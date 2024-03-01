import { Prettify, RequiredProperties } from '@goast/core';

import * as ts from './types';
import { TypeScriptAppendValue, TypeScriptFileBuilder } from '../file-builder';

type PPO<T, K extends keyof T = never, R extends keyof T = never> = Prettify<
  Omit<RequiredProperties<Partial<T>, R>, K | 'kind' | 'lang' | 'inject'> &
    (T extends { inject: object } ? { inject?: Partial<T['inject']> } : {})
>;

function tsNode<K extends string>(kind: K, options: PPO<ts.TsNode<K>, 'lang' | 'kind'> | undefined): ts.TsNode<K> {
  return {
    lang: 'ts',
    kind,
    inject: { before: options?.inject?.before ?? [], after: options?.inject?.after ?? [] },
  };
}

export function isTsNode<K extends string>(node: unknown, kind: K): node is ts.TsNode<K> {
  return typeof node === 'object' && node !== null && 'kind' in node && node.kind === kind;
}
export function isTsCode(node: unknown): node is ts.TsCode {
  return isTsNode(node, 'code');
}
export function isTsGenericParameter(node: unknown): node is ts.TsGenericParameter {
  return isTsNode(node, 'genericParameter');
}
export function isTsParameter(node: unknown): node is ts.TsParameter {
  return isTsNode(node, 'parameter');
}
export function isTsConstructorParameter(node: unknown): node is ts.TsConstructorParameter {
  return isTsNode(node, 'constructorParameter');
}
export function isTsConstructor(node: unknown): node is ts.TsConstructor {
  return isTsNode(node, 'constructor');
}
export function isTsMethod(node: unknown): node is ts.TsMethod {
  return isTsNode(node, 'method');
}
export function isTsPropertyMethod(node: unknown): node is ts.TsPropertyMethod {
  return isTsNode(node, 'propertyMethod');
}
export function isTsProperty(node: unknown): node is ts.TsProperty {
  return isTsNode(node, 'property');
}
export function isTsClass(node: unknown): node is ts.TsClass {
  return isTsNode(node, 'class');
}
export function isTsInterface(node: unknown): node is ts.TsInterface {
  return isTsNode(node, 'interface');
}
export function isTsTypeAlias(node: unknown): node is ts.TsTypeAlias {
  return isTsNode(node, 'typeAlias');
}
export function isTsEnumMember(node: unknown): node is ts.TsEnumMember {
  return isTsNode(node, 'enumMember');
}
export function isTsEnum(node: unknown): node is ts.TsEnum {
  return isTsNode(node, 'enum');
}
export function isTsFunction(node: unknown): node is ts.TsFunction {
  return isTsNode(node, 'function');
}
export function isTsVariable(node: unknown): node is ts.TsVariable {
  return isTsNode(node, 'variable');
}
export function isTsObjectType(node: unknown): node is ts.TsObjectType {
  return isTsNode(node, 'objectType');
}
export function isTsArrayType(node: unknown): node is ts.TsArrayType {
  return isTsNode(node, 'arrayType');
}
export function isTsFunctionType(node: unknown): node is ts.TsFunctionType {
  return isTsNode(node, 'functionType');
}
export function isTsObject(node: unknown): node is ts.TsObject {
  return isTsNode(node, 'object');
}
export function isTsArrowFunction(node: unknown): node is ts.TsArrowFunction {
  return isTsNode(node, 'arrowFunction');
}

export function tsCode(
  code: NonNullable<TypeScriptAppendValue<TypeScriptFileBuilder>>,
  ...additionalCode: TypeScriptAppendValue<TypeScriptFileBuilder>[]
): ts.TsCode;
export function tsCode(...parts: TypeScriptAppendValue<TypeScriptFileBuilder>[]): ts.TsCode {
  return {
    ...tsNode('code', undefined),
    parts: parts.flatMap((p) => (isTsCode(p) ? p.parts : [p])),
    multiline: true,
  };
}

export function tsGenericParameter(name: string, options?: PPO<ts.TsGenericParameter, 'name'>): ts.TsGenericParameter {
  return {
    ...tsNode('genericParameter', options),
    name,
    constraint: options?.constraint ?? null,
    default: options?.default ?? null,
    const: options?.const ?? false,
  };
}

export function tsParameter(name: string, options?: PPO<ts.TsParameter, 'name'>): ts.TsParameter {
  return {
    ...tsNode('parameter', options),
    name,
    type: options?.type ?? null,
    default: options?.default ?? null,
    optional: options?.optional ?? false,
  };
}

export function tsConstructorParameter(
  name: string,
  options?: PPO<ts.TsConstructorParameter, 'name' | 'kind'>
): ts.TsConstructorParameter {
  return {
    ...tsNode('constructorParameter', options),
    name,
    type: options?.type ?? null,
    default: options?.default ?? null,
    accessibility: options?.accessibility ?? null,
    readonly: options?.readonly ?? false,
    optional: options?.optional ?? false,
  };
}

export function tsConstructor(options?: PPO<ts.TsConstructor>): ts.TsConstructor {
  const base = tsNode('constructor', options);
  return {
    ...base,
    parameters: options?.parameters ?? [],
    body: options?.body ?? null,
    inject: {
      ...base.inject,
      afterParams: options?.inject?.afterParams ?? [],
      beforeParams: options?.inject?.beforeParams ?? [],
    },
  };
}

