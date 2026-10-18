import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { goReference } from '../nodes/reference.ts';
import * as refs from './index.ts';

const options = {
  ...defaultGoGeneratorConfig,
  newLine: '\n',
  addGeneratedHeader: false,
} as GoGeneratorConfig;

/** Writes the reference to a file, which returns the code and the imports it adds. */
function renderInFile(reference: ReturnType<typeof goReference>): { code: string; source: string } {
  const builder = new GoFileBuilder('api', undefined, options);
  builder.append(reference);
  return { code: builder.toFragmentString().trim(), source: builder.toString() };
}

describe('predeclared identifiers', () => {
  it.each([
    ['any', refs.any],
    ['bool', refs.bool],
    ['byte', refs.byte],
    ['error', refs.error],
    ['float32', refs.float32],
    ['float64', refs.float64],
    ['int', refs.int],
    ['int32', refs.int32],
    ['int64', refs.int64],
    ['rune', refs.rune],
    ['string', refs.string],
  ])('writes %s without an import', (name, factory) => {
    expect(factory.refName).toBe(name);
    expect(factory.importPath ?? null).toBeNull();

    const { code, source } = renderInFile(factory());
    expect(code).toBe(name);
    expect(source).toBe(`package api\n\n${name}\n`);
  });

  it('matches only references of the predeclared name', () => {
    expect(refs.error.matches(goReference('error'))).toBe(true);
    expect(refs.error.matches(goReference('error', 'example.com/error'))).toBe(false);
  });
});

describe('packages', () => {
  it.each([
    ['context.Context', refs.context.context, 'Context', 'context', 'context.Context'],
    ['json.RawMessage', refs.encoding.jsonRawMessage, 'RawMessage', 'encoding/json', 'json.RawMessage'],
    ['io.Reader', refs.io.reader, 'Reader', 'io', 'io.Reader'],
    ['io.ReadCloser', refs.io.readCloser, 'ReadCloser', 'io', 'io.ReadCloser'],
    ['multipart.FileHeader', refs.mime.multipartFileHeader, 'FileHeader', 'mime/multipart', 'multipart.FileHeader'],
    ['http.Handler', refs.net.httpHandler, 'Handler', 'net/http', 'http.Handler'],
    ['http.Header', refs.net.httpHeader, 'Header', 'net/http', 'http.Header'],
    ['http.Request', refs.net.httpRequest, 'Request', 'net/http', 'http.Request'],
    ['http.ResponseWriter', refs.net.httpResponseWriter, 'ResponseWriter', 'net/http', 'http.ResponseWriter'],
    ['http.ServeMux', refs.net.httpServeMux, 'ServeMux', 'net/http', 'http.ServeMux'],
    ['time.Time', refs.time.time, 'Time', 'time', 'time.Time'],
  ])('references %s', (_label, factory, name, importPath, qualified) => {
    expect(factory.refName).toBe(name);
    expect(factory.importPath).toBe(importPath);

    const { code, source } = renderInFile(factory());
    expect(code).toBe(qualified);
    expect(source).toBe(`package api\n\nimport "${importPath}"\n\n${qualified}\n`);
  });

  it('matches references of the same package and name', () => {
    expect(refs.io.reader.matches(goReference('Reader', 'io'))).toBe(true);
    expect(refs.io.reader.matches(goReference('ReadCloser', 'io'))).toBe(false);
    expect(refs.io.reader.matches(refs.io.readCloser())).toBe(false);
  });

  it('imports the package once for several references to it', () => {
    const builder = new GoFileBuilder('api', undefined, options);
    builder.append(refs.net.httpRequest(), ' ', refs.net.httpResponseWriter());

    expect(builder.toString()).toBe('package api\n\nimport "net/http"\n\nhttp.Request http.ResponseWriter\n');
  });
});
