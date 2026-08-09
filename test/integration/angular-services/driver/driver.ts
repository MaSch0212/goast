// deno-lint-ignore-file no-process-global -- this driver is compiled and run under Node inside the container,
// not Deno, so `process.argv` is the correct way to read the container-supplied base URL.
// `zone.js` first and `@angular/compiler` second, both for their side effects and both load-order-sensitive:
// `NgZone` throws without a loaded Zone, and every injectable resolution fails with a JIT error without the
// compiler, because `@angular/common` ships partially-compiled and nothing here runs the Angular linker.
import 'zone.js';
import '@angular/compiler';

import { FetchBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { Injector, NgZone } from '@angular/core';

import { ApiConfiguration } from '../tree/utils/api-configuration';
import { PetsService } from '../tree/services/pets.service';

/** Prefix on every line of case output, so a driver line is distinguishable from Node's own noise. */
const CASE_LINE_PREFIX = '##GOAST-CASE##';

/**
 * Builds the injector the generated services need.
 *
 * `Injector.create` rather than `TestBed`: the generated services inject through field initializers, so they
 * need an injection context, but they need nothing a platform provides. `TestBed` would require
 * `platform-browser-dynamic/testing` and therefore a DOM, which this leg has no reason to bring in.
 *
 * `FetchBackend` as the `HttpHandler` is the same backend `provideHttpClient(withFetch())` selects, without the
 * interceptor chain that wrapper also installs — nothing here has an interceptor under test. `provideHttpClient`
 * itself returns `EnvironmentProviders`, which `Injector.create` does not accept.
 */
function createInjector(baseUrl: string): Injector {
  return Injector.create({
    providers: [
      {
        provide: ApiConfiguration,
        useFactory: () => {
          const config = new ApiConfiguration();
          // No trailing slash: `rootUrl` is concatenated with a leading-slash path, and a trailing slash
          // produces `//pets/abc`, which the reference server's route pattern does not match.
          config.rootUrl = baseUrl.replace(/\/$/, '');
          return config;
        },
        deps: [],
      },
      { provide: NgZone, useFactory: () => new NgZone({}), deps: [] },
      { provide: FetchBackend, deps: [NgZone] },
      { provide: HttpHandler, useExisting: FetchBackend },
      { provide: HttpClient, deps: [HttpHandler] },
      { provide: PetsService, deps: [] },
    ],
  });
}

const baseUrl = process.argv[2];
const injector = createInjector(baseUrl);
const pets = injector.get(PetsService);

const response = await pets.getPet({ id: 'abc' });
console.log(
  CASE_LINE_PREFIX +
    JSON.stringify({
      caseId: 'getPet/ok',
      result: response.ok ? response.body : (response as { error: unknown }).error,
    }),
);
