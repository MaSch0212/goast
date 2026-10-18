export { GoNode as Node } from './node.ts';
export {
  GoConst as Const,
  goConst as const,
  GoConstSpec as ConstSpec,
  goConstSpec as constSpec,
} from './nodes/const.ts';
export { GoDoc as Doc, goDoc as doc } from './nodes/doc.ts';
export { GoField as Field, goField as field, type GoStructTagEntries as StructTagEntries } from './nodes/field.ts';
export { GoFunction as Function, goFunction as function } from './nodes/function.ts';
export {
  GoInterface as Interface,
  goInterface as interface,
  type GoInterfaceMember as InterfaceMember,
} from './nodes/interface.ts';
export { GoMap as Map, goMap as map } from './nodes/map.ts';
export { GoMethod as Method, goMethod as method } from './nodes/method.ts';
export { GoParameter as Parameter, goParameter as parameter } from './nodes/parameter.ts';
export { GoPointer as Pointer, goPointer as pointer } from './nodes/pointer.ts';
export {
  GoReference as Reference,
  goReference as reference,
  type GoReferenceFactory as ReferenceFactory,
} from './nodes/reference.ts';
export { GoSlice as Slice, goSlice as slice } from './nodes/slice.ts';
export { GoString as String, goString as string } from './nodes/string.ts';
export { GoStruct as Struct, goStruct as struct } from './nodes/struct.ts';
export {
  GoTypeDeclaration as TypeDeclaration,
  goTypeDeclaration as typeDeclaration,
} from './nodes/type-declaration.ts';
export { type GoType as Type } from './nodes/types.ts';
export * as refs from './references/index.ts';
export { isGoNilableType as isNilable } from './utils/is-nilable.ts';
export { renderGoNode as render, writeGoNode as writeNode, writeGoNodes as writeNodes } from './utils/write-go-node.ts';
