import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { escapeCSharpString } from '../../utils.ts';
import { CsNode } from '../node.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsValue } from './types.ts';

type Injects = never;

export type CsStringKind = 'regular' | 'verbatim' | 'interpolated' | 'raw';

/** An embedded expression of an interpolated string: `{value}`, `{value:format}` or `{value,alignment}`. */
export type CsStringPart<TBuilder extends SourceBuilder> = {
  value: CsValue<TBuilder>;
  format?: Nullable<string>;
  alignment?: Nullable<number>;
};

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /**
     * - `regular`: `"escaped"`
     * - `verbatim`: `@"no escapes except ""quotes"""` (newlines are kept as they are)
     * - `interpolated`: `$"text {value}"`
     * - `raw`: `"""` raw string literal, written on multiple lines
     */
    kind?: Nullable<CsStringKind>;
    /** The text of the string. Ignored for `interpolated` strings. */
    value?: Nullable<string>;
    /** The text and embedded expressions of an `interpolated` string. Plain strings are literal text. */
    parts?: Nullable<(string | CsStringPart<TBuilder>)[]>;
  }
>;

export class CsString<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public kind: CsStringKind;
  public value: string | null;
  public parts: (string | CsStringPart<TBuilder>)[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.kind = options?.kind ?? (options?.parts ? 'interpolated' : 'regular');
    this.value = options?.value ?? null;
    this.parts = options?.parts ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.kind === 'interpolated') {
      this.writeInterpolated(builder);
      return;
    }

    if (this.value === null) {
      builder.append('null');
      return;
    }

    switch (this.kind) {
      case 'verbatim':
        builder.append('@"', this.value.replace(/"/g, '""'), '"');
        break;
      case 'raw':
        this.writeRaw(builder, this.value);
        break;
      default:
        builder.append('"', escapeCSharpString(this.value), '"');
        break;
    }
  }

  private writeInterpolated(builder: TBuilder): void {
    builder.append('$"');
    for (const part of this.parts) {
      if (typeof part === 'string') {
        builder.append(escapeCSharpString(part).replace(/[{}]/g, (c) => c + c));
      } else {
        builder.append('{');
        writeCsNode(builder, part.value);
        if (part.alignment !== null && part.alignment !== undefined) builder.append(',', part.alignment);
        if (part.format) builder.append(':', part.format);
        builder.append('}');
      }
    }
    builder.append('"');
  }

  private writeRaw(builder: TBuilder, value: string): void {
    // The delimiter must be longer than any run of quotes in the text.
    const longestQuoteRun = Math.max(0, ...(value.match(/"+/g) ?? []).map((x) => x.length));
    const delimiter = '"'.repeat(Math.max(3, longestQuoteRun + 1));
    builder.appendLine(delimiter);
    builder.appendLine(value);
    builder.append(delimiter);
  }
}

const createString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value' | 'parts'>>,
): CsString<TBuilder> => new CsString<TBuilder>({ ...options, value });

const createVerbatimString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value' | 'parts' | 'kind'>>,
): CsString<TBuilder> => new CsString<TBuilder>({ ...options, value, kind: 'verbatim' });

const createRawString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value' | 'parts' | 'kind'>>,
): CsString<TBuilder> => new CsString<TBuilder>({ ...options, value, kind: 'raw' });

const createInterpolatedString = <TBuilder extends SourceBuilder>(
  parts: (string | CsStringPart<TBuilder>)[],
  options?: Prettify<Omit<Options<TBuilder>, 'value' | 'parts' | 'kind'>>,
): CsString<TBuilder> => new CsString<TBuilder>({ ...options, parts, kind: 'interpolated' });

export const csString: typeof createString & {
  verbatim: typeof createVerbatimString;
  raw: typeof createRawString;
  interpolated: typeof createInterpolatedString;
  write: typeof writeCsNodes;
} = Object.assign(createString, {
  verbatim: createVerbatimString,
  raw: createRawString,
  interpolated: createInterpolatedString,
  write: writeCsNodes,
});
