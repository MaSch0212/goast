import { EOL } from 'os';

import { ktAnnotation, writeKtAnnotations } from './annotation';
import { KotlinFileBuilder } from '../../file-builder';

let builder: KotlinFileBuilder;

beforeEach(() => {
  builder = new KotlinFileBuilder();
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
    builder.append(ktAnnotation('Test', [], { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('before@Testafter');
  });
});

describe('multiple', () => {
  it('should write annotations across multiple lines', () => {
    writeKtAnnotations(builder, [ktAnnotation('Test'), ktAnnotation('Test')], true);
    expect(builder.toString(false)).toBe(`@Test${EOL}@Test${EOL}`);
  });

  it('should write annotations on the same line', () => {
    writeKtAnnotations(builder, [ktAnnotation('Test'), ktAnnotation('Test')], false);
    expect(builder.toString(false)).toBe('@Test @Test ');
  });
});
