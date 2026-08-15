/**
 * Entry point: build the stub, register every generated stub method, print the registration report, serve.
 *
 * `SERVER_PORT` and `READINESS_PATH` are duplicated here as literals, matching `build.ts`'s `SERVER_PORT`
 * (8080) and `READINESS_PATH` (`/__goast-readiness`), rather than imported. This file is compiled by `tsc`
 * inside the container and cannot import from `build.ts`, which is a Deno module that never enters this
 * program. Nothing catches a drift between the two values by construction — but a drift is not silent:
 * `boot.test.ts` and Task 4's case loop both publish `SERVER_PORT` and poll `READINESS_PATH` from
 * `build.ts`, so either value moving on one side alone makes the readiness probe time out against a
 * container that is alive and answering — a loud failure with the container's own output attached, not a
 * quiet wrong answer. Closing it properly would mean coupling the two module systems, which costs more
 * than it buys.
 *
 * The registration report is printed before the server binds, one line per stub under `##REGISTRATION##`.
 * It has to be a report rather than a crash because one registration is *expected* to fail —
 * `stubPathStyleSimple`'s generated route uses an array route parameter, which the library rejects
 * synchronously — and because a stub that silently never registered looks, from the host, exactly like a
 * route the matcher could not match. See `stubs.ts`.
 */
import { ApiStubs } from '../tree/stubs';

import { NodeEasyNetworkStub, serveStub } from './adapter';
import { registerAll } from './stubs';

const stub = new NodeEasyNetworkStub('/api/');
stub.start();

// `rememberRequests` exercises the generated per-operation request queues (`_getPetRequests` and
// friends), which are otherwise dead code in this leg: nothing reads them, but a defect that made pushing
// to them throw would take down every request to that operation, and only this flag can surface it.
const api = new ApiStubs(stub, { rememberRequests: true });
// Newlines collapsed to a marker: a registration error whose message spans lines would otherwise put its
// tail on lines carrying no `##REGISTRATION##` prefix, and the host parses this report by prefix.
for (const line of registerAll(api)) console.log('##REGISTRATION##', line.replaceAll('\n', ' ⏎ '));

const server = serveStub(stub, 8080, '/__goast-readiness');
// Printed from `server`'s own `'listening'` event, not immediately after the call above: `listen()` is
// asynchronous and reports a bind failure only through an `'error'` event (handled in `adapter.ts`), so
// printing this marker unconditionally right after calling `serveStub` would claim the server started
// even on a container where it never bound at all.
server.once('listening', () => console.log('##LISTENING##'));
