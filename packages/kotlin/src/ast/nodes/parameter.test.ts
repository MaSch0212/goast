import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';
import { ktParameter } from './parameter.ts';

describe('ktParameter', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  describe('single parameter', () => {
    it('should write the name and type of the parameter', () => {
      builder.append(ktParameter('x', 'Int'));
      expect(builder.toString(false)).toBe('x: Int');
    });

    it('should write the default if it exists', () => {
      builder.append(ktParameter('x', 'Int', { default: '42' }));
      expect(builder.toString(false)).toBe('x: Int = 42');
    });

    it('should write vararg if it exists', () => {
      builder.append(ktParameter('x', 'Int', { vararg: true }));
      expect(builder.toString(false)).toBe('vararg x: Int');
    });

    it('should write all annotations', () => {
      builder.append(ktParameter('x', 'Int', { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
      expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}x: Int`);
    });

    it('should write all the parts of the parameter', () => {
      builder.append(
        ktParameter('x', 'Int', {
          default: '42',
          vararg: true,
          annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        }),
      );
      expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}vararg x: Int = 42`);
    });

    it('should render injections', () => {
      builder.append(ktParameter('x', 'Int', { inject: { before: ['before'], after: ['after'] } }));
      expect(builder.toString(false)).toBe('beforex: Intafter');
    });
  });

  describe('multiple', () => {
    it('should write parenthesis if the node is empty', () => {
      ktParameter.write(builder, []);
      expect(builder.toString(false)).toBe('()');
    });

    it('should write a single parameter', () => {
      ktParameter.write(builder, [ktParameter('x', 'Int')]);
      expect(builder.toString(false)).toBe(`(x: Int)`);
    });

    it('should write all the parameters', () => {
      ktParameter.write(builder, [ktParameter('x', 'Int'), ktParameter('y', 'String')]);
      expect(builder.toString(false)).toBe(`(x: Int, y: String)`);
    });

    it('should multiline if there are more than 2 parameters', () => {
      ktParameter.write(builder, [ktParameter('x', 'Int'), ktParameter('y', 'String'), ktParameter('z', 'Boolean')]);
      expect(builder.toString(false)).toBe(`(${EOL}    x: Int,${EOL}    y: String,${EOL}    z: Boolean${EOL})`);
    });

    it('should multiline if there are annotations', () => {
      ktParameter.write(builder, [ktParameter('x', 'Int', { annotations: [ktAnnotation('Inject')] })]);
      expect(builder.toString(false)).toBe(`(${EOL}    @Inject${EOL}    x: Int${EOL})`);
    });

    it('shoudl add spacing if one parameter has annotations', () => {
      ktParameter.write(builder, [
        ktParameter('x', 'Int'),
        ktParameter('y', 'String', { annotations: [ktAnnotation('Inject')] }),
      ]);
      expect(builder.toString(false)).toBe(`(${EOL}    x: Int,${EOL}${EOL}    @Inject${EOL}    y: String${EOL})`);
    });
  });
});

describe('ktClassParameter', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  describe('single class parameter', () => {
    it('should write the name and type of the parameter', () => {
      builder.append(ktParameter.class('x', 'Int'));
      expect(builder.toString(false)).toBe('x: Int');
    });

    it('should write the default if it exists', () => {
      builder.append(ktParameter.class('x', 'Int', { default: '42' }));
      expect(builder.toString(false)).toBe('x: Int = 42');
    });

    it('should write override if it exists', () => {
      builder.append(ktParameter.class('x', 'Int', { override: true, property: 'mutable' }));
      expect(builder.toString(false)).toBe('override var x: Int');
    });

    it('should write vararg if it exists', () => {
      builder.append(ktParameter.class('x', 'Int', { vararg: true }));
      expect(builder.toString(false)).toBe('vararg x: Int');
    });

    it('should write val keyword if readonly property', () => {
      builder.append(ktParameter.class('x', 'Int', { property: 'readonly' }));
      expect(builder.toString(false)).toBe('val x: Int');
    });

    it('should write var keyword if mutable property', () => {
      builder.append(ktParameter.class('x', 'Int', { property: 'mutable' }));
      expect(builder.toString(false)).toBe('var x: Int');
    });

    it('should write accessModifier if also property', () => {
      builder.append(ktParameter.class('x', 'Int', { accessModifier: 'private', property: 'mutable' }));
      expect(builder.toString(false)).toBe('private var x: Int');
    });

    it('should not write accessModifier if no property', () => {
      builder.append(ktParameter.class('x', 'Int', { accessModifier: 'private' }));
      expect(builder.toString(false)).toBe('x: Int');
    });

    it('should write all annotations', () => {
      builder.append(
        ktParameter.class('x', 'Int', { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }),
      );
      expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}x: Int`);
    });

    it('should write all the parts of the class parameter', () => {
      builder.append(
        ktParameter.class('x', 'Int', {
          default: '42',
          override: true,
          vararg: true,
          property: 'mutable',
          accessModifier: 'private',
          annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        }),
      );
      expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}private override vararg var x: Int = 42`);
    });

    it('should render injections', () => {
      builder.append(
        ktParameter.class('x', 'Int', {
          default: '42',
          override: true,
          vararg: true,
          property: 'mutable',
          accessModifier: 'private',
          annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
          inject: {
            before: '║b║',
            after: '║a║',
            beforeAnnotations: '║ba║',
            afterAnnotations: '║aa║',
            beforeModifiers: '║bm║',
            afterModifiers: '║am║',
            beforeName: '║bn║',
            afterName: '║an║',
            beforeType: '║bt║',
            afterType: '║at║',
            beforeDefault: '║bd║',
            afterDefault: '║ad║',
          },
        }),
      );
      expect(builder.toString(false)).toBe(
        `║b║║ba║@Inject${EOL}@Optional${EOL}║aa║║bm║private override vararg ║am║var ║bn║x║an║: ║bt║Int║at║ = ║bd║42║ad║║a║`,
      );
    });
  });
});
