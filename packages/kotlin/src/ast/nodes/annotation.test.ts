import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';

describe('ktAnnotation', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  describe('single', () => {
    it('should write an annotation without parameters', () => {
      builder.append(ktAnnotation('Test'));
      expect(builder.toString(false)).toBe('@Test');
    });

    it('should write an annotation with parameters', () => {
      builder.append(ktAnnotation('Test', ['Param']));
      expect(builder.toString(false)).toBe('@Test(Param)');
    });

    it('should write an annotation with target', () => {
      builder.append(ktAnnotation('Test', [], { target: 'property' }));
      expect(builder.toString(false)).toBe('@property:Test');
    });

    it('should write an annotation with all options', () => {
      builder.append(ktAnnotation('Test', ['Param'], { target: 'property' }));
      expect(builder.toString(false)).toBe('@property:Test(Param)');
    });

    it('should render injections', () => {
      builder.append(
        ktAnnotation('Test', ['Param'], {
          target: 'property',
          inject: {
            before: '║b║',
            after: '║a║',
            beforeTarget: '║bt║',
            afterTarget: '║at║',
            beforeClass: '║bc║',
            afterClass: '║ac║',
            beforeArguments: '║ba║',
            afterArguments: '║aa║',
          },
        }),
      );
      expect(builder.toString(false)).toBe('║b║@║bt║property║at║:║bc║Test║ac║║ba║(Param)║aa║║a║');
    });
  });

  describe('multiple', () => {
    it('should write annotations across multiple lines', () => {
      ktAnnotation.write(builder, [ktAnnotation('Test'), ktAnnotation('Test')], { multiline: true });
      expect(builder.toString(false)).toBe('@Test\n@Test\n');
    });

    it('should write annotations on the same line', () => {
      ktAnnotation.write(builder, [ktAnnotation('Test'), ktAnnotation('Test')], { multiline: false });
      expect(builder.toString(false)).toBe('@Test @Test ');
    });
  });
});
