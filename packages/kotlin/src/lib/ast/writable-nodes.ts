import { AppendValue, SourceBuilder } from '@goast/core';

import { KtDefaultBuilder, isKtNode } from './common';
import { KtAnnotation, ktAnnotationNodeKind, writeKtAnnotation } from './nodes/annotation';
import { KtConstructor, ktConstructorNodeKind, writeKtConstructor } from './nodes/constructor';
import { KtDoc, ktDocNodeKind, writeKtDoc } from './nodes/doc';
import { KtDocTag, ktDocTagNodeKind, writeKtDocTag } from './nodes/doc-tag';
import { KtFunction, ktFunctionNodeKind, writeKtFunction } from './nodes/function';
import { KtGenericParameter, ktGenericParameterNodeKind, writeKtGenericParameter } from './nodes/generic-parameter';
import { KtInitBlock, ktInitBlockNodeKind, writeKtInitBlock } from './nodes/init-block';
import { KtParameter, ktParameterNodeKind, writeKtParameter } from './nodes/parameter';
import { KtProperty, ktPropertyNodeKind, writeKtProperty } from './nodes/property';
import { KtReference, ktReferenceNodeKind, writeKtReference } from './nodes/reference';
import { KtString, ktStringNodeKind, writeKtString } from './nodes/string';
import { KotlinFileBuilder } from '../file-builder';

export type KtWritableNode<TBuilder extends SourceBuilder = KtDefaultBuilder> =
  | KtAnnotation<TBuilder>
  | KtConstructor<TBuilder>
  | KtDocTag<TBuilder>
  | KtDoc<TBuilder>
  | KtFunction<TBuilder>
  | KtGenericParameter<TBuilder>
  | KtInitBlock<TBuilder>
  | KtParameter<TBuilder>
  | KtProperty<TBuilder>
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
      case ktConstructorNodeKind:
        return writeKtConstructor(builder, value);
      case ktDocTagNodeKind:
        return writeKtDocTag(builder, value);
      case ktDocNodeKind:
        return writeKtDoc(builder, value);
      case ktFunctionNodeKind:
        return writeKtFunction(builder, value);
      case ktGenericParameterNodeKind:
        return writeKtGenericParameter(builder, value);
      case ktInitBlockNodeKind:
        return writeKtInitBlock(builder, value);
      case ktParameterNodeKind:
        return writeKtParameter(builder, value);
      case ktPropertyNodeKind:
        return writeKtProperty(builder, value);
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
