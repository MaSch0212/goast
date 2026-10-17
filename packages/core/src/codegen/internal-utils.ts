/**
 * Stores the spec location of a generated result in its `__source__` property when running in test mode.
 * The location is only recorded if `config.__test__` is set and the result does not have a `__source__` yet, so tests
 * can trace a generated item back to the schema, endpoint or service it was created from.
 * @param config The generator configuration. Only the `__test__` flag is read.
 * @param result The generation result to annotate. It is mutated in place.
 * @param sourceFn Returns the location to store, usually formatted as `file#path`.
 */
export function addSourceIfTest(config: any, result: any, sourceFn: () => any) {
  if (config.__test__ && !result.__source__) {
    result.__source__ = sourceFn();
  }
}
