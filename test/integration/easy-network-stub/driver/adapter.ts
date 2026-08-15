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
 * module graph, so no Deno *type-checker* ever sees it: `deno check`/`deno test` only walk the imports
 * reachable from a test entry point, and no `.test.ts` file imports this one. `deno lint` is different —
 * it is not module-graph-based, and lints every `.ts` file in the workspace directly regardless of what
 * imports it — so it *does* see this file; the `node:buffer` import below exists precisely because
 * `deno lint`'s `no-node-globals` rule caught the bare global `Buffer` type here. The only thing that
 * type-checks this file is the `tsc` run in `build.ts`'s pipeline and that pipeline's driver-diagnostic
 * guard, which is why this leg's boot gate (`boot.test.ts`) exists at all — it is the only test that can
 * catch a type-level mistake here.
 */
import { Buffer } from 'node:buffer';
import { createServer, type Server } from 'node:http';
import process from 'node:process';

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
 * A single request can end in three ways this adapter tells apart, plus a fourth this file cannot and
 * does not try to distinguish (see the note at the end):
 *   1. **The stub replies.** `reply` writes a real response.
 *   2. **The stub destroys the socket without replying.** This is what
 *      `failBecauseOfNotOrWrongMockedRoute` does when no registered route matches — for example, a
 *      route param whose default `([\w-_~.]+)` matcher cannot match a percent-encoded character.
 *      Destroying the socket for real is the honest reproduction of what a browser interceptor does
 *      to an unmatched request, so `destroy` is wired straight to `request.socket.destroy()` and is
 *      itself a legitimate, measured outcome — not a bug in this adapter.
 *   3. **Neither happens — an adapter-level fault, not a route outcome.** Every path *through the
 *      library itself* ends in a `reply` or a `destroy` before resolving: an unmatched route destroys
 *      (outcome 2), and a matched route's callback — whether it throws (the convention every generated
 *      stub follows) or returns a plain value — is funnelled by the library's own response handling into
 *      a `reply`. The one documented escape is a callback that hands the library a
 *      `CustomResponseHandler` whose `handle()` itself calls neither — not something a generated stub
 *      can produce, but reachable from a hand-written registration (verified with a scratch driver that
 *      does exactly this; see this task's report). That gap is a hole in *this adapter or a driver
 *      registration built on it*, not a property of the generated code under test, and it must never be
 *      mistakable for outcome 1 or 2. It is answered with `599` and a body naming the offending path,
 *      matching this leg's `599 MISMATCH`-style convention for "something this driver measured is not
 *      what was expected" — except this one names an adapter defect rather than a generator one. The
 *      check that produces it (`!response.writableEnded && !request.socket.destroyed`) runs only after
 *      `stub.handler(...)`'s promise has *resolved*, so it can only ever fire for this case: by then
 *      `reply` has already called `response.writeHead(...).end(...)` (which sets `writableEnded`) or
 *      `destroy` has already destroyed the socket, so at least one of the two guards is already true for
 *      outcomes 1 and 2.
 *
 *      A *rejected* `stub.handler(...)` promise is a related but distinct fault, handled by the
 *      `.catch` below rather than by this check (which never runs if the `await` throws): `reply` itself
 *      can throw synchronously — e.g. a driver handing it a status code outside `100..999`
 *      (`response.writeHead` throws `RangeError [ERR_HTTP_INVALID_STATUS_CODE]`) or an invalid header —
 *      and left unhandled that rejection would be fatal (Node treats an unhandled rejection as a fatal
 *      error by default), killing the container for every case still queued behind it. Worse, the
 *      connection a killed process leaves behind is bit-for-bit the same wire observation — an empty
 *      reply / reset connection — as outcome 2's clean `destroy()`, which is exactly the inversion this
 *      tier exists to prevent: a bug in this driver, recorded as a "generated code doesn't handle this"
 *      finding. Not reachable through anything the committed tree can currently produce (every declared
 *      status is `200`–`500` and the generated responder sets no headers), but latent rather than absent
 *      — Task 3's driver-authored responses are exactly the kind of code that could hand `reply` a bad
 *      value.
 *
 *   4. **Named here so it is not missed, but out of scope for this file:** a driver callback that throws
 *      a plain `Error` with no `statusCode` is still caught by the library — the same catch that turns a
 *      generated stub's `throw` into a reply — and answered `500` with body `"unknown error in mocked
 *      response"`. That response is indistinguishable, on the wire, from a real generated `500`. This
 *      adapter has no way to tag it and does not try to; it is a constraint on how Task 3's
 *      `expectations.ts` constructs and throws its own errors (they must always carry a `statusCode`),
 *      not a defect in this file.
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
      })().catch((error: unknown) => {
        // See outcome 3's second paragraph above: a rejection here (most likely `reply` itself throwing
        // on a bad status code or header) must not be left unhandled — Node 22 treats an unhandled
        // rejection as fatal, and the connection reset that would leave behind is bit-for-bit the same
        // wire observation as outcome 2's legitimate `destroy()`. `##ADAPTER-FAULT##` in the container's
        // own log is the one channel a wire-only observer cannot fake, so it — not the HTTP response
        // below, which is best-effort on top of it — is the true disambiguator.
        //
        // The whole body is wrapped, including the `console.error` and the fallback `destroy()`. That is
        // not defensive habit: this handler's own return value is discarded, so anything it throws is
        // itself an unhandled rejection — the exact failure this `.catch` exists to prevent, displaced
        // one layer outward. `console.error` can throw `EPIPE` if stdout is gone, which is precisely the
        // kind of container-level trouble this path runs under. If everything fails there is nothing
        // left to say, and staying alive matters more than reporting.
        try {
          const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
          console.error('##ADAPTER-FAULT##', request.url ?? '/', detail);

          if (response.headersSent || request.socket.destroyed) {
            // Either a reply already went out (most likely a *second* `reply`/`destroy` call throwing
            // while trying to act again on an already-finished response — the client already has whatever
            // the first call sent) or the socket is already gone. Either way nothing more can be put on
            // the wire; the log line above is the only record left to make.
            return;
          }
          try {
            response.writeHead(599).end(`ADAPTER FAULT handling ${request.url ?? '/'}: ${detail}`);
          } catch {
            // Headers were never sent, but writing them failed too (or the socket died between the checks
            // above and here) — the connection cannot carry a response at all. Destroying it is the only
            // thing left to do; the wire signature this leaves is the same as outcome 2's on its own, but
            // the `##ADAPTER-FAULT##` line already told the container's own output apart from a genuine
            // unmatched route, which never logs it.
            if (!request.socket.destroyed) request.socket.destroy();
          }
        } catch {
          // Deliberately empty. Reaching here means even reporting the fault failed.
        }
      });
    });
  });
  server.on('error', (error) => {
    // `listen()` is asynchronous and reports a bind failure (e.g. the port already in use) only through
    // this event, never as an exception the caller of `serveStub` can catch. `server.ts` prints its
    // `##LISTENING##` marker from this same server's `'listening'` event rather than unconditionally
    // after calling this function, specifically so a bind failure here is not silently outrun by that
    // marker already having been printed. Logging and exiting deterministically beats the alternative:
    // an `'error'` event with no listener is fatal on its own, but as an unhandled synchronous throw from
    // deep inside Node's net internals, with no `##`-prefixed marker to grep for in the container's log.
    console.error('##LISTEN-ERROR##', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
  server.listen(port, '0.0.0.0');
  return server;
}
