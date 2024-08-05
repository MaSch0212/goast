export type TypeScriptComponentOutput = {
  component: string;
  filePath?: string;
  imports: TypeScriptImport[];
  additionalExports?: string[];
};

export type TypeScriptExportOutput = {
  component: string;
  filePath: string;
};

export type TypeScriptImportKind = 'module' | 'file';
export type TypeScriptImportType = 'import' | 'type-import' | 'js-doc';

export type TypeScriptImport = {
  kind: TypeScriptImportKind;
  type: TypeScriptImportType;
  modulePath: string;
  name: string;
};
