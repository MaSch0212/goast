import { BuilderFn } from '@goast/core';

import { isTsEnumMember } from './factories';
import * as ts from './types';
import { TypeScriptFileBuilder } from '../file-builder';

export const writers: {
  [K in ts.TsWritableNodes['kind']]: <T extends TypeScriptFileBuilder>(
    builder: T,
    node: ts.TsWritableNodes & { kind: K }
  ) => T;
} = {
  code: writeTsCode,
  genericParameter: writeTsGenericParameter,
  parameter: writeTsParameter,
  constructorParameter: writeTsConstructorParameter,
  constructor: writeTsConstructor,
  method: writeTsMethod,
  property: writeTsProperty,
  class: writeTsClass,
  interface: writeTsInterface,
  typeAlias: writeTsTypeAlias,
  enum: writeTsEnum,
  function: writeTsFunction,
  variable: writeTsVariable,
  objectType: writeTsObjectType,
  arrayType: writeTsArrayType,
  functionType: writeTsFunctionType,
  object: writeTsObject,
  arrowFunction: writeTsArrowFunction,
};

function singleLineTsCode(code: ts.TsCode): ts.TsCode;
function singleLineTsCode(code: ts.TsCode | null): ts.TsCode | null;
function singleLineTsCode(code: ts.TsCode | null): ts.TsCode | null {
  if (code === null) return null;
  return { ...code, multiline: false };
}

function writeTsNode<T extends TypeScriptFileBuilder, N extends ts.TsNode<string>>(
  builder: T,
  node: N,
  build: BuilderFn<T>
) {
  return builder
    .append(...node.inject.before)
    .append(build)
    .append(...node.inject.after);
}

export function writeTsCode<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsCode): T {
  return writeTsNode(builder, node, (b) =>
    b.if(
      node.multiline,
      (b) => b.forEach(node.parts, (b, p) => b.append(p).ensureCurrentLineEmpty()),
      (b) => b.append(...node.parts)
    )
  );
}

export function writeTsGenericParameters<T extends TypeScriptFileBuilder>(
  builder: T,
  parameters: (ts.TsGenericParameter | ts.TsValueInject)[]
): T {
  if (parameters.length === 0) return builder;
  return builder.parenthesize('<>', (b) => b.forEach(parameters, (b, p) => b.append(p), { separator: ', ' }));
}

export function writeTsGenericParameter<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsGenericParameter): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.const, 'const ')
      .append(node.name)
      .appendIf(node.constraint !== null, ' extends ', singleLineTsCode(node.constraint))
      .appendIf(node.default !== null, ' = ', singleLineTsCode(node.default))
  );
}

export function writeTsParameters<T extends TypeScriptFileBuilder>(
  builder: T,
  parameters: (ts.TsParameter | ts.TsValueInject)[]
): T {
  return builder.parenthesize('()', (b) => b.forEach(parameters, (b, p) => b.append(p), { separator: ', ' }));
}

export function writeTsParameter<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsParameter): T {
  return writeTsNode(builder, node, (b) =>
    b
      .append(node.name)
      .appendIf(node.optional, '?')
      .appendIf(node.type !== null, ': ', singleLineTsCode(node.type))
      .appendIf(node.default !== null, ' = ', singleLineTsCode(node.default))
  );
}

export function writeTsConstructorParameters<T extends TypeScriptFileBuilder>(
  builder: T,
  parameters: (ts.TsConstructorParameter | ts.TsValueInject)[]
): T {
  return builder.parenthesize('()', (b) => b.forEach(parameters, (b, p) => b.append(p), { separator: ', ' }));
}

export function writeTsConstructorParameter<T extends TypeScriptFileBuilder>(
  builder: T,
  node: ts.TsConstructorParameter
): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.accessibility !== null, node.accessibility + ' ')
      .appendIf(node.readonly, 'readonly ')
      .append(node.name)
      .appendIf(node.optional, '?')
      .appendIf(node.type !== null, ': ', singleLineTsCode(node.type))
      .appendIf(node.default !== null, ' = ', singleLineTsCode(node.default))
  );
}

