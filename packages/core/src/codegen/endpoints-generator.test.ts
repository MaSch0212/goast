import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiData, ApiEndpoint } from '../transform/api-types.ts';
import { defaultOpenApiGeneratorConfig } from './config.ts';
import {
  OpenApiEndpointsGenerationProviderBase,
  type OpenApiEndpointsGenerationProviderContext,
} from './endpoints-generator.ts';
import type { AnyConfig, OpenApiGeneratorContext } from './types.ts';

type Input = Record<string, unknown>;
type Output = { items: Record<string, EndpointOutput> };
type EndpointOutput = { name: string; __source__?: string };
type Context = OpenApiEndpointsGenerationProviderContext<Input, Output, AnyConfig, EndpointOutput>;

class TestEndpointsGenerator
  extends OpenApiEndpointsGenerationProviderBase<Input, Output, AnyConfig, EndpointOutput, Context> {
  public generatedEndpoints: ApiEndpoint[] = [];
  public additionalFilesCalled = false;

  protected override initResult(): Output {
    return { items: {} };
  }

  protected override buildContext(context: OpenApiGeneratorContext<Input>, config?: Partial<AnyConfig>): Context {
    return this.getProviderContext(context, config, {});
  }

  protected override generateEndpoint(_ctx: Context, endpoint: ApiEndpoint): Promise<EndpointOutput> {
    this.generatedEndpoints.push(endpoint);
    return Promise.resolve({ name: endpoint.name });
  }

  protected override addEndpointResult(ctx: Context, endpoint: ApiEndpoint, result: EndpointOutput): void {
    ctx.output.items[endpoint.id] = result;
  }

  protected override generateAdditionalFiles(): void {
    this.additionalFilesCalled = true;
  }

  /** Exposes the protected `buildContext` so a test can seed `existingEndpointResults` before calling `getEndpointResult`. */
  public buildTestContext(context: OpenApiGeneratorContext<Input>): Context {
    return this.buildContext(context);
  }
}

const makeEndpoint = (id: string, name: string): ApiEndpoint =>
  ({
    id,
    name,
    $src: { file: 'test.yml', path: `/paths/${name}` },
  }) as unknown as ApiEndpoint;

const makeData = (endpoints: ApiEndpoint[]): ApiData => ({ documents: [], services: [], endpoints, schemas: [] });

const makeContext = (data: ApiData, testMode = false): OpenApiGeneratorContext<Input> => ({
  data,
  input: {},
  config: testMode
    ? ({ ...defaultOpenApiGeneratorConfig, __test__: true } as unknown as typeof defaultOpenApiGeneratorConfig)
    : defaultOpenApiGeneratorConfig,
});

describe('OpenApiEndpointsGenerationProviderBase', () => {
  it('visits every endpoint in data.endpoints and returns the output onGenerate built', async () => {
    const generator = new TestEndpointsGenerator();
    const endpoints = [makeEndpoint('e1', 'getThing'), makeEndpoint('e2', 'listThings')];

    const result = await generator.generate(makeContext(makeData(endpoints)));

    expect(generator.generatedEndpoints).toEqual(endpoints);
    expect(result).toEqual({
      items: {
        e1: { name: 'getThing' },
        e2: { name: 'listThings' },
      },
    });
  });

  it('does nothing for empty input beyond calling generateAdditionalFiles', async () => {
    const generator = new TestEndpointsGenerator();

    const result = await generator.generate(makeContext(makeData([])));

    expect(generator.generatedEndpoints).toEqual([]);
    expect(generator.additionalFilesCalled).toBe(true);
    expect(result).toEqual({ items: {} });
  });

  it('stamps __source__ from the endpoint $src when __test__ is set, and omits it otherwise', async () => {
    const generator = new TestEndpointsGenerator();
    const endpoint = makeEndpoint('e1', 'getThing');

    const testResult = await generator.generate(makeContext(makeData([endpoint]), true));
    expect(testResult.items.e1.__source__).toBe('test.yml#/paths/getThing');

    const generator2 = new TestEndpointsGenerator();
    const normalResult = await generator2.generate(makeContext(makeData([endpoint]), false));
    expect(normalResult.items.e1.__source__).toBeUndefined();
  });

  it('does not memoize repeated endpoint ids: nothing in the base class ever writes to existingEndpointResults', async () => {
    // Unlike schemas-generator (which populates its cache itself), endpoints-generator only reads
    // `existingEndpointResults`; populating it is left to `addEndpointResult`, and every real
    // subclass in this repo only writes into the output object there, never into the cache. So two
    // endpoints sharing an id both regenerate instead of the second one being served from cache.
    const generator = new TestEndpointsGenerator();
    const first = makeEndpoint('dup', 'first');
    const second = makeEndpoint('dup', 'second');

    await generator.generate(makeContext(makeData([first, second])));

    expect(generator.generatedEndpoints).toEqual([first, second]);
  });

  it('returns the cached result and skips generateEndpoint when existingEndpointResults is pre-populated', async () => {
    // Nothing in this repo currently writes to `existingEndpointResults` (see the finding above),
    // but the early-return branch is not unreachable by construction the way mergeDeep's dead
    // Array.isArray branch is -- nothing stops a subclass from populating the map directly. This
    // pins that the branch itself still works correctly, independent of whether anything uses it.
    const generator = new TestEndpointsGenerator();
    const ctx = generator.buildTestContext(makeContext(makeData([])));
    const cached: EndpointOutput = { name: 'from-cache' };
    ctx.existingEndpointResults.set('preset', cached);

    const result = await generator.getEndpointResult(ctx, makeEndpoint('preset', 'ignored'));

    expect(result).toBe(cached);
    expect(generator.generatedEndpoints).toEqual([]);
  });
});
