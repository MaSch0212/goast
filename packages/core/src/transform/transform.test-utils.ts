// This file is test-only. It must not be imported from `mod.ts` (or any other production entry point):
// doing so would pull it into `deno task npm:core`'s build graph and ship it in the published package.
// It mirrors `packages/core/src/parse/deref.test-utils.ts` from an earlier task: Deno does not discover
// the `*.test-utils.ts` suffix as a test file, and `deno task npm:core` does not ship it. There is no
// barrel export; every consumer imports it by relative path.
import type { OpenApiCollectorData } from '../collect/types.ts';
import { IdGenerator } from './helpers.ts';
import {
  defaultOpenApiTransformerOptions,
  type OpenApiTransformerContext,
  type OpenApiTransformerOptions,
} from './types.ts';

/**
 * Builds the same context `transformOpenApi` builds, so a unit test of one transform step sees the
 * state the whole pipeline would have given it.
 *
 * Kept in lockstep with the literal in `transformer.ts` deliberately: a test-only context that fills
 * just the fields one function happens to read passes even when the function starts reading another,
 * which is how a partial fixture turns a real regression into a green suite.
 */
export function createTransformerContext(
  options?: Partial<OpenApiTransformerOptions>,
  input?: OpenApiCollectorData,
): OpenApiTransformerContext {
  return {
    config: { ...defaultOpenApiTransformerOptions, ...options },

    idGenerator: new IdGenerator(),
    input: input ?? { documents: [], schemas: new Map(), endpoints: new Map() },
    incompleteSchemas: new Map(),
    paths: new Map(),
    services: new Map(),
    endpoints: new Map(),
    schemas: new Map(),

    transformed: {
      services: new Map(),
      paths: new Map(),
      parameters: new Map(),
      requestBodies: new Map(),
      responses: new Map(),
      content: new Map(),
      headers: new Map(),
      schemas: new Map(),
    },
  };
}
