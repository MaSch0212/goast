/**
 * The three ways a registration in `stubs.ts` can refuse to answer, and the assertion that produces the
 * first of them.
 *
 * This is the `easy-network-stub` analogue of `test/integration/spring-controllers/delegates/common/
 * Expectations.kt`, and it exists for the same reason: in the server direction the HTTP response is the
 * *only* channel the host can observe, so a request whose values are not what `test/cases/cases.ts`
 * declares has to become a distinguishable response or it is not observable at all. The status codes are
 * the same as that leg's, so an artifact from either reads the same way:
 *
 *   * `599 MISMATCH …` — a value arrived that the case table does not declare.
 *   * `598 UNEXPRESSIBLE …` — the generated responder cannot express the response a case declares.
 *   * `597 UNEXPECTED …` — this driver itself broke. Treat a 597 in a committed artifact as a finding to
 *     investigate, never as a snapshot to accept.
 *
 * **Every one of them carries a `statusCode`, and that is the load-bearing detail of this file.** The
 * library catches whatever a stub callback throws and, in `logErrorAndReplyWithErrorCode`, branches on
 * `error.statusCode`: with one it replies with that status and the error's `content`; *without* one it
 * replies `500` with the body `"unknown error in mocked response"` and discards the message entirely
 * (measured). A `500` carrying that body is indistinguishable on the wire from a real generated `500` —
 * `getWidget/serverError` declares exactly that — so a bare `Error` escaping this driver would be
 * recorded as a generated deviation. `GoastDriverFault` and {@link guard} exist to close that hole for
 * throws this file did not author: a `TypeError` from reading a property off a value that arrived with a
 * different shape than the generated type promised is precisely the kind of accident that would otherwise
 * land in an artifact wearing the generator's name.
 *
 * `content` is a plain string on all three, so the library's
 * `typeof content !== 'object' ? JSON.stringify(content) : content` sends it **JSON-quoted**. That is not
 * fought or post-processed anywhere in this leg: the artifact showing `"MISMATCH …"` with quotes is an
 * honest record of what the library put on the wire.
 *
 * Container-side Node/TypeScript, like the rest of `driver/`: type-checked only by the `tsc` run inside
 * the image (`deno lint` sees it, no Deno type-checker does), which is why `boot.test.ts` is the only
 * test that can catch a mistake here.
 */

/**
 * A value arrived that `test/cases/cases.ts` does not declare.
 *
 * Extends `Error` for a readable stack in the container's own log, but the `statusCode`/`content` pair is
 * what the library actually reads — see this file's header.
 */
export class GoastMismatch extends Error {
  public readonly statusCode: number = 599;
  public readonly content: string;

  constructor(detail: string) {
    super(`MISMATCH ${detail}`);
    this.name = 'GoastMismatch';
    this.content = this.message;
  }
}

/**
 * The generated responder cannot express the response a case declares.
 *
 * One real case: `getWidget`'s generated status map is `{200, 400, 401, 403, 404, 500}`, and
 * `getWidget/unexpectedError` declares `503` — reachable in the spec only through the `default` response,
 * for which nothing was generated. Signalling that explicitly keeps the artifact honest; substituting an
 * available status would record a smaller, wrong deviation and hide the actual gap.
 */
export class GoastUnexpressible extends Error {
  public readonly statusCode: number = 598;
  public readonly content: string;

  constructor(detail: string) {
    super(`UNEXPRESSIBLE ${detail}`);
    this.name = 'GoastUnexpressible';
    this.content = this.message;
  }
}

/**
 * This driver broke, in a way it did not anticipate.
 *
 * Never thrown deliberately — {@link guard} manufactures it from anything a registration throws that is
 * not one of the two above, so that no such throw can reach the library bare and be answered
 * `500 "unknown error in mocked response"`. The message interpolates a foreign exception's own text, so a
 * `597` in a committed artifact may churn between runs; that is the point, and it is the same trade the
 * Spring leg's `GoastExceptionHandler` makes for the same code.
 */
export class GoastDriverFault extends Error {
  public readonly statusCode: number = 597;
  public readonly content: string;

  constructor(operation: string, cause: unknown) {
    const detail = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
    super(`UNEXPECTED ${operation}: ${detail}`);
    this.name = 'GoastDriverFault';
    this.content = this.message;
  }
}

/**
 * A stable, order-insensitive rendering of a value, used both to compare and to report.
 *
 * Object keys are sorted, so `{name, age}` and `{age, name}` are the same value here — which matters
 * because the things being compared arrive from `JSON.parse` and from `URLSearchParams`, neither of which
 * promises an order. Strings come out quoted, which is deliberate: it is the difference between a
 * parameter that arrived empty and one that never arrived at all, and both show up in these messages.
 */
export function render(value: unknown): string {
  return JSON.stringify(canonical(value)) ?? 'undefined';
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object' && value !== null) {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) sorted[key] = canonical(source[key]);
    return sorted;
  }
  return value;
}

/**
 * Asserts one value the generated stub handed over against what the case table declares, and returns it
 * so callers can chain.
 */
export function expectParam<T>(name: string, expected: T, actual: T): T {
  if (render(expected) !== render(actual)) {
    throw new GoastMismatch(`${name} expected <${render(expected)}> but was <${render(actual)}>`);
  }
  return actual;
}

/**
 * Runs one registration's body, converting anything it throws that is not already a `Goast*` into a
 * `597`.
 *
 * Wrapping every callback rather than trusting that none of them can throw is the whole point: the cost
 * of being wrong once is an artifact that blames the generator for this driver's bug, and there is no way
 * to tell that artifact apart from a real one after the fact.
 */
export function guard<T>(operation: string, answer: () => T): T {
  try {
    return answer();
  } catch (error) {
    if (error instanceof GoastMismatch || error instanceof GoastUnexpressible) throw error;
    throw new GoastDriverFault(operation, error);
  }
}
