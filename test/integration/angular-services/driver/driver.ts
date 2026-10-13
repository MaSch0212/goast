// deno-lint-ignore-file no-process-global -- this driver is compiled and run under Node inside the container,
// not Deno, so `process.argv` is the correct way to read the container-supplied base URL.
// `zone.js` first and `@angular/compiler` second, both for their side effects and both load-order-sensitive:
// `NgZone` throws without a loaded Zone, and every injectable resolution fails with a JIT error without the
// compiler, because `@angular/common` ships partially-compiled and nothing here runs the Angular linker.
import 'zone.js';
import '@angular/compiler';

import { FetchBackend, HttpClient, HttpContext, HttpContextToken, HttpHandler } from '@angular/common/http';
import { Injector, NgZone } from '@angular/core';

import { ApiConfiguration } from '../tree/utils/api-configuration';
import { BlobsService } from '../tree/services/blobs.service';
import { ParamsService } from '../tree/services/params.service';
import { PetsService } from '../tree/services/pets.service';
import { WidgetsService } from '../tree/services/widgets.service';

import type { HttpEvent, HttpRequest } from '@angular/common/http';
import type { Observable } from 'rxjs';

/** Prefix on every line of case output, so a driver line is distinguishable from Node's own noise. */
const CASE_LINE_PREFIX = '##GOAST-CASE##';

/**
 * Per-call extra headers, read by {@link ExtraHeadersHandler} below.
 *
 * `createPet` needs `authorization: Bearer secret-token` (`bearerAuth`) and every `getWidget` case needs
 * `x-api-key: secret-key` (`apiKeyAuth`). No generated service method has a parameter for either —
 * `angular-services` emits no security-scheme code at all, the same finding phase 5 made for
 * `fetch-clients` — and unlike that target's client-constructor `headers` option, `ApiConfiguration` here
 * carries only `rootUrl` (see `utils/api-configuration.ts`), so there is no per-service, construction-time
 * header hook either. `HttpContext` is the one per-*call* mechanism every generated method does accept
 * (its second, optional parameter, threaded straight through to `RequestBuilder.build()`), so this driver
 * defines a token for it and a handler (below) that reads the token and stamps the header on just that
 * request — narrower than `fetch-clients`' approach of adding the header to every request an instance
 * ever makes, and only possible here because the generated method signature leaves that door open.
 */
const EXTRA_HEADERS = new HttpContextToken<Record<string, string> | undefined>(() => undefined);

/**
 * Wraps the real backend to apply {@link EXTRA_HEADERS}.
 *
 * This is the "custom `HttpHandler`" the task brief anticipated as the fallback once `ApiConfiguration`
 * turned out not to carry headers: `Injector.create` has no interceptor chain to hook into (that comes
 * from `provideHttpClient(withInterceptors(...))`, which needs a platform this driver has no reason to
 * bring in — see `createInjector`'s doc comment), so this handler *is* the interceptor chain, installed
 * by hand as the thing `HttpClient` calls directly instead of `FetchBackend`.
 */
class ExtraHeadersHandler implements HttpHandler {
  constructor(private readonly inner: HttpHandler) {}

  handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const extra = req.context.get(EXTRA_HEADERS);
    if (!extra) return this.inner.handle(req);
    let headers = req.headers;
    for (const [name, value] of Object.entries(extra)) {
      headers = headers.set(name, value);
    }
    return this.inner.handle(req.clone({ headers }));
  }
}

/**
 * Builds the injector the generated services need.
 *
 * `Injector.create` rather than `TestBed`: the generated services inject through field initializers, so they
 * need an injection context, but they need nothing a platform provides. `TestBed` would require
 * `platform-browser-dynamic/testing` and therefore a DOM, which this leg has no reason to bring in.
 *
 * `FetchBackend` is still the concrete backend the same way `provideHttpClient(withFetch())` would pick, but
 * `HttpHandler` now resolves to an {@link ExtraHeadersHandler} wrapping it rather than `FetchBackend` itself —
 * see that class's doc comment for why.
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
      {
        provide: HttpHandler,
        useFactory: (backend: FetchBackend) => new ExtraHeadersHandler(backend),
        deps: [FetchBackend],
      },
      { provide: HttpClient, deps: [HttpHandler] },
      { provide: PetsService, deps: [] },
      { provide: WidgetsService, deps: [] },
      { provide: BlobsService, deps: [] },
      { provide: ParamsService, deps: [] },
    ],
  });
}

const baseUrl = process.argv[2];
const injector = createInjector(baseUrl);
const pets = injector.get(PetsService);
const widgets = injector.get(WidgetsService);
const blobs = injector.get(BlobsService);
const params = injector.get(ParamsService);

const authContext = new HttpContext().set(EXTRA_HEADERS, { authorization: 'Bearer secret-token' });
const apiKeyContext = new HttpContext().set(EXTRA_HEADERS, { 'x-api-key': 'secret-key' });

/**
 * Runs one case: awaits `fn`, catches anything it throws, and prints exactly one `##GOAST-CASE##` line —
 * so a single failing case cannot stop the other 18 from reporting. Mirrors `runCase` in the okhttp3
 * driver and the one-line-per-case contract the fetch-clients driver keeps by hand.
 */
