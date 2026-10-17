import { type CSharpGeneratorConfig, defaultCSharpGeneratorConfig } from '../../config.ts';
import { CSharpFileBuilder } from '../../file-builder.ts';

/**
 * Creates a builder for node tests. A fixed newLine keeps the expectations host-independent.
 */
export function createBuilder(namespace?: string): CSharpFileBuilder {
  return new CSharpFileBuilder(namespace, { ...defaultCSharpGeneratorConfig, newLine: '\n' } as CSharpGeneratorConfig);
}

/** Joins the lines with `\n` and terminates the last line. */
export function lines(...value: string[]): string {
  return value.join('\n') + '\n';
}