export function writeTsConstructor<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsConstructor): T {
  return writeTsNode(builder, node, (b) =>
    b
      .append(
        'constructor',
        ...node.inject.beforeParams,
        (b) => writeTsConstructorParameters(b, node.parameters),
        ...node.inject.afterParams,
        ' '
      )
      .parenthesize('{}', node.body, { multiline: node.body !== null })
      .appendLine()
  );
}

export function writeTsMethod<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsMethod): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.accessibility !== null, node.accessibility + ' ')
      .appendIf(node.static, 'static ')
      .appendIf(node.abstract, 'abstract ')
      .appendIf(node.override, 'override ')
      .append(node.name)
      .appendIf(node.optional, '?')
      .append(
        (b) => writeTsGenericParameters(b, node.generics),
        (b) => writeTsParameters(b, node.parameters)
      )
      .appendIf(node.returnType !== null, ': ', singleLineTsCode(node.returnType))
      .if(
        node.body !== null,
        (b) => b.append(' ').parenthesize('{}', node.body, { multiline: true }),
        (b) => b.append(';')
      )
      .appendLine()
  );
}

export function writeTsPropertyMethod<T extends TypeScriptFileBuilder>(
  builder: T,
  kind: 'set' | 'get',
  name: string,
  node: ts.TsPropertyMethod
): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.accessibility !== null, node.accessibility + ' ')
      .appendIf(node.static, 'static ')
      .appendIf(node.abstract, 'abstract ')
      .appendIf(node.override, 'override ')
      .append(kind, ' ', name)
      .parenthesize('()', (b) =>
        b.if(kind === 'set', (b) => b.append('value').appendIf(node.type !== null, ': ', singleLineTsCode(node.type)))
      )
      .appendIf(kind === 'get' && node.type !== null, ': ', singleLineTsCode(node.type))
      .if(
        node.body !== null,
        (b) => b.append(' ').parenthesize('{}', node.body, { multiline: true }),
        (b) => b.append(';')
      )
      .appendLine()
  );
}

export function writeTsProperty<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsProperty): T {
  if ('get' in node) {
    return writeTsNode(builder, node, (b) => {
      if (node.get !== null) {
        writeTsPropertyMethod(b, 'get', node.name, node.get);
      }
      if (node.set !== null) {
        writeTsPropertyMethod(b, 'set', node.name, node.set);
      }
    });
  } else {
    return writeTsNode(builder, node, (b) =>
      b
        .appendIf(node.accessibility !== null, node.accessibility + ' ')
        .appendIf(node.static, 'static ')
        .appendIf(node.abstract, 'abstract ')
        .appendIf(node.override, 'override ')
        .appendIf(node.readonly, 'readonly ')
        .append(node.name)
        .appendIf(node.optional, '?')
        .appendIf(node.type !== null, ': ', singleLineTsCode(node.type))
        .appendIf(node.value !== null, ' = ', singleLineTsCode(node.value))
        .append(';')
        .appendLine()
    );
  }
}

export function writeTsClass<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsClass): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .appendIf(node.abstract, 'abstract ')
      .append('class ', node.name, (b) => writeTsGenericParameters(b, node.generics))
      .appendIf(node.extends !== null, ' extends ', singleLineTsCode(node.extends))
      .if(node.implements.length > 0, (b) =>
        b.append(' implements ').forEach(node.implements, (b, i) => b.append(singleLineTsCode(i)), { separator: ', ' })
      )
      .append(' ')
      .parenthesize(
        '{}',
        (b) =>
          b
            .forEach(node.properties, (b, p) => b.append(p))
            .appendLineIf(node.properties.length > 0 && node.ctor !== null)
            .append(node.ctor)
            .appendLineIf((node.ctor !== null || node.properties.length > 0) && node.methods.length > 0)
            .forEach(node.methods, (b, m) => b.append(m), { separator: '\n' }),
        { multiline: node.properties.length > 0 || node.ctor !== null || node.methods.length > 0 }
      )
      .appendLine()
  );
}