async function runCase(caseId: string, fn: () => Promise<unknown>): Promise<void> {
  let result: unknown;
  try {
    result = await fn();
  } catch (error) {
    result = { error: error instanceof Error ? error.message : String(error) };
  }
  console.log(CASE_LINE_PREFIX + JSON.stringify({ caseId, result }));
}

// Calls are issued in `casesFor('angular-services', 'client')` table order: the reference server queues
// canned responses per `${method} ${pathTemplate}` and consumes each queue with `shift()`, and
// `updatePet`'s two content-type cases and `getWidget`'s five status cases each share a queue.

await runCase('getPet/ok', async () => {
  const res = await pets.getPet({ id: 'abc' });
  return res.ok ? res.body : res.error;
});

await runCase('updatePet/json', async () => {
  const res = await pets.updatePet({ id: 'abc', body: { name: 'Rex', age: 4 } });
  return res.ok ? res.body : res.error;
});

await runCase('updatePet/form', async () => {
  // Same call as updatePet/json: `updatePet` hardcodes `rb.body(params.body, 'application/json')` (see
  // `pets.service.ts`) with no way for a caller to request a different content type, so this is the
  // closest thing the generated signature permits. The case exists to observe whether the client can
  // emit the form encoding at all — the identical call and identical wire body IS that answer.
  const res = await pets.updatePet({ id: 'abc', body: { name: 'Rex', age: 4 } });
  return res.ok ? res.body : res.error;
});

await runCase('addPetNote/text', async () => {
  const res = await pets.addPetNote({ id: 'abc', body: 'plain text body' });
  return res.ok ? res.body : res.error;
});

await runCase('deletePet/noContent', async () => {
  const res = await pets.deletePet({ id: 'abc' });
  return { status: res.status };
});

await runCase('createPet/created', async () => {
  const res = await pets.createPet({ body: { id: 'new1', name: 'Fido' } }, authContext);
  return res.ok ? res.body : res.error;
});

await runCase('uploadPetPhoto/ok', async () => {
  // `File`, not a plain `Blob`: the case declares filename 'photo.png', and `File extends Blob`, so this
  // still type-checks against the generated `body: { file: Blob; caption?: string }` signature while
  // making the declared multipart part honest.
  const res = await pets.uploadPetPhoto({
    id: 'abc',
    body: { file: new File(['binarydata'], 'photo.png', { type: 'image/png' }), caption: 'A good boy' },
  });
  return { status: res.status };
});

await runCase('getWidget/ok', async () => {
  const res = await widgets.getWidget({ id: 'w1' }, apiKeyContext);
  return res.ok ? res.body : res.error;
});

await runCase('getWidget/badRequest', async () => {
  const res = await widgets.getWidget({ id: 'bad' }, apiKeyContext);
  return res.ok ? res.body : res.error;
});

await runCase('getWidget/notFound', async () => {
  const res = await widgets.getWidget({ id: 'missing' }, apiKeyContext);
  return res.ok ? res.body : res.error;
});

await runCase('getWidget/serverError', async () => {
  const res = await widgets.getWidget({ id: 'boom' }, apiKeyContext);
  return res.ok ? res.body : res.error;
});

await runCase('getWidget/unexpectedError', async () => {
  const res = await widgets.getWidget({ id: 'other' }, apiKeyContext);
  return res.ok ? res.body : res.error;
});

await runCase('uploadBlob/ok', async () => {
  const res = await blobs.uploadBlob({ body: new Blob(['hello']) });
  return res.ok ? res.body : res.error;
});

await runCase('allLocations/ok', async () => {
  // `AllLocationsParams` declares an optional `session` field for the spec's `session` cookie parameter,
  // but `ParamsService.allLocations` never reads `params.session` — there is no `rb.header('Cookie', ...)`
  // or equivalent in the generated method body (see `params.service.ts`). That is a stronger deviation
  // than `fetch-clients`' fifth wire limitation, which does not even declare the field: here the type
  // promises something the implementation silently drops. `session: 'abc123'` is still passed, driving
  // the closest thing the signature permits, so the drop is what shows up as a recorded deviation rather
  // than the case going undriven.
  const res = await params.allLocations({
    pathParam: 'loc1',
    queryParam: 'q1',
    xHeaderParam: 'h1',
    session: 'abc123',
  });
  return { status: res.status };
});

await runCase('styleMatrix/formExploded', async () => {
  const res = await params.styleMatrix({ formExploded: ['a', 'b'] });
  return { status: res.status };
});

await runCase('styleMatrix/formUnexploded', async () => {
  const res = await params.styleMatrix({ formUnexploded: ['a', 'b'] });
  return { status: res.status };
});

await runCase('styleMatrix/spaceDelimited', async () => {
  const res = await params.styleMatrix({ spaceDelimited: ['a', 'b'] });
  return { status: res.status };
});

await runCase('pathStyleSimple/ok', async () => {
  const res = await params.pathStyleSimple({ values: ['a', 'b'] });
  return { status: res.status };
});

await runCase('getEncoded/ok', async () => {
  const res = await params.getEncoded({ value: 'abc def/x', raw: 'a&b=c' });
  return { status: res.status };
});
