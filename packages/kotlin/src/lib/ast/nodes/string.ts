import {
  AppendValue,
  AstNodeOptions,
  Prettify,
  Separator,
  SingleOrMultiple,
  SourceBuilder,
  spliceString,
  toArray,
} from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtStringOptions<TBuilder extends SourceBuilder> = AstNodeOptions<KtString<TBuilder>, typeof KtNode<TBuilder>>;

export class KtString<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public value: string | null;
  public template: boolean;
  public multiline: boolean;
  public trimMargin: boolean;
  public marginPrefix: string | null;
  public autoAddMarginPrefix: boolean;

  constructor(options: KtStringOptions<TBuilder>) {
    super(options);
    this.value = options?.value ?? null;
    this.template = options?.template ?? false;
    this.multiline = options?.multiline ?? false;
    this.trimMargin = options?.trimMargin ?? true;
    this.marginPrefix = options?.marginPrefix ?? null;
    this.autoAddMarginPrefix = options?.autoAddMarginPrefix ?? true;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.value === null) {
      builder.append('null');
      return;
    }

    let value = JSON.stringify(this.value).slice(1, -1);
    if (this.multiline) {
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }

    if (!this.template) {
      value = value.replace(/\$/g, '\\$');
    } else {
      const originalParts = this.findTemplateParts(this.value);
      const escapedParts = this.findTemplateParts(value);
      if (originalParts.length !== escapedParts.length) {
        throw new Error('Template parts count mismatch');
      }
      for (let i = originalParts.length - 1; i >= 0; i--) {
        const original = originalParts[i];
        const escaped = escapedParts[i];
        value = spliceString(value, escaped.index, escaped.value.length, original.value);
      }
    }

    builder
      .if(this.multiline, (b) => b.append('"""').appendLineIf(this.trimMargin), '"')
      .indentIf(this.multiline && this.trimMargin, (b) =>
        b
          .if(
            this.multiline && this.trimMargin && this.autoAddMarginPrefix,
            (b) => b.appendWithLinePrefix(this.marginPrefix ?? '|', value),
            value
          )
          .if(
            this.multiline,
            (b) =>
              b
                .appendLineIf(this.trimMargin)
                .append('"""')
                .appendIf(
                  this.trimMargin,
                  '.trimMargin(',
                  this.marginPrefix ? (b) => new KtString<TBuilder>({ value: this.marginPrefix }).write(b) : null,
                  ')'
                ),
            '"'
          )
      );
  }

  protected findTemplateParts(value: string) {
    const parts: { value: string; index: number }[] = [];
    let start: number | undefined = undefined;
    let bracketCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '$' && value[i + 1] === '{') {
        start = i;
      } else if (value[i] === '{') {
        bracketCount++;
      } else if (value[i] === '}') {
        bracketCount--;
        if (bracketCount === 0 && start !== undefined) {
          parts.push({ value: value.slice(start, i + 1), index: start });
          start = undefined;
        }
      }
    }
    return parts;
  }
}

const createString = <TBuilder extends SourceBuilder>(
  value: KtString<TBuilder>['value'],
  options?: Prettify<Omit<KtStringOptions<TBuilder>, 'value'>>
) => new KtString<TBuilder>({ ...options, value });

const writeStrings = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtString<TBuilder> | AppendValue<TBuilder>>,
  options?: { separator: Separator<TBuilder, KtString<TBuilder> | AppendValue<TBuilder>> }
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: options?.separator });
};

export const ktString = Object.assign(createString, {
  write: writeStrings,
});