export function writeTsInterface<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsInterface): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .append('interface ')
      .append(node.name, (b) => writeTsGenericParameters(b, node.generics))
      .if(node.extends.length > 0, (b) =>
        b.append(' extends ').forEach(node.extends, (b, e) => b.append(singleLineTsCode(e)), { separator: ', ' })
      )
      .append(' ')
      .parenthesize(
        '{}',
        (b) =>
          b
            .forEach(node.properties, (b, p) => b.append(p))
            .appendLineIf(node.properties.length > 0 && node.methods.length > 0)
            .forEach(node.methods, (b, m) => b.append(m), { separator: '\n' }),
        { multiline: node.properties.length > 0 || node.methods.length > 0 }
      )
      .appendLine()
  );
}

export function writeTsTypeAlias<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsTypeAlias): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .append(
        'type ',
        node.name,
        (b) => writeTsGenericParameters(b, node.generics),
        ' = ',
        singleLineTsCode(node.type),
        ';'
      )
      .appendLine()
  );
}

export function writeTsEnumMember<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsEnumMember): T {
  return writeTsNode(builder, node, (b) =>
    b.append(node.name).appendIf(node.value !== null, ' = ', singleLineTsCode(node.value))
  );
}

export function writeTsEnum<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsEnum): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .appendIf(node.const, 'const ')
      .append('enum ', node.name, ' ')
      .parenthesize(
        '{}',
        (b) =>
          b.forEach(node.members, (b, m) => (isTsEnumMember(m) ? writeTsEnumMember(b, m) : b.append(m)), {
            separator: ',\n',
          }),
        { multiline: node.members.length > 0 }
      )
      .appendLine()
  );
}

export function writeTsFunction<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsFunction): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .append(
        'function ',
        node.name,
        (b) => writeTsGenericParameters(b, node.generics),
        (b) => writeTsParameters(b, node.parameters)
      )
      .appendIf(node.returnType !== null, ': ', singleLineTsCode(node.returnType))
      .append(' ')
      .parenthesize('{}', node.body, { multiline: true })
      .appendLine()
  );
}

export function writeTsVariable<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsVariable): T {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .appendIf(node.readonly, 'const ', 'let ')
      .append(node.name)
      .appendIf(node.type !== null, ': ', singleLineTsCode(node.type))
      .appendIf(node.value !== null, ' = ', singleLineTsCode(node.value))
      .appendLine(';')
  );
}

export function writeTsObjectType<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsObjectType): T {
  return writeTsNode(builder, node, (b) =>
    b.parenthesize('{}', (b) => b.forEach(node.members, (b, node) => b.append(node), { separator: '\n' }), {
      multiline: true,
    })
  );
}

export function writeTsArrayType<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsArrayType): T {
  return writeTsNode(builder, node, (b) =>
    b.appendIf(node.readonly, ' readonly').parenthesize('()', singleLineTsCode(node.type)).append('[]')
  );
}

export function writeTsFunctionType<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsFunctionType): T {
  return writeTsNode(builder, node, (b) =>
    b.parenthesize('()', (b) =>
      b
        .append(
          (b) => writeTsGenericParameters(b, node.generics),
          (b) => writeTsParameters(b, node.parameters)
        )
        .appendIf(node.returnType !== null, ': ', singleLineTsCode(node.returnType))
        .append(' => ', singleLineTsCode(node.returnType))
    )
  );
}

export function writeTsObject<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsObject): T {
  return writeTsNode(builder, node, (b) =>
    b.parenthesize('{}', (b) => b.forEach(node.members, (b, node) => b.append(node), { separator: '\n' }), {
      multiline: true,
    })
  );
}

export function writeTsArrowFunction<T extends TypeScriptFileBuilder>(builder: T, node: ts.TsArrowFunction): T {
  return writeTsNode(builder, node, (b) =>
    b
      .append(
        (b) => writeTsGenericParameters(b, node.generics),
        (b) => writeTsParameters(b, node.parameters)
      )
      .appendIf(node.returnType !== null, ': ', singleLineTsCode(node.returnType))
      .append(' => ')
      .parenthesize('{}', node.body, { multiline: true })
  );
}
