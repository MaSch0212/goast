export type TypeScriptComponentOutput = {
  name: string;
  filePath: string;
  additionalImports: TypeScriptImport[];
};

export type TypeScriptImport = {
  modulePath: string;
  typeName: string;
};
