import { normalizePath, type ExecutorContext, type ProjectGraphProjectNode } from '@nrwl/devkit';
import { TsupExecutorSchema } from './schema';
import { build, defineConfig, Options as TsupOptions } from 'tsup';
import { join, relative } from 'path';
import { copyFile, emptyDir, pathExists, readJson, writeJson } from 'fs-extra';
import { checkDependencies } from '@nrwl/js/src/utils/check-dependencies';
import { getHelperDependency, HelperDependency, updatePackageJson } from '@nrwl/js';
import { DependentBuildableProjectNode } from '@nrwl/js/src/utils/buildable-libs-utils';

type EntryPoint = {
  entryFile: string;
  exportName: string;
};

export default async function runExecutor(options: TsupExecutorSchema, context: ExecutorContext) {
  if (!context.projectName) {
    throw new Error('Project name not found.');
  }
  const projectRoot = context.workspace?.projects[context.projectName].root;
  if (!projectRoot) {
    throw new Error('Project root not found.');
  }
  const tsupConfig = join(projectRoot, 'tsup.config.ts');
  const distDir = join('dist', projectRoot);
  const tsconfig = join(projectRoot, options.tsConfig || 'tsconfig.lib.json');
  await emptyDir(distDir);

  const { target, dependencies } = checkDependencies(context, tsconfig);

  const entryFile = options.entryFile
    ? join(projectRoot, options.entryFile)
    : join(projectRoot, 'src', 'index.ts');
  const additionalEntryPoints: EntryPoint[] =
    options.additionalEntryPoints?.map((x) => ({
      entryFile: join(projectRoot, x.entryFile),
      exportName: x.exportName,
    })) ?? [];
  const tsupOptions: TsupOptions = {
    format: ['esm', 'cjs'],
    tsconfig: normalizePath(tsconfig),
    config: tsupConfig,
    dts: true,
    outDir: normalizePath(distDir),
    clean: false,
    entry: Object.fromEntries([
      ['index', normalizePath(entryFile)],
      ...additionalEntryPoints.map((x) => [x.exportName, normalizePath(x.entryFile)]),
    ]),
    splitting: true,
    external: dependencies.map((x) => new RegExp(escapeRegExp(x.name) + '($|\\/)')),
  };

  try {
    await build(tsupOptions);
  } catch (e: any) {
    console.error(e.message);
    return { success: false };
  }

  await copyFileIfExists(join(projectRoot, 'package.json'), join(distDir, 'package.json'));
  await copyFileIfExists(join(projectRoot, 'README.md'), join(distDir, 'README.md'));
  await copyFileIfExists(join(projectRoot, 'LICENSE'), join(distDir, 'LICENSE'));

  if (context.projectGraph) {
    const tsLibDependency = getHelperDependency(
      HelperDependency.tsc,
      tsconfig,
      dependencies,
      context.projectGraph
    );
    if (tsLibDependency) {
      dependencies.push(tsLibDependency);
    }
  }

  await updatePackageJsonExt(
    projectRoot,
    additionalEntryPoints,
    distDir,
    context,
    target,
    dependencies
  );

  return {
    success: true,
  };
}

async function copyFileIfExists(src: string, dest: string) {
  if (await pathExists(src)) {
    await copyFile(src, dest);
  }
}

async function updatePackageJsonExt(
  projectRoot: string,
  additionalEntryPoints: EntryPoint[],
  outDir: string,
  context: ExecutorContext,
  target: ProjectGraphProjectNode,
  dependencies: DependentBuildableProjectNode[]
) {
  updatePackageJson(
    {
      projectRoot: '',
      main: 'index',
      outputPath: outDir,
      updateBuildableProjectDepsInPackageJson: true,
      outputFileExtensionForCjs: '.cjs',
      format: ['cjs', 'esm'],
      generateExportsField: true,
    },
    context,
    target,
    dependencies
  );
  const packageJson = await readJson(join(outDir, 'package.json'));
  for (const entryPoint of additionalEntryPoints) {
    const entryPointName = entryPoint.exportName.startsWith('./')
      ? entryPoint.exportName
      : './' + entryPoint.exportName;
    packageJson.exports[entryPointName] = {
      import: `./${entryPoint.exportName}.js`,
      require: `./${entryPoint.exportName}.cjs`,
    };
  }
  packageJson.exports['./package.json'] = './package.json';
  await writeJson(join(outDir, 'package.json'), packageJson, { spaces: 2 });
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
