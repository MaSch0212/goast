import type { ApiCase, HttpMethod, RecordedRequest } from '../cases/types.ts';
import { normalizeHeaders, parseQuery, readBody } from './wire.ts';

export type RefServer = {
  /** Origin to hand the client under test, e.g. `http://127.0.0.1:51234`. */
  baseUrl: string;
  /** The bound port. A containerized driver builds its own origin from this. */
  port: number;
  /** Recorded request per case id, in the order the server matched them. */
  recorded: Map<string, RecordedRequest>;
  /** Requests that matched no waiting case: a stray retry, a preflight, a duplicate. */
  surplus: RecordedRequest[];
  close(): Promise<void>;
};

/** Turns `/pets/{id}` into `^/pets/[^/]+$`, so routing does not depend on the parameter's value. */
function templateToPattern(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

/**
 * A reference server for one run of the case table.
 *
 * Queues are keyed per `(method, pathTemplate)` rather than globally, so the only ordering requirement
 * is *within* one endpoint that has several cases — `getPet` 200 then 404, in table order. A client's
 * stray retry lands in {@link RefServer.surplus} and is reported, instead of shifting every subsequent
 * case's response by one and turning a single defect into a wall of failures.
 */
export function startRefServer(
  cases: readonly ApiCase[],
  options: { hostname?: string } = {},
): Promise<RefServer> {
  const queues = new Map<string, ApiCase[]>();
  for (const apiCase of cases) {
    const key = `${apiCase.method} ${apiCase.pathTemplate}`;
    (queues.get(key) ?? queues.set(key, []).get(key)!).push(apiCase);
  }

  const routes = [...queues.keys()].map((key) => {
    const [method, template] = key.split(' ');
    return { key, method: method as HttpMethod, pattern: templateToPattern(template) };
  });

  const recorded = new Map<string, RecordedRequest>();
  const surplus: RecordedRequest[] = [];

  const record = async (request: Request, url: URL): Promise<RecordedRequest> => ({
    method: request.method.toLowerCase() as HttpMethod,
    path: url.pathname,
    query: parseQuery(url),
    headers: normalizeHeaders(request.headers),
    body: await readBody(request),
  });

  const server = Deno.serve(
    { hostname: options.hostname ?? '127.0.0.1', port: 0, onListen: () => {} },
    async (request) => {
      const url = new URL(request.url);
      const method = request.method.toLowerCase();
      const route = routes.find((r) => r.method === method && r.pattern.test(url.pathname));
      const queue = route === undefined ? undefined : queues.get(route.key);
      const next = queue?.shift();

      if (next === undefined) {
        surplus.push(await record(request, url));
        // 418 rather than 404: a generated client may legitimately expect a 404 from the table, and a
        // harness failure must never be mistakable for a case's declared response.
        return new Response('unmatched request', { status: 418 });
      }

      recorded.set(next.id, await record(request, url));

      const headers = new Headers(next.response.headers ?? {});
      const body = next.response.body === undefined ? null : JSON.stringify(next.response.body);
      if (body !== null && !headers.has('content-type')) headers.set('content-type', 'application/json');
      return new Response(next.response.status === 204 ? null : body, { status: next.response.status, headers });
    },
  );

  const port = (server.addr as Deno.NetAddr).port;

  return Promise.resolve({
    port,
    // A bind address like `0.0.0.0` is not a usable destination, so `baseUrl` always resolves against
    // loopback regardless of `options.hostname` — every in-process caller wants loopback, and a
    // containerized caller builds its own origin from `port` instead.
    baseUrl: `http://127.0.0.1:${port}`,
    recorded,
    surplus,
    close: async () => {
      await server.shutdown();
    },
  });
}
