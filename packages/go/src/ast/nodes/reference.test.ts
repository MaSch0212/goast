import { SourceBuilder } from '@goast/core';
import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goPointer } from './pointer.ts';
import { goReference } from './reference.ts';
import { goString } from './string.ts';
import { renderGoNode } from '../utils/write-go-node.ts';

const options = {
  ...defaultGoGeneratorConfig,
  newLine: '\n',
  addGeneratedHeader: false,
} as GoGeneratorConfig;

function createBuilder(packageName = 'api', importPath?: string): GoFileBuilder {
  // A fixed newLine keeps the expectations below host-independent.
  return new GoFileBuilder(packageName, importPath, options);
}

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  const builder = createBuilder();
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

describe('goReference', () => {
  it('writes the example of its documentation', () => {
    const builder = createBuilder();
    builder.append(goReference('Pet', 'example.com/pets/models'));

    expect(builder.toString()).toBe('package api\n\nimport "example.com/pets/models"\n\nmodels.Pet\n');
  });

  it('writes the name alone without an import path', () => {
    const builder = createBuilder();
    builder.append(goReference('Pet'));

    expect(render(goReference('Pet'))).toBe('Pet');
    expect(builder.imports.hasImports).toBe(false);
  });

  it('writes the name of a predeclared identifier without an import', () => {
    const builder = createBuilder();
    builder.append(refs.string(), ' ', refs.error());

    expect(builder.toString()).toBe('package api\n\nstring error\n');
  });

  it('does not qualify an identifier of the package of the file', () => {
    const builder = createBuilder('models', 'example.com/pets/models');
    builder.append(goReference('Pet', 'example.com/pets/models'));

    expect(builder.toString()).toBe('package models\n\nPet\n');
  });

  it('imports a package once, however often it is referenced', () => {
    const builder = createBuilder();
    builder.append(goReference('A', 'example.com/x'), ' ', goReference('B', 'example.com/x'));

    expect(builder.toString()).toBe('package api\n\nimport "example.com/x"\n\nx.A x.B\n');
  });

  it('writes the qualifier from the package name when it differs from the last segment of the path', () => {
    const builder = createBuilder();
    builder.append(goReference('Parser', 'example.com/x/v2', { packageName: 'xparser' }));

    expect(builder.toString()).toBe('package api\n\nimport xparser "example.com/x/v2"\n\nxparser.Parser\n');
  });

  it('writes the type arguments in square brackets after the name', () => {
    expect(render(goReference('Set', null, { typeArguments: [refs.string()] }))).toBe('Set[string]');
  });

  it('separates several type arguments with commas', () => {
    expect(render(goReference('Pair', null, { typeArguments: [refs.string(), refs.int()] }))).toBe('Pair[string, int]');
  });

  it('writes no brackets for an empty list of type arguments', () => {
    expect(render(goReference('Set', null, { typeArguments: [] }))).toBe('Set');
  });

  it('skips nullish type arguments', () => {
    expect(render(goReference('Set', null, { typeArguments: [null, refs.int(), undefined] }))).toBe('Set[int]');
  });

  it('imports the packages of the type arguments with the reference', () => {
    const builder = createBuilder();
    builder.append(
      goReference('List', 'container/list', {
        typeArguments: [goPointer(goReference('Pet', 'example.com/pets'))],
      }),
    );

    expect(builder.toString()).toBe(
      [
        'package api',
        '',
        'import (',
        '\t"container/list"',
        '',
        '\t"example.com/pets"',
        ')',
        '',
        'list.List[*pets.Pet]',
        '',
      ].join('\n'),
    );
  });

  it('gives packages with the same name distinct names', () => {
    const builder = createBuilder();
    builder.append(goReference('Int', 'math/rand'), ' ', goReference('Read', 'crypto/rand'));

    expect(builder.toString()).toBe(
      [
        'package api',
        '',
        'import (',
        '\trand2 "crypto/rand"',
        '\t"math/rand"',
        ')',
        '',
        'rand.Int rand2.Read',
        '',
      ].join('\n'),
    );
  });

  it('exposes its name, import path, package name and type arguments', () => {
    const typeArgument = refs.int();
    const reference = goReference('Pet', 'example.com/pets', { packageName: 'pets', typeArguments: [typeArgument] });

    expect(reference.name).toBe('Pet');
    expect(reference.importPath).toBe('example.com/pets');
    expect(reference.packageName).toBe('pets');
    expect(reference.typeArguments).toEqual([typeArgument]);
  });

  it('defaults the import path, package name and type arguments to none', () => {
    const reference = goReference('Pet');

    expect(reference.importPath).toBeNull();
    expect(reference.packageName).toBeNull();
    expect(reference.typeArguments).toEqual([]);
  });

  describe('getQualifier', () => {
    it('returns null without an import path', () => {
      expect(goReference('Pet').getQualifier(createBuilder())).toBeNull();
    });

    it('imports the package into a file builder and returns its name', () => {
      const builder = createBuilder();

      expect(goReference('Pet', 'example.com/pets/models').getQualifier(builder)).toBe('models');
      expect(builder.imports.hasImports).toBe(true);
    });

    it('returns null for the package of the file without importing it', () => {
      const builder = createBuilder('models', 'example.com/pets/models');

      expect(goReference('Pet', 'example.com/pets/models').getQualifier(builder)).toBeNull();
      expect(builder.imports.hasImports).toBe(false);
    });

    it('returns the package name for a plain builder', () => {
      const reference = goReference('Parser', 'example.com/x/v2', { packageName: 'xparser' });

      expect(reference.getQualifier(new SourceBuilder(options))).toBe('xparser');
    });

    it('returns the last segment of a plain path for a plain builder', () => {
      expect(goReference('Pet', 'example.com/pets/models').getQualifier(new SourceBuilder(options))).toBe('models');
    });

    it('returns the same qualifier for a plain builder as for a file builder', () => {
      // A plain builder uses the same package name as a file builder: no major version suffix.
      expect(renderGoNode(new SourceBuilder(options), goReference('Client', 'github.com/x/lib/v2'))).toBe('lib.Client');
    });

    it('returns the same qualifier for a plain builder with a version suffix as a file builder', () => {
      // `gopkg.in/yaml.v3` becomes "yamlv3" on a plain builder but "yaml" in a file.
      expect(renderGoNode(new SourceBuilder(options), goReference('Client', 'gopkg.in/yaml.v3'))).toBe('yaml.Client');
    });
  });

  it('writes several references through its write helper', () => {
    const builder = createBuilder();
    goReference.write(builder, [goReference('A'), goReference('B', 'example.com/x')], { separator: ', ' });

    expect(builder.toString()).toBe('package api\n\nimport "example.com/x"\n\nA, x.B\n');
  });

  describe('factory', () => {
    it('creates references with a fixed name and import path', () => {
      const request = goReference.factory('Request', 'net/http');

      expect(request().name).toBe('Request');
      expect(request().importPath).toBe('net/http');
      expect(render(request())).toBe('http.Request');
    });

    it('creates references with type arguments', () => {
      const pair = goReference.factory('Pair', 'example.com/x');

      expect(render(pair({ typeArguments: [refs.string(), refs.int()] }))).toBe('x.Pair[string, int]');
    });

    it('creates references with a fixed package name', () => {
      const factory = goReference.factory('Opt', 'example.com/x', 'xx');
      const builder = createBuilder();
      builder.append(factory());

      expect(builder.toString()).toBe('package api\n\nimport xx "example.com/x"\n\nxx.Opt\n');
    });

    it('creates references without an import for a predeclared name', () => {
      const string = goReference.factory('string');

      expect(string.refName).toBe('string');
      expect(string.importPath).toBeUndefined();
      expect(render(string())).toBe('string');
    });

    it('exposes the name and the import path it was created with', () => {
      const request = goReference.factory('Request', 'net/http');

      expect(request.refName).toBe('Request');
      expect(request.importPath).toBe('net/http');
    });

    it('matches references with the same name and import path', () => {
      const request = goReference.factory('Request', 'net/http');

      expect(request.matches(goReference('Request', 'net/http'))).toBe(true);
      expect(request.matches(request())).toBe(true);
    });

    it('does not match references with another name or import path', () => {
      const request = goReference.factory('Request', 'net/http');

      expect(request.matches(goReference('Response', 'net/http'))).toBe(false);
      expect(request.matches(goReference('Request', 'example.com/http'))).toBe(false);
      expect(request.matches(goReference('Request'))).toBe(false);
    });

    it('matches only references without an import path for a predeclared name', () => {
      expect(refs.string.matches(goReference('string'))).toBe(true);
      expect(refs.string.matches(goReference('string', 'example.com/string'))).toBe(false);
    });

    it('does not match nodes that are not references', () => {
      const string = refs.string;

      expect(string.matches(goPointer(refs.string()))).toBe(false);
      expect(string.matches(goString('string'))).toBe(false);
      expect(string.matches('string')).toBe(false);
      expect(string.matches(null)).toBe(false);
    });
  });
});
