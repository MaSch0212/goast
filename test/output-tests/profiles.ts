// deno-lint-ignore-file no-explicit-any
import type { OpenApiGenerator } from '@goast/core';
import type { SpecVersionDir } from '@goast/test-harness';

import { KotlinModelsGenerator } from '../../packages/kotlin/src/generators/models/models-generator.ts';
import { KotlinOkHttp3ClientsGenerator } from '../../packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts';
import { KotlinSpringControllersGenerator } from '../../packages/kotlin/src/generators/services/spring-controllers/spring-controllers-generator.ts';
import { KotlinSpringReactiveWebClientsGenerator } from '../../packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-clients-generator.ts';
import { TypeScriptModelsGenerator } from '../../packages/typescript/src/generators/models/models-generator.ts';
import { TypeScriptAngularServicesGenerator } from '../../packages/typescript/src/generators/services/angular-services/angular-services-generator.ts';
import { TypeScriptEasyNetworkStubsGenerator } from '../../packages/typescript/src/generators/services/easy-network-stub/easy-network-stubs-generator.ts';
import { TypeScriptFetchClientsGenerator } from '../../packages/typescript/src/generators/services/fetch-clients/fetch-clients-generator.ts';
import { TypeScriptK6ClientsGenerator } from '../../packages/typescript/src/generators/services/k6-clients/k6-clients-generator.ts';

/**
 * One generator plus one config variant. Config changes output, so each variant is its own profile
 * and its own snapshot tree.
 */
export type Profile = {
  /** Snapshot path segment, e.g. `spring-controllers@sb3-strict`. */
  name: string;
  /** Language directory under `test/output/`. */
  language: 'kotlin' | 'typescript';
  /** Corpus versions this profile runs against. */
  versions: 'all' | SpecVersionDir[];
  /** Chains the generators and config this profile represents. */
  configure: (generator: OpenApiGenerator) => any;
};

/** `__test__` makes the generators stamp `__source__` provenance into their returned state. */
const base = { __test__: true } as any;

const kotlin = (springBootVersion: 3 | 4) => ({ ...base, springBootVersion }) as any;

export const profiles: Profile[] = [
  // Kotlin. springBootVersion sits on the shared KotlinGeneratorConfig base, so it varies all four.
  ...([3, 4] as const).flatMap((sb): Profile[] => {
    const config = kotlin(sb);
    return [
      {
        name: `models@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) => g.useType(KotlinModelsGenerator, config),
      },
      {
        name: `spring-controllers@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) => g.useType(KotlinModelsGenerator, config).useType(KotlinSpringControllersGenerator, config),
      },
      {
        name: `spring-controllers@sb${sb}-strict`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) =>
          g.useType(KotlinModelsGenerator, config)
            .useType(KotlinSpringControllersGenerator, { ...config, strictResponseEntities: true }),
      },
      {
        name: `spring-reactive-web-clients@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) =>
          g.useType(KotlinModelsGenerator, config).useType(KotlinSpringReactiveWebClientsGenerator, config),
      },
      {
        name: `okhttp3-clients@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) => g.useType(KotlinModelsGenerator, config).useType(KotlinOkHttp3ClientsGenerator, config),
      },
    ];
  }),

  // TypeScript.
  {
    name: 'models',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base),
  },
  {
    name: 'fetch-clients',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptFetchClientsGenerator, base),
  },
  {
    name: 'angular-services',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptAngularServicesGenerator, base),
  },
  {
    name: 'k6-clients',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptK6ClientsGenerator, base),
  },
  {
    name: 'easy-network-stub',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptEasyNetworkStubsGenerator, base),
  },
];
