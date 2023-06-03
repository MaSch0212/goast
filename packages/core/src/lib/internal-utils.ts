export function isOpenApiObjectProperty<T extends string>(
  propertyName: T
): propertyName is Exclude<T, `$${string}` | `x-${string}`> {
  return !propertyName.startsWith('$') && !propertyName.startsWith('x-');
}
