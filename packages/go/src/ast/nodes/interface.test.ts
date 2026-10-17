import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goDoc } from './doc.ts';
import { goField } from './field.ts';
import { goInterface } from './interface.ts';
import { goMethod } from './method.ts';
import { goParameter } from './parameter.ts';
import { goPointer } from './pointer.ts';
import { goReference } from './reference.ts';
import { goStruct } from './struct.ts';

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

describe('goInterface', () => {
  it('writes the example of its documentation', () => {
    expect(
      render(
        goInterface([
          goMethod('GetPet', {
            parameters: [goParameter('id', goReference('string'))],
            results: [goParameter(null, goPointer(goReference('Pet'))), goParameter(null, goReference('error'))],
          }),
        ]),
      ),
    ).toBe('interface {\n\tGetPet(id string) (*Pet, error)\n}');
  });

  it('writes an empty interface on one line', () => {
    expect(render(goInterface())).toBe('interface{}');
    expect(render(goInterface([]))).toBe('interface{}');
    expect(render(goInterface([null, undefined]))).toBe('interface{}');
  });

  it('writes a single method on its own line', () => {
    expect(render(goInterface([goMethod('Ping')]))).toBe('interface {\n\tPing()\n}');
  });

  it('writes an embedded type as its type only', () => {
    expect(render(goInterface([goReference('Stringer', 'fmt')]))).toBe('interface {\n\tfmt.Stringer\n}');
  });

  it('writes the members in order and skips nullish members', () => {
    expect(render(goInterface([goMethod('B'), null, goMethod('A'), undefined]))).toBe('interface {\n\tB()\n\tA()\n}');
  });

  it('writes the doc comment of a method above it', () => {
    expect(render(goInterface([goMethod('Get', { doc: goDoc('Get it.') })]))).toBe(
      'interface {\n\t// Get it.\n\tGet()\n}',
    );
  });

  it('writes the injections before and after the members', () => {
    expect(
      render(
        goInterface([goMethod('Get')], {
          inject: { beforeMembers: '/* before */', afterMembers: '/* after */' },
        }),
      ),
    ).toBe('interface {\n\t/* before */Get()\n\t/* after */\n}');
  });

  it('writes the injections of an empty interface instead of writing it on one line', () => {
    expect(render(goInterface([], { inject: { beforeMembers: '/* empty */' } }))).toBe('interface {\n\t/* empty */\n}');
  });

  it('is written as the type of a field', () => {
    expect(render(goStruct([goField('X', goInterface())]))).toBe('struct {\n\tX interface{}\n}');
  });

  it('writes several interfaces through its write helper', () => {
    const builder = createBuilder();
    goInterface.write(builder, [goInterface(), goInterface([goMethod('A')])], { separator: '\n' });

    expect(builder.toFragmentString().trimEnd()).toBe('interface{}\ninterface {\n\tA()\n}');
  });

  it('writes a context parameter with its package', () => {
    expect(render(goInterface([goMethod('Run', { parameters: [goParameter('ctx', refs.context.context())] })]))).toBe(
      'interface {\n\tRun(ctx context.Context)\n}',
    );
  });
});
