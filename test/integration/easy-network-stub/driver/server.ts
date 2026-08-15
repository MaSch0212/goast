/**
 * Entry point: build the stub, register the routes this task's boot gate probes, and serve.
 *
 * `SERVER_PORT` and `READINESS_PATH` are duplicated here as literals, matching `build.ts`'s
 * `SERVER_PORT` (8080) and `READINESS_PATH` (`/__goast-readiness`), rather than imported. This file is
 * compiled by `tsc` inside the container and cannot import from `build.ts`, which is a Deno module
 * that never enters this program. `build.test.ts` does not catch a drift between the two values —
 * nothing currently does. Task 3 registers every case and is the place to close that gap without
 * coupling the two module systems together, if a way to do so turns up.
 *
 * This registration block is deliberately minimal: only the two routes the boot gate in this task
 * checks (one to exercise a plain reply, one to exercise whole-body buffering). Task 3 replaces it
 * wholesale with one registration per generated stub method.
 */
import { ApiStubs } from '../tree/stubs';

import { NodeEasyNetworkStub, serveStub } from './adapter';

const stub = new NodeEasyNetworkStub('/api/');
stub.start();

const api = new ApiStubs(stub);
api.pets((pets) =>
  pets
    .stubGetPet((respond) => respond(200, { id: 'abc', name: 'Rex' }))
    // Chained onto the same group, not a second `api.pets(...)` call, purely so both registrations show
    // up together — `EasyNetworkStubGroup`'s callback form returns the container either way. Body-typed
    // (via `stub2`, wired in by the generated `stubUpdatePet`) so the boot gate can prove the adapter's
    // whole-body-buffering-and-handoff path, not just the no-body `stubGetPet` path above.
    .stubUpdatePet((respond, { body }) => respond(200, { id: 'abc', name: body.name ?? 'Rex', age: body.age }))
);

const server = serveStub(stub, 8080, '/__goast-readiness');
// Printed from `server`'s own `'listening'` event, not immediately after the call above: `listen()` is
// asynchronous and reports a bind failure only through an `'error'` event (handled in `adapter.ts`), so
// printing this marker unconditionally right after calling `serveStub` would claim the server started
// even on a container where it never bound at all.
server.once('listening', () => console.log('##LISTENING##'));
