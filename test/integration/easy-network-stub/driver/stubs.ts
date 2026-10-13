/**
 * One registration per generated stub method: what each operation must have received, and what it must
 * answer.
 *
 * This is the `delegates/` analogue for the `easy-network-stub` profile. **Every expected value here comes
 * from `test/cases/cases.ts` and nowhere else** — not from the generated tree, not from a sibling leg, not
 * from memory. A transcription error here does not fail loudly; it produces a committed deviation
 * artifact that blames the generator for this file's mistake, or an absent one claiming a case conforms
 * that was never really checked.
 *
 * Three structural rules, each with a measured reason:
 *
 * **Every registration is guarded individually.** `stubPathStyleSimple` throws *synchronously* while
 * registering — its generated route is `styles/{values:string[]}` and the library rejects array route
 * parameters outright (`Array parameters are not supported for route parameters.`, measured). One
 * unguarded registration takes the server down before it ever binds, and every case then records a
 * transport failure that says nothing about the generator. {@link registerAll} therefore returns one
 * report line per stub, and `server.ts` prints them under `##REGISTRATION##` so the host can assert
 * exactly which registrations failed — a route that silently never registered is otherwise
 * indistinguishable, from the host, from one the matcher could not match.
 *
 * **Cases inside one operation are told apart by the values that arrived.** `getWidget` is a single
 * operation carrying five cases separated only by path parameter, so the `switch` on `params.id` below is
 * both the response selector and the assertion that the path parameter bound correctly. An id no case
 * declares is a `GoastMismatch`, never a fallback response: a fallback would let a mis-bound parameter
 * answer `200` and conform.
 *
 * **Assert, then answer.** Each callback checks the parameters, body and case-declared request headers
 * before returning the responder's result, and nothing is papered over: a response the generated responder
 * cannot express is a `GoastUnexpressible`, not a substituted status.
 *
 * Container-side Node/TypeScript, compiled by the `tsc` run inside the image; no Deno type-checker sees
 * it, so `boot.test.ts` is the only test that can catch a mistake here.
 */
import { Buffer } from 'node:buffer';

import { expectParam, GoastMismatch, GoastUnexpressible, guard, render } from './expectations';

import type { ApiStubs } from '../tree/stubs';

/**
 * Asserts that exactly one of `styleMatrix`'s three query parameters arrived, carrying `['a', 'b']`.
 *
 * The three cases each send one parameter and all declare the same `200`, so which one arrived is the
 * only thing that distinguishes them. The value is `['a', 'b']` for all three because that is the array
 * the case table encodes three ways: `styleMatrix/formExploded` declares it literally as the repeated-key
 * form (`formExploded: ['a', 'b']`), and the other two declare the comma-joined and space-joined
 * encodings of that same array (`['a,b']` and `['a b']`) — the table names them as such in its own
 * comments. Comparing against the raw multi-map instead would invert the test: a stub that correctly
 * decoded the declared style into two items would be recorded as deviating.
 *
 * The "exactly one" check distinguishes "absent" from "present but wrong" in its own message — the
 * difference between a parameter the route matcher dropped and one it failed to decode. It does *not*
 * catch a value decoded into the wrong slot while exactly one parameter is present: this function only
 * counts. (The Spring leg's `styleMatrixCase` carries the stronger claim in its comment; it has the same
 * gap.) The library keys query matching by parameter name, so a cross-slot swap is not a shape it can
 * produce — which is why counting is enough here rather than why counting proves more than it does.
 */
function expectStyleMatrixCase(
  formExploded: string[] | undefined,
  formUnexploded: string[] | undefined,
  spaceDelimited: string[] | undefined,
): void {
  const present = ([
    ['formExploded', formExploded],
    ['formUnexploded', formUnexploded],
    ['spaceDelimited', spaceDelimited],
  ] as const).filter(([, values]) => values !== undefined);

  if (present.length !== 1) {
    throw new GoastMismatch(
      `styleMatrix expected exactly one parameter to arrive but got formExploded=<${render(formExploded)}> ` +
        `formUnexploded=<${render(formUnexploded)}> spaceDelimited=<${render(spaceDelimited)}>`,
    );
  }

  const [name, values] = present[0];
  expectParam(`styleMatrix.${name}`, ['a', 'b'], values);
}

/**
 * Registers every generated stub, and reports on each one separately.
 *
 * Returns one line per stub — `"<operation>: ok"` or `"<operation>: FAILED <message>"` — keyed by the
 * operation id `test/cases/cases.ts` uses, so a report line and a deviation artifact name the same thing.
 * A registration that throws is recorded and the rest still run.
 */
