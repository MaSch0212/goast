import ts from 'typescript';

export type TypeScriptFileGeneratorConfig = {
  indentSize: number;
  useTabsForIndent: boolean;
};

const defaultConfig: TypeScriptFileGeneratorConfig = {
  indentSize: 2,
  useTabsForIndent: false,
};

export class TypeScriptFileGenerator {
  private config: TypeScriptFileGeneratorConfig;

  constructor(config?: Partial<TypeScriptFileGeneratorConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  public generate(): string {
    return '';
  }
}
