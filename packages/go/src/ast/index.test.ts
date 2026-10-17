import { describe, expect, it } from 'vitest';

import { go } from './index.ts';
import { GoConst, goConst, goConstSpec, GoConstSpec } from './nodes/const.ts';
import { GoDoc, goDoc } from './nodes/doc.ts';
import { GoField, goField } from './nodes/field.ts';
import { GoFunction, goFunction } from './nodes/function.ts';
import { GoInterface, goInterface } from './nodes/interface.ts';
import { GoMap, goMap } from './nodes/map.ts';
import { GoMethod, goMethod } from './nodes/method.ts';
import { GoParameter, goParameter } from './nodes/parameter.ts';
import { GoPointer, goPointer } from './nodes/pointer.ts';
import { GoReference, goReference } from './nodes/reference.ts';
import { GoSlice, goSlice } from './nodes/slice.ts';
import { GoString, goString } from './nodes/string.ts';
import { GoStruct, goStruct } from './nodes/struct.ts';
import { GoTypeDeclaration, goTypeDeclaration } from './nodes/type-declaration.ts';
import * as refs from './references/index.ts';
import { GoNode } from './node.ts';
import { isGoNilableType } from './utils/is-nilable.ts';
import { renderGoNode, writeGoNode, writeGoNodes } from './utils/write-go-node.ts';

describe('go namespace', () => {
  it('exposes the node classes and their factories', () => {
    expect(go.Node).toBe(GoNode);
    expect(go.Const).toBe(GoConst);
    expect(go.const).toBe(goConst);
    expect(go.ConstSpec).toBe(GoConstSpec);
    expect(go.constSpec).toBe(goConstSpec);
    expect(go.Doc).toBe(GoDoc);
    expect(go.doc).toBe(goDoc);
    expect(go.Field).toBe(GoField);
    expect(go.field).toBe(goField);
    expect(go.Function).toBe(GoFunction);
    expect(go.function).toBe(goFunction);
    expect(go.Interface).toBe(GoInterface);
    expect(go.interface).toBe(goInterface);
    expect(go.Map).toBe(GoMap);
    expect(go.map).toBe(goMap);
    expect(go.Method).toBe(GoMethod);
    expect(go.method).toBe(goMethod);
    expect(go.Parameter).toBe(GoParameter);
    expect(go.parameter).toBe(goParameter);
    expect(go.Pointer).toBe(GoPointer);
    expect(go.pointer).toBe(goPointer);
    expect(go.Reference).toBe(GoReference);
    expect(go.reference).toBe(goReference);
    expect(go.Slice).toBe(GoSlice);
    expect(go.slice).toBe(goSlice);
    expect(go.String).toBe(GoString);
    expect(go.string).toBe(goString);
    expect(go.Struct).toBe(GoStruct);
    expect(go.struct).toBe(goStruct);
    expect(go.TypeDeclaration).toBe(GoTypeDeclaration);
    expect(go.typeDeclaration).toBe(goTypeDeclaration);
  });

  it('exposes the reference helpers, the utils and the writers', () => {
    expect(go.refs).toBe(refs);
    expect(go.isNilable).toBe(isGoNilableType);
    expect(go.render).toBe(renderGoNode);
    expect(go.writeNode).toBe(writeGoNode);
    expect(go.writeNodes).toBe(writeGoNodes);
  });
});
