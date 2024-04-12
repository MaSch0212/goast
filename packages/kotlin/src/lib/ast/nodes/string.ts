import { AstNodeOptions, Nullable, Prettify, SourceBuilder, spliceString } from '@goast/core';

import { ktArgument } from './argument';
import { KtNode } from '../node';
import { writeKtNodes } from '../utils/write-kt-node';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    value?: Nullable<string>;
    template?: Nullable<boolean>;
    multiline?: Nullable<boolean>;
    trimMargin?: Nullable<boolean>;
    marginPrefix?: Nullable<string>;
    autoAddMarginPrefix?: Nullable<boolean>;
  }
>;

export class KtString<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public value: string | null;
  public template: boolean;
  public multiline: boolean;
  public trimMargin: boolean;
  public marginPrefix: string | null;
  public autoAddMarginPrefix: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
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

    builder.append(this.multiline ? '"""' + (this.trimMargin ? '\n' : '') : '"');

    if (this.multiline && this.trimMargin) {
      builder.indent((b) => {
        if (this.autoAddMarginPrefix) {
          b.appendWithLinePrefix(this.marginPrefix ?? '|', value);
        } else {
          b.append(value);
        }

        b.append('\n""".trimMargin');
        ktArgument.write(b, [this.marginPrefix ? new KtString<TBuilder>({ value: this.marginPrefix }) : null]);
      });
    } else {
      builder.append(value, this.multiline ? '"""' : '"');
    }
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
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
) => new KtString<TBuilder>({ ...options, value });

export const ktString = Object.assign(createString, {
  write: writeKtNodes,
});
