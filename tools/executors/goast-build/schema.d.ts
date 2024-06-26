export interface ExecutorOptions {
  outputPath: string;
  entryFile?: string;
  additionalEntryPoints?: Record<string, string>;
  tsConfig?: string;
  assets?: string[];
}

export type EntryPoint = {
  entryFile: string;
  exportName: string;
};
