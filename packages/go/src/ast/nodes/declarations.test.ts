import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goConst, goConstSpec } from './const.ts';
import { goDoc } from './doc.ts';
import { goFunction } from './function.ts';
import { goInterface } from './interface.ts';
import { goMap } from './map.ts';
import { goMethod } from './method.ts';
import { goParameter } from './parameter.ts';
import { goPointer } from './pointer.ts';
import { goReference } from './reference.ts';
import { goString } from './string.ts';
import { goTypeDeclaration } from './type-declaration.ts';

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  // A fixed newLine keeps the expectations below host-independent.
  const builder = new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
  } as GoGeneratorConfig);
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

describe('goDoc', () => {
  it('writes every line as a comment', () => {
    expect(render(goDoc('First line.\n\nSecond paragraph.'))).toBe('// First line.\n//\n// Second paragraph.');
  });

  it('adds a deprecation paragraph', () => {
    expect(render(goDoc('A pet.', { deprecated: 'Use Animal.' }))).toBe('// A pet.\n//\n// Deprecated: Use Animal.');
  });

  it('writes nothing without text', () => {
    expect(render(goDoc())).toBe('');
  });
});

describe('goTypeDeclaration', () => {
  it('declares a type with its doc', () => {
    expect(render(goTypeDeclaration('Tags', goMap(refs.string(), refs.string()), { doc: goDoc('Tags.') }))).toBe(
      '// Tags.\ntype Tags map[string]string',
    );
  });

  it('declares an alias', () => {
    expect(render(goTypeDeclaration('Anything', refs.any(), { alias: true }))).toBe('type Anything = any');
  });
});

describe('goConst', () => {
  it('aligns the names, types and values of a block', () => {
    const type = goReference('PetStatus');
    expect(
      render(
        goConst([
          goConstSpec('PetStatusAvailable', goString('available'), { type }),
          goConstSpec('PetStatusSold', goString('sold'), { type }),
        ]),
      ),
    ).toBe(
      ['const (', '\tPetStatusAvailable PetStatus = "available"', '\tPetStatusSold      PetStatus = "sold"', ')'].join(
        '\n',
      ),
    );
  });
});

describe('goInterface', () => {
  it('writes its methods', () => {
    expect(
      render(
        goInterface([
          goMethod('GetPet', {
            parameters: [goParameter('ctx', refs.context.context()), goParameter('id', refs.string())],
            results: [goParameter(null, goPointer(goReference('Pet'))), goParameter(null, refs.error())],
          }),
        ]),
      ),
    ).toBe('interface {\n\tGetPet(ctx context.Context, id string) (*Pet, error)\n}');
  });
});

describe('goFunction', () => {
  it('writes a method with a receiver and a body', () => {
    expect(
      render(
        goFunction('IsValid', {
          receiver: goParameter('v', goReference('PetStatus')),
          results: [goParameter(null, refs.bool())],
          body: 'return v != ""',
        }),
      ),
    ).toBe('func (v PetStatus) IsValid() bool {\n\treturn v != ""\n}');
  });

  it('writes type parameters and named results', () => {
    expect(
      render(
        goFunction('first', {
          typeParameters: [goParameter('T', refs.any())],
          parameters: [goParameter('values', goReference('T'), { variadic: true })],
          results: [goParameter('value', goReference('T')), goParameter('ok', refs.bool())],
          body: 'return',
        }),
      ),
    ).toBe('func first[T any](values ...T) (value T, ok bool) {\n\treturn\n}');
  });
});
