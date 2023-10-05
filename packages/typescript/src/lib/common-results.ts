export type TypeScriptComponentOutput = {
  component: string;
  filePath?: string;
  imports: TypeScriptImport[];
};

export type TypeScriptImportKind = 'module' | 'file';

export type TypeScriptImport = {
  kind: TypeScriptImportKind;
  modulePath: string;
  name: string;
};
