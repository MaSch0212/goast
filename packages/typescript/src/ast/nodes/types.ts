import type { BasicAppendValue, SourceBuilder } from '@goast/core';
import type { TsArrayType } from './array-type.ts';
import type { TsArrowFunction } from './arrow-function.ts';
import type { TsCall } from './call.ts';
import type { TsClass } from './class.ts';
import type { TsFunctionType } from './function-type.ts';
import type { TsFunction } from './function.ts';
import type { TsIntersectionType } from './intersection-type.ts';
import type { TsLookupType } from './lookup-type.ts';
import type { TsObjectType } from './object-type.ts';
import type { TsObject } from './object.ts';
import type { TsReference } from './reference.ts';
import type { TsString } from './string.ts';
import type { TsTuple } from './tuple.ts';
import type { TsTypeof } from './typeof.ts';
import type { TsUnionType } from './union-type.ts';

/**
 * A type that can be written in a type position, such as a type annotation, a generic argument or a union member.
 * Plain strings and other append values are written as they are.
 *
 * @template TBuilder The type of the source builder the type is written to.
 */
export type TsType<TBuilder extends SourceBuilder> =
  | BasicAppendValue<TBuilder>
  | TsIntersectionType<TBuilder>
  | TsUnionType<TBuilder>
  | TsArrayType<TBuilder>
  | TsTuple<TBuilder>
  | TsFunctionType<TBuilder>
  | TsObjectType<TBuilder>
  | TsString<TBuilder>
  | TsLookupType<TBuilder>
  | TsTypeof<TBuilder>
  | TsReference<TBuilder>;

/**
 * A value that can be written in an expression position, such as the initial value of a variable or the default value
 * of a parameter. Plain strings and other append values are written as they are.
 *
 * @template TBuilder The type of the source builder the value is written to.
 */
export type TsValue<TBuilder extends SourceBuilder> =
  | BasicAppendValue<TBuilder>
  | TsObject<TBuilder>
  | TsTuple<TBuilder>
  | TsString<TBuilder>
  | TsArrowFunction<TBuilder>
  | TsFunction<TBuilder>
  | TsClass<TBuilder>
  | TsCall<TBuilder>
  | TsReference<TBuilder>;
