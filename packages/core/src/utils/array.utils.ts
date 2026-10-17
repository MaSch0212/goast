/**
 * Removes all items that match a predicate from an array. The array is modified in place.
 * @template T The type of the items.
 * @param array The array to remove items from.
 * @param predicate The function that returns `true` for items to remove. It is called once per item, from the last item
 * to the first.
 */
export function removeItems<T>(array: T[], predicate: (item: T) => boolean): void {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      array.splice(i, 1);
    }
  }
}
