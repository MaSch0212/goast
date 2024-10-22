import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDocTag } from './doc-tag.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write a custom tag', () => {
  builder
    .appendLine(tsDocTag('custom'))
    .appendLine(tsDocTag('custom', { type: 'number' }))
    .appendLine(tsDocTag('custom', { text: 'description' }))
    .append(tsDocTag('custom', { type: 'number', text: 'description' }));
  expect(builder.toString(false)).toBe(
    `@custom${EOL}@custom {number}${EOL}@custom description${EOL}@custom {number} description`,
  );
});

it('should render injections', () => {
  builder.append(tsDocTag('custom', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before@customafter`);
});

it('should write author tag', () => {
  builder.appendLine(tsDocTag('author', 'John Doe')).append(tsDocTag('author', 'John Doe', 'john.doe@gmail.com'));
  expect(builder.toString(false)).toBe(`@author John Doe${EOL}@author John Doe <john.doe@gmail.com>`);
});

it('should write access tag', () => {
  builder.append(tsDocTag('access', 'public'));
  expect(builder.toString(false)).toBe('@access public');
});
