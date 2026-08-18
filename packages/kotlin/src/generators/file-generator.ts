import {
  type MaybePromise,
  type Nullable,
  type OpenApiGenerationProviderContext,
  type OpenApiGeneratorInput,
  toCasing,
} from '@goast/core';

import type { KotlinGeneratorConfig } from '../config.ts';
import { toKotlinPropertyName, toKotlinStringLiteral } from '../utils.ts';

export abstract class KotlinFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, KotlinGeneratorConfig>,
  TOutput,
> {
  public abstract generate(context: TContext): MaybePromise<TOutput>;

  protected toPropertyName(context: TContext, name: string): string {
    return toKotlinPropertyName(toCasing(name, context.config.propertyNameCasing));
  }

  /**
   * The Kotlin constant names for the values of an enum, index-aligned with `values`.
   *
   * `toCasing` cannot be relied on alone: `getWords` strips leading digits and every non-alphanumeric
   * character, so a purely numeric value (`1`, `1.1`), the empty string, or a value written only in
   * punctuation or non-ASCII letters all case to `''` — which renders as a nameless enum constant and an
   * empty `when` branch, neither of which is valid Kotlin. Such a value gets an identifier derived from its
   * raw text instead, always prefixed with `_`. That prefix cannot collide with anything `toCasing`
   * produces, because `getWords` strips leading non-alphanumerics.
   *
   * Names are then de-duplicated in declaration order (`_2`, `_2_2`, `_2_3`, ...), so two distinct raw
   * values — `2` and `'2'`, say — can never share one constant.
   */
  protected toEnumValueNames(context: TContext, values: Nullable<readonly unknown[]>): string[] {
    const names: string[] = [];
    const used = new Set<string>();

    for (const value of values ?? []) {
      const raw = String(value);
      let base = toCasing(raw, context.config.enumValueNameCasing);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(base) || /^_+$/.test(base)) {
        const sanitized = raw.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        base = sanitized.length > 0 ? `_${sanitized}` : raw.length === 0 ? '_EMPTY' : '_VALUE';
      }

      let name = base;
      for (let i = 2; used.has(name); i++) name = `${base}_${i}`;
      used.add(name);
      names.push(name);
    }

    return names;
  }

  /**
   * The Kotlin constant name `value` is given among the enum's `values`, so that a reference to an enum
   * constant always agrees with the constant `toEnumValueNames` declared for it. Values are matched by
   * their string form, because that is what the generated enum stores. Falls back to the name `value`
   * would get on its own if it is not among `values`.
   */
  protected toEnumValueName(context: TContext, values: Nullable<readonly unknown[]>, value: unknown): string {
    const all = values ?? [];
    const index = all.findIndex((x) => String(x) === String(value));
    return index < 0 ? this.toEnumValueNames(context, [value])[0] : this.toEnumValueNames(context, all)[index];
  }

  protected toStringLiteral(_context: TContext, text: Nullable<string>): string {
    return toKotlinStringLiteral(text);
  }
}
