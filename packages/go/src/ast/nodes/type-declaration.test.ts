import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goDoc } from './doc.ts';
import { goField } from './field.ts';
import { goMap } from './map.ts';
import { goParameter } from './parameter.ts';
import { goReference } from './reference.ts';
import { goStruct } from './struct.ts';
import { goTypeDeclaration } from './type-declaration.ts';

function createBuilder(): GoFileBuilder {
  // A fixed newLine keeps the expectations below host-independent.
  return new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
    addGeneratedHeader: false,
  } as GoGeneratorConfig);
}

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  const builder = createBuilder();
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

describe('goTypeDeclaration', () => {
  it('writes the example of its documentation', () => {
    expect(render(goTypeDeclaration('Tags', goMap(refs.string(), refs.string()), { doc: goDoc('Tags.') }))).toBe(
      '// Tags.\ntype Tags map[string]string',
    );
  });

  it('writes a new type with a struct type', () => {
    expect(render(goTypeDeclaration('Pet', goStruct([goField('ID', refs.string())])))).toBe(
      'type Pet struct {\n\tID string\n}',
    );
  });

  it('writes a predeclared type as a new type', () => {
    expect(render(goTypeDeclaration('ID', refs.string()))).toBe('type ID string');
  });

  it('writes a raw type string as it is', () => {
    expect(render(goTypeDeclaration('Ids', '[]int64'))).toBe('type Ids []int64');
  });

  it('writes an alias of a reference', () => {
    expect(render(goTypeDeclaration('Owner', goReference('Pet'), { alias: true }))).toBe('type Owner = Pet');
  });

  it('writes a declaration that is not an alias when alias is null', () => {
    expect(render(goTypeDeclaration('Owner', goReference('Pet'), { alias: null }))).toBe('type Owner Pet');
  });

  it('writes type parameters in square brackets after the name', () => {
    expect(
      render(
        goTypeDeclaration('Set', goMap(goReference('T'), refs.bool()), {
          typeParameters: [goParameter('T', refs.any())],
        }),
      ),
    ).toBe('type Set[T any] map[T]bool');
  });

  it('writes several type parameters separated by commas', () => {
    expect(
      render(
        goTypeDeclaration('Pair', goStruct(), {
          typeParameters: [goParameter('K', refs.any()), goParameter('V', refs.any())],
        }),
      ),
    ).toBe('type Pair[K any, V any] struct{}');
  });

  it('skips nullish type parameters and writes no brackets for an empty list', () => {
    expect(
      render(
        goTypeDeclaration('Set', goReference('Y'), {
          typeParameters: [null, undefined],
        }),
      ),
    ).toBe('type Set Y');
  });

  it('ends the declaration with a line break', () => {
    const builder = createBuilder();
    builder.append(goTypeDeclaration('A', refs.int()));

    expect(builder.toFragmentString()).toBe('type A int\n');
  });

  it('writes the injections around the doc comment, name, type parameters and type', () => {
    expect(
      render(
        goTypeDeclaration('Set', refs.bool(), {
          typeParameters: [goParameter('T', refs.any())],
          inject: {
            beforeDoc: '<bd>',
            afterDoc: '<ad>',
            beforeName: '<bn>',
            afterName: '<an>',
            beforeTypeParameters: '<btp>',
            afterTypeParameters: '<atp>',
            beforeType: '<bt>',
            afterType: '<at>',
          },
        }),
      ),
    ).toBe('<bd><ad>type <bn>Set<an><btp>[T any]<atp> <bt>bool<at>');
  });

  it('does not write the type parameter injections without type parameters', () => {
    expect(
      render(
        goTypeDeclaration('Set', refs.bool(), {
          inject: { beforeTypeParameters: '<btp>', afterTypeParameters: '<atp>' },
        }),
      ),
    ).toBe('type Set bool');
  });

  it('writes several declarations through its write helper', () => {
    const builder = createBuilder();
    goTypeDeclaration.write(builder, [goTypeDeclaration('A', refs.int()), goTypeDeclaration('B', refs.bool())]);

    expect(builder.toFragmentString()).toBe('type A int\ntype B bool\n');
  });
});
