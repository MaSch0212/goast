export type CodeGeneratorConfig = Readonly<{
  outputDir: string;
  clearOutputDir: boolean;
}>;

export const defaultCodeGeneratorConfig: CodeGeneratorConfig = {
  outputDir: 'generated',
  clearOutputDir: true,
};
