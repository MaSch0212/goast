export function getInitializedValue<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('Generator not initialized.');
  }
  return value;
}
