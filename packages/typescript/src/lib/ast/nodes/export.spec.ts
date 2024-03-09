import { tsExport } from './export';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should add the export to the builder', () => {
  builder.append(tsExport('myFunction', './my-function'));
  expect(builder.imports['_exports']).toEqual(new Map([['./my-function', new Set(['myFunction'])]]));
});
