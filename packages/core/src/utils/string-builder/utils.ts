import { concatSingleOrMultiple, notNullish } from '../common.utils.ts';
import type { Nullable } from '../type.utils.ts';
import type { AdditionalAppendsSymbol, AppendParam, BuilderFn, Primitive, StringBuilder } from './string-builder.ts';

/**
 * A value that can be appended to a `StringBuilder` without any additional append types: a primitive, a build function
 * or an append value group.
 * @template TBuilder The builder type that build functions receive.
 */
export type BasicAppendValue<TBuilder extends StringBuilder = StringBuilder> =
  | Primitive
  | BuilderFn<TBuilder>
  | BasicAppendValueGroup<TBuilder>;

/**
 * A group of basic append values that are appended one after another, optionally with a separator in between.
 * @template TBuilder The builder type that build functions receive.
 */
export type BasicAppendValueGroup<TBuilder extends StringBuilder = StringBuilder> = {
  /**
   * The type marker that identifies the object as an append value group.
   */
  __type: 'append-value-group';
  /**
   * The values to append in order.
   */
  values: BasicAppendValue<TBuilder>[];
  /**
   * The string to append between two values, or `null` for no separator.
   */
  separator: string | null;
};

/**
 * A value that can be appended to a `StringBuilder`, including the additional append types of the builder.
 * @template TBuilder The builder type that determines the additional append types.
 */
export type AppendValue<TBuilder extends StringBuilder = StringBuilder> = NonNullable<
  AppendParam<TBuilder, Parameters<TBuilder[typeof AdditionalAppendsSymbol]>[0]>
>;

/**
 * A group of append values that are appended one after another, optionally with a separator in between.
 * @template TBuilder The builder type that determines the additional append types.
 */
export type AppendValueGroup<TBuilder extends StringBuilder = StringBuilder> = {
  /**
   * The type marker that identifies the object as an append value group.
   */
  __type: 'append-value-group';
  /**
   * The values to append in order.
   */
  values: AppendValue<TBuilder>[];
  /**
   * The string to append between two values, or `null` for no separator.
   */
  separator: string | null;
};

/** @deprecated Use AppendValue<TBuilder> instead */
export type TextOrBuilderFn<TBuilder> = string | ((builder: TBuilder) => void);

/**
 * Creates a group of basic append values. Nullish values are removed from the group.
 * @template TBuilder The builder type that build functions receive.
 * @param values The values to group. `null` and `undefined` yield an empty group.
 * @param separator The string to append between two values. Defaults to no separator.
 * @returns The append value group.
 */
export function basicAppendValueGroup<TBuilder extends StringBuilder = StringBuilder>(
  values: Nullable<Nullable<BasicAppendValue<TBuilder>>[]>,
  separator?: Nullable<string>,
): BasicAppendValueGroup<TBuilder> {
  return {
    __type: 'append-value-group',
    values: values?.filter(notNullish) ?? [],
    separator: separator ?? null,
  };
}

/**
 * Creates a group of append values. Nullish values are removed from the group.
 * @template TBuilder The builder type that determines the additional append types.
 * @param values The values to group. `null` and `undefined` yield an empty group.
 * @param separator The string to append between two values. Defaults to no separator.
 * @returns The append value group.
 */
export function appendValueGroup<TBuilder extends StringBuilder = StringBuilder>(
  values: Nullable<Nullable<AppendValue<TBuilder>>[]>,
  separator?: Nullable<string>,
): AppendValueGroup<TBuilder> {
  return {
    __type: 'append-value-group',
    values: values?.filter(notNullish) ?? [],
    separator: separator ?? null,
  };
}

/**
 * Checks whether a value is a basic append value: a string, number, boolean, function or append value group.
 * Nullish values, arrays and other objects are not append values.
 * @param value The value to check.
 * @returns `true` if the value is an append value; otherwise, `false`.
 */
export function isAppendValue(value: unknown): value is AppendValue<never> {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'function' ||
    isAppendValueGroup(value)
  );
}

/**
 * Checks whether a value is an append value group, that is an object with the `append-value-group` type marker.
 * @template TBuilder The builder type of the group.
 * @param value The value to check.
 * @returns `true` if the value is an append value group; otherwise, `false`.
 */
export function isAppendValueGroup<TBuilder extends StringBuilder = StringBuilder>(
  value: unknown,
): value is AppendValueGroup<TBuilder> {
  return typeof value === 'object' && value !== null && '__type' in value && value.__type === 'append-value-group';
}

/**
 * Combines multiple append values into one. A single value is returned as is. Otherwise, the values are returned as an
 * array in which array arguments are flattened by one level. Without any values, an empty array is returned.
 * @template TBuilder The builder type that determines the additional append types.
 * @param values The append values to combine.
 * @returns The combined append value.
 */
export function concatAppendValues<TBuilder extends StringBuilder = StringBuilder>(
  ...values: AppendValue<TBuilder>[]
): AppendValue<TBuilder> {
  return concatSingleOrMultiple(...values) as AppendValue<TBuilder>;
}
