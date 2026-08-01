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
});
