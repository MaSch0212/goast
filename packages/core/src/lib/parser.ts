import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';
import path from 'path';
import { cwd } from 'process';
import { collectOpenApi } from './collect/collector.js';
import { transformOpenApi } from './transform/transformer.js';
import { ApiComponent, Deref, OpenApiData, ReferenceObject } from './types.js';

export class OpenApiParser {
  private readonly _loadedApis = new Map<string, OpenAPI.Document>();

  public async parseApisAndTransform(fileNames: string[]): Promise<OpenApiData> {
    console.time('Load OpenAPI files');
    const apis = await Promise.all(fileNames.map((fileName) => this.parseApi(fileName)));
    console.timeEnd('Load OpenAPI files');

    console.time('Transform OpenAPI');
    const transformed = this.transformApis(apis);
    console.timeEnd('Transform OpenAPI');

    return transformed;
  }

  public async parseApi(fileName: string): Promise<Deref<OpenAPI.Document>> {
    const absoluteFilePath = path.resolve(cwd(), fileName);
    const api = await SwaggerParser.parse(absoluteFilePath);
    this._loadedApis.set(absoluteFilePath, api);
    return await this.dereference(absoluteFilePath, '', api);
  }

  public transformApis(apis: Deref<OpenAPI.Document>[]): OpenApiData {
    const collectedData = collectOpenApi(apis);
    const transformedData = transformOpenApi(collectedData);
    return transformedData;
  }

  private async dereference<T extends Record<string, any>>(
    file: string,
    path: string,
    value: T
  ): Promise<Deref<T>> {
    const result = {} as Deref<any>;
    const keys = Object.keys(value) as (keyof T)[];
    for (const key of keys) {
      const v = value[key];
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) {
          result[key] = await Promise.all(
            v.map(async (v: any) => {
              if (v && typeof v === 'object') {
                if ('$ref' in v) {
                  return await this.resolveReference(file, v);
                } else {
                  return await this.dereference(file, `${path}/${String(key)}`, v);
                }
              } else {
                return v;
              }
            })
          );
        } else if ('$ref' in v) {
          result[key] = await this.resolveReference(file, v as unknown as ReferenceObject);
        } else {
          result[key] = await this.dereference(file, `${path}/${String(key)}`, v);
        }
      } else {
        result[key] = v as Deref<any>[keyof any];
      }
    }

    result.$src = <ApiComponent<any>['$src']>{
      file,
      path,
    };

    return result;
  }

  private async resolveReference(file: string, ref: ReferenceObject): Promise<any> {
    const [refFile, refPath] = ref.$ref.split('#');

    let absoluteRefFile: string = refFile;
    const lowerCaseRefFile = refFile.toLowerCase();
    if (!/\S/.test(refFile)) {
      absoluteRefFile = file;
    } else if (
      !lowerCaseRefFile.startsWith('http://') &&
      !lowerCaseRefFile.startsWith('https://')
    ) {
      absoluteRefFile = path.resolve(path.dirname(file), refFile);
    }

    let api = this._loadedApis.get(absoluteRefFile);
    if (!api) {
      api = await SwaggerParser.parse(absoluteRefFile);
    }

    const value = getDeepProperty(api, refPath.replace(/[/]/g, '.'));
    let result: any = {};
    if (value && typeof value === 'object') {
      result = this.dereference(absoluteRefFile, refPath, value);
    }

    if (result && typeof value === 'object' && '$src' in value) {
      if (ref.summary) result.summary = ref.summary;
      if (ref.description) result.description = ref.description;
      result.$src.reference = ref;
    }

    return result;
  }
}

function getDeepProperty(value: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let result = value;
  for (const part of parts) {
    if (!/\S/.test(part)) continue;
    result = result?.[part];
  }

  return result;
}
