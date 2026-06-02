import * as YAML from 'yaml';

const yamlInfoSymbol = Symbol('yamlInfo');

type WithYamlInfo = {
  [yamlInfoSymbol]?: YamlInfo;
};

export type YamlInfo = {
  document: YAML.Document.Parsed;
  lineCounter: YAML.LineCounter;
};

export function getYamlInfo(obj: unknown): YamlInfo {
  const yamlInfo = (obj as WithYamlInfo)[yamlInfoSymbol] as YamlInfo | undefined;
  if (!yamlInfo) {
    throw new Error('No YAML info found on object');
  }
  return yamlInfo;
}

export function getLineInfo(obj: unknown, path: unknown[]): { line: number; col: number } {
  const yamlInfo = getYamlInfo(obj);
  const node = yamlInfo.document.getIn(path, true) ?? yamlInfo.document.getIn(
    path.map((v) => {
      const num = Number(v);
      return isNaN(num) ? v : num;
    }),
    true,
  );
  if (
    !node || typeof node !== 'object' || !('range' in node) || !Array.isArray(node.range) ||
    typeof node.range[0] !== 'number'
  ) {
    console.warn(`Unable to get line info for path ${path.join('/')}`);
    return { line: 0, col: 0 };
  }
  return yamlInfo.lineCounter.linePos(node.range[0]);
}

export function parseYamlWithInfo(yamlString: string): unknown {
  const lineCounter = new YAML.LineCounter();
  const document = YAML.parseDocument(yamlString, { lineCounter });
  return Object.assign(
    document.toJS(),
    { [yamlInfoSymbol]: { document, lineCounter } },
  );
}
