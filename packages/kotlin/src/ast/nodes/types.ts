import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import type { KtCall } from './call.ts';
import type { KtCollectionLiteral } from './collection-literal.ts';
import type { KtLambdaType } from './lambda-type.ts';
import type { KtLambda } from './lambda.ts';
import type { KtObject } from './object.ts';
import type { KtReference } from './reference.ts';
import type { KtString } from './string.ts';

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
