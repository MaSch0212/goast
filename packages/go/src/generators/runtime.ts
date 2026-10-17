import { getAssetFileContent } from '../assets.ts';
import type { GoGeneratorConfig } from '../config.ts';
import { GoFileBuilder } from '../file-builder.ts';
import { getGoIdentifierRegistry } from '../identifier-registry.ts';
import { toGoPackageName } from '../utils.ts';
import type { GoPackageInfo } from './file-generator.ts';

/**
 * Gets the package a generator writes into, from a `packagePath`. Its directory is `outputDir` followed by the path,
 * its import path is `modulePath` followed by the path, and its name is `packageName` or else derived from the last
 * segment of the path. Backslashes are read as `/`, and leading and trailing slashes are removed.
 * @param config The configuration of the generator, which holds the common Go options and the package options.
 * @returns The package.
 */
export function getGoRuntimePackage(
  config: GoGeneratorConfig & { packagePath: string; packageName?: string },
): GoPackageInfo {
  const path = config.packagePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const modulePath = config.modulePath.replace(/\/+$/, '');
  return {
    path,
    name: config.packageName ?? toGoPackageName(path || modulePath),
    importPath: path ? `${modulePath}/${path}` : modulePath,
    dir: path ? `${config.outputDir}/${path}` : config.outputDir,
  };
}

/**
 * Reserves the top-level identifiers of a runtime asset in the package. Exported ones the package declares already
 * (e.g. a schema named `RequestError`) get another name. Unexported ones keep theirs, since the models declare none.
 * @param run The data of the run, in which the identifiers are reserved.
 * @param pkg The package the runtime is written into.
 * @param runtime The content of the runtime asset, whose top-level declarations are reserved.
 * @returns The name of each top-level identifier of the runtime in the package, by its name in the runtime.
 */
export function reserveGoRuntimeNames(run: object, pkg: GoPackageInfo, runtime: string): Record<string, string> {
  const registry = getGoIdentifierRegistry(run, pkg.importPath);
  const names: Record<string, string> = {};
  for (const [, name] of runtime.matchAll(/^(?:func|type|var|const) ([A-Za-z_][A-Za-z0-9_]*)/gm)) {
    names[name] = registry.reserve(name, `runtime:${name}`);
  }
  return names;
}

/**
 * Writes a runtime asset into a package. The imports of the asset are added to the file, and its top-level identifiers
 * are renamed to the names in `runtimeNames`. The file name is reserved, so a runtime never replaces the file of
 * another generator.
 * @param options What to write: the data of the run and the configuration, the package, the asset to copy (relative to
 *   the `assets` directory), the file name without extension, the names of its identifiers in the package, and what the
 *   runtime is called in the log.
 */
export async function writeGoRuntimeFile(options: {
  data: object;
  config: GoGeneratorConfig;
  pkg: GoPackageInfo;
  asset: string;
  fileName: string;
  runtimeNames: Record<string, string>;
  label: string;
}): Promise<void> {
  const { pkg, asset } = options;
  const files = getGoIdentifierRegistry(options.data, `${pkg.importPath}\u0000files`);
  const filePath = `${pkg.dir}/${files.reserve(options.fileName)}.go`;
  console.log(`Generating ${options.label} runtime to ${filePath}...`);

  const runtime = await getAssetFileContent(asset);
  const importBlock = /^import \(\n([\s\S]*?)\n\)\n/m.exec(runtime);
  if (!importBlock) throw new Error(`The asset ${asset} has no import block.`);

  const builder = new GoFileBuilder(pkg.name, pkg.importPath, options.config);
  for (const [, path] of importBlock[1].matchAll(/"([^"]+)"/g)) {
    builder.imports.addImport(path);
  }
  let body = runtime.slice(importBlock.index + importBlock[0].length);
  for (const [name, renamed] of Object.entries(options.runtimeNames)) {
    if (name !== renamed) body = body.replace(new RegExp(`\\b${name}\\b`, 'g'), renamed);
  }
  builder.append(body);
  builder.writeToFile(filePath);
}
