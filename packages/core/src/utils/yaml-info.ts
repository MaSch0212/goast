import * as YAML from 'yaml';

/**
 * Symbol under which `parseYamlWithInfo` stores the `YamlInfo` of the parsed value.
 * @see parseYamlWithInfo
 */
export const yamlInfoSymbol = Symbol('yamlInfo');

type WithYamlInfo = {
  [yamlInfoSymbol]?: YamlInfo;
};

/**
 * The parsed YAML document and line counter that `parseYamlWithInfo` attaches to a parsed value.
 * @see parseYamlWithInfo
 */
export type YamlInfo = {
  /**
   * The parsed YAML document, used to look up nodes by their path.
   */
  document: YAML.Document.Parsed;
  /**
   * The line counter, used to convert the character offset of a node into a line and column.
   */
  lineCounter: YAML.LineCounter;
};

/**
 * Gets the YAML information that `parseYamlWithInfo` attached to the specified object. Throws an error if the object
 * has no such information.
 * @param obj The object to get the YAML information from.
 * @returns The YAML information of the object.
 */
export function getYamlInfo(obj: unknown): YamlInfo {
  const yamlInfo = (obj as WithYamlInfo)[yamlInfoSymbol] as YamlInfo | undefined;
  if (!yamlInfo) {
    throw new Error('No YAML info found on object');
  }
  return yamlInfo;
}

/**
 * Gets the line and column of the node at the specified path within the YAML document that the object was parsed from.
 * Logs a warning and returns `{ line: 0, col: 0 }` if the node cannot be found or has no source range. Throws if the
 * object has no YAML information.
 * @param obj The object that was returned by `parseYamlWithInfo`.
 * @param path The path of the node, as keys and array indices. Numeric strings are also matched against array indices.
 * @returns The line and column of the node.
 */
export function getLineInfo(obj: unknown, path: unknown[]): { line: number; col: number } {
  const yamlInfo = getYamlInfo(obj);
  const node =
    yamlInfo.document.getIn(path, true) ??
    yamlInfo.document.getIn(
      path.map((v) => {
        const num = Number(v);
        return isNaN(num) ? v : num;
      }),
      true,
    );
  if (
    !node ||
    typeof node !== 'object' ||
    !('range' in node) ||
    !Array.isArray(node.range) ||
    typeof node.range[0] !== 'number'
  ) {
    console.warn(`Unable to get line info for path ${path.join('/')}`);
    return { line: 0, col: 0 };
  }
  return yamlInfo.lineCounter.linePos(node.range[0]);
}

/**
 * Parses a YAML or JSON string into a value and attaches its YAML information under `yamlInfoSymbol`. The attached
 * property is non-enumerable, so it does not appear in keys or serialized output. Throws if the document is a scalar
 * value such as a string or `null`, because only objects can carry the information.
 * @param yamlString The YAML or JSON string to parse.
 * @returns The parsed value, with the YAML information attached.
 */
export function parseYamlWithInfo(yamlString: string): unknown {
  const lineCounter = new YAML.LineCounter();
  const document = YAML.parseDocument(yamlString, { lineCounter });
  return Object.defineProperty(document.toJS(), yamlInfoSymbol, {
    value: { document, lineCounter },
    enumerable: false,
  });
}
