import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import type { KtCall } from './call.ts';
import type { KtCollectionLiteral } from './collection-literal.ts';
import type { KtLambdaType } from './lambda-type.ts';
import type { KtLambda } from './lambda.ts';
import type { KtObject } from './object.ts';
import type { KtReference } from './reference.ts';
import type { KtString } from './string.ts';

/**
 * A value that can be written where a Kotlin type is expected: a reference, a lambda type, or any appended value.
 * @template TBuilder The type of the builder that the type is written to.
 */
export type KtType<TBuilder extends SourceBuilder> =
  | KtReference<TBuilder>
  | KtLambdaType<TBuilder>
  | BasicAppendValue<TBuilder>;

/**
 * A value that can be written where a Kotlin expression is expected, such as a default value or an argument: a
 * reference, a string, a call, an object, a lambda, a collection literal, or any appended value.
 * @template TBuilder The type of the builder that the value is written to.
 */
export type KtValue<TBuilder extends SourceBuilder> =
  | KtReference<TBuilder>
  | KtString<TBuilder>
  | KtCall<TBuilder>
  | KtObject<TBuilder>
  | KtLambda<TBuilder>
  | KtCollectionLiteral<TBuilder>
  | BasicAppendValue<TBuilder>;
