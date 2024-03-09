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
import { KtClassParameter, ktClassParameterNodeKind, writeKtClassParameter } from './nodes/class-parameter';
import { KtDocTag, ktDocTagNodeKind, writeKtDocTag } from './nodes/doc-tag';
import { KtParameter, ktParameterNodeKind, writeKtParameter } from './nodes/parameter';
import { KotlinFileBuilder } from '../file-builder';

export type KtWritableNode<TBuilder extends SourceBuilder = KtDefaultBuilder> =
  | KtAnnotation<TBuilder>
  | KtClassParameter<TBuilder>
  | KtDocTag<TBuilder>
  | KtGenericParameter<TBuilder>
  | KtParameter<TBuilder>
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
      case ktClassParameterNodeKind:
        return writeKtClassParameter(builder, value);
      case ktDocTagNodeKind:
        return writeKtDocTag(builder, value);
      case ktGenericParameterNodeKind:
        return writeKtGenericParameter(builder, value);
      case ktParameterNodeKind:
        return writeKtParameter(builder, value);
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
