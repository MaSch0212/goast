import path from 'node:path';
import { cwd } from 'node:process';

// @deno-types="npm:@types/fs-extra"
import fs from 'fs-extra';
import * as YAML from 'yaml';

import { collectOpenApi } from '../collect/collector.ts';
import type { ApiData } from '../transform/api-types.ts';
import { transformOpenApi } from '../transform/transformer.ts';
import { isNullish } from '../utils/common.utils.ts';
import { createDerefProxy } from './deref-proxy.ts';
import type { OpenApiDocument, OpenApiObject, OpenApiReference, OpenApiSchema } from './openapi-types.ts';
import { defaultOpenApiParserOptions, type Deref, type OpenApiParserOptions } from './types.ts';

type LoadedDocument = {
  file: string;
  document: OpenApiDocument;
  dereferencedDocument: Deref<OpenApiDocument>;
  dereferencedComponents: Map<string, Deref<OpenApiObject<string>>>;
};

export class OpenApiParser {
  private readonly _loadedDocuments = new Map<string, LoadedDocument>();
  private readonly _config: OpenApiParserOptions;

  constructor(config?: Partial<OpenApiParserOptions>) {
    this._config = { ...defaultOpenApiParserOptions, ...config };
  }

  public async parseApisAndTransform(...fileNames: (string | string[])[]): Promise<ApiData> {
    const flatFileNames = ([] as string[]).concat(...fileNames);
    const apis = await Promise.all(flatFileNames.map((fileName) => this.parseApi(fileName)));

    const transformed = this.transformApis(apis);

    return transformed;
  }

  public async parseApi(fileName: string): Promise<Deref<OpenApiDocument>> {
    const absoluteFilePath = this.isUrl(fileName) ? fileName : path.resolve(cwd(), fileName);
    const doc = await this.loadDocument(absoluteFilePath);
    return await this.dereference(absoluteFilePath, '', doc.document);
  }

  public transformApis(apis: Deref<OpenApiDocument>[]): ApiData {
    const collectedData = collectOpenApi(apis);
    const transformedData = transformOpenApi(collectedData, this._config);
    return transformedData;
  }

  private async dereference<T extends OpenApiObject<string>>(file: string, path: string, value: T): Promise<Deref<T>> {
    let existingDocument = this._loadedDocuments.get(file);
    if (existingDocument) {
      const existingComponent = existingDocument.dereferencedComponents.get(path);
      if (existingComponent) {
        return existingComponent as Deref<T>;
      }
    } else {
      existingDocument = await this.loadDocument(file);
    }

    const result = createDerefProxy(value, {
      file,
      path,
      document: existingDocument.dereferencedDocument,
      originalComponent: value,
    });
    existingDocument.dereferencedComponents.set(path, result as Deref<OpenApiObject<string>>);

    if (value.$ref) {
      // deno-lint-ignore no-explicit-any
      result.$ref = await this.resolveReference<T>(file, value as OpenApiReference) as any;
    }
    for (const key of Object.keys(value) as (keyof T)[]) {
      if (key === '$ref') continue;
      const v = value[key];
      if (isNullish(v)) continue;
      if (typeof v === 'object') {
        if (Array.isArray(v)) {
          (result as Record<keyof T, unknown>)[key] = await Promise.all(
            v.map(async (v, index) => {
              if (v && typeof v === 'object') {
                return await this.dereference(file, `${path}/${String(key)}/${index}`, v);
              } else {
                return v;
              }
            }),
          );
        } else {
          (result as Record<keyof T, unknown>)[key] = await this.dereference(
            file,
            `${path}/${String(key)}`,
            v as Record<string, unknown>,
          );
        }
      }
      if (typeof v === 'string' && path.endsWith('/discriminator/mapping')) {
        (result as Record<keyof T, unknown>)[key] = await this.resolveReference<OpenApiSchema>(file, { $ref: v });
      }
    }

    return result;
  }

  private async resolveReference<T extends OpenApiObject<string>>(
    file: string,
    ref: OpenApiReference,
  ): Promise<Deref<T> | undefined> {
    const [refFile, refPath] = ref.$ref.split('#');

    let absoluteRefFile: string = refFile;
    if (!/\S/.test(refFile)) {
      absoluteRefFile = file;
    } else if (!this.isUrl(refFile)) {
      absoluteRefFile = path.resolve(path.dirname(file), refFile);
    }

    const doc = await this.loadDocument(absoluteRefFile);

    const value = refPath ? getDeepProperty(doc.document, refPath.replace(/[/]/g, '.')) : doc.document;
    if (value && typeof value === 'object') {
      return this.dereference(absoluteRefFile, refPath ?? '/', value as T);
    }

    return undefined;
  }

  private async loadDocument(fileOrUrl: string): Promise<LoadedDocument> {
    const existingDocument = this._loadedDocuments.get(fileOrUrl);
    if (existingDocument) {
      return existingDocument;
    }

    const documentContent = await this.getDocumentContent(fileOrUrl);
    const extname = path.extname(fileOrUrl).toLowerCase();

    let parsedDocument: unknown;
    if (extname === '.json') {
      parsedDocument = this.tryParseJson(documentContent);
    } else if (extname === '.yaml' || extname === '.yml') {
      parsedDocument = this.tryParseYaml(documentContent);
    } else {
      parsedDocument = this.tryParseJson(documentContent);
      if (parsedDocument !== undefined) {
        parsedDocument = this.tryParseYaml(documentContent);
      }
    }

    if (parsedDocument === undefined) {
      throw new Error(`Unable to parse ${fileOrUrl}`);
    }

    const doc = (parsedDocument ?? {}) as OpenApiDocument;
    const deref = createDerefProxy(doc, {
      file: fileOrUrl,
      path: '',
      originalComponent: doc,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document: undefined!,
    });
    deref.$src.document = deref;
    const loadedDocument = {
      file: fileOrUrl,
      document: doc,
      dereferencedDocument: deref,
      dereferencedComponents: new Map(),
    };
    this._loadedDocuments.set(fileOrUrl, loadedDocument);
    return loadedDocument;
  }

  private async getDocumentContent(fileOrUrl: string): Promise<string> {
    if (this.isUrl(fileOrUrl)) {
      const res = await fetch(fileOrUrl);
      if (!res.ok) {
        throw new Error(`Unable to download ${fileOrUrl}: ${res.statusText}`);
      }
      return await res.text();
    } else {
      return (await fs.readFile(fileOrUrl)).toString();
    }
  }

  private isUrl(fileOrUrl: string): boolean {
    return /^https?:\/\//i.test(fileOrUrl);
  }

  private tryParseJson(json: string): unknown {
    try {
      return JSON.parse(json);
    } catch {
      return undefined;
    }
  }

  private tryParseYaml(yaml: string): unknown {
    try {
      return YAML.parse(yaml);
    } catch {
      return undefined;
    }
  }
}

function getDeepProperty(value: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let result: unknown = value;
  for (const part of parts) {
    if (!/\S/.test(part)) continue;
    if (typeof result === 'object') {
      result = (result as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return result;
}
