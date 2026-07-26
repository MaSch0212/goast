import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import type { OpenApiGeneratorConfig } from '../codegen/config.ts';
import { writeGeneratedFile } from './file-system.utils.ts';

function configWith(existingFileBehavior: OpenApiGeneratorConfig['existingFileBehavior']): OpenApiGeneratorConfig {
  return { existingFileBehavior } as OpenApiGeneratorConfig;
}

describe('writeGeneratedFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir();
  });

  afterEach(async () => {
    await Deno.remove(tempDir, { recursive: true });
  });

  describe("existingFileBehavior: 'count'", () => {
    it('writes to the plain path when nothing exists', () => {
      const filePath = join(tempDir, 'MyThing.kt');

      writeGeneratedFile(configWith('count'), filePath, 'content');

      expect(fs.readFileSync(filePath, 'utf-8')).toBe('content');
    });

    it('writes X_1.kt when X.kt exists, and the original file is untouched', () => {
      const filePath = join(tempDir, 'MyThing.kt');
      const countedPath = join(tempDir, 'MyThing_1.kt');
      fs.writeFileSync(filePath, 'original');

      writeGeneratedFile(configWith('count'), filePath, 'new content');

      expect(fs.readFileSync(filePath, 'utf-8')).toBe('original');
      expect(fs.readFileSync(countedPath, 'utf-8')).toBe('new content');
    });

    it('writes X_2.kt when both X.kt and X_1.kt exist', () => {
      const filePath = join(tempDir, 'MyThing.kt');
      const firstCountedPath = join(tempDir, 'MyThing_1.kt');
      const secondCountedPath = join(tempDir, 'MyThing_2.kt');
      fs.writeFileSync(filePath, 'original');
      fs.writeFileSync(firstCountedPath, 'original 1');

      writeGeneratedFile(configWith('count'), filePath, 'new content');

      expect(fs.readFileSync(filePath, 'utf-8')).toBe('original');
      expect(fs.readFileSync(firstCountedPath, 'utf-8')).toBe('original 1');
      expect(fs.readFileSync(secondCountedPath, 'utf-8')).toBe('new content');
    });

    it('produces _1.kt for a filename that is nothing but an extension', () => {
      const filePath = join(tempDir, '.kt');
      const countedPath = join(tempDir, '_1.kt');
      fs.writeFileSync(filePath, 'original');

      writeGeneratedFile(configWith('count'), filePath, 'new content');

      expect(fs.readFileSync(countedPath, 'utf-8')).toBe('new content');
    });

    it('produces Name_1 for a filename with no extension', () => {
      const filePath = join(tempDir, 'Makefile');
      const countedPath = join(tempDir, 'Makefile_1');
      fs.writeFileSync(filePath, 'original');

      writeGeneratedFile(configWith('count'), filePath, 'new content');

      expect(fs.readFileSync(countedPath, 'utf-8')).toBe('new content');
    });

    it('produces foo.bar_1.ts for foo.bar.ts, splitting at the last dot', () => {
      const filePath = join(tempDir, 'foo.bar.ts');
      const countedPath = join(tempDir, 'foo.bar_1.ts');
      fs.writeFileSync(filePath, 'original');

      writeGeneratedFile(configWith('count'), filePath, 'new content');

      expect(fs.readFileSync(countedPath, 'utf-8')).toBe('new content');
    });

    it('creates missing parent directories', () => {
      const filePath = join(tempDir, 'nested', 'dir', 'MyThing.kt');

      writeGeneratedFile(configWith('count'), filePath, 'content');

      expect(fs.readFileSync(filePath, 'utf-8')).toBe('content');
    });
  });

  describe("existingFileBehavior: 'error'", () => {
    it('throws with the exact existing message when the file exists', () => {
      const filePath = join(tempDir, 'MyThing.kt');
      fs.writeFileSync(filePath, 'original');

      expect(() => writeGeneratedFile(configWith('error'), filePath, 'new content')).toThrow(
        `File already exists: ${filePath}`,
      );
    });

    it('writes the file when it does not yet exist', () => {
      const filePath = join(tempDir, 'MyThing.kt');

      writeGeneratedFile(configWith('error'), filePath, 'content');

      expect(fs.readFileSync(filePath, 'utf-8')).toBe('content');
    });
  });

  describe("existingFileBehavior: 'skip'", () => {
    it('leaves the existing content alone and writes nothing new', () => {
      const filePath = join(tempDir, 'MyThing.kt');
      fs.writeFileSync(filePath, 'original');

      writeGeneratedFile(configWith('skip'), filePath, 'new content');

      expect(fs.readFileSync(filePath, 'utf-8')).toBe('original');
    });
  });

  describe("existingFileBehavior: 'override'", () => {
    it('replaces the existing content', () => {
      const filePath = join(tempDir, 'MyThing.kt');
      fs.writeFileSync(filePath, 'original');

      writeGeneratedFile(configWith('override'), filePath, 'new content');

      expect(fs.readFileSync(filePath, 'utf-8')).toBe('new content');
    });
  });
});
