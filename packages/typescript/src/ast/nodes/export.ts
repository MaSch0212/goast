import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import type { TypeScriptExportType } from '../../common-results.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    filePath: string;
    kind?: Nullable<TypeScriptExportType>;
  }
>;

/**
 * Represents a re-export of a symbol from another module, such as `export { X } from './x';`.
 *
 * In a `TypeScriptFileBuilder` the export is not written in place. The file collects it and writes it together with its
 * other exports, grouped by module path. Any other builder receives the export statement as text, followed by a line
 * break.
 *
 * @template TBuilder The type of the source builder the export is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsExport
 */
export class TsExport<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the exported symbol, written inside the braces, such as `X` in `export { X } from './x';`.
   */
  public name: string;
  /**
   * The module path that the symbol is re-exported from, such as `./x`. The file builder groups exports by this path.
   */
  public filePath: string;
  /**
   * Whether the symbol is re-exported as a value with `export`, or as a type with `export type`.
   * @default 'export'
   */
  public kind: TypeScriptExportType;

  /**
   * Initializes a new instance of the TsExport class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.filePath = options.filePath;
    this.kind = options.kind ?? 'export';
  }

  protected override onWrite(builder: TBuilder): void {
    if (builder instanceof TypeScriptFileBuilder) {
      builder.addExport(this.name, this.filePath, { type: this.kind });
    } else {
      builder.appendLine(
        this.kind === 'type-export' ? 'export type' : 'export',
        ` { ${this.name} } from '${this.filePath}';`,
      );
    }
  }
}

/**
 * Creates a re-export node. The `tsExport` factory creates the same node and also provides a `write` function.
 *
 * @param name The name of the exported symbol.
 * @param filePath The module path to re-export from.
 * @param options The settings of the export. See `TsExport` for the available properties.
 * @example
 * ```ts
 * createExport('myFunction', './my-function');
 * // Emits (outside a TypeScriptFileBuilder):
 * // export { myFunction } from './my-function';
 * ```
 */
export const createExport = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  filePath: Options<TBuilder>['filePath'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'filePath'>>,
): TsExport<TBuilder> => new TsExport<TBuilder>({ ...options, name, filePath });

/**
 * Factory for creating re-export nodes. The `write` function writes one or more re-exports to a builder.
 *
 * @param name The name of the exported symbol.
 * @param filePath The module path to re-export from.
 * @param options The settings of the export. See `TsExport` for the available properties.
 * @example
 * ```ts
 * tsExport('myFunction', './my-function');
 * // Emits (outside a TypeScriptFileBuilder):
 * // export { myFunction } from './my-function';
 * ```
 */
export const tsExport: typeof createExport & { write: typeof writeTsNodes } = Object.assign(createExport, {
  write: writeTsNodes,
});
