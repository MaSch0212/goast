import { EOL } from 'os';

import { tsConstructor } from './constructor';
import { tsConstructorParameter } from './constructor-parameter';
import { tsDecorator } from './decorator';
import { tsDoc } from './doc';
import { tsDocTag } from './doc-tag';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write empty constructor', () => {
  builder.append(tsConstructor());
  expect(builder.toString(false)).toBe(`constructor() {}${EOL}`);
});

it('should write documentation if it exists', () => {
  builder.append(tsConstructor({ doc: tsDoc({ description: 'description' }) }));
  expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}constructor() {}${EOL}`);
});

it('should write decorators if they exist', () => {
  builder.append(tsConstructor({ decorators: [tsDecorator('decorator')] }));
  expect(builder.toString(false)).toBe(`@decorator${EOL}constructor() {}${EOL}`);
});

it('should write the parameters', () => {
  builder.append(
    tsConstructor({
      parameters: [tsConstructorParameter('x'), tsConstructorParameter('y')],
    }),
  );
  expect(builder.toString(false)).toBe(`constructor(x, y) {}${EOL}`);
});

it('should write the description of the parameters when no documentation is provided', () => {
  builder.append(
    tsConstructor({
      parameters: [tsConstructorParameter('x', { description: 'description' }), tsConstructorParameter('y')],
    }),
  );
  expect(builder.toString(false)).toBe(`/**${EOL} * @param x description${EOL} */${EOL}constructor(x, y) {}${EOL}`);
});

it('should write the description of the parameter when documentation is provided', () => {
  builder.append(
    tsConstructor({
      doc: tsDoc({
        description: 'description',
        tags: [tsDocTag('param', 'y', 'y-description'), tsDocTag('returns', 'r-description')],
      }),
      parameters: [tsConstructorParameter('x', { description: 'x-description' }), tsConstructorParameter('y')],
    }),
  );
  expect(builder.toString(false)).toBe(
    `/**${EOL} * description${EOL} * ${EOL} * @param x x-description${EOL} * @param y y-description${EOL} * @returns r-description${EOL} */${EOL}constructor(x, y) {}${EOL}`,
  );
});

it('should write the body', () => {
  builder.append(tsConstructor({ body: 'this.x = x;' }));
  expect(builder.toString(false)).toBe(`constructor() {${EOL}  this.x = x;${EOL}}${EOL}`);
});

it('should render injections', () => {
  builder.append(
    tsConstructor({
      inject: { before: ['before'], after: ['after'], beforeParams: ['beforeParams'], afterParams: ['afterParams'] },
      parameters: [tsConstructorParameter('x'), 'custom', tsConstructorParameter('y')],
      body: 'this.x = x;',
    }),
  );
  expect(builder.toString(false)).toBe(
    `beforeconstructorbeforeParams(x, custom, y)afterParams {${EOL}  this.x = x;${EOL}}${EOL}after`,
  );
});
