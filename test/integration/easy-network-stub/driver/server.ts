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
 * This registration block is deliberately minimal: only the one route the boot gate in this task
 * checks. Task 3 replaces it wholesale with one registration per generated stub method.
 */
import { ApiStubs } from '../tree/stubs';

import { NodeEasyNetworkStub, serveStub } from './adapter';

const stub = new NodeEasyNetworkStub('/api/');
stub.start();

const api = new ApiStubs(stub);
api.pets((pets) => pets.stubGetPet((respond) => respond(200, { id: 'abc', name: 'Rex' })));

serveStub(stub, 8080, '/__goast-readiness');
console.log('##LISTENING##');
