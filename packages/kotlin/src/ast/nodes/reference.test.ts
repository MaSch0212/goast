import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import type { KotlinImport } from '../../common-results.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktReference } from './reference.ts';

describe('ktReference', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write reference', () => {
    builder.append(ktReference('MyClass'));
    expect(builder.toString(false)).toBe('MyClass');
  });

  it('should write reference with generics', () => {
    builder.append(ktReference('MyClass', null, { generics: [ktReference('String')] }));
    expect(builder.toString(false)).toBe('MyClass<String>');
  });

  it('should add import to builder', () => {
    builder.append(ktReference('MyClass', 'my-package'));
    expect(builder.imports.imports).toEqual(
      <KotlinImport[]> [
        {
          typeName: 'MyClass',
          packageName: 'my-package',
        },
      ],
    );
  });

  it('should render nullable', () => {
    builder.append(ktReference('MyClass', null, { nullable: true }));
    expect(builder.toString(false)).toBe('MyClass?');
  });

  it('should render injections', () => {
    builder.append(ktReference('MyClass', null, { inject: { before: 'before', after: 'after' } }));
    expect(builder.toString(false)).toBe('beforeMyClassafter');
  });
});
