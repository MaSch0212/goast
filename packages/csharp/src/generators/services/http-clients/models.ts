import type {
  ApiEndpoint,
  ApiResponse,
  ApiSchema,
  ApiService,
  SourceBuilder,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import type { cs } from '../../../ast/index.ts';
import { type CSharpGeneratorConfig, defaultCSharpGeneratorConfig } from '../../../config.ts';
import type { CSharpFileBuilder } from '../../../file-builder.ts';
import type { CSharpModelsGeneratorOutput } from '../../models/index.ts';
import type { getReferenceFactories } from './refs.ts';

export type CSharpHttpClientsGeneratorConfig = CSharpGeneratorConfig & {
  /**
   * The suffix to append to the root namespace for generated clients.
   * @default '.Clients'
   */
  namespaceSuffix: string;

  /**
   * The directory (relative to `outputDir`) the client files are written to.
   * @default 'Clients'
   */
  clientsDir: string;

  /**
   * How errors are surfaced. Only `strict` exists today: the first success (2xx) response defines the return
   * type, every other status throws an `ApiException` and documented error responses throw a typed subclass.
   * @default 'strict'
   */
  mode: 'strict';

  /**
   * The default `HttpClient.BaseAddress` the generated `Add<Service>Client` registration applies before the
   * `configure` callback runs. By default the first server URL of the specification is used (if it is an
   * absolute `http(s)` URL without variables).
   */
  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
};

export const defaultCSharpHttpClientsGeneratorConfig: DefaultGenerationProviderConfig<CSharpHttpClientsGeneratorConfig> =
  {
    ...defaultCSharpGeneratorConfig,

    namespaceSuffix: '.Clients',
    clientsDir: 'Clients',
    mode: 'strict',
  };

export type CSharpHttpClientsGeneratorInput = CSharpModelsGeneratorOutput;

export type CSharpHttpClientsGeneratorOutput = {
  csharp: {
    clients: {
      [serviceId: string]: CSharpHttpClientGeneratorOutput;
    };
  };
};

export type CSharpHttpClientGeneratorOutput = {
  /** The `<Service>Client` class. */
  type: cs.Reference<SourceBuilder>;
  /** The `I<Service>Client` interface. */
  interfaceType: cs.Reference<SourceBuilder>;
};

export type CSharpHttpClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  CSharpHttpClientsGeneratorInput,
  CSharpHttpClientsGeneratorOutput,
  CSharpHttpClientsGeneratorConfig,
  CSharpHttpClientGeneratorOutput
> & {
  /** The namespace everything is generated into: the root namespace plus `namespaceSuffix`. */
  namespace: string;
  refs: ReturnType<typeof getReferenceFactories>;
  /**
   * The files written so far in this generation. An operation tagged with several tags is generated into several
   * services, but its exception types are one set of files.
   */
  writtenFiles: Set<string>;
};

export type CSharpHttpClientGeneratorContext = CSharpHttpClientsGeneratorContext & {
  service: ApiService;
};

/** One parameter of a generated client method, with everything needed to declare and send it. */
export type CSharpClientParameter = {
  /** The C# parameter name. */
  name: string;
  /** The name on the wire: the parameter name, the multipart part name or the body's placeholder. */
  wireName: string;
  target: 'path' | 'query' | 'header' | 'cookie' | 'body' | 'part';
  type: cs.Type<CSharpFileBuilder>;
  required: boolean;
  description: string | undefined;
  /** The OpenAPI `style` (after applying the default of the location). */
  style: string;
  /** The OpenAPI `explode` (after applying the default of the style). */
  explode: boolean;
  allowReserved: boolean;
};

/** The kind of content a request or response body is (de)serialized as. */
export type CSharpClientContentKind = 'json' | 'form' | 'multipart' | 'text' | 'binary';

/** How the request body of an operation is sent. */
export type CSharpClientBody = {
  kind: CSharpClientContentKind;
  mediaType: string;
  /** The body parameter (one for every kind but `multipart`, where it is one parameter per part). */
  parameters: CSharpClientParameter[];
  /** For `json` and `form`: the type the body is serialized as (the polymorphic base, if there is one). */
  serializeAs: cs.Type<CSharpFileBuilder> | undefined;
};

/** How the body of a response is read. */
export type CSharpClientResponseBody = {
  kind: 'json' | 'text' | 'binary';
  mediaType: string;
  /** The C# type the body is read as. */
  type: cs.Type<CSharpFileBuilder>;
  schema: ApiSchema | undefined;
};

/** A documented non-success response, thrown as its own exception type. */
export type CSharpClientError = {
  /** The response key as the specification wrote it (`404`, `4XX`, `default`). */
  statusKey: string;
  /** The status code of an exact response key. */
  statusCode: number | undefined;
  /** The `[min, max]` of a range key (`4XX`). */
  range: [number, number] | undefined;
  className: string;
  description: string | undefined;
  body: CSharpClientResponseBody | undefined;
};

/** Everything the generator derives from one operation, computed once per operation. */
export type CSharpClientEndpoint = {
  endpoint: ApiEndpoint;
  /** The method name without the `Async` suffix; also the prefix of the exception types. */
  methodBaseName: string;
  methodName: string;
  /** All parameters in declaration order: required ones first. */
  parameters: CSharpClientParameter[];
  body: CSharpClientBody | undefined;
  /** The first success (2xx) response, which defines the return type. */
  success: { response: ApiResponse; body: CSharpClientResponseBody | undefined } | undefined;
  /** Whether another success response has no content, so that the body of the first may be absent. */
  allowEmptySuccess: boolean;
  errors: CSharpClientError[];
  /** The media types sent in the `Accept` header. */
  accept: string[];
};
