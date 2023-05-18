import { ExecutorContext, normalizePath } from '@nx/devkit';
import { HelperDependency, getHelperDependency, updatePackageJson } from '@nx/js';
import { checkDependencies } from '@nx/js/src/utils/check-dependencies.js';
import { copyFile, emptyDir, readJson, rename, writeJson } from 'fs-extra';
import { glob } from 'glob';
import { EOL } from 'os';
import { join, relative } from 'path';
import { DiagnosticCategory, EmitResult, ModuleKind, Project, getCompilerOptionsFromTsConfig } from 'ts-morph';
import { EntryPoint, ExecutorOptions } from './schema';
import { ResolvedModule, resolveModuleName } from 'typescript';

type Context = Required<Omit<ExecutorOptions, 'additionalEntryPoints'>> & {
  additionalEntryPoints: EntryPoint[];
  projectRoot: string;
  projectSourceRoot: string;
  distDir: string;
} & ExecutorContext;

export default async function runExecutor(options: ExecutorOptions, context: ExecutorContext) {
  await run(await prepare(options, context));
  return { success: true };
}

async function run(context: Context) {
  console.time('Done');

  await buildTypeScript(context);
  await buildPackageJson(context);
  await copyAssets(context);

  console.timeEnd('Done');
}

async function prepare(options: ExecutorOptions, context: ExecutorContext): Promise<Context> {
  if (!context.projectName) {
    throw new Error('Project name not found.');
  }
  const project = context.workspace?.projects[context.projectName];
  if (!project) {
    throw new Error(`Project ${context.projectName} not found.`);
  }
  const ctx: Omit<Context, keyof ExecutorContext> = {
    additionalEntryPoints: Object.entries(options.additionalEntryPoints ?? {}).map(([exportName, entryFile]) => ({
      exportName,
      entryFile: join(project.root, entryFile),
    })),
    assets: options.assets ?? [],
    entryFile: join(project.root, options.entryFile ?? 'src/index.ts'),
    projectRoot: project.root,
    projectSourceRoot: project.sourceRoot ?? project.root,
    distDir: join('dist', project.root),
    tsConfig: join(project.root, options.tsConfig || 'tsconfig.lib.json'),
  };

  await emptyDir(ctx.distDir);

  return Object.assign({}, context, ctx);
}

async function buildTypeScript(ctx: Context) {
  console.log('Building CommonJS...');
  const cjsProject = createTypeScriptProject(ctx, ModuleKind.CommonJS);
  await buildTypeScriptProject(cjsProject);
  await renameJavaScriptFilesToCjs(ctx.distDir);
  console.log(`  - Done (CommonJS)${EOL}`);

  console.log('Building ES2015...');
  const mjsProject = createTypeScriptProject(ctx, ModuleKind.ES2015, false);
  await buildTypeScriptProject(mjsProject);
  console.log(`  - Done (ES2015)${EOL}`);
}

function createTypeScriptProject(ctx: Context, moduleKind: ModuleKind, declaration: boolean = true) {
  const project = new Project({
    tsConfigFilePath: ctx.tsConfig,
    compilerOptions: {
      outDir: normalizePath(join(ctx.distDir, 'dist')),
      rootDir: ctx.projectSourceRoot,
      module: moduleKind,
      declaration,
    },
    resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
      return {
        resolveModuleNames: (moduleNames, containingFile) => {
          const options = getCompilerOptions();
          return moduleNames.map((moduleName) => {
            const resolvedModule = resolveModuleName(
              moduleName,
              containingFile,
              options,
              moduleResolutionHost,
              undefined
            ).resolvedModule;
            if (resolvedModule && options.paths?.hasOwnProperty(moduleName)) {
              resolvedModule.isExternalLibraryImport = true;
            }
            return resolvedModule;
          });
        },
      };
    },
  });
  return project;
}

async function buildTypeScriptProject(project: Project): Promise<EmitResult> {
  const emitResult = await project.emit();
  const diagnostics = project.getPreEmitDiagnostics().concat(emitResult.getDiagnostics());
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics));
  if (diagnostics.find((d) => d.getCategory() === DiagnosticCategory.Error)) {
    throw new Error('TypeScript compilation failed.');
  }
  return emitResult;
}

async function renameJavaScriptFilesToCjs(distDir: string) {
  const jsFiles = await glob(normalizePath(join(distDir, '**', '*.js')));
  for (const file of jsFiles) {
    await rename(file, file.replace(/\.js$/, '.cjs'));
  }

  const jsMapFiles = await glob(normalizePath(join(distDir, '**', '*.js.map')));
  for (const file of jsMapFiles) {
    const map = await readJson(file);
    map.file = map.file.replace(/\.js$/, '.cjs');
    await writeJson(file, map);
    await rename(file, file.replace(/\.js\.map$/, '.cjs.map'));
  }
}

async function buildPackageJson(ctx: Context) {
  console.log('Building package.json...');
  const { target, dependencies } = checkDependencies(ctx, ctx.tsConfig);
  const tsLibDependency = ctx.projectGraph
    ? getHelperDependency(HelperDependency.tsc, ctx.tsConfig, dependencies, ctx.projectGraph)
    : undefined;
  if (tsLibDependency) {
    dependencies.push(tsLibDependency);
  }

  updatePackageJson(
    {
      projectRoot: '',
      main: `dist/${removeTsExtension(getRelativeSourceFilePath(ctx, ctx.entryFile))}`,
      outputPath: ctx.distDir,
      updateBuildableProjectDepsInPackageJson: true,
      outputFileExtensionForCjs: '.cjs',
      format: ['cjs', 'esm'],
    },
    ctx,
    target,
    dependencies
  );

  const packageJson = await readJson(join(ctx.distDir, 'package.json'));
  packageJson.exports = {};
  addExport(ctx, packageJson, { exportName: '.', entryFile: ctx.entryFile });
  for (const entryPoint of ctx.additionalEntryPoints) {
    addExport(ctx, packageJson, entryPoint);
  }
  packageJson.exports['./package.json'] = './package.json';
  await writeJson(join(ctx.distDir, 'package.json'), packageJson, { spaces: 2 });
  console.log(`  - Done (package.json)${EOL}`);
}

function getRelativeSourceFilePath(ctx: Context, filePath: string) {
  return normalizePath(relative(ctx.projectSourceRoot, filePath));
}

function addExport(ctx: Context, packageJson: any, entryPoint: EntryPoint) {
  const entryPointName =
    entryPoint.exportName === '.' || entryPoint.exportName.startsWith('./')
      ? entryPoint.exportName
      : './' + entryPoint.exportName;
  const entryPointFile = removeTsExtension(getRelativeSourceFilePath(ctx, entryPoint.entryFile));
  packageJson.exports[entryPointName] = {
    import: `./dist/${entryPointFile}.js`,
    require: `./dist/${entryPointFile}.cjs`,
    types: `./dist/${entryPointFile}.d.ts`,
  };
}

async function copyAssets(ctx: Context) {
  console.log('Copying assets...');
  const files = await glob(ctx.assets.map((x) => normalizePath(join(ctx.projectRoot, x))));
  for (const file of files) {
    await copyFile(file, join(ctx.distDir, relative(ctx.projectRoot, file)));
  }
  console.log(`  - Done (${files.length} asset(s))${EOL}`);
}

function removeTsExtension(path: string) {
  return path.replace(/\.?(d\.ts|ts|js)$/, '');
}
