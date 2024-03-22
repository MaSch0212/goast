import { AdditionalAppendsSymbol, AppendParam, StringBuilder } from './string-builder';
import { concatSingleOrMultiple } from '../common.utils';
import { Nullable } from '../type.utils';

export type AppendValue<TBuilder extends StringBuilder = StringBuilder> = AppendParam<
  TBuilder,
  Parameters<TBuilder[typeof AdditionalAppendsSymbol]>[0]
>;
export type AppendValueGroup<TBuilder extends StringBuilder = StringBuilder> = {
  __type: 'append-value-group';
  values: AppendValue<TBuilder>[];
  separator: string | null;
};

/** @deprecated Use AppendValue<TBuilder> instead */
export type TextOrBuilderFn<TBuilder> = string | ((builder: TBuilder) => void);

export function appendValueGroup<TBuilder extends StringBuilder = StringBuilder>(
  values: AppendValue<TBuilder>[],
  separator?: Nullable<string>
): AppendValueGroup<TBuilder> {
  return {
    __type: 'append-value-group',
    values,
    separator: separator ?? null,
  };
}

export function isAppendValue<TBuilder extends StringBuilder = StringBuilder>(
  value: unknown
): value is AppendValue<TBuilder> {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined ||
    typeof value === 'function' ||
    isAppendValueGroup(value)
  );
}

export function isAppendValueGroup<TBuilder extends StringBuilder = StringBuilder>(
  value: unknown
): value is AppendValueGroup<TBuilder> {
  return typeof value === 'object' && value !== null && '__type' in value && value.__type === 'append-value-group';
}

export function concatAppendValues<TBuilder extends StringBuilder = StringBuilder>(
  ...values: AppendValue<TBuilder>[]
): AppendValue<TBuilder> {
  return concatSingleOrMultiple(...values) as AppendValue<TBuilder>;
}
