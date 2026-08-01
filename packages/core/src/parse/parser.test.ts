import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { OpenApiParser } from './parser.ts';

describe('OpenApiParser', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir({ prefix: 'goast-parser-' });
  });

  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  /** Writes `content` to `name` under the temp dir and returns its absolute path. */
  async function write(name: string, content: string): Promise<string> {
    const file = join(dir, name);
    await Deno.writeTextFile(file, content);
    return file;
  }

  it('parses a minimal document and records its source file', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info:
  title: Test
  version: '1.0'
paths: {}
`,
    );

    const doc = await new OpenApiParser().parseApi(file);

    expect(doc.info!.title).toBe('Test');
    expect(doc.$src.file).toBe(file);
  });

  it('throws naming the file when the content is not YAML or JSON', async () => {
    // The YAML parser is lenient and recovers from most malformed input without throwing (e.g.
    // `{ this is: [not valid` parses to `{ "this is": ["not valid"] }`). An alias to an anchor that
    // was never defined is one of the few inputs where `document.toJS()` genuinely throws.
    const file = await write('broken.yml', 'a: *undefined\n');
    await expect(new OpenApiParser().parseApi(file)).rejects.toThrow(`Unable to parse ${file}`);
  });

  it('propagates a read failure for a file that does not exist', async () => {
    await expect(new OpenApiParser().parseApi(join(dir, 'missing.yml'))).rejects.toThrow();
  });

  it('resolves a local $ref and exposes the target through $ref', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Target:
      type: string
      description: the target
    Source:
      $ref: '#/components/schemas/Target'
`,
    );

    const doc = await new OpenApiParser().parseApi(file);
    const source = doc.components!.schemas!.Source;

    expect(source.$ref!.type).toBe('string');
    expect(source.description).toBe('the target');
  });

  it('resolves a $ref into another file relative to the referring file', async () => {
    await write(
      'other.yml',
      `Target:
  type: integer
`,
    );
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Source:
      $ref: 'other.yml#/Target'
`,
    );

    const doc = await new OpenApiParser().parseApi(file);
    expect(doc.components!.schemas!.Source.$ref!.type).toBe('integer');
  });

  it('resolves a $ref with no fragment to the whole target file', async () => {
    await write(
      'other.yml',
      `type: string
description: whole file target
`,
    );
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Source:
      $ref: 'other.yml'
`,
    );

    const doc = await new OpenApiParser().parseApi(file);
    const target = doc.components!.schemas!.Source.$ref!;

    expect(target.type).toBe('string');
    expect(target.description).toBe('whole file target');
  });

  it('leaves $ref undefined when it resolves to a non-object value', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Source:
      $ref: '#/info/title'
`,
    );

    const doc = await new OpenApiParser().parseApi(file);
    expect(doc.components!.schemas!.Source.$ref).toBeUndefined();
  });

  it('resolves a discriminator mapping entry to the named schema, in place', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Dog:
      type: object
      description: a dog
    Pet:
      type: object
      discriminator:
        propertyName: petType
        mapping:
          dog: '#/components/schemas/Dog'
`,
    );

    const doc = await new OpenApiParser().parseApi(file);
    // `discriminator` is typed as `OpenApiDiscriminator | string`; narrow for the test.
    const mapping = (doc.components!.schemas!.Pet.discriminator as {
      mapping: Record<string, { type?: string; description?: string }>;
    })
      .mapping;

    expect(mapping.dog.type).toBe('object');
    expect(mapping.dog.description).toBe('a dog');
  });

  it('leaves a plain array of scalars intact and dereferences a $ref found inside an array', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Target:
      type: string
      description: an array target
    Container:
      type: object
      required: [a, b]
      oneOf:
        - $ref: '#/components/schemas/Target'
        - type: number
`,
    );

    const doc = await new OpenApiParser().parseApi(file);
    const container = doc.components!.schemas!.Container;

    // Plain scalar array: survives untouched.
    expect(container.required).toEqual(['a', 'b']);

    // Array of objects: each element is independently dereferenced. The first is a $ref and
    // exposes the target's properties through the proxy fallback; the second is a plain schema.
    expect(container.oneOf![0].type).toBe('string');
    expect(container.oneOf![0].description).toBe('an array target');
    expect(container.oneOf![1].type).toBe('number');
  });

  it('returns the same proxy instance for a component dereferenced twice', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Target: { type: string }
    A: { $ref: '#/components/schemas/Target' }
    B: { $ref: '#/components/schemas/Target' }
`,
    );

    const doc = await new OpenApiParser().parseApi(file);
    expect(doc.components!.schemas!.A.$ref).toBe(doc.components!.schemas!.B.$ref);
  });

  it('reuses a loaded document across parseApi calls on the same parser', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
`,
    );

    const parser = new OpenApiParser();
    const first = await parser.parseApi(file);
    const second = await parser.parseApi(file);

    expect(second).toBe(first);
  });

  it('parses several documents and transforms them into one ApiData', async () => {
    const a = await write(
      'a.yml',
      `openapi: 3.0.0
info: { title: A, version: '1' }
paths:
  /a:
    get:
      operationId: getA
      responses: { '200': { description: ok } }
`,
    );
    const b = await write(
      'b.yml',
      `openapi: 3.0.0
info: { title: B, version: '1' }
paths:
  /b:
    get:
      operationId: getB
      responses: { '200': { description: ok } }
`,
    );

    const data = await new OpenApiParser().parseApisAndTransform(a, b);

    expect(data.documents).toHaveLength(2);
    expect(data.endpoints.map((e) => e.name).sort()).toEqual(['getA', 'getB']);
  });

  it('flattens array arguments', async () => {
    const a = await write('a.yml', `openapi: 3.0.0\ninfo: { title: A, version: '1' }\npaths: {}\n`);
    const data = await new OpenApiParser().parseApisAndTransform([a]);
    expect(data.documents).toHaveLength(1);
  });

  it('resolves a relative path against the current working directory', async () => {
    await write(
      'api.yml',
      `openapi: 3.0.0
info: { title: Relative, version: '1' }
paths: {}
`,
    );

    // `parseApi` does `path.resolve(cwd(), fileName)` for anything that isn't URL-shaped; every
    // other test in this file passes an absolute path, which makes that call a no-op. Exercising
    // the real branch means changing the process's cwd, which is global state — chdir into the
    // temp dir, pass a bare file name, and restore the original cwd in `finally` so a failure
    // here cannot leak into any other test in this run.
    const originalCwd = Deno.cwd();
    Deno.chdir(dir);
    try {
      const doc = await new OpenApiParser().parseApi('api.yml');
      expect(doc.info!.title).toBe('Relative');
    } finally {
      Deno.chdir(originalCwd);
    }
  });
});
