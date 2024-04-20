import { concatSingleOrMultiple, notNullish } from '../common.utils';
import { Nullable } from '../type.utils';

import type { AdditionalAppendsSymbol, AppendParam, BuilderFn, Primitive, StringBuilder } from './string-builder';

export type BasicAppendValue<TBuilder extends StringBuilder = StringBuilder> =
  | Primitive
  | BuilderFn<TBuilder>
  | BasicAppendValueGroup<TBuilder>;
export type BasicAppendValueGroup<TBuilder extends StringBuilder = StringBuilder> = {
  __type: 'append-value-group';
  values: BasicAppendValue<TBuilder>[];
  separator: string | null;
};

export type AppendValue<TBuilder extends StringBuilder = StringBuilder> = NonNullable<
  AppendParam<TBuilder, Parameters<TBuilder[typeof AdditionalAppendsSymbol]>[0]>
>;
export type AppendValueGroup<TBuilder extends StringBuilder = StringBuilder> = {
  __type: 'append-value-group';
  values: AppendValue<TBuilder>[];
  separator: string | null;
};

/** @deprecated Use AppendValue<TBuilder> instead */
export type TextOrBuilderFn<TBuilder> = string | ((builder: TBuilder) => void);

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

export function isAppendValue(value: unknown): value is AppendValue<never> {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'function' ||
    isAppendValueGroup(value)
  );
}

export function isAppendValueGroup<TBuilder extends StringBuilder = StringBuilder>(
  value: unknown,
): value is AppendValueGroup<TBuilder> {
  return typeof value === 'object' && value !== null && '__type' in value && value.__type === 'append-value-group';
}

export function concatAppendValues<TBuilder extends StringBuilder = StringBuilder>(
  ...values: AppendValue<TBuilder>[]
): AppendValue<TBuilder> {
  return concatSingleOrMultiple(...values) as AppendValue<TBuilder>;
}
