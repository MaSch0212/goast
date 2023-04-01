// import {
//   DiscriminatorObject,
//   ExternalDocumentationObject,
//   ReferenceObject,
//   SchemaObject,
//   XMLObject,
// } from 'openapi-typescript';
// import {
//   ApiComponentSource,
//   ApiSchema,
//   ApiSchemaAccessibility,
//   ApiSchemaBase,
//   ApiSchemaKind,
//   assumeDeref,
//   Except,
// } from '../api-types.js';
// import { Dref } from '../parser.js';

// export function transformApiSchema(
//   name: string | undefined,
//   source: Dref<SchemaObject>
// ): ApiSchema {
//   const { kind, schema } = determineKind(source);

//   const base: ApiSchemaBase & { kind: ApiSchemaKind } = {
//     $src: { ...source.$src, component: objectWithoutProperties(source, ['$src']) },
//     name,
//     kind,
//     description: schema.description,
//     deprecated: schema.deprecated || false,
//     accessibility: getAccessibility(schema),
//     enum: schema.enum,
//     const: schema.const,
//     default: schema.default,
//     format: schema.format,
//     nullable: schema.nullable,
//     custom: getCustomFields(schema),
//   };

//   return { ...base, ...(transformFunctions as any)[kind](source, schema) };
// }

// function objectWithoutProperties(source: any, excluded: string[]): any {
//   const target: any = {};
//   for (const key in source) {
//     if (Object.prototype.hasOwnProperty.call(source, key) && !excluded.includes(key)) {
//       target[key] = source[key];
//     }
//   }
//   return target;
// }

// type _SchemaObject<T extends ApiSchemaKind = ApiSchemaKind> = {
//   discriminator?: DiscriminatorObject;
//   xml?: XMLObject;
//   externalDocs?: ExternalDocumentationObject;
//   example?: any;
//   title?: string;
//   description?: string;
//   $comment?: string;
//   deprecated?: boolean;
//   readOnly?: boolean;
//   writeOnly?: boolean;
//   enum?: unknown[];
//   const?: unknown;
//   default?: unknown;
//   format?: string;
//   nullable?: boolean;
//   [key: `x-${string}`]: any;
// } & (T extends 'oneOf'
//   ? { oneOf: (SchemaObject | ReferenceObject)[] }
//   : T extends 'multi-type'
//   ? { type: ('string' | 'number' | 'integer' | 'array' | 'boolean' | 'null' | 'object')[] }
//   : T extends 'string' | 'boolean' | 'null'
//   ? { type: T }
//   : T extends 'number' | 'integer'
//   ? { type: T; minimum?: number; maximum?: number }
//   : T extends 'array'
//   ? {
//       type: 'array';
//       prefixItems?: SchemaObject | ReferenceObject;
//       items?: SchemaObject | ReferenceObject;
//       minItems?: number;
//       maxItems?: number;
//     }
//   : T extends 'object'
//   ? {
//       type: 'object';
//       properties?: {
//         [name: string]: SchemaObject | ReferenceObject;
//       };
//       additionalProperties?: boolean | Record<string, never> | SchemaObject | ReferenceObject;
//       required?: string[];
//       allOf?: (SchemaObject | ReferenceObject)[];
//       anyOf?: (SchemaObject | ReferenceObject)[];
//     }
//   : T extends 'combined'
//   ?
//       | {
//           allOf: (SchemaObject | ReferenceObject)[];
//           anyOf?: (SchemaObject | ReferenceObject)[];
//           required?: string[];
//         }
//       | {
//           allOf?: (SchemaObject | ReferenceObject)[];
//           anyOf: (SchemaObject | ReferenceObject)[];
//           required?: string[];
//         }
//   : {});
// type SchemaObjectWithKind<T extends ApiSchemaKind = ApiSchemaKind> = {
//   kind: T;
//   schema: Dref<_SchemaObject<T>>;
// };

// function determineKind(schema: Dref<SchemaObject>): SchemaObjectWithKind {
//   const s = schema as any;
//   let kind: ApiSchemaKind = 'unknown';

