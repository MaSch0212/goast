/**
 * Returns the specified value if it has been initialized. Throws an error if the value is `undefined`, which is used as
 * the marker for a generator field that has not been set yet. Other values, including `null`, are returned as-is.
 * @template T The type of the value.
 * @param value The value to check.
 * @returns The initialized value.
 */
export function getInitializedValue<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('Generator not initialized.');
  }
  return value;
}
