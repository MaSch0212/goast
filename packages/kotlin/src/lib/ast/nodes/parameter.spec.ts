import { EOL } from 'os';

import { ktAnnotation } from '.';
import { ktClassParameter, ktParameter, writeKtParameters } from './parameter';
import { KotlinFileBuilder } from '../../file-builder';

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
        })
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
      writeKtParameters(builder, []);
      expect(builder.toString(false)).toBe('()');
    });

    it('should write a single parameter', () => {
      writeKtParameters(builder, [ktParameter('x', 'Int')]);
      expect(builder.toString(false)).toBe(`(x: Int)`);
    });

    it('should write all the parameters', () => {
      writeKtParameters(builder, [ktParameter('x', 'Int'), ktParameter('y', 'String')]);
      expect(builder.toString(false)).toBe(`(x: Int, y: String)`);
    });

    it('should multiline if there are more than 2 parameters', () => {
      writeKtParameters(builder, [ktParameter('x', 'Int'), ktParameter('y', 'String'), ktParameter('z', 'Boolean')]);
      expect(builder.toString(false)).toBe(`(${EOL}    x: Int,${EOL}    y: String,${EOL}    z: Boolean${EOL})`);
    });

    it('should multiline if there are annotations', () => {
      writeKtParameters(builder, [ktParameter('x', 'Int', { annotations: [ktAnnotation('Inject')] })]);
      expect(builder.toString(false)).toBe(`(${EOL}    @Inject${EOL}    x: Int${EOL})`);
    });

    it('shoudl add spacing if one parameter has annotations', () => {
      writeKtParameters(builder, [
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
      builder.append(ktClassParameter('x', 'Int'));
      expect(builder.toString(false)).toBe('x: Int');
    });

    it('should write the default if it exists', () => {
      builder.append(ktClassParameter('x', 'Int', { default: '42' }));
      expect(builder.toString(false)).toBe('x: Int = 42');
    });

    it('should write override if it exists', () => {
      builder.append(ktClassParameter('x', 'Int', { override: true }));
      expect(builder.toString(false)).toBe('override x: Int');
    });

    it('should write vararg if it exists', () => {
      builder.append(ktClassParameter('x', 'Int', { vararg: true }));
      expect(builder.toString(false)).toBe('vararg x: Int');
    });

    it('should write val keyword if readonly property', () => {
      builder.append(ktClassParameter('x', 'Int', { property: 'readonly' }));
      expect(builder.toString(false)).toBe('val x: Int');
    });

    it('should write var keyword if mutable property', () => {
      builder.append(ktClassParameter('x', 'Int', { property: 'mutable' }));
      expect(builder.toString(false)).toBe('var x: Int');
    });

    it('should write accessibility if also property', () => {
      builder.append(ktClassParameter('x', 'Int', { accessibility: 'private', property: 'mutable' }));
      expect(builder.toString(false)).toBe('private var x: Int');
    });

    it('should not write accessibility if no property', () => {
      builder.append(ktClassParameter('x', 'Int', { accessibility: 'private' }));
      expect(builder.toString(false)).toBe('x: Int');
    });

    it('should write all annotations', () => {
      builder.append(ktClassParameter('x', 'Int', { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
      expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}x: Int`);
    });

    it('should write all the parts of the class parameter', () => {
      builder.append(
        ktClassParameter('x', 'Int', {
          default: '42',
          override: true,
          vararg: true,
          property: 'mutable',
          accessibility: 'private',
          annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        })
      );
      expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}private override vararg var x: Int = 42`);
    });

    it('should render injections', () => {
      builder.append(ktClassParameter('x', 'Int', { inject: { before: ['before'], after: ['after'] } }));
      expect(builder.toString(false)).toBe('beforex: Intafter');
    });
  });
});
