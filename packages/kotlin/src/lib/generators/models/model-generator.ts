import { dirname } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiSchema, ApiSchemaProperty, ObjectLikeApiSchema, resolveAnyOfAndAllOf, toCasing } from '@goast/core';

import { KotlinModelGeneratorContext, KotlinModelGeneratorOutput } from './models';
import { KotlinFileBuilder } from '../../file-builder';
import { KotlinFileGenerator } from '../file-generator';

type Context = KotlinModelGeneratorContext;
type Output = KotlinModelGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultKotlinModelGenerator extends KotlinFileGenerator<Context, Output> implements KotlinModelGenerator {
  public generate(ctx: KotlinModelGeneratorContext): KotlinModelGeneratorOutput {
    if (/\/(anyOf|allOf)(\/[0-9]+)?$/.test(ctx.schema.$src.path)) {
      // Do not generate types that are only used for anyOf and/or allOf
      return { typeName: 'Any?', packageName: undefined, additionalImports: [] };
    }

    if (ctx.schema.id === ctx.schema.name) {
      // TODO: Add this to @goast/core
      const match = ctx.schema.$src.path.match(/\/components\/responses\/([^/]+)\/content\/.+\/schema/);
      if (match) {
        ctx.schema.name = match[1].toLowerCase().endsWith('response') ? match[1] : match[1] + 'Response';
      }
    }

    if (ctx.schema.isNameGenerated) {
      // TODO: Change this in @goast/core
      const match = ctx.schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/responses\/(?<status>\d+)\//);
      if (match && match.groups) {
        const { path, method, status } = match.groups;
        const endpoint = ctx.data.endpoints.find((e) => e.path === path && e.method === method);
        if (endpoint) {
          ctx.schema.name = `${endpoint.name}${status}Response`;
        }
      }
    }

    if (this.shouldGenerateTypeDeclaration(ctx, ctx.schema)) {
      const typeName = this.getDeclarationTypeName(ctx);
      const packageName = ctx.config.packageName + ctx.config.packageSuffix;
      const filePath = `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}/${typeName}.kt`;
      console.log(`Generating model ${packageName}.${typeName} to ${filePath}...`);
      ensureDirSync(dirname(filePath));

      const builder = new KotlinFileBuilder(packageName, ctx.config);
      this.generateFileContent(ctx, builder);

      writeFileSync(filePath, builder.toString());

      return { typeName, packageName, additionalImports: [] };
    } else {
      const builder = new KotlinFileBuilder(undefined, ctx.config);
      this.generateType(ctx, builder, ctx.schema);
      const additionalImports = builder.imports.imports;
      builder.imports.clear();
      return { typeName: builder.toString(false), packageName: undefined, additionalImports };
    }
  }

  protected generateFileContent(ctx: Context, builder: Builder): void {
    let schema = ctx.schema;
    if (schema.kind === 'object' || schema.kind === 'combined') {
      const mergedSchema = resolveAnyOfAndAllOf(schema, true);
      if (mergedSchema) {
        schema = mergedSchema;
      }
    }

    if (schema.kind === 'object') {
      this.generateObjectType(ctx, builder, schema);
    } else if (schema.enum !== undefined && schema.enum.length > 0) {
      this.generateEnum(ctx, builder, schema);
    } else {
      this.generateType(ctx, builder, schema);
    }
  }

  protected generateObjectType(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    if (schema.properties.size === 0) {
      if (schema.additionalProperties) {
        this.generateMapType(ctx, builder, schema);
      } else {
        builder.append('Any');
      }
    } else {
      this.generateObjectPackageMember(ctx, builder, schema);
    }
  }

  protected generateObjectPackageMember(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    if (schema.discriminator) {
      this.generateObjectInterface(ctx, builder, schema);
    } else {
      this.generateObjectDataClass(ctx, builder, schema);
    }
  }

  protected generateObjectInterface(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    builder
      .apply((builder) => this.generateDocumentation(ctx, builder, schema))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateObjectInterfaceAnnotations(ctx, builder, schema))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateObjectInterfaceSignature(ctx, builder, schema))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateObjectInterfaceMembers(ctx, builder, schema));
  }

  protected generateObjectInterfaceAnnotations(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    if (schema.discriminator) {
      builder.appendAnnotation('JsonTypeInfo', 'com.fasterxml.jackson.annotation', [
        ['use', 'JsonTypeInfo.Id.NAME'],
        ['include', 'JsonTypeInfo.As.PROPERTY'],
        ['property', this.toStringLiteral(ctx, schema.discriminator.propertyName)],
        ['visible', 'true'],
      ]);

      const entries = Object.entries(schema.discriminator.mapping);
      if (entries.length > 0) {
        builder.appendAnnotation(
          'JsonSubTypes',
          'com.fasterxml.jackson.annotation',
          entries.map(([value, schema]) => (builder) => {
            const schemaResult = ctx.getSchemaResult(schema);
            builder
              .append(
                `JsonSubTypes.Type(value = ${schemaResult.typeName}::class, name = ${this.toStringLiteral(ctx, value)})`
              )
              .addImport(schemaResult.typeName, schemaResult.packageName);
          })
        );
      }
    }
  }

  protected generateObjectInterfaceSignature(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    builder.append('interface ').append(this.getDeclarationTypeName(ctx));
  }

  protected generateObjectInterfaceMembers(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    builder.forEach(this.sortProperties(ctx, schema, schema.properties.values()), (builder, property) =>
      builder
        .ensurePreviousLineEmpty()
        .apply((builder) => this.generateJsonPropertyAnnotation(ctx, builder, schema, property, 'get'))
        .ensureCurrentLineEmpty()
        .append(`val ${toCasing(property.name, 'camel')}: `)
        .apply((builder) => this.generateType(ctx, builder, property.schema))
        .applyIf(!schema.required.has(property.name), (builder) =>
          builder.appendIf(!property.schema.nullable, '?').append(' = null')
        )
    );
  }

  protected generateObjectDataClass(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    const inheritedSchemas = schema.inheritedSchemas.filter(
      (x) => this.shouldGenerateTypeDeclaration(ctx, x) && !x.isNameGenerated
    );
    builder
      .apply((builder) => this.generateDocumentation(ctx, builder, schema))
      .append('data class ')
      .append(this.getDeclarationTypeName(ctx))
      .parenthesizeMultilineIf(schema.properties.size > 0, '()', (builder) =>
        builder.forEachSeparated(
          this.sortProperties(ctx, schema, schema.properties.values()),
          ',\n',
          (builder, property) =>
            builder
              .ensurePreviousLineEmpty()
              .apply((builder) => this.generateObjectDataClassParameterAnnotations(ctx, builder, schema, property))
              .appendIf(
                inheritedSchemas.some((x) => this.hasProperty(ctx, x, property.name)),
                'override '
              )
              .append(`val ${toCasing(property.name, 'camel')}: `)
              .apply((builder) => this.generateType(ctx, builder, property.schema))
              .applyIf(!schema.required.has(property.name), (builder) =>
                builder.appendIf(!property.schema.nullable, '?').append(' = null')
              )
        )
      )
      .applyIf(
        inheritedSchemas.length > 0,
        (builder) =>
          builder
            .append(' : ')
            .forEachSeparated(inheritedSchemas, ', ', (builder, schema) =>
              builder.append(toCasing(schema.name, 'pascal'))
            ) // TODO: Calling generateType here will lead to endless loop
      )
      .append(' ')
      .parenthesizeMultilineIf(
        schema.additionalProperties !== undefined && schema.additionalProperties !== false,
        '{}',
        (builder) =>
          builder.applyIf(
            schema.additionalProperties !== undefined && schema.additionalProperties !== false,
            (builder) =>
              builder
                .appendLine('@JsonIgnore')
                .addImport('JsonIgnore', 'com.fasterxml.jackson.annotation')
                .append('val additionalProperties: Mutable')
                .apply((builder) => this.generateMapType(ctx, builder, schema))
                .appendLine(' = mutableMapOf()')
                .appendLine()
                .appendLine('@JsonAnySetter')
                .addImport('JsonAnySetter', 'com.fasterxml.jackson.annotation')
                .append('fun set')
                .parenthesize('()', (builder) =>
                  builder.append('name: String, value: ').applyIfElse(
                    schema.additionalProperties === true,
                    (builder) => builder.append('Any?'),
                    (builder) => this.generateType(ctx, builder, schema.additionalProperties as ApiSchema)
                  )
                )
                .append(' ')
                .parenthesizeMultiline('{}', 'this.additionalProperties[name] = value')
                .appendLine()
                .appendLine()
                .appendLine('@JsonAnyGetter')
                .addImport('JsonAnyGetter', 'com.fasterxml.jackson.annotation')
                .append('fun getMap(): ')
                .apply((builder) => this.generateMapType(ctx, builder, schema))
                .append(' ')
                .parenthesizeMultiline('{}', 'return this.additionalProperties')
          )
      );
  }

  protected generateObjectDataClassParameterAnnotations(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema,
    property: ApiSchemaProperty
  ): void {
    this.generatePropertyValidationAnnotations(ctx, builder, schema, property);
    this.generatePropertySchemaAnnotation(ctx, builder, schema, property);
    this.generateJsonPropertyAnnotation(ctx, builder, schema, property);
  }

  protected generatePropertyValidationAnnotations(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema,
    property: ApiSchemaProperty
  ): void {
    if (property.schema.kind === 'string' && property.schema.pattern) {
      builder
        .append('@get:Pattern(regexp = ')
        .append(this.toStringLiteral(ctx, property.schema.pattern))
        .append(')')
        .addImport('Pattern', 'jakarta.validation.constraints')
        .appendLine();
    }
    if (this.shouldGenerateTypeDeclaration(ctx, property.schema)) {
      builder.append('@field:Valid').addImport('Valid', 'jakarta.validation').appendLine();
    }
  }

  protected generatePropertySchemaAnnotation(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema,
    property: ApiSchemaProperty
  ): void {
    const parts: Map<string, string> = new Map();
    if (property.schema.example !== undefined) {
      parts.set('example', this.toStringLiteral(ctx, String(property.schema.example)));
    }
    if (schema.required.has(property.name)) {
      parts.set('required', 'true');
    }
    if (property.schema.description !== undefined) {
      parts.set('description', this.toStringLiteral(ctx, property.schema.description));
    }

    builder
      .append('@Schema')
      .addImport('Schema', 'io.swagger.v3.oas.annotations.media')
      .parenthesizeIf(parts.size > 0, '()', (builder) =>
        builder.forEachSeparated(parts.entries(), ', ', (builder, [key, value]) => builder.append(`${key} = ${value}`))
      )
      .appendLine();
  }

  protected generateJsonPropertyAnnotation(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema,
    property: ApiSchemaProperty,
    scope?: string
  ): void {
    builder
      .append(`@${scope ? scope + ':' : ''}JsonProperty`)
      .addImport('JsonProperty', 'com.fasterxml.jackson.annotation')
      .parenthesize('()', (builder) =>
        builder
          .append(this.toStringLiteral(ctx, property.name))
          .appendIf(schema.required.has(property.name), ', required = true')
      )
      .appendLine()
      .applyIf(property.schema.custom['exclude-when-null'] === true, (builder) =>
        builder
          .append('@get:JsonInclude')
          .addImport('JsonInclude', 'com.fasterxml.jackson.annotation')
          .parenthesize('()', 'JsonInclude.Include.NON_NULL')
          .appendLine()
      );
  }

  protected generateMapType(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    if (schema.additionalProperties === true) {
      builder.append('Map<String, Any?>');
    } else if (typeof schema.additionalProperties === 'object') {
      const propertiesType = schema.additionalProperties;
      builder
        .append('Map')
        .parenthesize('<>', (builder) =>
          builder.append('String, ').apply((builder) => this.generateType(ctx, builder, propertiesType))
        );
    }
  }

  protected generateType(ctx: Context, builder: Builder, schema: ApiSchema): void {
    if (this.shouldGenerateTypeDeclaration(ctx, schema)) {
      if (schema === ctx.schema) {
        builder.append('Any?');
        return;
      }
      const schemaResult = ctx.getSchemaResult(schema);
      builder.append(schemaResult.typeName);
      if (schemaResult.packageName) {
        builder.addImport(schemaResult.typeName, schemaResult.packageName);
      }
      return;
    }

    switch (schema.kind) {
      case 'boolean':
        builder.append('Boolean');
        break;
      case 'integer':
      case 'number':
        this.generateNumberType(ctx, builder, schema);
        break;
      case 'string':
        if (schema.enum !== undefined && schema.enum.length > 0) {
          this.generateEnum(ctx, builder, schema);
        } else {
          this.generateStringType(ctx, builder, schema);
        }
        break;
      case 'null':
        builder.append('null');
        break;
      case 'unknown':
        builder.append('Any');
        break;
      case 'array':
        this.generateArrayType(ctx, builder, schema);
        break;
      case 'object':
        this.generateObjectType(ctx, builder, schema);
        break;
      case 'combined':
        builder.append('Any');
        break;
      case 'multi-type':
        builder.append('Any');
        break;
      case 'oneOf':
        builder.append('Any');
        break;
      default:
        builder.append('Any');
        break;
    }

    if (schema.nullable) {
      builder.append('?');
    }
  }

  protected generateNumberType(ctx: Context, builder: Builder, schema: ApiSchema<'number' | 'integer'>): void {
    switch (schema.format) {
      case 'int32':
        builder.append('Int');
        break;
      case 'int64':
        builder.append('Long');
        break;
      case 'float':
        builder.append('Float');
        break;
      case 'double':
        builder.append('Double');
        break;
      default:
        builder.append(schema.kind === 'integer' ? 'Int' : 'Double');
        break;
    }
  }

  protected generateStringType(ctx: Context, builder: Builder, schema: ApiSchema<'string'>): void {
    switch (schema.format) {
      case 'date-time':
        builder.append('OffsetDateTime').addImport('OffsetDateTime', 'java.time');
        break;
      default:
        builder.append('String');
        break;
    }
  }

  protected generateEnum(ctx: Context, builder: Builder, schema: ApiSchema): void {
    builder
      .apply((builder) => this.generateDocumentation(ctx, builder, schema))
      .append('enum class ')
      .append(this.getDeclarationTypeName(ctx))
      .append('(val value: String) ')
      .parenthesizeMultiline('{}', (builder) =>
        builder.forEachSeparated(
          schema.enum ?? [],
          (builder) => builder.appendLine(',').appendLine(),
          (builder, value) =>
            builder
              .append('@JsonProperty')
              .addImport('JsonProperty', 'com.fasterxml.jackson.annotation')
              .parenthesize('()', this.toStringLiteral(ctx, String(value)))
              .appendLine()
              .append(toCasing(String(value), 'snake'))
              .parenthesize('()', this.toStringLiteral(ctx, String(value)))
        )
      );
  }

  protected generateArrayType(ctx: Context, builder: Builder, schema: ApiSchema<'array'>): void {
    builder.append('List').parenthesize('<>', (builder) =>
      builder.applyIfElse(
        schema.items === undefined,
        (builder) => builder.append('Any?'),
        (builder) => this.generateType(ctx, builder, schema.items!)
      )
    );
  }

  protected generateDocumentation(ctx: Context, builder: Builder, schema: ApiSchema): void {
    const propertiesWithDescription = Array.from((schema as ObjectLikeApiSchema).properties?.values() ?? []).filter(
      (p) => p.schema.description !== undefined
    );
    if (schema.description !== undefined || propertiesWithDescription.length > 0) {
      builder
        .ensurePreviousLineEmpty()
        .appendLine('/**')
        .applyWithLinePrefix(' * ', (builder) =>
          builder
            .appendLineIf(!!schema.description, schema.description)
            .forEach(propertiesWithDescription, (builder, property) =>
              builder.appendLine(`@param ${toCasing(property.name, 'camel')} ${property.schema.description?.trim()}`)
            )
        )
        .appendLine(' */');
    }
  }

  protected shouldGenerateTypeDeclaration(ctx: Context, schema: ApiSchema): boolean {
    // All enum types should have its own type declaration
    if (schema.enum !== undefined && schema.enum.length > 0) {
      return true;
    }

    // All primitive types already exist and do not need its own type declaration
    if (
      schema.kind !== 'combined' &&
      schema.kind !== 'multi-type' &&
      schema.kind !== 'object' &&
      schema.kind !== 'oneOf'
    ) {
      return false;
    }

    // Only object types with properties should have its own type declaration
    if (
      schema.kind === 'object' &&
      schema.properties.size === 0 &&
      schema.anyOf.length === 0 &&
      schema.allOf.length === 0
    ) {
      return false;
    }

    return true;
  }

  protected getDeclarationTypeName(ctx: Context): string {
    return toCasing(ctx.schema.name, 'pascal');
  }

  protected sortProperties(
    ctx: Context,
    schema: ApiSchema,
    properties: Iterable<ApiSchemaProperty>
  ): ApiSchemaProperty[] {
    return [...properties].sort((a, b) => {
      const aRequired = schema.required.has(a.name) ? 1 : 0;
      const bRequired = schema.required.has(b.name) ? 1 : 0;
      return bRequired - aRequired;
    });
  }

  private hasProperty(ctx: Context, schema: ApiSchema, name: string): boolean {
    return (
      ('properties' in schema && schema.properties.has(name)) ||
      ('anyOf' in schema && schema.anyOf.some((x) => this.hasProperty(ctx, x, name))) ||
      ('allOf' in schema && schema.allOf.some((x) => this.hasProperty(ctx, x, name)))
    );
  }
}
