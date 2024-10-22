import type { TypeScriptExportOptions } from './import-collection.ts';

export type TypeScriptComponentOutputKind = 'interface' | 'type' | 'enum' | 'class' | 'function' | 'variable';
export type TypeScriptComponentOutput = {
  component: string;
  filePath?: string;
  imports: TypeScriptImport[];
  additionalExports?: string[] | ({ name: string } & TypeScriptExportOptions)[];
  kind?: TypeScriptComponentOutputKind;
};

export type TypeScriptExportOutput = {
  component: string;
  filePath: string;
} & TypeScriptExportOptions;

export type TypeScriptImportKind = 'module' | 'file';
export type TypeScriptImportType = 'import' | 'type-import' | 'js-doc';
export type TypeScriptExportType = 'export' | 'type-export';

export type TypeScriptImport = {
  kind: TypeScriptImportKind;
  type: TypeScriptImportType;
  modulePath: string;
  name: string;
};
