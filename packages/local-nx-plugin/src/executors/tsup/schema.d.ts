export interface TsupExecutorSchema {
  entryFile?: string;
  additionalEntryPoints?: {
    entryFile: string;
    exportName: string;
  }[];
  tsConfig?: string;
}
