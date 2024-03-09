import { tsAny } from './any';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
  builder.options.preferUnknown = true;
});

it('should write "any" if unknown is not preferred', () => {
  builder.options.preferUnknown = false;
  builder.append(tsAny());
  expect(builder.toString(false)).toBe('any');
});

it('should write "unknown" if unknown is preferred', () => {
  builder.append(tsAny());
  expect(builder.toString(false)).toBe('unknown');
});

it('should render injections', () => {
  builder.append(tsAny({ inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`beforeunknownafter`);
});
