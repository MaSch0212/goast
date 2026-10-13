import type { RecordedResponse } from '../../cases/cases.ts';

/**
 * Every attribute Spring's default error body carries, and therefore the fingerprint that identifies one.
 *
 * `DefaultErrorAttributes` populates exactly these five for a WebFlux error response, and no schema in
 * the kitchen-sink corpus declares a property named `timestamp` or `requestId` — so requiring the whole
 * set to be present is what keeps {@link stabilizeFrameworkErrorBody} from ever touching a body the
 * generated code actually produced.
 *
 * That premise is load-bearing and it is *only* a premise about today's corpus, which is why
 * `stabilize.test.ts` exists and why it drives adversarial bodies rather than only the happy path. If a
 * spec ever grows an error model declaring these five names, this guard stops distinguishing the
 * framework's error body from the generated code's and would substitute real values. The test is the
 * place that failure becomes visible.
 */
export const FRAMEWORK_ERROR_ATTRIBUTES: readonly string[] = ['timestamp', 'path', 'status', 'error', 'requestId'];

/** What replaces a framework error attribute whose value varies from run to run. */
export const NONDETERMINISTIC = '<nondeterministic>';

/**
 * Normalizes the two run-to-run-varying fields of Spring's *own* error body, leaving everything else —
 * including the status, which is the actual deviation — exactly as it arrived.
 *
 * `GoastExceptionHandler` exists to keep framework error bodies out of the committed artifacts, and for
 * every failure a delegate can raise it succeeds. It cannot cover the one class of failure that never
 * reaches a delegate: WebFlux rejects `updatePet/form` with `415` during argument resolution, *before*
 * the generated controller's `try` block runs, so the generated `catch` never sees it and no handler of
 * ours is consulted. What comes back is `DefaultErrorAttributes`' own JSON, whose `timestamp` is the
 * wall clock and whose `requestId` is a per-connection identifier — measured churning across two runs of
 * `@sb3-strict` while the other six artifacts stayed byte-identical.
 *
 * This is deliberately a *value* substitution and not a key removal, and it is deliberately scoped by
 * {@link FRAMEWORK_ERROR_ATTRIBUTES} rather than applied to every response: the artifact must still show
 * that Spring answered with its own error shape rather than the delegate's, because "the request never
 * reached the delegate" is a materially different finding from "the delegate answered wrongly". Same
 * reasoning as `IGNORED_HEADERS` in `wire.ts` — drop what the runtime controls, never what the generator
 * controls.
 *
 * Applied to the *actual* response only. Running it over the expectation too would let a mismatch vanish
 * from both sides at once, which is the one thing a normalizer in this design must never be able to do.
 */
export function stabilizeFrameworkErrorBody(response: RecordedResponse): RecordedResponse {
  const { body } = response;
  if (body.kind !== 'json' || body.value === null || typeof body.value !== 'object' || Array.isArray(body.value)) {
    return response;
  }

  const attributes = body.value as Record<string, unknown>;
  // `Object.hasOwn`, not `name in attributes`: `in` walks the prototype chain, and it also counts a key
  // whose value is `undefined` — in which case the substitution below would *add* two keys that were
  // never there. Unreachable through `JSON.parse`, which is the only way a body gets here, but a guard
  // this function's safety rests on should not depend on its caller for that.
  if (!FRAMEWORK_ERROR_ATTRIBUTES.every((name) => Object.hasOwn(attributes, name))) return response;

  return {
    ...response,
    body: {
      kind: 'json',
      value: { ...attributes, timestamp: NONDETERMINISTIC, requestId: NONDETERMINISTIC },
    },
  };
}
