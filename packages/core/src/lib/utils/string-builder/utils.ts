import { StringBuilder } from './string-builder';
import { concatSingleOrMultiple } from '../common.utils';

export type AppendValue<TBuilder extends StringBuilder = StringBuilder> = Parameters<TBuilder['append']>[number];
export type AppendValueGroup<TBuilder extends StringBuilder = StringBuilder> = Extract<
  AppendValue<TBuilder>,
  { __type: 'append-value-group' }
>;

/** @deprecated Use AppendValue<TBuilder> instead */
export type TextOrBuilderFn<TBuilder> = string | ((builder: TBuilder) => void);

export function appendValueGroup<TBuilder extends StringBuilder = StringBuilder>(
  values: AppendValue<TBuilder>[],
  separator: string
): AppendValueGroup<StringBuilder> {
  return {
    __type: 'append-value-group',
    values,
    separator,
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
