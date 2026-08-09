/**
 * The seam between `easy-network-stub`'s framework-agnostic interception contract and a real
 * `node:http` server.
 *
 * `EasyNetworkStub` is a concrete class whose `protected initInternal<T>(config)` ends with
 * `return config.interceptor(this._urlMatch, async (req) => { ... })`, where
 * `Interceptor<T> = (baseUrl: string | RegExp, handler: (req: Request) => Promise<void>) => T`. An
 * interceptor of `(_urlMatch, handler) => handler` therefore hands the request handler straight back,
 * and a subclass that exposes it is the whole adapter — the same seam `playwright-easy-network-stub`
 * and `cypress-easy-network-stub` use, just pointed at `node:http` instead of a browser page.
 *
 * This file is container-side Node/TypeScript, compiled by `tsc` inside the image and in no Deno
 * module graph: `deno lint` and `deno check` never see it. The only things that type-check it are the
 * `tsc` run in `build.ts`'s pipeline and that pipeline's driver-diagnostic guard, which is why this
 * leg's boot gate (`boot.test.ts`) exists at all — it is the only test that can catch this file being
 * wrong.
 */
import { Buffer } from 'node:buffer';
import { createServer, type Server } from 'node:http';

import { EasyNetworkStub } from 'easy-network-stub';
import type { HttpMethod, Request } from 'easy-network-stub';

type Handler = (req: Request) => Promise<void>;

/**
 * Exposes the request handler `EasyNetworkStub` normally hides behind a browser/test-runner
 * interceptor, so a plain `node:http` server can hand it real requests.
 */
export class NodeEasyNetworkStub extends EasyNetworkStub {
  private _handler?: Handler;

  /** Wires the pass-through interceptor and stores the handler it hands back. */
  public start(): void {
    this._handler = this.initInternal<Handler>({
      interceptor: (_urlMatch, handler) => handler,
      failer: (error) => console.log('##FAILER##', typeof error === 'string' ? error : error.message),
      errorLogger: (log) => console.log('##ERRLOG##', log.message),
    });
  }

  public get handler(): Handler {
    if (this._handler === undefined) throw new Error('start() has not been called');
    return this._handler;
  }
}

/**
 * Bridges a started {@link NodeEasyNetworkStub} to a real `node:http` server.
 *
 * Answers `readinessPath` with `200` **before** consulting the stub. The generated stubs' route
 * regexes are suffix-anchored only (no `^` — `buildStubRegex` returns `segments.join('') + '/?$'`), so
 * a readiness path that merely avoided colliding with a *literal* generated route would still risk
 * being swallowed by one whose pattern happens to match its suffix.
 *
 * Method matching in the library is exact and case-sensitive (`stubs.filter(s => s.method ===
 * req.method)`), so the incoming method is upper-cased before being handed to the stub.
 *
 * The request body is buffered in full and handed over as a UTF-8 string — the library only ever
 * parses a string body (with numeric/boolean/JSON fallbacks), so nothing here ever needs to produce a
 * `Blob` or a parsed multipart body.
 *
 * A single request can end in exactly three ways here, and telling them apart is the entire point of
 * this function:
 *   1. **The stub replies.** `reply` writes a real response.
 *   2. **The stub destroys the socket without replying.** This is what
 *      `failBecauseOfNotOrWrongMockedRoute` does when no registered route matches — for example, a
 *      route param whose default `([\w-_~.]+)` matcher cannot match a percent-encoded character.
 *      Destroying the socket for real is the honest reproduction of what a browser interceptor does
 *      to an unmatched request, so `destroy` is wired straight to `request.socket.destroy()` and is
 *      itself a legitimate, measured outcome — not a bug in this adapter.
 *   3. **Neither happens.** A handler that returns without calling `reply` or `destroy` is a hole in
 *      *this adapter* (or in a driver registration built on it), not a property of the generated code
 *      under test, and it must never be mistakable for one of the two outcomes above. It is answered
 *      with `599` and a body naming the offending path, matching this leg's `599 MISMATCH`-style
 *      convention for "something this driver measured is not what was expected" — except this one
 *      names an adapter defect rather than a generator one. The check that produces it
 *      (`!response.writableEnded && !request.socket.destroyed`) runs only after `stub.handler(...)`'s
 *      promise has settled, so it can only ever fire for the "neither" case: by then `reply` has
 *      already called `response.writeHead(...).end(...)` (which sets `writableEnded`) or `destroy` has
 *      already destroyed the socket, so at least one of the two guards is always already true for the
 *      other two outcomes.
 */
export function serveStub(stub: NodeEasyNetworkStub, port: number, readinessPath: string): Server {
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      void (async () => {
        const url = request.url ?? '/';
        if (url === readinessPath) {
          response.writeHead(200).end('ready');
          return;
        }
        await stub.handler({
          // The raw request path, passed through as-is: not stripped of a prefix, not decoded. The
          // library's route matching is suffix-anchored, so the raw path is what a registered stub
          // needs to see, and decoding it here would let this adapter "fix" a percent-encoding
          // mismatch that the real generated stub cannot handle either.
          url,
          method: (request.method ?? 'GET').toUpperCase() as HttpMethod,
          body: Buffer.concat(chunks).toString('utf8'),
          headers: request.headers as Record<string, string | string[]>,
          reply: (stubResponse) => {
            // Every generated stub answers by throwing, so all responses go through the library's own
            // `logErrorAndReplyWithErrorCode`, which `JSON.stringify`s non-object content. A string
            // body therefore arrives quoted, and `undefined` content yields an `undefined` body
            // (`JSON.stringify(undefined) === undefined`, not the string `"undefined"`) — both
            // reproduced here rather than "fixed", since the point is to match what the library does.
            const body = stubResponse.body === undefined
              ? ''
              : typeof stubResponse.body === 'string'
              ? stubResponse.body
              : JSON.stringify(stubResponse.body);
            response.writeHead(stubResponse.statusCode, stubResponse.headers ?? {}).end(body);
          },
          destroy: () => request.socket.destroy(),
        });
        if (!response.writableEnded && !request.socket.destroyed) {
          response.writeHead(599).end(`UNEXPECTED no stub replied and none destroyed the socket: ${url}`);
        }
      })();
    });
  });
  server.listen(port, '0.0.0.0');
  return server;
}
