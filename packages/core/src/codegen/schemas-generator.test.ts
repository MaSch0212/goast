import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiData, ApiSchema } from '../transform/api-types.ts';
import { defaultOpenApiGeneratorConfig } from './config.ts';
import {
  OpenApiSchemasGenerationProviderBase,
  type OpenApiSchemasGenerationProviderContext,
} from './schemas-generator.ts';
import type { AnyConfig, OpenApiGeneratorContext } from './types.ts';

type Input = Record<string, unknown>;
type Output = { items: Record<string, SchemaOutput> };
type SchemaOutput = { name: string; __source__?: string };
type Context = OpenApiSchemasGenerationProviderContext<Input, Output, AnyConfig, SchemaOutput>;

class TestSchemasGenerator
  extends OpenApiSchemasGenerationProviderBase<Input, Output, AnyConfig, SchemaOutput, Context> {
  public generatedSchemas: ApiSchema[] = [];
  public additionalFilesCalled = false;

  protected override initResult(): Output {
    return { items: {} };
  }

  protected override buildContext(context: OpenApiGeneratorContext<Input>, config?: Partial<AnyConfig>): Context {
    return this.getProviderContext(context, config, {});
  }

  protected override generateSchema(_ctx: Context, schema: ApiSchema): Promise<SchemaOutput> {
    this.generatedSchemas.push(schema);
    return Promise.resolve({ name: schema.name });
  }

  protected override addSchemaResult(ctx: Context, schema: ApiSchema, result: SchemaOutput): void {
    ctx.output.items[schema.id] = result;
  }

  protected override generateAdditionalFiles(): void {
    this.additionalFilesCalled = true;
  }
}

const makeSchema = (id: string, name: string, extra: Partial<ApiSchema> = {}): ApiSchema =>
  ({
    id,
    name,
    $src: { file: 'test.yml', path: `/schemas/${name}`, originalComponent: { type: 'string' } },
    $ref: undefined,
    ...extra,
  }) as unknown as ApiSchema;

const makeData = (schemas: ApiSchema[]): ApiData => ({ documents: [], services: [], endpoints: [], schemas });

const makeContext = (data: ApiData, testMode = false): OpenApiGeneratorContext<Input> => ({
  data,
  input: {},
  config: testMode
    ? ({ ...defaultOpenApiGeneratorConfig, __test__: true } as unknown as typeof defaultOpenApiGeneratorConfig)
    : defaultOpenApiGeneratorConfig,
});

describe('OpenApiSchemasGenerationProviderBase', () => {
  it('visits every schema in data.schemas and returns the output onGenerate built', async () => {
    const generator = new TestSchemasGenerator();
    const schemas = [makeSchema('sc1', 'Pet'), makeSchema('sc2', 'Order')];

    const result = await generator.generate(makeContext(makeData(schemas)));

    expect(generator.generatedSchemas).toEqual(schemas);
    expect(result).toEqual({
      items: {
        sc1: { name: 'Pet' },
        sc2: { name: 'Order' },
      },
    });
  });

  it('does nothing for empty input beyond calling generateAdditionalFiles', async () => {
    const generator = new TestSchemasGenerator();

    const result = await generator.generate(makeContext(makeData([])));

    expect(generator.generatedSchemas).toEqual([]);
    expect(generator.additionalFilesCalled).toBe(true);
    expect(result).toEqual({ items: {} });
  });

  it('stamps __source__ from the schema $src when __test__ is set, and omits it otherwise', async () => {
    const generator = new TestSchemasGenerator();
    const schema = makeSchema('sc1', 'Pet');

    const testResult = await generator.generate(makeContext(makeData([schema]), true));
    expect(testResult.items.sc1.__source__).toBe('test.yml#/schemas/Pet');

    const generator2 = new TestSchemasGenerator();
    const normalResult = await generator2.generate(makeContext(makeData([schema]), false));
    expect(normalResult.items.sc1.__source__).toBeUndefined();
  });

  it('memoizes by schema id: a second schema sharing an id reuses the cached result instead of regenerating', async () => {
    // Unlike endpoints/services, the base class itself writes `ctx.existingSchemaResults.set(schema.id,
    // result)`, so this cache is genuinely populated and the early-return branch is reachable here.
    const generator = new TestSchemasGenerator();
    const first = makeSchema('dup', 'first');
    const second = makeSchema('dup', 'second');

    const result = await generator.generate(makeContext(makeData([first, second])));

    expect(generator.generatedSchemas).toEqual([first]);
    expect(result.items.dup).toEqual({ name: 'first' });
  });

  it('resolves through a pure $ref schema to its target, generating only the target', async () => {
    // A schema whose originalComponent is nothing but `$ref` (no own OpenAPI object properties) is
    // treated by getSchemaReference as a pure reference: the target is generated instead, and the
    // wrapping schema is never passed to generateSchema itself.
    const target = makeSchema('target', 'Target');
    const wrapper = makeSchema('wrapper', 'Wrapper', {
      $ref: target,
      $src: { file: 'test.yml', path: '/schemas/Wrapper', originalComponent: { $ref: '#/components/schemas/Target' } },
    } as Partial<ApiSchema>);

    const generator = new TestSchemasGenerator();
    const result = await generator.generate(makeContext(makeData([wrapper]), true));

    expect(generator.generatedSchemas).toEqual([target]);
    // Both the wrapper's id and the target's id end up in the output, sharing the exact same result
    // object -- and __source__ reflects the *target's* location, not the wrapper's, because the
    // wrapper's own addSourceIfTest call sees __source__ already set and its `!result.__source__`
    // guard refuses to overwrite it.
    expect(result.items.wrapper).toBe(result.items.target);
    expect(result.items.target).toEqual({ name: 'Target', __source__: 'test.yml#/schemas/Target' });
  });
});
