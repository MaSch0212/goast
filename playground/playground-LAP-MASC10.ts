import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { OpenApiGenerator, OpenApiParser } from '@goast/core';
import { KotlinModelsGenerator, KotlinSpringControllersGenerator } from '@goast/kotlin';

export async function main(): Promise<void> {
  const x = await new OpenApiGenerator({ outputDir: 'out' })
    .useType(KotlinModelsGenerator)
    .useType(KotlinSpringControllersGenerator)
    .parseAndGenerateFromDir('.openapi');
  console.log(x);
}
