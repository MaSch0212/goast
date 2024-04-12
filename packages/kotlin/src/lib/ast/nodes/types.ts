import type { KtCall } from './call';
import type { KtCollectionLiteral } from './collection-literal';
import type { KtLambda } from './lambda';
import type { KtLambdaType } from './lambda-type';
import type { KtObject } from './object';
import type { KtReference } from './reference';
import type { KtString } from './string';
import type { BasicAppendValue, SourceBuilder } from '@goast/core';

export type KtType<TBuilder extends SourceBuilder> =
  | KtReference<TBuilder>
  | KtLambdaType<TBuilder>
  | BasicAppendValue<TBuilder>;

export type KtValue<TBuilder extends SourceBuilder> =
  | KtReference<TBuilder>
  | KtString<TBuilder>
  | KtCall<TBuilder>
  | KtObject<TBuilder>
  | KtLambda<TBuilder>
  | KtCollectionLiteral<TBuilder>
  | BasicAppendValue<TBuilder>;
