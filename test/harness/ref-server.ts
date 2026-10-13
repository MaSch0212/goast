import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

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

  const handle = async (request: Request): Promise<Response> => {
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
  };

  const server = createServer((req, res) => {
    toWebRequest(req)
      .then(handle)
      .then((response) => writeWebResponse(res, response))
      .catch((error: unknown) => {
        console.error(`Reference server failed on ${req.method} ${req.url}:`, error);
        if (!res.headersSent) res.writeHead(500);
        res.end();
      });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, options.hostname ?? '127.0.0.1', () => {
      server.off('error', reject);
      const { port } = server.address() as AddressInfo;
      resolve({
        port,
        // A bind address like `0.0.0.0` is not a usable destination, so `baseUrl` always resolves against
        // loopback regardless of `options.hostname` — every in-process caller wants loopback, and a
        // containerized caller builds its own origin from `port` instead.
        baseUrl: `http://127.0.0.1:${port}`,
        recorded,
        surplus,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            server.close((error) => (error === undefined ? resolveClose() : rejectClose(error)));
          }),
      });
    });
  });
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);

  const headers = new Headers();
  for (let i = 0; i < req.rawHeaders.length; i += 2) headers.append(req.rawHeaders[i], req.rawHeaders[i + 1]);

  // Only path and query are recorded, so the origin is a placeholder.
  return new Request(`http://localhost${req.url ?? '/'}`, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' || body.length === 0 ? null : body,
  });
}

async function writeWebResponse(res: ServerResponse, response: Response): Promise<void> {
  const body = response.body === null ? undefined : Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(body);
}
