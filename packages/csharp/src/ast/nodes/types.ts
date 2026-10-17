import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import type { CsCall } from './call.ts';
import type { CsCollectionExpression } from './collection-expression.ts';
import type { CsLambda } from './lambda.ts';
import type { CsObjectCreation } from './object-creation.ts';
import type { CsReference } from './reference.ts';
import type { CsString } from './string.ts';
import type { CsSwitchExpression } from './switch-expression.ts';

export type CsType<TBuilder extends SourceBuilder> = CsReference<TBuilder> | BasicAppendValue<TBuilder>;

export type CsValue<TBuilder extends SourceBuilder> =
  | CsReference<TBuilder>
  | CsString<TBuilder>
  | CsCall<TBuilder>
  | CsObjectCreation<TBuilder>
  | CsLambda<TBuilder>
  | CsCollectionExpression<TBuilder>
  | CsSwitchExpression<TBuilder>
  | BasicAppendValue<TBuilder>;