export function registerAll(api: ApiStubs): string[] {
  const report: string[] = [];
  const register = (operation: string, doRegister: () => void): void => {
    try {
      doRegister();
      report.push(`${operation}: ok`);
    } catch (error) {
      report.push(`${operation}: FAILED ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // --- Pets ------------------------------------------------------------------------------------------

  register('getPet', () =>
    api.pets((pets) =>
      pets.stubGetPet((respond, { params }) =>
        guard('getPet', () => {
          expectParam('getPet.id', 'abc', params.id);
          return respond(200, { id: 'abc', name: 'Rex' });
        })
      )
    ));

  // `updatePet/json` and `updatePet/form` are one operation and one route, and they declare the same
  // response, so this registration serves both — but unlike the Spring leg, which is handed a decoded
  // `PetUpdate` either way, here the two arrive in visibly different shapes: the library parses a body
  // with `JSON.parse` and falls back to the raw string when that fails, so the form-encoded flavour turns
  // up as `'name=Rex&age=4'` typed as `PetUpdate`. Which shape arrived is therefore the discriminator,
  // and each is asserted against exactly what its own case declares.
  register(
    'updatePet',
    () =>
      api.pets((pets) =>
        pets.stubUpdatePet((respond, { params, body }) =>
          guard('updatePet', () => {
            expectParam('updatePet.id', 'abc', params.id);
            const arrived: unknown = body;
            if (typeof arrived === 'string') {
              const search = new URLSearchParams(arrived);
              const fields: Record<string, string[]> = {};
              search.forEach((value, key) => {
                (fields[key] ??= []).push(value);
              });
              expectParam('updatePet.body(form)', { name: ['Rex'], age: ['4'] }, fields);
            } else {
              expectParam('updatePet.body(json)', { name: 'Rex', age: 4 }, body);
            }
            return respond(200, { id: 'abc', name: 'Rex', age: 4 });
          })
        )
      ),
  );

  register(
    'addPetNote',
    () =>
      api.pets((pets) =>
        pets.stubAddPetNote((respond, { params, body, headers }) =>
          guard('addPetNote', () => {
            expectParam('addPetNote.id', 'abc', params.id);
            expectParam('addPetNote.header.content-type', 'text/plain', headers['content-type']);
            expectParam('addPetNote.body', 'plain text body', body);
            return respond(200, { id: 'abc', name: 'Rex' });
          })
        )
      ),
  );

  register('deletePet', () =>
    api.pets((pets) =>
      pets.stubDeletePet((respond, { params }) =>
        guard('deletePet', () => {
          expectParam('deletePet.id', 'abc', params.id);
          // `204: never` in the generated status map, so the responder takes no content argument.
          return respond(204);
        })
      )
    ));

  register(
    'createPet',
    () =>
      api.pets((pets) =>
        pets.stubCreatePet((respond, { body, headers }) =>
          guard('createPet', () => {
            expectParam('createPet.header.authorization', 'Bearer secret-token', headers['authorization']);
            expectParam('createPet.body', { id: 'new1', name: 'Fido' }, body);
            return respond(201, { id: 'new1', name: 'Fido' });
          })
        )
      ),
  );

  register(
    'uploadPetPhoto',
    () =>
      api.pets((pets) =>
        pets.stubUploadPetPhoto((respond, { params, body }) =>
          guard('uploadPetPhoto', () => {
            expectParam('uploadPetPhoto.id', 'abc', params.id);
            // The generated body type is `{ file: Blob; caption?: string }`, but the library only ever hands
            // a callback a `JSON.parse`d value or the raw string it failed to parse — it does not decode
            // multipart, so what arrives here is the raw payload.
            //
            // That gap is real, and it is recorded — but as a *register* entry about a body type the
            // generated code cannot receive, not as a wire deviation. Recording it as a deviation here
            // would be inconsistent with the two sibling cases in this file that hit the same gap:
            // `updatePet/form` re-parses the raw form encoding and `uploadBlob` compares the raw bytes,
            // and both record conformance. Two absent artifacts claiming conformance for the exact defect
            // class a third records would make this directory's artifacts mean different things in
            // different files, which is worse than either choice made consistently.
            //
            // So the parts are checked in the raw payload instead. Each declared part is asserted by
            // presence, never by showing the payload: its multipart boundary is random per request and
            // interpolating it would make a committed artifact churn between runs.
            const arrived: unknown = body;
            if (typeof arrived !== 'string') {
              throw new GoastMismatch(
                `uploadPetPhoto.body arrived as ${typeof arrived}, not the raw multipart string this ` +
                  'library always hands over. Something about how the body is delivered has changed.',
              );
            }
            for (const part of ['photo.png', 'image/png', 'binarydata', 'A good boy']) {
              if (!arrived.includes(part)) {
                throw new GoastMismatch(`uploadPetPhoto.body does not carry the declared part <${part}>`);
              }
            }
            return respond(200);
          })
        )
      ),
  );

  // --- Widgets ---------------------------------------------------------------------------------------

  register(
    'getWidget',
    () =>
      api.widgets((widgets) =>
        widgets.stubGetWidget((respond, { params, headers }) =>
          guard('getWidget', () => {
            expectParam('getWidget.header.x-api-key', 'secret-key', headers['x-api-key']);
            // The discriminator *is* the binding assertion: all five cases differ only by this parameter.
            switch (params.id) {
              case 'w1':
                // `getStubResponder` returns exactly `(statusCode, content?) => ({ statusCode, content })`
                // and cannot set a response header, but `getWidget/ok` declares `x-rate-limit: 42`. Spreading
                // the responder's own result and adding `headers` is what the generated `ErrorResponse<T>`
                // permits, and the library merges it over its defaults. The only case in this file that
                // needs it.
                return {
                  ...respond(200, { id: 'w1', name: 'Sprocket', price: 9.99 }),
                  headers: { 'X-Rate-Limit': '42' },
                };
              case 'bad':
                return respond(400, { message: 'Invalid widget id', code: 400 });
              case 'missing':
                return respond(404, { message: 'Widget not found', code: 404 });
              case 'boom':
                return respond(500, { message: 'Internal error', code: 500 });
              case 'other':
                throw new GoastUnexpressible(
                  "getWidget cannot answer 503: the generated responder's status map is " +
                    '{200, 400, 401, 403, 404, 500}, and the spec can only serve 503 through its `default` ' +
                    'response, for which no entry was generated',
                );
              default:
                throw new GoastMismatch(`getWidget.id was <${render(params.id)}>, which no case declares`);
            }
          })
        )
      ),
  );

  // --- Blobs -----------------------------------------------------------------------------------------

  register(
    'uploadBlob',
    () =>
      api.blobs((blobs) =>
        blobs.stubUploadBlob((respond, { body }) =>
          guard('uploadBlob', () => {
            // The case declares the body as base64 (`aGVsbG8=`), so it is decoded here rather than
            // transcribing what it decodes to. The generated body type is `Blob`, but `adapter.ts` hands the
            // library a UTF-8 string and the library hands that straight on when `JSON.parse` fails, so the
            // comparison is against the decoded bytes read back the same way the adapter read them.
            const arrived: unknown = body;
            expectParam('uploadBlob.body', Buffer.from('aGVsbG8=', 'base64').toString('utf8'), arrived);
            return respond(201, { id: 'blob1' });
          })
        )
      ),
  );

  // --- Params ----------------------------------------------------------------------------------------

  register(
    'allLocations',
    () =>
      api.params((paramsGroup) =>
        paramsGroup.stubAllLocations((respond, { params, headers }) =>
          guard('allLocations', () => {
            expectParam('allLocations.pathParam', 'loc1', params.pathParam);
            expectParam('allLocations.queryParam', 'q1', params.queryParam);
            // The case also declares an `x-header-param` header and a `session` cookie. The generated route
            // — `locations/{pathParam:string}?{queryParam?:string}` — has no slot for either, so they are
            // asserted from the library's raw header bag. That measures the request arriving rather than a
            // generated binding, which is the honest scope; asserting nothing would let this case conform
            // while the values never arrived at all.
            expectParam('allLocations.header.x-header-param', 'h1', headers['x-header-param']);
            expectParam('allLocations.header.cookie', 'session=abc123', headers['cookie']);
            return respond(200);
          })
        )
      ),
  );

  register(
    'styleMatrix',
    () =>
      api.params((paramsGroup) =>
        paramsGroup.stubStyleMatrix((respond, { params }) =>
          guard('styleMatrix', () => {
            expectStyleMatrixCase(params.formExploded, params.formUnexploded, params.spaceDelimited);
            return respond(200);
          })
        )
      ),
  );

  // Expected to land in the report as a FAILURE, not an `ok` — see this file's header. The callback is
  // written out in full anyway: the day the generator stops emitting an array route parameter, this
  // registration must already assert the right thing rather than be a stub nobody wrote.
  register(
    'pathStyleSimple',
    () =>
      api.params((paramsGroup) =>
        paramsGroup.stubPathStyleSimple((respond, { params }) =>
          guard('pathStyleSimple', () => {
            // `['a', 'b']` for the same reason as `styleMatrix`: the case declares the path `/styles/a,b`
            // and names it the comma-joined (`style: simple`) encoding of the array, and the generated route
            // parameter is typed `string[]`.
            expectParam('pathStyleSimple.values', ['a', 'b'], params.values);
            return respond(200);
          })
        )
      ),
  );

  register(
    'getEncoded',
    () =>
      api.params((paramsGroup) =>
        paramsGroup.stubGetEncoded((respond, { params }) =>
          guard('getEncoded', () => {
            // The case sends `/encoded/abc%20def%2Fx?raw=a%26b%3Dc` and states what those encode: a space
            // and a slash inside one path segment, and an `&` and an `=` inside one query value. A correct
            // server hands the callback the decoded values.
            expectParam('getEncoded.value', 'abc def/x', params.value);
            expectParam('getEncoded.raw', 'a&b=c', params.raw);
            return respond(200);
          })
        )
      ),
  );

  return report;
}
