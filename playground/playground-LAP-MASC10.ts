import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { OpenApiGenerator, OpenApiParser } from '@goast/core';
import { KotlinModelsGenerator, KotlinOkHttp3ClientsGenerator, KotlinSpringControllersGenerator } from '@goast/kotlin';
import { TypeScriptAngularServicesGenerator, TypeScriptModelsGenerator } from '@goast/typescript';

export async function main(): Promise<void> {
  const packageName = 'com.serviceware.platform.engine.data';
  const outBaseDir = 'out';
  const mainOutDir = path.join(outBaseDir, 'main', 'kotlin');
  const testOutDir = path.join(outBaseDir, 'test', 'kotlin');
  const clientOutDir = path.join(outBaseDir, 'client');
  const basePath = /\/api\/.*/;

  const x = await new OpenApiGenerator({ outputDir: outBaseDir })
    .useType(KotlinModelsGenerator, { packageName, outputDir: mainOutDir })
    .useType(KotlinSpringControllersGenerator, { basePath, packageName, outputDir: mainOutDir })
    .useType(KotlinOkHttp3ClientsGenerator, {
      basePath,
      packageName,
      outputDir: testOutDir,
    })
    .useType(TypeScriptModelsGenerator, { outputDir: clientOutDir, immutableTypes: true })
    .useType(TypeScriptAngularServicesGenerator, { outputDir: clientOutDir })
    .parseAndGenerateFromDir('.openapi');
  //console.log(x);
}
