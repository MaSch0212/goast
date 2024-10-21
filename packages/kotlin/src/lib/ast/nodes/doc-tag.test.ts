import { ktDocTag } from './doc-tag.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

describe('ktDocTag', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write custom tag', () => {
    builder.append(ktDocTag('custom'));
    expect(builder.toString(false)).toBe('@custom');
  });

  it('should write custom tag with description', () => {
    builder.append(ktDocTag('custom', { description: 'description' }));
    expect(builder.toString(false)).toBe('@custom description');
  });

  it('should write param tag', () => {
    builder.append(ktDocTag('param', 'x', 'description'));
    expect(builder.toString(false)).toBe('@param x description');
  });

  it('should write return tag', () => {
    builder.append(ktDocTag('return', 'description'));
    expect(builder.toString(false)).toBe('@return description');
  });

  it('should write constructor tag', () => {
    builder.append(ktDocTag('constructor', 'description'));
    expect(builder.toString(false)).toBe('@constructor description');
  });

  it('should write receiver tag', () => {
    builder.append(ktDocTag('receiver', 'description'));
    expect(builder.toString(false)).toBe('@receiver description');
  });

  it('should write property tag', () => {
    builder.append(ktDocTag('property', 'name', 'description'));
    expect(builder.toString(false)).toBe('@property name description');
  });

  it('should write throws tag', () => {
    builder.append(ktDocTag('throws', 'exception', 'description'));
    expect(builder.toString(false)).toBe('@throws exception description');
  });

  it('should write exception tag', () => {
    builder.append(ktDocTag('exception', 'exception', 'description'));
    expect(builder.toString(false)).toBe('@exception exception description');
  });

  it('should write see tag', () => {
    builder.append(ktDocTag('see', 'reference'));
    expect(builder.toString(false)).toBe('@see reference');
  });

  it('should write author tag', () => {
    builder.append(ktDocTag('author', 'name'));
    expect(builder.toString(false)).toBe('@author name');
  });

  it('should write since tag', () => {
    builder.append(ktDocTag('since', 'version'));
    expect(builder.toString(false)).toBe('@since version');
  });

  it('should write supress tag', () => {
    builder.append(ktDocTag('suppress'));
    expect(builder.toString(false)).toBe('@suppress');
  });

  it('should render injections', () => {
    builder.append(ktDocTag('custom', { inject: { before: 'before', after: 'after' } }));
    expect(builder.toString(false)).toBe('before@customafter');
  });
});
