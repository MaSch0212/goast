// import { readFileSync } from 'fs';
// import { dirname, resolve } from 'path';

// import { ensureDirSync, writeFileSync } from 'fs-extra';

// import {
//   ApiService,
//   Factory,
//   OpenApiGeneratorContext,
//   OpenApiServicesGenerationProviderBase,
//   notNullish,
// } from '@goast/core';

// import {
//   DefaultTypeScriptAngularServiceGenerator,
//   TypeScriptAngularServiceGenerator,
// } from './angular-service-generator';
// import {
//   TypeScriptAngularServicesGeneratorInput,
//   TypeScriptAngularServicesGeneratorOutput,
//   TypeScriptAngularServicesGeneratorConfig,
//   TypeScriptAngularServiceGeneratorOutput,
//   TypeScriptAngularServicesGeneratorContext,
//   defaultTypeScriptAngularServicesGeneratorConfig,
// } from './models';
// import { TypeScriptFileBuilder } from '../../../file-builder';
// import { ImportExportCollection } from '../../../import-collection';
// import { modifyString } from '../../../utils';

// type Input = TypeScriptAngularServicesGeneratorInput;
// type Output = TypeScriptAngularServicesGeneratorOutput;
// type Config = TypeScriptAngularServicesGeneratorConfig;
// type ServiceOutput = TypeScriptAngularServiceGeneratorOutput;
// type Context = TypeScriptAngularServicesGeneratorContext;

// export class TypeScriptAngularServicesGenerator extends OpenApiServicesGenerationProviderBase<
//   Input,
//   Output,
//   Config,
//   ServiceOutput,
//   Context
// > {
//   private readonly _clientGeneratorFactory: Factory<TypeScriptAngularServiceGenerator, []>;

//   constructor(clientGeneratorFactory?: Factory<TypeScriptAngularServiceGenerator, []>) {
//     super();
//     this._clientGeneratorFactory =
//       clientGeneratorFactory ?? Factory.fromValue(new DefaultTypeScriptAngularServiceGenerator());
//   }

//   protected override initResult(): Output {
//     return {
//       services: {},
//       servicesIndexFilePath: undefined,
//       responseModelsIndexFilePath: undefined,
//     };
//   }

//   protected override buildContext(
//     context: OpenApiGeneratorContext<Input>,
//     config?: Partial<Config> | undefined
//   ): Context {
//     return this.getProviderContext(context, config, defaultTypeScriptAngularServicesGeneratorConfig);
//   }

//   public override onGenerate(ctx: Context): Output {
//     const output = super.onGenerate(ctx);
//     this.copyUtilsFiles(ctx);
//     output.servicesIndexFilePath = this.generateServicesIndexFile(ctx);
//     return output;
//   }

//   protected override generateService(ctx: Context, service: ApiService): ServiceOutput {
//     const clientGenerator = this._clientGeneratorFactory.create();
//     return clientGenerator.generate({
//       ...ctx,
//       service,
//     });
//   }

//   protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
//     ctx.output.services[service.id] = result;
//   }

//   protected generateServicesIndexFile(ctx: Context): string | undefined {
//     if (!this.shouldGenerateServicesIndexFile(ctx)) {
//       return undefined;
//     }

//     const filePath = this.getServicesIndexFilePath(ctx);
//     console.log(`Generating index file to ${filePath}...`);
//     ensureDirSync(dirname(filePath));

//     const builder = new TypeScriptFileBuilder(filePath, ctx.config);
//     this.generateServicesIndexFileContent(ctx, builder);
//     writeFileSync(filePath, builder.toString());

//     return filePath;
//   }

//   protected getServicesIndexFilePath(ctx: Context): string {
//     return resolve(ctx.config.outputDir, ctx.config.indexFilePath ?? 'clients.ts');
//   }

//   protected shouldGenerateServicesIndexFile(ctx: Context): boolean {
//     return notNullish(ctx.config.indexFilePath);
//   }

//   protected generateServicesIndexFileContent(ctx: Context, builder: TypeScriptFileBuilder) {
//     const exports = new ImportExportCollection();

//     for (const serviceId in ctx.output.services) {
//       const service = ctx.output.services[serviceId];
//       exports.addExport(service.component, service.filePath);
//     }

//     exports.writeTo(builder);
//   }

//   protected generateResponseModelsIndexFile(ctx: Context): string | undefined {
//     if (!this.shouldGenerateResponseModelsIndexFile(ctx)) {
//       return undefined;
//     }

//     const filePath = this.getResponseModelsIndexFilePath(ctx);
//     console.log(`Generating response models index file to ${filePath}...`);
//     ensureDirSync(dirname(filePath));

//     const builder = new TypeScriptFileBuilder(filePath, ctx.config);
//     this.generateResponseModelsIndexFileContent(ctx, builder);
//     writeFileSync(filePath, builder.toString());

//     return filePath;
//   }

//   protected getResponseModelsIndexFilePath(ctx: Context): string {
//     return resolve(ctx.config.outputDir, ctx.config.responseModelsIndexFilePath ?? 'responses.ts');
//   }

//   protected shouldGenerateResponseModelsIndexFile(ctx: Context): boolean {
//     return notNullish(ctx.config.responseModelsDirPath) && notNullish(ctx.config.responseModelsIndexFilePath);
//   }

//   protected generateResponseModelsIndexFileContent(ctx: Context, builder: TypeScriptFileBuilder) {
//     const exports = new ImportExportCollection();

//     for (const serviceId in ctx.output.services) {
//       const service = ctx.output.services[serviceId];
//       for (const operationId in service.responseModels) {
//         const responseModel = service.responseModels[operationId];
//         if (responseModel.filePath) {
//           exports.addExport(responseModel.component, responseModel.filePath);
//         }
//       }
//     }

//     exports.writeTo(builder);
//   }

//   protected copyUtilsFiles(ctx: Context): void {
//     const sourceDir = resolve(dirname(require.resolve('@goast/typescript')), '../assets/service/angular');
//     const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDirPath);
//     ensureDirSync(targetDir);

//     const files = ['api-configuration.ts', 'base-service.ts', 'request-builder.ts', 'strict-http-response.ts'];
//     if (ctx.config.clientMethodFlavor === 'response-handler') {
//       files.push('response-handler.ts');
//     }

//     const rootUrl = this.getRootUrl(ctx);
//     for (const file of files) {
//       const fileContent = readFileSync(resolve(sourceDir, file))
//         .toString()
//         .replace(/@ROOT_URL@/g, rootUrl);
//       writeFileSync(resolve(targetDir, file), fileContent);
//     }
//   }

//   protected getRootUrl(ctx: Context): string {
//     return modifyString<[]>(
//       (ctx.data.services[0].$src ?? ctx.data.services[0].endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
//       ctx.config.rootUrl
//     );
//   }
// }