export function tsMethod(name: string, options?: PPO<ts.TsMethod, 'name'>): ts.TsMethod {
  return {
    ...tsNode('method', options),
    name,
    generics: options?.generics ?? [],
    parameters: options?.parameters ?? [],
    returnType: options?.returnType ?? null,
    body: options?.body ?? null,
    accessibility: options?.accessibility ?? null,
    static: options?.static ?? false,
    abstract: options?.abstract ?? false,
    override: options?.override ?? false,
    optional: options?.optional ?? false,
  };
}

export function tsPropertyMethod(options?: PPO<ts.TsPropertyMethod>): ts.TsPropertyMethod {
  return {
    ...tsNode('propertyMethod', options),
    type: options?.type ?? null,
    body: options?.body ?? null,
    accessibility: options?.accessibility ?? null,
    static: options?.static ?? false,
    abstract: options?.abstract ?? false,
    override: options?.override ?? false,
  };
}

type _TsPropertyAutoOpt = {
  type?: ts.TsCode | null;
  value?: ts.TsCode | null;
  readonly?: boolean;
  accessibility?: ts.TsAccessibility;
  static?: boolean;
  abstract?: boolean;
  override?: boolean;
  optional?: boolean;
} & PPO<ts.TsNode<string>>;
type _TsPropertyGetSetOpt = { get?: ts.TsPropertyMethod | null; set?: ts.TsPropertyMethod | null } & PPO<
  ts.TsNode<string>
>;
export function tsProperty(
  name: string,
  options?: Prettify<_TsPropertyAutoOpt> | Prettify<_TsPropertyGetSetOpt>
): ts.TsProperty {
  if (options && ('get' in options || 'set' in options)) {
    return {
      ...tsNode('property', options),
      name,
      get: options.get ?? null,
      set: options.set ?? null,
    };
  } else {
    const o = options as _TsPropertyAutoOpt | undefined;
    return {
      ...tsNode('property', options),
      name,
      type: o?.type ?? null,
      value: o?.value ?? null,
      readonly: o?.readonly ?? false,
      accessibility: o?.accessibility ?? null,
      static: o?.static ?? false,
      abstract: o?.abstract ?? false,
      override: o?.override ?? false,
      optional: o?.optional ?? false,
    };
  }
}

export function tsClass(name: string, options?: PPO<ts.TsClass, 'name'>): ts.TsClass {
  return {
    ...tsNode('class', options),
    name,
    generics: options?.generics ?? [],
    extends: options?.extends ?? null,
    implements: options?.implements ?? [],
    properties: options?.properties ?? [],
    methods: options?.methods ?? [],
    ctor: options?.ctor ?? null,
    export: options?.export ?? false,
    abstract: options?.abstract ?? false,
  };
}

export function tsInterface(name: string, options?: PPO<ts.TsInterface, 'name'>): ts.TsInterface {
  return {
    ...tsNode('interface', options),
    name,
    generics: options?.generics ?? [],
    extends: options?.extends ?? [],
    properties: options?.properties ?? [],
    methods: options?.methods ?? [],
    export: options?.export ?? false,
  };
}

export function tsTypeAlias(name: string, options: PPO<ts.TsTypeAlias, 'name', 'type'>): ts.TsTypeAlias {
  return {
    ...tsNode('typeAlias', options),
    name,
    generics: options.generics ?? [],
    type: options.type,
    export: options.export ?? false,
  };
}

export function tsEnumMember(name: string, options?: PPO<ts.TsEnumMember, 'name'>): ts.TsEnumMember {
  return { ...tsNode('enumMember', options), name, value: options?.value ?? null };
}

export function tsEnum(name: string, options?: PPO<ts.TsEnum, 'name'>): ts.TsEnum {
  return {
    ...tsNode('enum', options),
    name,
    members: options?.members ?? [],
    export: options?.export ?? false,
    const: options?.const ?? false,
  };
}

export function tsFunction(name: string, options: PPO<ts.TsFunction, 'name'>): ts.TsFunction {
  return {
    ...tsNode('function', options),
    name,
    generics: options.generics ?? [],
    parameters: options.parameters ?? [],
    returnType: options.returnType ?? null,
    body: options.body ?? null,
    export: options.export ?? false,
  };
}

export function tsVariable(name: string, options?: PPO<ts.TsVariable, 'name'>): ts.TsVariable {
  return {
    ...tsNode('variable', options),
    name,
    type: options?.type ?? null,
    value: options?.value ?? null,
    export: options?.export ?? false,
    readonly: options?.readonly ?? false,
  };
}

export function tsObjectType(options?: PPO<ts.TsObjectType>): ts.TsObjectType {
  return {
    ...tsNode('objectType', options),
    members: options?.members ?? [],
  };
}

export function tsArrayType(type: ts.TsCode, options: PPO<ts.TsArrayType, 'type'>): ts.TsArrayType {
  return {
    ...tsNode('arrayType', options),
    type,
    readonly: options.readonly ?? false,
  };
}

export function tsFunctionType(options: PPO<ts.TsFunctionType>): ts.TsFunctionType {
  return {
    ...tsNode('functionType', options),
    generics: options.generics ?? [],
    parameters: options.parameters ?? [],
    returnType: options.returnType ?? null,
  };
}

export function tsObject(options?: PPO<ts.TsObject>): ts.TsObject {
  return {
    ...tsNode('object', options),
    members: options?.members ?? [],
  };
}

export function tsArrowFunction(options: PPO<ts.TsArrowFunction, never, 'body'>): ts.TsArrowFunction {
  return {
    ...tsNode('arrowFunction', options),
    generics: options.generics ?? [],
    parameters: options.parameters ?? [],
    returnType: options.returnType ?? null,
    body: options.body,
  };
}
