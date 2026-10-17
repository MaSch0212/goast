import { describe, expect, it } from 'vitest';

import * as refs from '../references/index.ts';
import { goField } from '../nodes/field.ts';
import { goInterface } from '../nodes/interface.ts';
import { goMap } from '../nodes/map.ts';
import { goPointer } from '../nodes/pointer.ts';
import { goReference } from '../nodes/reference.ts';
import { goSlice } from '../nodes/slice.ts';
import { goStruct } from '../nodes/struct.ts';
import { isGoNilableType } from './is-nilable.ts';

describe('isGoNilableType', () => {
  describe('nilable types', () => {
    it('is true for pointers, whatever they point to', () => {
      expect(isGoNilableType(goPointer(goReference('Pet')))).toBe(true);
      expect(isGoNilableType(goPointer(refs.int()))).toBe(true);
      expect(isGoNilableType(goPointer(goStruct()))).toBe(true);
    });

    it('is true for slices', () => {
      expect(isGoNilableType(goSlice(refs.string()))).toBe(true);
      expect(isGoNilableType(goSlice(goStruct()))).toBe(true);
    });

    it('is true for maps', () => {
      expect(isGoNilableType(goMap(refs.string(), refs.int()))).toBe(true);
    });

    it('is true for interface literals', () => {
      expect(isGoNilableType(goInterface())).toBe(true);
      expect(isGoNilableType(goInterface([goReference('Stringer', 'fmt')]))).toBe(true);
    });

    it('is true for the predeclared any and error', () => {
      expect(isGoNilableType(refs.any())).toBe(true);
      expect(isGoNilableType(refs.error())).toBe(true);
      expect(isGoNilableType(goReference('any'))).toBe(true);
      expect(isGoNilableType(goReference('error'))).toBe(true);
    });

    it('is true for json.RawMessage, which is a byte slice', () => {
      expect(isGoNilableType(refs.encoding.jsonRawMessage())).toBe(true);
    });

    it('is true for io.Reader', () => {
      expect(isGoNilableType(refs.io.reader())).toBe(true);
    });
  });

  describe('types that are not nilable', () => {
    it('is false for predeclared value types', () => {
      expect(isGoNilableType(refs.string())).toBe(false);
      expect(isGoNilableType(refs.int())).toBe(false);
      expect(isGoNilableType(refs.bool())).toBe(false);
      expect(isGoNilableType(refs.float64())).toBe(false);
      expect(isGoNilableType(refs.byte())).toBe(false);
    });

    it('is false for structs', () => {
      expect(isGoNilableType(goStruct())).toBe(false);
      expect(isGoNilableType(goStruct([goField('ID', refs.string())]))).toBe(false);
    });

    it('is false for named types of this package and other packages', () => {
      expect(isGoNilableType(goReference('Pet'))).toBe(false);
      expect(isGoNilableType(goReference('PetStatus', 'example.com/pets'))).toBe(false);
    });

    it('is false for structs of other packages', () => {
      expect(isGoNilableType(refs.time.time())).toBe(false);
      expect(isGoNilableType(refs.mime.multipartFileHeader())).toBe(false);
      expect(isGoNilableType(refs.net.httpRequest())).toBe(false);
      expect(isGoNilableType(refs.net.httpServeMux())).toBe(false);
    });

    it('is false for a raw type string, which is not inspected', () => {
      // Raw strings are appended as they are, so their kind is unknown and they are not treated as nilable.
      expect(isGoNilableType('[]string')).toBe(false);
    });
  });

  describe('known gaps', () => {
    // BUG: the check only knows a fixed list of predeclared and well-known types, while the doc comment defines
    // nilable as "pointers, slices, maps and interfaces". The interfaces of the standard library below have a zero
    // value of nil, but are not in that list, so they are reported as not nilable.
    it.fails('is true for context.Context, an interface', () => {
      expect(isGoNilableType(refs.context.context())).toBe(true);
    });

    it.fails('is true for io.ReadCloser, an interface', () => {
      expect(isGoNilableType(refs.io.readCloser())).toBe(true);
    });

    it.fails('is true for http.Handler, an interface', () => {
      expect(isGoNilableType(refs.net.httpHandler())).toBe(true);
    });

    it.fails('is true for http.ResponseWriter, an interface', () => {
      expect(isGoNilableType(refs.net.httpResponseWriter())).toBe(true);
    });

    // BUG: http.Header is declared as `map[string][]string` in the standard library, so its zero value is nil.
    it.fails('is true for http.Header, a map', () => {
      expect(isGoNilableType(refs.net.httpHeader())).toBe(true);
    });
  });
});
