import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { OpenApiGenerator, OpenApiParser, SourceBuilder } from '@goast/core';
import { TypeScriptClientsGenerator, TypeScriptModelsGenerator } from '@goast/typescript';
import { KotlinModelsGenerator, KotlinOkHttp3ClientsGenerator, KotlinSpringControllersGenerator } from '@goast/kotlin';

export async function main(): Promise<void> {
  const x = await new OpenApiGenerator({ outputDir: 'out' })
    .useType(KotlinModelsGenerator)
    .useType(KotlinOkHttp3ClientsGenerator)
    .useType(KotlinSpringControllersGenerator)
    .parseAndGenerateFromDir('.openapi');
}