//   if (s.oneOf) {
//     kind = 'oneOf';
//   } else if (s.type) {
//     if (Array.isArray(s.type)) {
//       kind = 'multi-type';
//     } else if (
//       s.type === 'string' ||
//       s.type === 'number' ||
//       s.type === 'integer' ||
//       s.type === 'array' ||
//       s.type === 'boolean' ||
//       s.type === null ||
//       s.type === 'object'
//     ) {
//       kind = s.type;
//     }
//   } else if (s.allOf || s.anyOf) {
//     kind = 'combined';
//   }

//   return { kind, schema: s };
// }

// const transformFunctions: {
//   [K in ApiSchemaKind]: (
//     schema: Dref<_SchemaObject<K>>
//   ) => Omit<Except<ApiSchema<K>, ApiSchemaBase>, 'kind'>;
// } = {
//   oneOf: (source) => ({
//     oneOf: source.oneOf,
//   }),
//   'multi-type': (_, schema) => ({
//     type: schema.type,
//   }),
//   string: () => ({
//     type: 'string',
//   }),
//   number: (_, schema) => ({
//     type: 'number',
//     minimum: schema.minimum,
//     maximum: schema.maximum,
//   }),
//   integer: (_, schema) => ({
//     type: 'integer',
//     minimum: schema.minimum,
//     maximum: schema.maximum,
//   }),
//   array: (source, schema) => ({
//     type: 'array',
//     prefixItems: mapSchema<'array'>(source, (x) => x.prefixItems),
//     items: mapSchema<'array'>(source, (x) => x.items),
//     minItems: schema.minItems,
//     maxItems: schema.maxItems,
//   }),
//   boolean: () => ({
//     type: 'boolean',
//   }),
//   null: () => ({
//     type: 'null',
//   }),
//   object: (source, schema) => ({
//     type: 'object',
//     // TODO: properties, additionalProperties
//     allOf: mapSchemaArray<'object'>(source, (x) => x.allOf),
//     anyOf: mapSchemaArray<'object'>(source, (x) => x.anyOf),
//   }),
//   combined: (source, schema) => ({
//     allOf: mapSchemaArray<'combined'>(source, (x) => x.allOf),
//     anyOf: mapSchemaArray<'combined'>(source, (x) => x.anyOf),
//   }),
//   unknown: () => ({}),
// };

// function getAccessibility(schema: _SchemaObject): ApiSchemaAccessibility {
//   if (schema.readOnly === true) {
//     return schema.writeOnly === true ? 'none' : 'readOnly';
//   } else {
//     return schema.writeOnly === true ? 'writeOnly' : 'all';
//   }
// }

// function getCustomFields(schema: _SchemaObject): Record<string, any> {
//   const result: Record<string, any> = {};
//   const schemaRecord = schema as Record<string, any>;
//   for (const key in schemaRecord) {
//     if (key.startsWith('x-')) {
//       const name = key.substring(2);
//       result[name] = schemaRecord[key];
//     }
//   }
//   return result;
// }

// function mapSchemaArray<T extends ApiSchemaKind>(
//   source: ApiComponentSource<SchemaObject>,
//   getArray: (schema: _SchemaObject<T>) => (SchemaObject | ReferenceObject)[] | undefined
// ): ApiSchema[] | undefined {
//   const na = getArray(source.component as _SchemaObject<T>);
//   const nd = getArray(source.dereferencedComponent as _SchemaObject<T>);
//   if (!na || !nd) return undefined;
//   const result: ApiSchema[] = [];
//   for (let i = 0; i < na.length; i++) {
//     result.push(
//       transformApiSchema(undefined, {
//         file: source.file,
//         component: assumeDeref(na[i]),
//         dereferencedComponent: assumeDeref(nd[i]),
//       })
//     );
//   }
//   return result;
// }

// function mapSchema<T extends ApiSchemaKind>(
//   source: ApiComponentSource<SchemaObject>,
//   get: (schema: _SchemaObject<T>) => SchemaObject | ReferenceObject | undefined
// ): ApiSchema | undefined {
//   const sa = get(source.component as _SchemaObject<T>);
//   const sd = get(source.dereferencedComponent as _SchemaObject<T>);
//   return !sa || !sd
//     ? undefined
//     : transformApiSchema(undefined, {
//         file: source.file,
//         component: assumeDeref(sa),
//         dereferencedComponent: assumeDeref(sd),
//       });
// }
