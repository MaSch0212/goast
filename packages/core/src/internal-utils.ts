/**
 * Checks whether a property name of an OpenAPI object is a regular property. Names starting with `$` (such as `$ref`)
 * and specification extensions starting with `x-` are not regular properties and should be skipped.
 * @template T The type of the property name.
 * @param propertyName The property name to check.
 * @returns `true` if the name is a regular property name; otherwise, `false`.
 */
export function isOpenApiObjectProperty<T extends string>(
  propertyName: T,
): propertyName is Exclude<T, `$${string}` | `x-${string}`> {
  return !propertyName.startsWith('$') && !propertyName.startsWith('x-');
}
