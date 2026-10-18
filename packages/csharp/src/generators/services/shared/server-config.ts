import type { ApiEndpoint, ApiService, DefaultGenerationProviderConfig } from '@goast/core';

import { type CSharpGeneratorConfig, defaultCSharpGeneratorConfig } from '../../../config.ts';
import type { CSharpModelsGeneratorOutput } from '../../models/index.ts';

/**
 * The configuration every server generator (controllers, minimal APIs, FastEndpoints) shares.
 *
 * `mode` is a single-value union today: it is the seam a later non-strict mode plugs into without changing the shape
 * of the config.
 */
export type CSharpServerGeneratorConfig = CSharpGeneratorConfig & {
  /**
   * The suffix to append to the root namespace for generated server code.
   */
  namespaceSuffix: string | ((service: ApiService | null) => string);

  /**
   * How the generated server code treats responses. In `strict` mode a handler returns the generated result type
   * of its endpoint and can only produce documented responses.
   * @default 'strict'
   */
  mode: 'strict';

  /**
   * The base path every route of a service is placed under. Defaults to the path of the first server of the spec.
   * A string replaces the base path, a `RegExp` extracts the first match and a function computes it.
   */
  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);

  /**
   * Modifies the path of an endpoint before it is turned into a route.
   */
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
};

export const defaultCSharpServerGeneratorConfig: DefaultGenerationProviderConfig<CSharpServerGeneratorConfig> = {
  ...defaultCSharpGeneratorConfig,

  namespaceSuffix: '.Server',
  mode: 'strict',
};

/** The input every server generator needs: the output of the models generator. */
export type CSharpServerGeneratorInput = CSharpModelsGeneratorOutput;

/**
 * The part of a generator context the shared server helpers read. Every server generator's context satisfies it
 * structurally.
 */
export type CSharpServerContext = {
  config: CSharpServerGeneratorConfig;
  input: CSharpServerGeneratorInput;
};
