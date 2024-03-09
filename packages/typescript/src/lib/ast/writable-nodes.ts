import { AppendValue, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, isTsNode } from './common';
import { TsAny, tsAnyNodeKind, writeTsAny } from './nodes/any';
import { TsArrayType, tsArrayTypeNodeKind, writeTsArrayType } from './nodes/array-type';
import { TsArrowFunction, tsArrowFunctionNodeKind, writeTsArrowFunction } from './nodes/arrow-function';
import { TsClass, tsClassNodeKind, writeTsClass } from './nodes/class';
import { TsConstructor, tsConstructorNodeKind, writeTsConstructor } from './nodes/constructor';
import {
  TsConstructorParameter,
  tsConstructorParameterNodeKind,
  writeTsConstructorParameter,
} from './nodes/constructor-parameter';
import { TsDecorator, tsDecoratorNodeKind, writeTsDecorator } from './nodes/decorator';
import { TsDoc, tsDocNodeKind, writeTsDoc } from './nodes/doc';
import { TsDocTag, tsDocTagNodeKind, writeTsDocTag } from './nodes/doc-tag';
import { TsEnum, TsEnumValue, tsEnumNodeKind, tsEnumValueNodeKind, writeTsEnum, writeTsEnumValue } from './nodes/enum';
import { TsExport, tsExportNodeKind, writeTsExport } from './nodes/export';
import { TsFunction, tsFunctionNodeKind, writeTsFunction } from './nodes/function';
import { TsFunctionType, tsFunctionTypeNodeKind, writeTsFunctionType } from './nodes/function-type';
import { TsGenericParameter, tsGenericParameterNodeKind, writeTsGenericParameter } from './nodes/generic-parameter';
import { TsIndexer, tsIndexerNodeKind, writeTsIndexer } from './nodes/indexer';
import { TsInterface, tsInterfaceNodeKind, writeTsInterface } from './nodes/interface';
import { TsIntersectionType, tsIntersectionNodeKind, writeTsIntersectionType } from './nodes/intersection-type';
import { TsMethod, tsMethodNodeKind, writeTsMethod } from './nodes/method';
import { TsObject, tsObjectNodeKind, writeTsObject } from './nodes/object';
import { TsObjectType, tsObjectTypeNodeKind, writeTsObjectType } from './nodes/object-type';
import { TsParameter, tsParameterNodeKind, writeTsParameter } from './nodes/parameter';
import { TsProperty, tsPropertyNodeKind, writeTsProperty } from './nodes/property';
import { TsReference, tsReferenceNodeKind, writeTsReference } from './nodes/reference';
import { TsString, tsStringNodeKind, writeTsString } from './nodes/string';
import { TsTuple, tsTupleNodeKind, writeTsTuple } from './nodes/tuple';
import { TsTypeAlias, tsTypeAliasNodeKind, writeTsTypeAlias } from './nodes/type-alias';
import { TsUnionType, tsUnionNodeKind, writeTsUnionType } from './nodes/union-type';
import { TsVariable, tsVariableNodeKind, writeTsVariable } from './nodes/variable';
import { TypeScriptFileBuilder } from '../file-builder';

export type TsWritableNode<TBuilder extends SourceBuilder = TsDefaultBuilder> =
  | TsAny<TBuilder>
  | TsArrayType<TBuilder>
  | TsArrowFunction<TBuilder>
  | TsClass<TBuilder>
  | TsConstructorParameter<TBuilder>
  | TsConstructor<TBuilder>
  | TsDecorator<TBuilder>
  | TsDocTag<TBuilder>
  | TsDoc<TBuilder>
  | TsEnumValue<TBuilder>
  | TsEnum<TBuilder>
  | TsExport<TBuilder>
  | TsFunctionType<TBuilder>
  | TsFunction<TBuilder>
  | TsGenericParameter<TBuilder>
  | TsIndexer<TBuilder>
  | TsInterface<TBuilder>
  | TsIntersectionType<TBuilder>
  | TsMethod<TBuilder>
  | TsObjectType<TBuilder>
  | TsObject<TBuilder>
  | TsParameter<TBuilder>
  | TsProperty<TBuilder>
  | TsReference<TBuilder>
  | TsString<TBuilder>
  | TsTuple<TBuilder>
  | TsTypeAlias<TBuilder>
  | TsUnionType<TBuilder>
  | TsVariable<TBuilder>;

export function writeTs<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  value: AppendValue<TBuilder> | TsWritableNode<TBuilder>
): TBuilder {
  if (isTsNode(value)) {
    switch (value.kind) {
      case tsAnyNodeKind:
        return writeTsAny(builder, value);
      case tsArrayTypeNodeKind:
        return writeTsArrayType(builder, value);
      case tsArrowFunctionNodeKind:
        return writeTsArrowFunction(builder, value);
      case tsClassNodeKind:
        return writeTsClass(builder, value);
      case tsConstructorParameterNodeKind:
        return writeTsConstructorParameter(builder, value);
      case tsConstructorNodeKind:
        return writeTsConstructor(builder, value);
      case tsDecoratorNodeKind:
        return writeTsDecorator(builder, value);
      case tsDocTagNodeKind:
        return writeTsDocTag(builder, value);
      case tsDocNodeKind:
        return writeTsDoc(builder, value);
      case tsEnumValueNodeKind:
        return writeTsEnumValue(builder, value);
      case tsEnumNodeKind:
        return writeTsEnum(builder, value);
      case tsExportNodeKind:
        if (!(builder instanceof TypeScriptFileBuilder)) {
          throw new Error('Export node can be used only in TypeScript file');
        }
        return writeTsExport(builder, value) as SourceBuilder as TBuilder;
      case tsFunctionTypeNodeKind:
        return writeTsFunctionType(builder, value);
      case tsFunctionNodeKind:
        return writeTsFunction(builder, value);
      case tsGenericParameterNodeKind:
        return writeTsGenericParameter(builder, value);
      case tsIndexerNodeKind:
        return writeTsIndexer(builder, value);
      case tsInterfaceNodeKind:
        return writeTsInterface(builder, value);
      case tsIntersectionNodeKind:
        return writeTsIntersectionType(builder, value);
      case tsMethodNodeKind:
        return writeTsMethod(builder, value);
      case tsObjectTypeNodeKind:
        return writeTsObjectType(builder, value);
      case tsObjectNodeKind:
        return writeTsObject(builder, value);
      case tsParameterNodeKind:
        return writeTsParameter(builder, value);
      case tsPropertyNodeKind:
        return writeTsProperty(builder, value);
      case tsReferenceNodeKind:
        if (!(builder instanceof TypeScriptFileBuilder)) {
          throw new Error('Reference node can be used only in TypeScript file');
        }
        return writeTsReference(builder, value) as SourceBuilder as TBuilder;
      case tsStringNodeKind:
        return writeTsString(builder, value);
      case tsTupleNodeKind:
        return writeTsTuple(builder, value);
      case tsTypeAliasNodeKind:
        return writeTsTypeAlias(builder, value);
      case tsUnionNodeKind:
        return writeTsUnionType(builder, value);
      case tsVariableNodeKind:
        return writeTsVariable(builder, value);
    }
  }
  return builder.append(value);
}
