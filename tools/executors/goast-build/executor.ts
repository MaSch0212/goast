import { ExecutorContext, normalizePath } from '@nx/devkit';
import { HelperDependency, getHelperDependency, updatePackageJson } from '@nx/js';
import { checkDependencies } from '@nx/js/src/utils/check-dependencies';
import fs from 'fs-extra';
import { glob } from 'glob';
import { EOL } from 'os';
import { dirname, join, relative } from 'path';
import { DiagnosticCategory, EmitResult, ModuleKind, Project, getCompilerOptionsFromTsConfig } from 'ts-morph';
import { EntryPoint, ExecutorOptions } from './schema';
import { resolveModuleName } from 'typescript';
import { replaceTscAliasPaths, prepareSingleFileReplaceTscAliasPaths } from 'tsc-alias';

type Context = Required<Omit<ExecutorOptions, 'additionalEntryPoints'>> & {
  additionalEntryPoints: EntryPoint[];
  projectRoot: string;
  projectSourceRoot: string;
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
  const project = context.projectsConfigurations.projects[context.projectName];
  if (!project) {
    throw new Error(`Project ${context.projectName} not found.`);
  }
  const ctx: Omit<Context, keyof ExecutorContext> = {
    additionalEntryPoints: Object.entries(options.additionalEntryPoints ?? {}).map(([exportName, entryFile]) => ({
      exportName,
      entryFile: join(project.root, entryFile),
    })),
    assets: options.assets ?? [],
    outputPath: options.outputPath,
    entryFile: join(project.root, options.entryFile ?? 'src/index.ts'),
    projectRoot: project.root,
    projectSourceRoot: project.sourceRoot ?? project.root,
    tsConfig: join(project.root, options.tsConfig || 'tsconfig.lib.json'),
  };

  await fs.emptyDir(ctx.outputPath);

  return Object.assign({}, context, ctx);
}

async function buildTypeScript(ctx: Context) {
  console.log('Emitting types...');
  const emitProject = createTypeScriptProject(ctx, ModuleKind.None, 'types', true);
  await buildTypeScriptProject(emitProject);
  console.log(`  - Done (types)${EOL}`);

  console.log('Building CommonJS...');
  const cjsProject = createTypeScriptProject(ctx, ModuleKind.CommonJS, 'cjs', false);
  await buildTypeScriptProject(cjsProject);
  await fs.writeJson(join(cjsProject.compilerOptions.get().outDir, 'package.json'), { type: 'commonjs' });
  console.log(`  - Done (CommonJS)${EOL}`);

  console.log('Building ES2015...');
  const mjsProject = createTypeScriptProject(ctx, ModuleKind.ES2015, 'esm', false);
  await buildTypeScriptProject(mjsProject);
  console.log('  - Run tsc-alias...');
  const tsConfig = fs.readJsonSync(ctx.tsConfig);
  tsConfig.compilerOptions ??= {};
  tsConfig.compilerOptions.paths = [];
  await fs.writeJson(ctx.tsConfig + '.tmp', tsConfig, { spaces: 2 });
  await replaceTscAliasPaths({
    configFile: ctx.tsConfig + '.tmp',
    outDir: mjsProject.compilerOptions.get().outDir,
    declarationDir: mjsProject.compilerOptions.get().declarationDir,
    resolveFullPaths: true,
    verbose: true,
  });
  fs.removeSync(ctx.tsConfig + '.tmp');
  console.log(`  - Done (ES2015)${EOL}`);
}

function createTypeScriptProject(ctx: Context, moduleKind: ModuleKind, outDir: string, declaration: boolean) {
  const project = new Project({
    tsConfigFilePath: ctx.tsConfig,
    compilerOptions: {
      outDir: normalizePath(join(ctx.outputPath, outDir)),
      rootDir: ctx.projectSourceRoot,
      module: moduleKind,
      declaration,
      emitDeclarationOnly: declaration,
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
              undefined,
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
      outputPath: ctx.outputPath,
      updateBuildableProjectDepsInPackageJson: true,
      format: ['cjs', 'esm'],
    },
    ctx,
    target,
    dependencies,
  );

  const relativeIndex = removeTsExtension(getRelativeSourceFilePath(ctx, ctx.entryFile));
  const packageJson = await fs.readJson(join(ctx.outputPath, 'package.json'));
  packageJson.exports = {};
  packageJson.type = 'module';
  packageJson.module = `./esm/${relativeIndex}.js`;
  packageJson.main = `./cjs/${relativeIndex}.js`;
  packageJson.types = `./types/${relativeIndex}.d.ts`;
  addExport(ctx, packageJson, { exportName: '.', entryFile: ctx.entryFile });
  for (const entryPoint of ctx.additionalEntryPoints) {
    addExport(ctx, packageJson, entryPoint);
  }
  packageJson.exports['./package.json'] = './package.json';
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['@types/fs-extra'] = '^11.0.4';
  await fs.writeJson(join(ctx.outputPath, 'package.json'), packageJson, { spaces: 2 });
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
    import: `./esm/${entryPointFile}.js`,
    require: `./cjs/${entryPointFile}.js`,
    types: `./types/${entryPointFile}.d.ts`,
  };
}

async function copyAssets(ctx: Context) {
  console.log('Copying assets...');
  const files = await glob(
    ctx.assets.map((x) => normalizePath(join(ctx.projectRoot, x))),
    { nodir: true },
  );
  for (const file of files) {
    const targetDir = join(ctx.outputPath, relative(ctx.projectRoot, dirname(file)));
    await fs.ensureDir(targetDir);
    await fs.copyFile(file, join(ctx.outputPath, relative(ctx.projectRoot, file)));
  }
  console.log(`  - Done (${files.length} asset(s))${EOL}`);
}

function removeTsExtension(path: string) {
  return path.replace(/\.?(d\.ts|ts|js)$/, '');
}
