import { describe, expect, it } from 'vitest';

import { createBuilder } from '../nodes/create-builder.test-utils.ts';
import { csReference } from '../nodes/reference.ts';
import * as refs from './index.ts';

type Factory = ((...args: any[]) => ReturnType<typeof csReference>) & {
  refName: string;
  namespace: string | null | undefined;
};

/** Flattens `refs.<lib>[.<sub>].<name>` into a list of `[path, factory]`. */
function collect(value: Record<string, unknown>, path: string[] = []): [string, Factory][] {
  return Object.entries(value).flatMap(([key, entry]) =>
    typeof entry === 'function'
      ? [[[...path, key].join('.'), entry as Factory] as [string, Factory]]
      : collect(entry as Record<string, unknown>, [...path, key]),
  );
}

const all = collect(refs as unknown as Record<string, unknown>);

describe('references', () => {
  it('should expose factories for every library', () => {
    expect(Object.keys(refs).sort()).toEqual([
      'aspNetCore',
      'dataAnnotations',
      'extensionsDependencyInjection',
      'fastEndpoints',
      'system',
      'systemNetHttp',
      'systemTextJson',
    ]);
    expect(all.length).toBeGreaterThan(100);
  });

  it.each(all)('%s should be a valid reference factory', (_path, factory) => {
    expect(factory.refName).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
    expect(
      factory.namespace === null ||
        factory.namespace === undefined ||
        /^[A-Za-z][A-Za-z0-9.]*$/.test(factory.namespace),
    ).toBe(true);
  });

  it('should not register the same type twice in one library', () => {
    const seen = new Map<string, [string, Factory]>();
    for (const [path, factory] of all) {
      // Generic and non-generic variants of one type are separate factories on purpose.
      const generic = 'infer' in factory;
      const id = `${path.split('.').slice(0, -1).join('.')}|${factory.namespace}|${factory.refName}|${generic}`;
      const existing = seen.get(id);
      // Aliases of the same factory are fine.
      expect(existing === undefined || existing[1] === factory, `${path} duplicates ${existing?.[0]}`).toBe(true);
      seen.set(id, [path, factory]);
    }
  });

  describe('keyword aliases', () => {
    it.each([
      ['string', refs.system.string],
      ['int', refs.system.int],
      ['long', refs.system.long],
      ['bool', refs.system.bool],
      ['double', refs.system.double],
      ['float', refs.system.float],
      ['decimal', refs.system.decimal],
      ['object', refs.system.object],
      ['byte', refs.system.byte],
    ])('should write %s without a namespace', (name, factory) => {
      const builder = createBuilder();
      builder.append(factory());
      expect(builder.toString(false)).toBe(name);
      expect(builder.usings.hasUsings).toBe(false);
    });
  });

  describe('usings', () => {
    it.each([
      ['Guid', refs.system.guid, 'System'],
      ['Stream', refs.system.stream, 'System.IO'],
      ['CancellationToken', refs.system.cancellationToken, 'System.Threading'],
      ['Task', refs.system.task, 'System.Threading.Tasks'],
      ['JsonSerializer', refs.systemTextJson.jsonSerializer, 'System.Text.Json'],
      ['JsonPropertyName', refs.systemTextJson.jsonPropertyName, 'System.Text.Json.Serialization'],
      ['Required', refs.dataAnnotations.required, 'System.ComponentModel.DataAnnotations'],
      ['IResult', refs.aspNetCore.http.iResult, 'Microsoft.AspNetCore.Http'],
      ['Ok', refs.aspNetCore.httpResults.ok, 'Microsoft.AspNetCore.Http.HttpResults'],
      ['ControllerBase', refs.aspNetCore.mvc.controllerBase, 'Microsoft.AspNetCore.Mvc'],
      ['IEndpointRouteBuilder', refs.aspNetCore.routing.iEndpointRouteBuilder, 'Microsoft.AspNetCore.Routing'],
      ['Endpoint', refs.fastEndpoints.endpoint, 'FastEndpoints'],
      ['Http', refs.fastEndpoints.http, 'FastEndpoints'],
      [
        'IServiceCollection',
        refs.extensionsDependencyInjection.iServiceCollection,
        'Microsoft.Extensions.DependencyInjection',
      ],
      ['HttpStatusCode', refs.systemNetHttp.httpStatusCode, 'System.Net'],
      ['HttpClient', refs.systemNetHttp.httpClient, 'System.Net.Http'],
      ['MediaTypeHeaderValue', refs.systemNetHttp.mediaTypeHeaderValue, 'System.Net.Http.Headers'],
    ] as [string, Factory, string][])('should register the namespace of %s', (name, factory, namespace) => {
      expect(factory.refName).toBe(name);
      expect(factory.namespace).toBe(namespace);
      const builder = createBuilder();
      builder.append(factory([]));
      expect(builder.usings.usings).toEqual([namespace]);
    });
  });

  describe('generic references', () => {
    it('should write generic arguments', () => {
      const builder = createBuilder();
      builder.append(refs.system.dictionary([refs.system.string(), refs.system.list([refs.system.int()])]));
      expect(builder.toString(false)).toBe('Dictionary<string, List<int>>');
      expect(builder.usings.usings).toEqual(['System.Collections.Generic']);
    });

    it('should write Task<T> through taskOf', () => {
      const builder = createBuilder();
      builder.append(refs.system.taskOf([refs.system.guid()]));
      expect(builder.toString(false)).toBe('Task<Guid>');
    });

    it('should write multi-result types', () => {
      const builder = createBuilder();
      builder.append(
        refs.aspNetCore.httpResults.results([
          refs.aspNetCore.httpResults.ok([refs.system.string()]),
          refs.aspNetCore.httpResults.notFound(),
        ]),
      );
      expect(builder.toString(false)).toBe('Results<Ok<string>, NotFound>');
    });

    it('should write nullable references', () => {
      const builder = createBuilder();
      builder.append(refs.system.guid({ nullable: true }));
      expect(builder.toString(false)).toBe('Guid?');
    });
  });
});
