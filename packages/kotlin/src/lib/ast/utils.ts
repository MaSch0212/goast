import {
  SourceBuilder,
  defaultOpenApiGeneratorConfig,
  AppendValue,
  notNullish,
  isAppendValue,
  isAppendValueGroup,
  Nullable,
} from '@goast/core';

import { KtNode } from './node';
import { KtProperty } from './nodes';
import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../config';
import { KotlinFileBuilder } from '../file-builder';

const ktConfigSymbol = Symbol();
type _BuilderWithConfig = SourceBuilder & { [ktConfigSymbol]?: KotlinGeneratorConfig };

export function getKotlinBuilderOptions(builder: SourceBuilder) {
  if (builder instanceof KotlinFileBuilder) {
    return builder.options;
  }
  if (ktConfigSymbol in builder.options) {
    return builder.options[ktConfigSymbol] as KotlinGeneratorConfig;
  }
  const options = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinGeneratorConfig, ...builder.options };
  (builder as _BuilderWithConfig)[ktConfigSymbol] = options;
  return options;
}

export function writeKt<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<AppendValue<TBuilder> | KtNode<TBuilder>>,
): void {
  if (node instanceof KtNode) {
    node.write(builder);
  } else {
    builder.append(node);
  }
}

export function writeKtMembers<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  members: Nullable<AppendValue<TBuilder> | KtNode<TBuilder>>[],
  options?: { alreadyHasMembers?: boolean },
): void {
  const filteredMembers = members.filter(notNullish);
  builder.forEach(filteredMembers, (b, m, i) =>
    b.if(
      () =>
        !(m instanceof KtProperty && !m.doc && m.annotations.length === 0) &&
        !isAppendValue(m) &&
        !isAppendValueGroup(m),
      (b) =>
        b
          .if(i > 0 || !!options?.alreadyHasMembers, (b) => b.ensurePreviousLineEmpty())
          .append((b) => writeKt(b, m))
          .if(i < filteredMembers.length - 1, (b) => b.ensurePreviousLineEmpty()),
      (b) => b.append((b) => writeKt(b, m)).ensureCurrentLineEmpty(),
    ),
  );
}
