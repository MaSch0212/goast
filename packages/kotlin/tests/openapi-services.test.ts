import { join } from 'node:path';

import { afterEach, describe, test } from '@std/testing/bdd';
import { restore, stub } from '@std/testing/mock';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import { OpenApiGenerator } from '@goast/core';
import { MultipartData, openApiV3FilesDir, verify } from '@goast/test-utils';

import { KotlinModelsGenerator } from '../src/generators/models/models-generator.ts';
import { KotlinOkHttp3ClientsGenerator } from '../src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts';
import { KotlinSpringControllersGenerator } from '../src/generators/services/spring-controllers/spring-controllers-generator.ts';
import { KotlinSpringReactiveWebClientsGenerator } from '../src/generators/services/spring-reactive-web-clients/spring-reactive-web-clients-generator.ts';
import type { SpringBootVersion } from '../src/config.ts';

const specFile = join(openApiV3FilesDir, 'service-endpoints.yml');

// deno-lint-ignore no-explicit-any
const generators: { name: string; useType: (generator: OpenApiGenerator, config: any) => OpenApiGenerator }[] = [
  {
    name: 'spring controllers',
    useType: (generator, config) =>
      generator.useType(KotlinModelsGenerator, config).useType(KotlinSpringControllersGenerator, config),
  },
  {
    name: 'spring controllers strict response entities',
    useType: (generator, config) =>
      generator
        .useType(KotlinModelsGenerator, config)
        .useType(KotlinSpringControllersGenerator, { ...config, strictResponseEntities: true }),
  },
  {
    name: 'spring reactive web clients',
    useType: (generator, config) =>
      generator.useType(KotlinModelsGenerator, config).useType(KotlinSpringReactiveWebClientsGenerator, config),
  },
  {
    name: 'okhttp3 clients',
    useType: (generator, config) =>
      generator.useType(KotlinModelsGenerator, config).useType(KotlinOkHttp3ClientsGenerator, config),
  },
];

const springBootVersions: SpringBootVersion[] = [3, 4];

for (const { name, useType } of generators) {
  describe(name, () => {
    afterEach(() => {
      restore();
    });

    for (const springBootVersion of springBootVersions) {
      test(`spring boot ${springBootVersion}`, async (t) => {
        const result = new MultipartData();
        stub(fs, 'ensureDirSync');
        stub(fs, 'writeFileSync', (path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) => {
          result.push([path.toString(), data.toString()]);
        });

        const generatorOptions = {
          outputDir: 'out',
          newLine: '\n',
        };
        // deno-lint-ignore no-explicit-any
        const config = { __test__: true, springBootVersion } as any;
        const state = await useType(new OpenApiGenerator(generatorOptions), config).parseAndGenerate(specFile);
        result.splice(0, 0, ['state', state]);

        restore();
        await verify(t, result);
      });
    }
  });
}
