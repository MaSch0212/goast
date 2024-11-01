import { build, type BuildOptions, emptyDir } from '@deno/dnt';
import { resolve } from 'node:path';
// @deno-types="npm:@types/fs-extra"
import fs from 'fs-extra';

type GoastNpmOptions = {
  shimDeno?: BuildOptions['shims']['deno'];
  shimUndici?: BuildOptions['shims']['undici'];
  usedLocalPackages?: string[];
  noReadme?: boolean;
  private?: boolean;
  assetsManagerFilePath?: string;
};
type DenoJson = {
  name?: string;
  version?: string;
  description?: string;
  exports?: string;
  goastNpmOptions?: GoastNpmOptions;
};
type PackageJson = {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const rootDir = import.meta.dirname ? resolve(import.meta.dirname, '..') : '.';
const projectDir = resolve(rootDir, Deno.args[0]);
const denoJson: DenoJson = JSON.parse(Deno.readTextFileSync(resolve(rootDir, Deno.args[0], 'deno.json')));

if (!denoJson.name) throw new Error('The "name" property in the deno.json is required.');
if (!denoJson.version) throw new Error('The "version" property in the deno.json is required.');

const distDir = resolve(rootDir, 'npm', denoJson.name);

Deno.chdir(projectDir);

await emptyDir(distDir);

await build({
  entryPoints: [resolve(projectDir, denoJson.exports ?? './src/index.ts')],
  outDir: distDir,
  importMap: resolve(rootDir, 'deno.json'),
  shims: {
    deno: denoJson.goastNpmOptions?.shimDeno ?? { test: 'dev' },
    undici: denoJson.goastNpmOptions?.shimUndici ?? false,
  },
  compilerOptions: {
    importHelpers: true,
    target: 'ES2018',
    lib: ['ESNext', 'DOM'],
  },
  package: {
    // package.json properties
    name: denoJson.name,
    version: denoJson.version,
    description: denoJson.description,
    license: 'MIT',
    private: denoJson.goastNpmOptions?.private,
    author: {
      name: 'Marc Schmidt (MaSch0212)',
      url: 'https://github.com/MaSch0212',
    },
    repository: {
      type: 'git',
      url: 'git+https://github.com/MaSch0212/goast.git',
    },
    bugs: {
      url: 'https://github.com/MaSch0212/goast/issues',
    },
    dependencies: Object.fromEntries(
      denoJson.goastNpmOptions?.usedLocalPackages?.map((x: string) => [x, `file:${resolve(rootDir, 'npm', x)}`]) ?? [],
    ),
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync(resolve(rootDir, 'LICENSE'), resolve(distDir, 'LICENSE'));
    if (!denoJson.goastNpmOptions?.noReadme) {
      Deno.copyFileSync(resolve(projectDir, 'README.md'), resolve(distDir, 'README.md'));
    }
    copyIfExists(resolve(projectDir, 'assets'), resolve(distDir, 'assets'));

    // Test files
    fs.copySync(resolve(rootDir, 'test', 'openapi-files'), resolve(distDir, '..', 'test', 'openapi-files'));
    copyIfExists(resolve(projectDir, 'tests', '.verify'), resolve(distDir, 'script', 'tests', '.verify'));
    copyIfExists(resolve(projectDir, 'tests', '.verify'), resolve(distDir, 'esm', 'tests', '.verify'));

    // Adjust asset relative path
    if (denoJson.goastNpmOptions?.assetsManagerFilePath) {
      for (const tech of ['esm', 'script']) {
        const assetsFilePath = resolve(
          distDir,
          tech,
          denoJson.goastNpmOptions.assetsManagerFilePath.replace(/\.ts$/, '.js'),
        );
        if (!fs.existsSync(assetsFilePath)) {
          throw new Error(`The file "${assetsFilePath}" does not exist.`);
        }
        let content = fs.readFileSync(assetsFilePath, 'utf-8');
        content = content.replace('../assets/', '../../assets/');
        fs.writeFileSync(assetsFilePath, content);
      }
    }
  },
});

adjustPackageJson();
adjustNpmIgnore();

function copyIfExists(src: string, dest: string) {
  if (fs.existsSync(src)) {
    fs.copySync(src, dest);
  }
}

function adjustPackageJson() {
  const packageJsonPath = resolve(distDir, 'package.json');
  const packageJson = JSON.parse(Deno.readTextFileSync(packageJsonPath));
  moveTypeDependenciesToDevDependencies(packageJson);
  removeTestRelatedDependencies(packageJson);
  correctLocalPackageDependencies(packageJson);
  Deno.writeTextFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2));
}

function moveTypeDependenciesToDevDependencies(packageJson: PackageJson) {
  if (!packageJson.dependencies) return;
  const typeDependencies = Object.entries(packageJson.dependencies).filter(([key]) => key.startsWith('@types/'));
  for (const [dep, version] of typeDependencies) {
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    packageJson.devDependencies[dep] = version;
    delete packageJson.dependencies[dep];
  }
}

function removeTestRelatedDependencies(packageJson: PackageJson) {
  const dependenciesToRemove = ['@deno/shim-deno-test', '@goast/test-utils', 'picocolors'];

  for (const depCollection of [packageJson.dependencies, packageJson.devDependencies, packageJson.peerDependencies]) {
    if (!depCollection) continue;
    for (const dep of dependenciesToRemove) {
      delete depCollection[dep];
    }
  }
}

function correctLocalPackageDependencies(packageJson: PackageJson) {
  for (const depCollection of [packageJson.dependencies, packageJson.devDependencies, packageJson.peerDependencies]) {
    if (!depCollection) continue;
    for (const dep of denoJson.goastNpmOptions?.usedLocalPackages ?? []) {
      if (!depCollection[dep]) continue;
      const depVersion = fs.readJsonSync(resolve(rootDir, 'npm', dep, 'package.json')).version;
      if (!depVersion) throw new Error(`The package.json of the local package "${dep}" does not contain a version.`);
      depCollection[dep] = depVersion;
    }
  }
}

function adjustNpmIgnore() {
  const npmIgnorePath = resolve(distDir, '.npmignore');
  const npmIgnore = Deno.readTextFileSync(npmIgnorePath).replace(/\r/g, '').split('\n');
  npmIgnore.push('/script/tests/', '/esm/tests/');
  npmIgnore.push(...npmIgnore.filter((x) => /\.[jt]s$/.test(x)).map((x) => x + '.map'));
  Deno.writeTextFileSync(npmIgnorePath, npmIgnore.join('\n') + '\n');
}
