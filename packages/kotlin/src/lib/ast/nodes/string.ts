import { AstNodeOptions, Nullable, SourceBuilder, spliceString } from '@goast/core';

import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktStringNodeKind = 'string' as const;

export type KtString<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktStringNodeKind, TBuilder> & {
  value: string | null;
  template: boolean;
  multiline: boolean;
  trimMargin: boolean;
  marginPrefix: string | null;
  autoAddMarginPrefix: boolean;
};

export function ktString<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: Nullable<string>,
  options?: AstNodeOptions<KtString<TBuilder>, 'value'>
): KtString<TBuilder> {
  return {
    ...ktNode(ktStringNodeKind, options),
    value: value ?? null,
    template: options?.template ?? false,
    multiline: options?.multiline ?? false,
    trimMargin: options?.trimMargin ?? true,
    marginPrefix: options?.marginPrefix ?? null,
    autoAddMarginPrefix: options?.autoAddMarginPrefix ?? true,
  };
}

export function isKtString<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: unknown
): value is KtString<TBuilder> {
  return isKtNode(value, ktStringNodeKind);
}

export function writeKtString<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtString<TBuilder>
): TBuilder {
  if (node.value === null) {
    return builder.append('null');
  }

  let value = JSON.stringify(node.value).slice(1, -1);
  if (node.multiline) {
    value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  }
  if (!node.template) {
    value = value.replace(/\$/g, '\\$');
  } else {
    const originalParts = findTemplateParts(node.value);
    const escapedParts = findTemplateParts(value);
    if (originalParts.length !== escapedParts.length) {
      throw new Error('Template parts count mismatch');
    }
    for (let i = originalParts.length - 1; i >= 0; i--) {
      const original = originalParts[i];
      const escaped = escapedParts[i];
      value = spliceString(value, escaped.index, escaped.value.length, original.value);
    }
  }
  return writeKtNode(builder, node, (b) =>
    b
      .if(node.multiline, (b) => b.append('"""').appendLineIf(node.trimMargin), '"')
      .indentIf(node.multiline && node.trimMargin, (b) =>
        b
          .if(
            node.multiline && node.trimMargin && node.autoAddMarginPrefix,
            (b) => b.appendWithLinePrefix(node.marginPrefix ?? '|', value),
            value
          )
          .if(
            node.multiline,
            (b) =>
              b
                .appendLineIf(node.trimMargin)
                .append('"""')
                .appendIf(
                  node.trimMargin,
                  '.trimMargin(',
                  node.marginPrefix ? (b) => writeKt(b, ktString(node.marginPrefix)) : null,
                  ')'
                ),
            '"'
          )
      )
  );
}

function findTemplateParts(value: string) {
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
