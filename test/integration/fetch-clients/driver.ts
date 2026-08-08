/**
 * Drives the generated fetch client against the reference server.
 *
 * Arguments are hardcoded rather than read from the case table on purpose: writing
 * `client.getPet({ id: 'abc def' })` in typed TypeScript *is* the assertion that the generated
 * signature is usable. Reading them from JSON would need a dynamic dispatch layer, which would erase
 * exactly what is under test.
 *
 * Calls are issued in `casesFor('fetch-clients', 'client')` table order, because the reference server
 * queues its canned responses per `${method} ${pathTemplate}` and consumes each queue with `shift()` —
 * two operations (`updatePet`'s two content-type cases, `getWidget`'s four error-status cases plus its
 * 200) share a queue, and issuing them out of order would attribute a response to the wrong case.
 *
 * `getWidget` is declared `Promise<TypedResponse<Widget>>` for every status: the generated client has
 * no per-status overload, so `.json()` type-checks (and, measured against the reference server,
 * resolves) whether the response is 200 or an error code. That is why every `getWidget` case below
 * calls `.json()` rather than reading `.status` — the type gives a caller no other option, and this
 * driver is only allowed to do what the generated signature allows.
 *
 * `deletePet`, `uploadPetPhoto`, and every `params-client.ts` method are declared
 * `Promise<TypedResponse<void>>`. `_VoidResponse` omits `.json()` entirely, so those cases report only
 * `.status` and must still drain the body themselves (`body?.cancel()`) since nothing else will.
 *
 * Output contract: one `{"caseId":…,"result":…}` line per case on stdout, and nothing else. Anything
 * else on stdout makes the harness fail to parse the run.
 */
import { BlobsClient } from '../../output/typescript/fetch-clients/integration/kitchen-sink/clients/blobs-client.ts';
import { ParamsClient } from '../../output/typescript/fetch-clients/integration/kitchen-sink/clients/params-client.ts';
import { PetsClient } from '../../output/typescript/fetch-clients/integration/kitchen-sink/clients/pets-client.ts';
import { WidgetsClient } from '../../output/typescript/fetch-clients/integration/kitchen-sink/clients/widgets-client.ts';

const baseUrl = Deno.args[0];
const emit = (caseId: string, result: unknown) => console.log(JSON.stringify({ caseId, result }));

// `bearerAuth` and `apiKeyAuth` have no generated code path at all (see cases.ts): the only way this
// client can satisfy either scheme is a header set at construction time, applied to every request the
// instance makes. Cases that do not declare the header are unaffected — `diffRequest` only compares
// headers a case names.
const pets = new PetsClient({ baseUrl, headers: { authorization: 'Bearer secret-token' } });
const widgets = new WidgetsClient({ baseUrl, headers: { 'x-api-key': 'secret-key' } });
const blobs = new BlobsClient({ baseUrl });
const params = new ParamsClient({ baseUrl });

{
  const response = await pets.getPet({ id: 'abc' });
  emit('getPet/ok', await response.json());
}

{
  const response = await pets.updatePet({ id: 'abc' }, { name: 'Rex', age: 4 });
  emit('updatePet/json', await response.json());
}

{
  const response = await pets.updatePet({ id: 'abc' }, { name: 'Rex', age: 4 });
  emit('updatePet/form', await response.json());
}

{
  const response = await pets.addPetNote({ id: 'abc' }, 'plain text body');
  emit('addPetNote/text', await response.json());
}

{
  const response = await pets.deletePet({ id: 'abc' });
  emit('deletePet/noContent', { status: response.status });
  await response.body?.cancel();
}

{
  const response = await pets.createPet({ id: 'new1', name: 'Fido' });
  emit('createPet/created', await response.json());
}

{
  // `File`, not a plain `Blob`: the case declares filename 'photo.png', which only a fixed generator
  // producing real multipart output (`form.append('file', body.file)`) could ever send — a plain `Blob`
  // would come out as `"blob"`. `File extends Blob`, so this still type-checks against the generated
  // `file: Blob` signature, and it makes the declared case honest without depending on that fix landing.
  const response = await pets.uploadPetPhoto(
    { id: 'abc' },
    { file: new File(['binarydata'], 'photo.png', { type: 'image/png' }), caption: 'A good boy' },
  );
  emit('uploadPetPhoto/ok', { status: response.status });
  await response.body?.cancel();
}

{
  const response = await widgets.getWidget({ id: 'w1' });
  emit('getWidget/ok', await response.json());
}

{
  const response = await widgets.getWidget({ id: 'bad' });
  emit('getWidget/badRequest', await response.json());
}

{
  const response = await widgets.getWidget({ id: 'missing' });
  emit('getWidget/notFound', await response.json());
}

{
  const response = await widgets.getWidget({ id: 'boom' });
  emit('getWidget/serverError', await response.json());
}

{
  const response = await widgets.getWidget({ id: 'other' });
  emit('getWidget/unexpectedError', await response.json());
}

{
  const response = await blobs.uploadBlob(new Blob(['hello']));
  emit('uploadBlob/ok', await response.json());
}

{
  const response = await params.allLocations({ pathParam: 'loc1', queryParam: 'q1', xHeaderParam: 'h1' });
  emit('allLocations/ok', { status: response.status });
  await response.body?.cancel();
}

{
  const response = await params.styleMatrix({ formExploded: ['a', 'b'] });
  emit('styleMatrix/formExploded', { status: response.status });
  await response.body?.cancel();
}

{
  const response = await params.styleMatrix({ formUnexploded: ['a', 'b'] });
  emit('styleMatrix/formUnexploded', { status: response.status });
  await response.body?.cancel();
}

{
  const response = await params.styleMatrix({ spaceDelimited: ['a', 'b'] });
  emit('styleMatrix/spaceDelimited', { status: response.status });
  await response.body?.cancel();
}

{
  const response = await params.pathStyleSimple({ values: ['a', 'b'] });
  emit('pathStyleSimple/ok', { status: response.status });
  await response.body?.cancel();
}

{
  const response = await params.getEncoded({ value: 'abc def/x', raw: 'a&b=c' });
  emit('getEncoded/ok', { status: response.status });
  await response.body?.cancel();
}
