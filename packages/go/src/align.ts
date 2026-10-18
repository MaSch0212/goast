/**
 * Aligns cells into columns the way `gofmt` does.
 *
 * `gofmt` prints a struct's fields and a `const` block's specs through `text/tabwriter`, with every cell but the last
 * of a line terminated by a tab. This is a port of the part of its algorithm that `gofmt` relies on (`padding` 1,
 * `minwidth` 0, padding with spaces, `DiscardEmptyColumns`):
 *
 * - A column is aligned within a *column block*: a run of consecutive lines that all have a terminated cell in that
 *   column. A line whose last cell is in that column (or before it) ends the block, which is why a field without a
 *   tag breaks the alignment of the tags around it.
 * - A comment line or a blank line is a line with a single, unterminated cell, so it ends every block.
 * - A column's width is that of its widest cell plus one space, or zero if all of its cells are empty.
 *
 * @param lines The lines, each a list of cells. The last cell of a line is written as it is.
 * @returns The aligned lines, without trailing whitespace.
 */
export function alignCells(lines: readonly (readonly string[])[]): string[] {
  const output: string[] = Array.from({ length: lines.length }, () => '');
  const widths: number[] = [];

  format(0, lines.length);
  return output;

  // A port of `(*tabwriter.Writer).format`.
  function format(line0: number, line1: number): void {
    const column = widths.length;
    for (let current = line0; current < line1; current++) {
      if (column >= lines[current].length - 1) continue;

      // The lines before this one have no cell in this column, so they are complete.
      writeLines(line0, current);
      line0 = current;

      let width = 0;
      let discardable = true;
      for (; current < line1; current++) {
        const line = lines[current];
        if (column >= line.length - 1) break;
        const cellWidth = textWidth(line[column]);
        width = Math.max(width, cellWidth + 1);
        if (cellWidth > 0) discardable = false;
      }

      widths.push(discardable ? 0 : width);
      format(line0, current);
      widths.pop();
      line0 = current;
    }
    writeLines(line0, line1);
  }

  function writeLines(line0: number, line1: number): void {
    for (let i = line0; i < line1; i++) {
      const line = lines[i];
      output[i] = line
        .map((cell, j) => (j < line.length - 1 ? cell + ' '.repeat(Math.max(0, widths[j] - textWidth(cell))) : cell))
        .join('')
        .trimEnd();
    }
  }
}

/** The width of a cell in characters (`tabwriter` counts runes, not bytes or UTF-16 code units). */
function textWidth(text: string): number {
  return [...text].length;
}
