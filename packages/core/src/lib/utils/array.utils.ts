export function removeItems<T>(array: T[], predicate: (item: T) => boolean): void {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      array.splice(i, 1);
    }
  }
}
