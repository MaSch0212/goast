import { normalizePath } from '@nx/devkit';
import { dirname, relative, resolve } from 'path';
import type { JestConfigWithTsJest } from 'ts-jest';

const esmModules = ['node-fetch', 'data-uri-to-buffer', 'fetch-blob', 'formdata-polyfill'];

export function createJestConfig(jestFilePath: string): JestConfigWithTsJest {
  const relativeDirToRoot = normalizePath(relative(resolve(__dirname, '..'), dirname(jestFilePath)));
  const pathToRoot = normalizePath(relative(dirname(jestFilePath), resolve(__dirname, '..')));
  return {
    displayName: relativeDirToRoot,
    preset: `${pathToRoot}/jest.preset.js`,
    transform: {
      '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    transformIgnorePatterns: [`node_modules/(?!(?:.pnpm/)?(${esmModules.join('|')}))`],
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: `${pathToRoot}/coverage/${relativeDirToRoot}`,
  };
}
