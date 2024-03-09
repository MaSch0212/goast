import { AppendValue, SourceBuilder } from '@goast/core';

import { KtDefaultBuilder, isKtNode } from './common';
import {
  KtAnnotation,
  KtGenericParameter,
  KtReference,
  KtString,
  ktAnnotationNodeKind,
  ktGenericParameterNodeKind,
  ktReferenceNodeKind,
  ktStringNodeKind,
  writeKtAnnotation,
  writeKtGenericParameter,
  writeKtReference,
  writeKtString,
} from './nodes';
import { KotlinFileBuilder } from '../file-builder';

export type KtWritableNode<TBuilder extends SourceBuilder = KtDefaultBuilder> =
  | KtAnnotation<TBuilder>
  | KtGenericParameter<TBuilder>
  | KtReference<TBuilder>
  | KtString<TBuilder>;

export function writeKt<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  value: AppendValue<TBuilder> | KtWritableNode<TBuilder>
): TBuilder {
  if (isKtNode(value)) {
    switch (value.kind) {
      case ktAnnotationNodeKind:
        return writeKtAnnotation(builder, value);
      case ktGenericParameterNodeKind:
        return writeKtGenericParameter(builder, value);
      case ktReferenceNodeKind:
        if (!(builder instanceof KotlinFileBuilder)) {
          throw new Error('Reference node can be used only in Kotlin file');
        }
        return writeKtReference(builder, value) as SourceBuilder as TBuilder;
      case ktStringNodeKind:
        return writeKtString(builder, value);
    }
  }
  return builder.append(value);
}
