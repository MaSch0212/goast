import { AppendValue } from '@goast/core';

import { TypeScriptAppendValue, TypeScriptFileBuilder } from '../file-builder';

export type TsValueInject = AppendValue<TypeScriptFileBuilder>;

export type TsNode<T> = {
  lang: 'ts';
  kind: T;
  inject: {
    before: TsValueInject[];
    after: TsValueInject[];
  };
};
export type TsCode = TsNode<'code'> & {
  parts: TypeScriptAppendValue<TypeScriptFileBuilder>[];
  multiline: boolean;
};
export type TsGenericParameter = TsNode<'genericParameter'> & {
  name: string;
  constraint: TsCode | null;
  default: TsCode | null;
  const: boolean;
};
export type TsParameter = TsNode<'parameter'> & {
  name: string;
  type: TsCode | null;
  optional: boolean;
  default: TsCode | null;
};
export type TsAccessibility = 'public' | 'protected' | 'private' | null;

export type TsConstructorParameter = TsNode<'constructorParameter'> &
  Omit<TsParameter, 'kind'> & {
    accessibility: TsAccessibility;
    readonly: boolean;
  };
export type TsConstructor = TsNode<'constructor'> & {
  parameters: (TsConstructorParameter | TsValueInject)[];
  body: TsCode | null;
  inject: {
    beforeParams: TsValueInject[];
    afterParams: TsValueInject[];
  };
};

export type TsMethod = TsNode<'method'> & {
  name: string;
  generics: (TsGenericParameter | TsValueInject)[];
  parameters: (TsParameter | TsValueInject)[];
  returnType: TsCode | null;
  body: TsCode | null;
  accessibility: TsAccessibility;
  static: boolean;
  abstract: boolean;
  override: boolean;
  optional: boolean;
};

export type TsPropertyMethod = TsNode<'propertyMethod'> & {
  type: TsCode | null;
  body: TsCode | null;
  accessibility: TsAccessibility;
  static: boolean;
  abstract: boolean;
  override: boolean;
};
export type TsProperty = TsNode<'property'> & {
  name: string;
} & (
    | {
        type: TsCode | null;
        value: TsCode | null;
        readonly: boolean;
        accessibility: TsAccessibility;
        static: boolean;
        abstract: boolean;
        override: boolean;
        optional: boolean;
      }
    | {
        get: TsPropertyMethod | null;
        set: TsPropertyMethod | null;
      }
  );

export type TsClass = TsNode<'class'> & {
  name: string;
  generics: (TsGenericParameter | TsValueInject)[];
  extends: TsCode | null;
  implements: TsCode[];
  properties: (TsProperty | TsValueInject)[];
  methods: (TsMethod | TsValueInject)[];
  ctor: TsConstructor | TsValueInject | null;
  export: boolean;
  abstract: boolean;
};

export type TsInterface = TsNode<'interface'> & {
  name: string;
  generics: (TsGenericParameter | TsValueInject)[];
  extends: TsCode[];
  properties: (TsProperty | TsValueInject)[];
  methods: (TsMethod | TsValueInject)[];
  export: boolean;
};

export type TsTypeAlias = TsNode<'typeAlias'> & {
  name: string;
  generics: (TsGenericParameter | TsValueInject)[];
  type: TsCode;
  export: boolean;
};

export type TsEnumMember = TsNode<'enumMember'> & {
  name: string;
  value: TsCode | null;
};
export type TsEnum = TsNode<'enum'> & {
  name: string;
  members: (TsEnumMember | TsValueInject)[];
  export: boolean;
  const: boolean;
};

export type TsFunction = TsNode<'function'> & {
  name: string;
  generics: (TsGenericParameter | TsValueInject)[];
  parameters: (TsParameter | TsValueInject)[];
  returnType: TsCode | null;
  body: TsCode | null;
  export: boolean;
};

export type TsVariable = TsNode<'variable'> & {
  name: string;
  type: TsCode | null;
  value: TsCode | null;
  export: boolean;
  readonly: boolean;
};

export type TsObjectType = TsNode<'objectType'> & {
  members: (TsProperty | TsMethod | TsValueInject)[];
};

export type TsArrayType = TsNode<'arrayType'> & {
  type: TsCode;
  readonly: boolean;
};

export type TsFunctionType = TsNode<'functionType'> & {
  generics: (TsGenericParameter | TsValueInject)[];
  parameters: (TsParameter | TsValueInject)[];
  returnType: TsCode | null;
};

export type TsObject = TsNode<'object'> & {
  members: (TsProperty | TsMethod | TsValueInject)[];
};

export type TsArrowFunction = TsNode<'arrowFunction'> & {
  generics: (TsGenericParameter | TsValueInject)[];
  parameters: (TsParameter | TsValueInject)[];
  returnType: TsCode | null;
  body: TsCode;
};

export type TsWritableNodes =
  | TsCode
  | TsGenericParameter
  | TsParameter
  | TsConstructorParameter
  | TsConstructor
  | TsMethod
  | TsProperty
  | TsClass
  | TsInterface
  | TsTypeAlias
  | TsEnum
  | TsFunction
  | TsVariable
  | TsObjectType
  | TsArrayType
  | TsFunctionType
  | TsObject
  | TsArrowFunction;
