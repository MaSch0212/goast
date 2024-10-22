// deno-lint-ignore no-explicit-any
export function addSourceIfTest(config: any, result: any, sourceFn: () => any) {
  if (config.__test__ && !result.__source__) {
    result.__source__ = sourceFn();
  }
}
