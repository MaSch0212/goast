import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiData, ApiService } from '../transform/api-types.ts';
import { defaultOpenApiGeneratorConfig } from './config.ts';
import {
  OpenApiServicesGenerationProviderBase,
  type OpenApiServicesGenerationProviderContext,
} from './services-generator.ts';
import type { AnyConfig, OpenApiGeneratorContext } from './types.ts';

type Input = Record<string, unknown>;
type Output = { items: Record<string, ServiceOutput> };
type ServiceOutput = { name: string; __source__?: string };
type Context = OpenApiServicesGenerationProviderContext<Input, Output, AnyConfig, ServiceOutput>;

class TestServicesGenerator
  extends OpenApiServicesGenerationProviderBase<Input, Output, AnyConfig, ServiceOutput, Context> {
  public generatedServices: ApiService[] = [];
  public additionalFilesCalled = false;

  protected override initResult(): Output {
    return { items: {} };
  }

  protected override buildContext(context: OpenApiGeneratorContext<Input>, config?: Partial<AnyConfig>): Context {
    return this.getProviderContext(context, config, {});
  }

  protected override generateService(_ctx: Context, service: ApiService): Promise<ServiceOutput> {
    this.generatedServices.push(service);
    return Promise.resolve({ name: service.name });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.items[service.id] = result;
  }

  protected override generateAdditionalFiles(): void {
    this.additionalFilesCalled = true;
  }
}

const makeService = (id: string, name: string, withSrc: boolean): ApiService =>
  ({
    id,
    name,
    ...(withSrc ? { $src: { file: 'test.yml', path: `/tags/${name}` } } : {}),
  }) as unknown as ApiService;

const makeData = (services: ApiService[]): ApiData => ({ documents: [], services, endpoints: [], schemas: [] });

const makeContext = (data: ApiData, testMode = false): OpenApiGeneratorContext<Input> => ({
  data,
  input: {},
  config: testMode
    ? ({ ...defaultOpenApiGeneratorConfig, __test__: true } as unknown as typeof defaultOpenApiGeneratorConfig)
    : defaultOpenApiGeneratorConfig,
});

describe('OpenApiServicesGenerationProviderBase', () => {
  it('visits every service in data.services and returns the output onGenerate built', async () => {
    const generator = new TestServicesGenerator();
    const services = [makeService('s1', 'Pets', true), makeService('s2', 'Orders', true)];

    const result = await generator.generate(makeContext(makeData(services)));

    expect(generator.generatedServices).toEqual(services);
    expect(result).toEqual({
      items: {
        s1: { name: 'Pets' },
        s2: { name: 'Orders' },
      },
    });
  });

  it('does nothing for empty input beyond calling generateAdditionalFiles', async () => {
    const generator = new TestServicesGenerator();

    const result = await generator.generate(makeContext(makeData([])));

    expect(generator.generatedServices).toEqual([]);
    expect(generator.additionalFilesCalled).toBe(true);
    expect(result).toEqual({ items: {} });
  });

  it('stamps __source__ from the service $src when it has one', async () => {
    const generator = new TestServicesGenerator();
    const service = makeService('s1', 'Pets', true);

    const result = await generator.generate(makeContext(makeData([service]), true));

    expect(result.items.s1.__source__).toBe('test.yml#/tags/Pets');
  });

  it('falls back to tag:<name> when the service has no $src (a synthesized tag)', async () => {
    const generator = new TestServicesGenerator();
    const service = makeService('s1', 'Pets', false);

    const result = await generator.generate(makeContext(makeData([service]), true));

    expect(result.items.s1.__source__).toBe('tag:Pets');
  });

  it('does not memoize repeated service ids: nothing in the base class ever writes to existingServiceResults', async () => {
    // Mirrors endpoints-generator: the cache is only ever read (`existingServiceResults.get`), and
    // `addServiceResult` in every real subclass only writes into the output object, never into the
    // cache, so two services sharing an id both regenerate.
    const generator = new TestServicesGenerator();
    const first = makeService('dup', 'first', true);
    const second = makeService('dup', 'second', true);

    await generator.generate(makeContext(makeData([first, second])));

    expect(generator.generatedServices).toEqual([first, second]);
  });
});
