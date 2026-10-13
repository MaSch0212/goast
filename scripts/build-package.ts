/**
 * Builds the workspace package in the current directory: `tsc` into `dist/`, plus its assets and the repo LICENSE.
 * Run through the package's `build` script.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const packageDir = process.cwd();
const rootDir = resolve(import.meta.dirname, '..');
const distDir = resolve(packageDir, 'dist');

rmSync(distDir, { recursive: true, force: true });

const tscPath = resolve(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin', 'tsc');
const tsc = spawnSync(process.execPath, [tscPath, '-p', 'tsconfig.build.json'], { cwd: packageDir, stdio: 'inherit' });
if (tsc.status !== 0) {
  throw new Error(`tsc failed for "${packageDir}" with exit code ${tsc.status}${tsc.error ? `: ${tsc.error}` : ''}`);
}

const assetsDir = resolve(packageDir, 'assets');
if (existsSync(assetsDir)) {
  cpSync(assetsDir, resolve(distDir, 'assets'), { recursive: true });
}
cpSync(resolve(rootDir, 'LICENSE'), resolve(packageDir, 'LICENSE'));
