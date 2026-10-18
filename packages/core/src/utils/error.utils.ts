/**
 * Throws an `Error` with the specified message. Useful in expressions that must produce a value, such as the right-hand
 * side of `??`.
 * @param message The message of the error to throw.
 * @returns This function never returns, because it always throws.
 */
export function throwExp(message: string): never {
  throw new Error(message);
}
