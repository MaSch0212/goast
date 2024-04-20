import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { OpenApiGenerator, OpenApiParser, SourceBuilder } from '@goast/core';
import {
  TypeScriptAngularServicesGenerator,
  TypeScriptClientsGenerator,
  TypeScriptEasyNetworkStubsGenerator,
  TypeScriptModelsGenerator,
} from '@goast/typescript';
import { KotlinModelsGenerator, KotlinOkHttp3ClientsGenerator, KotlinSpringControllersGenerator } from '@goast/kotlin';

export async function main(): Promise<void> {
  // console.profile();
  const x = await new OpenApiGenerator({ outputDir: 'out' })
    .useType(KotlinModelsGenerator)
    .useType(KotlinOkHttp3ClientsGenerator)
    .useType(KotlinSpringControllersGenerator)
    .useType(TypeScriptModelsGenerator)
    .useType(TypeScriptAngularServicesGenerator)
    .useType(TypeScriptEasyNetworkStubsGenerator)
    .parseAndGenerateFromDir('.openapi');
  // console.profileEnd();
}
