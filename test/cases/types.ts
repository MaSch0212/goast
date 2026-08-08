/** HTTP methods the case table can express. Declared here rather than imported from `@goast/core`:
 * the table is a test-side contract and must not drift when the generator's own type does. */
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/** Which side of the contract a case exercises. */
export type Direction = 'client' | 'server';

/** What the request body must look like on the wire, by content type. */
export type BodyExpectation =
  | { kind: 'none' }
  | { kind: 'json'; value: unknown }
  | { kind: 'form'; fields: Record<string, string[]> }
  | { kind: 'multipart'; parts: MultipartPart[] }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string };

/** One named part of a multipart body. `filename` present means a file part. */
export type MultipartPart = {
  name: string;
  filename?: string;
  contentType?: string;
  value: string;
};

/** A request as the reference server actually received it, after parsing. */
export type RecordedBody =
  | { kind: 'none' }
  | { kind: 'json'; value: unknown }
  | { kind: 'form'; fields: Record<string, string[]> }
  | { kind: 'multipart'; parts: MultipartPart[] }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string };

export type RecordedRequest = {
  method: HttpMethod;
  /** Path only, already percent-decoded by neither side — compared exactly as it arrived. */
  path: string;
  /** Order-insensitive multi-map. A repeated key becomes a multi-element array. */
  query: Record<string, string[]>;
  /** Lower-cased names, allowlist-filtered. See `wire.ts`. */
  headers: Record<string, string>;
  body: RecordedBody;
};

/** One API call, and everything three consumers need to know about it. */
export type ApiCase = {
  /** Stable id, e.g. `getPet/ok`. Doubles as the deviation artifact's file name. */
  id: string;
  operationId: string;
  method: HttpMethod;
  /** Template as written in the spec, e.g. `/pets/{id}`. Keys the server's case queues. */
  pathTemplate: string;
  /** What the wire must look like. */
  expectRequest: {
    /** Resolved and encoded, e.g. `/pets/abc%20def`. */
    path: string;
    query?: Record<string, string[]>;
    headers?: Record<string, string>;
    body?: BodyExpectation;
  };
  response: { status: number; headers?: Record<string, string>; body?: unknown };
  /** What the generated client must hand back to its caller. */
  expectResult: unknown;
  directions: Direction[];
  /** Profiles that cannot express this case *by design*. A profile that is merely wrong is not
   * listed here — it produces a committed deviation artifact instead. See the plan's design notes. */
  except?: string[];
};
