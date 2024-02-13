import { dirname } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import {
  ApiSchema,
  ApiSchemaProperty,
  ObjectLikeApiSchema,
  createOverwriteProxy,
  getSchemaReference,
  resolveAnyOfAndAllOf,
  toCasing,
} from '@goast/core';

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
      const typeName = this.getDeclarationTypeName(ctx, ctx.schema);
      const packageName = this.getPackageName(ctx, ctx.schema);
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
    const schema = this.normalizeSchema(ctx, ctx.schema);
    if (schema.kind === 'object') {
      this.generateObjectType(ctx, builder, schema);
    } else if (schema.enum !== undefined && schema.enum.length > 0) {
      this.generateEnum(ctx, builder, schema);
    } else {
      this.generateType(ctx, builder, schema);
    }
  }

  protected generateTypeUsage(ctx: Context, builder: Builder, schema: ApiSchema): void {
    schema = getSchemaReference(schema, ['description']);
    if (this.shouldGenerateTypeDeclaration(ctx, schema)) {
      const name = this.getDeclarationTypeName(ctx, schema);
      const packageName = this.getPackageName(ctx, schema);
      if (packageName) {
        builder.addImport(name, packageName);
      }
      builder.append(name);
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
      .append((builder) => this.generateDocumentation(ctx, builder, schema))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateObjectInterfaceAnnotations(ctx, builder, schema))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateObjectInterfaceSignature(ctx, builder, schema))
      .append(' ')
      .parenthesize('{}', (builder) => this.generateObjectInterfaceMembers(ctx, builder, schema), { multiline: true });
  }

  protected generateObjectInterfaceAnnotations(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    if (schema.discriminator && ctx.config.addJacksonAnnotations) {
      builder.appendAnnotation('JsonTypeInfo', 'com.fasterxml.jackson.annotation', [
        ['use', 'JsonTypeInfo.Id.NAME'],
        ['include', 'JsonTypeInfo.As.EXISTING_PROPERTY'],
        ['property', this.toStringLiteral(ctx, schema.discriminator.propertyName)],
        ['visible', 'true'],
      ]);

      const entries = Object.entries(schema.discriminator.mapping);
      if (entries.length > 0) {
        builder.appendAnnotation(
          'JsonSubTypes',
          'com.fasterxml.jackson.annotation',
          entries.map(
            ([value, schema]) =>
              (builder) =>
                builder.append(
                  'JsonSubTypes.Type(value = ',
                  (builder) => this.generateTypeUsage(ctx, builder, schema),
                  `::class, name = ${this.toStringLiteral(ctx, value)})`
                )
          )
        );
      }
    }
  }

  protected generateObjectInterfaceSignature(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    builder.append('interface ').append(this.getDeclarationTypeName(ctx, schema));
  }

  protected generateObjectInterfaceMembers(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    builder.forEach(this.sortProperties(ctx, schema, schema.properties.values()), (builder, property) =>
      builder
        .ensurePreviousLineEmpty()
        .append((builder) => this.generateJsonPropertyAnnotation(ctx, builder, schema, property, 'get'))
        .ensureCurrentLineEmpty()
        .append(`val ${toCasing(property.name, 'camel')}: `)
        .append((builder) => this.generateTypeUsage(ctx, builder, property.schema))
        .if(!schema.required.has(property.name), (builder) => builder.appendIf(!property.schema.nullable, '?'))
    );
  }

  protected generateObjectDataClassProperty(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema<'object'>,
    inheritedSchemas: ApiSchema[],
    property: ApiSchemaProperty
  ): void {
    builder
      .ensurePreviousLineEmpty()
      .append((builder) => this.generateObjectDataClassParameterAnnotations(ctx, builder, schema, property))
      .appendIf(
        inheritedSchemas.some((x) => this.hasProperty(ctx, x, property.name)),
        'override '
      )
      .append(`val ${toCasing(property.name, 'camel')}: `)
      .append((builder) => this.generateTypeUsage(ctx, builder, property.schema))
      .if(!schema.required.has(property.name), (builder) => builder.appendIf(!property.schema.nullable, '?'))
      .appendIf(property.schema.default !== undefined || !schema.required.has(property.name), ' = ', (builder) =>
        this.generateDefaultValue(ctx, builder, property.schema)
      );
  }

  protected generateObjectDataClass(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    const inheritedSchemas = this.getInheritedSchemas(ctx, schema);
    const params = this.getClassProperties(ctx, schema);
    builder
      .append((builder) => this.generateDocumentation(ctx, builder, schema))
      .append(params.length === 0 ? 'class' : 'data class', ' ')
      .append(this.getDeclarationTypeName(ctx, schema))
      .parenthesizeIf(
        params.length > 0,
        '()',
        (builder) =>
          builder.forEach(
            params,
            (builder, property) =>
              this.generateObjectDataClassProperty(ctx, builder, schema, inheritedSchemas, property),
            { separator: ',\n' }
          ),
        { multiline: true }
      )
      .if(inheritedSchemas.length > 0, (builder) =>
        builder
          .append(' : ')
          .forEach(inheritedSchemas, (builder, schema) => this.generateTypeUsage(ctx, builder, schema), {
            separator: ', ',
          })
      )
      .append(' ')
      .parenthesizeIf(
        schema.additionalProperties !== undefined && schema.additionalProperties !== false,
        '{}',
        (builder) =>
          builder.if(schema.additionalProperties !== undefined && schema.additionalProperties !== false, (builder) =>
            builder
              .if(ctx.config.addJacksonAnnotations, (builder) =>
                builder.appendLine('@JsonIgnore').addImport('JsonIgnore', 'com.fasterxml.jackson.annotation')
              )
              .append('val additionalProperties: Mutable')
              .append((builder) => this.generateMapType(ctx, builder, schema))
              .appendLine(' = mutableMapOf()')
              .appendLine()
              .if(ctx.config.addJacksonAnnotations, (builder) =>
                builder.appendLine('@JsonAnySetter').addImport('JsonAnySetter', 'com.fasterxml.jackson.annotation')
              )
              .append('fun set')
              .parenthesize('()', (builder) =>
                builder.append('name: String, value: ').if(
                  schema.additionalProperties === true,
                  (builder) => builder.append('Any?'),
                  (builder) => this.generateTypeUsage(ctx, builder, schema.additionalProperties as ApiSchema)
                )
              )
              .append(' ')
              .parenthesize('{}', 'this.additionalProperties[name] = value', { multiline: true })
              .appendLine()
              .appendLine()
              .if(ctx.config.addJacksonAnnotations, (builder) =>
                builder.appendLine('@JsonAnyGetter').addImport('JsonAnyGetter', 'com.fasterxml.jackson.annotation')
              )
              .append('fun getMap(): ')
              .append((builder) => this.generateMapType(ctx, builder, schema))
              .append(' ')
              .parenthesize('{}', 'return this.additionalProperties', { multiline: true })
          ),
        { multiline: true }
      );
  }

  protected generateDefaultValue(ctx: Context, builder: Builder, schema: ApiSchema) {
    if (schema.default === null || schema.default === undefined) {
      builder.append('null');
    } else {
      switch (schema.kind) {
        case 'boolean':
          builder.append(Boolean(schema.default) || String(schema.default).toLowerCase() === 'true' ? 'true' : 'false');
          break;
        case 'integer':
        case 'number':
          builder.append(String(schema.default));
          break;
        case 'string':
          if (schema.enum && schema.enum.length > 0) {
            builder
              .append((builder) => this.generateTypeUsage(ctx, builder, schema))
              .append('.')
              .append(toCasing(String(schema.default), ctx.config.enumValueNameCasing));
          } else {
            builder.append(this.toStringLiteral(ctx, String(schema.default)));
          }
          break;
        default:
          builder.append('null');
          break;
      }
    }
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
    if (ctx.config.addJakartaValidationAnnotations) {
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
  }

  protected generatePropertySchemaAnnotation(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema,
    property: ApiSchemaProperty
  ): void {
    if (ctx.config.addSwaggerAnnotations) {
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
          builder.forEach(parts.entries(), (builder, [key, value]) => builder.append(`${key} = ${value}`), {
            separator: ', ',
          })
        )
        .appendLine();
    }
  }

  protected generateJsonPropertyAnnotation(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema,
    property: ApiSchemaProperty,
    scope?: string
  ): void {
    builder
      .if(ctx.config.addJacksonAnnotations, (builder) =>
        builder
          .append(`@${scope ? scope + ':' : ''}JsonProperty`)
          .addImport('JsonProperty', 'com.fasterxml.jackson.annotation')
          .parenthesize('()', (builder) =>
            builder
              .append(this.toStringLiteral(ctx, property.name))
              .appendIf(schema.required.has(property.name), ', required = true')
          )
          .appendLine()
      )
      .if(property.schema.custom['exclude-when-null'] === true, (builder) =>
        builder
          .if(ctx.config.addJacksonAnnotations, (builder) =>
            builder.append('@get:JsonInclude').addImport('JsonInclude', 'com.fasterxml.jackson.annotation')
          )
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
          builder.append('String, ').append((builder) => this.generateTypeUsage(ctx, builder, propertiesType))
        );
    }
  }

  protected generateType(ctx: Context, builder: Builder, schema: ApiSchema): void {
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
        builder.append('Nothing');
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
      .append((builder) => this.generateDocumentation(ctx, builder, schema))
      .append('enum class ')
      .append(this.getDeclarationTypeName(ctx, schema))
      .append('(val value: String) ')
      .parenthesize(
        '{}',
        (builder) =>
          builder.forEach(
            schema.enum ?? [],
            (builder, value) =>
              builder
                .if(ctx.config.addJacksonAnnotations, (builder) =>
                  builder
                    .append('@JsonProperty')
                    .addImport('JsonProperty', 'com.fasterxml.jackson.annotation')
                    .parenthesize('()', this.toStringLiteral(ctx, String(value)))
                    .appendLine()
                )
                .append(toCasing(String(value), 'snake'))
                .parenthesize('()', this.toStringLiteral(ctx, String(value))),
            { separator: (builder) => builder.appendLine(',').appendLine() }
          ),
        { multiline: true }
      );
  }

  protected generateArrayType(ctx: Context, builder: Builder, schema: ApiSchema<'array'>): void {
    builder.append('List').parenthesize('<>', (builder) =>
      builder.if(
        schema.items === undefined,
        (builder) => builder.append('Any?'),
        (builder) => this.generateTypeUsage(ctx, builder, schema.items!)
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
        .appendWithLinePrefix(' * ', (builder) =>
          builder
            .appendLineIf(!!schema.description, schema.description)
            .forEach(propertiesWithDescription, (builder, property) =>
              builder.appendLine(`@param ${toCasing(property.name, 'camel')} ${property.schema.description?.trim()}`)
            )
        )
        .appendLine(' */');
    }
  }

  protected getPackageName(ctx: Context, schema: ApiSchema): string {
    const packageSuffix =
      typeof ctx.config.packageSuffix === 'string' ? ctx.config.packageSuffix : ctx.config.packageSuffix(schema);
    return ctx.config.packageName + packageSuffix;
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

    // Too complex types cannot be represented in Kotlin, so they fallback to Any
    if (schema.kind === 'multi-type') {
      return false;
    }
    schema = this.normalizeSchema(ctx, schema);
    if (schema.kind === 'combined' || schema.kind === 'oneOf') {
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

  protected getDeclarationTypeName(ctx: Context, schema: ApiSchema): string {
    return toCasing(schema.name, 'pascal');
  }

  protected getInheritedSchemas(ctx: KotlinModelGeneratorContext, schema: ApiSchema) {
    return schema.inheritedSchemas
      .filter((x) => this.shouldGenerateTypeDeclaration(ctx, x) && !x.isNameGenerated)
      .filter((item, index, self) => self.indexOf(item) === index);
  }

  protected getClassProperties(ctx: Context, schema: ApiSchema<'object'>): ApiSchemaProperty[] {
    const inheritedSchemas = this.getInheritedSchemas(ctx, schema);
    const properties: ApiSchemaProperty[] = [];
    const appendedProperties: ApiSchemaProperty[] = [];
    for (const property of schema.properties.values()) {
      const discriminator = inheritedSchemas.find(
        (x) => x.discriminator?.propertyName === property.name
      )?.discriminator;
      if (discriminator) {
        const schemaMappings = Object.entries(discriminator.mapping).filter(([_, v]) => v.id === schema.id);
        if (schemaMappings.length === 1) {
          const p = createOverwriteProxy(property);
          const s = createOverwriteProxy(p.schema);
          p.schema = s;
          s.default = schemaMappings[0][0];
          appendedProperties.push(p);
          continue;
        }
      }

      properties.push(property);
    }

    return [...this.sortProperties(ctx, schema, properties), ...appendedProperties];
  }

  protected sortProperties(
    ctx: Context,
    schema: ApiSchema,
    properties: Iterable<ApiSchemaProperty>
  ): ApiSchemaProperty[] {
    return [...properties].sort((a, b) => classify(a) - classify(b));

    function classify(p: ApiSchemaProperty) {
      if (p.schema.default !== undefined) return 1;
      if (schema.required.has(p.name)) return 0;
      return 2;
    }
  }

  private normalizeSchema(ctx: Context, schema: ApiSchema): ApiSchema {
    if (schema.kind === 'oneOf') {
      schema =
        ctx.config.oneOfBehavior === 'treat-as-any-of'
          ? { ...(schema as any), kind: 'combined', anyOf: schema.oneOf, allOf: [], oneOf: undefined }
          : { ...(schema as any), kind: 'combined', allOf: schema.oneOf, anyOf: [], oneOf: undefined };
      ctx.schema = schema;
    }
    if (schema.kind === 'object' || schema.kind === 'combined') {
      const mergedSchema = resolveAnyOfAndAllOf(schema, true);
      if (mergedSchema) {
        schema = mergedSchema;
      }
    }

    return schema;
  }

  private hasProperty(ctx: Context, schema: ApiSchema, name: string): boolean {
    return (
      ('properties' in schema && schema.properties.has(name)) ||
      ('anyOf' in schema && schema.anyOf.some((x) => this.hasProperty(ctx, x, name))) ||
      ('allOf' in schema && schema.allOf.some((x) => this.hasProperty(ctx, x, name)))
    );
  }
}
