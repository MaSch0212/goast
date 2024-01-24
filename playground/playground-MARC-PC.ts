import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { OpenApiGenerator, OpenApiParser } from '@goast/core';
import { TypeScriptClientsGenerator, TypeScriptModelsGenerator } from '@goast/typescript';

export async function main(): Promise<void> {
  const x = await new OpenApiGenerator({ outputDir: 'out' })
    .useType(TypeScriptModelsGenerator)
    .useType(TypeScriptClientsGenerator)
    .parseAndGenerateFromDir('.openapi');
  console.log(x);
}
