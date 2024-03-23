import { EOL } from 'os';

import { ktAnnotation, ktConstructor, ktObject, ktParameter } from '.';
import { ktDoc } from './doc';
import { ktEnum } from './enum';
import { ktEnumValue } from './enum-value';
import { KotlinFileBuilder } from '../../file-builder';

describe('ktEnum', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write enum', () => {
    builder.append(ktEnum('Foo'));
    expect(builder.toString(false)).toBe(`enum class Foo${EOL}`);
  });

  it('should write enum with values', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR'), ktEnumValue('BAZ')]));
    expect(builder.toString(false)).toBe(`enum class Foo {${EOL}    BAR, BAZ${EOL}}${EOL}`);
  });

  it('should write documenation', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { doc: ktDoc('This is a foo') }));
    expect(builder.toString(false)).toBe(
      `/**${EOL} * This is a foo${EOL} */${EOL}enum class Foo {${EOL}    BAR${EOL}}${EOL}`
    );
  });

  it('should write annotations', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { annotations: [ktAnnotation('Deprecated')] }));
    expect(builder.toString(false)).toBe(`@Deprecated${EOL}enum class Foo {${EOL}    BAR${EOL}}${EOL}`);
  });

  it('should write access modifiers', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { accessModifier: 'private' }));
    expect(builder.toString(false)).toBe(`private enum class Foo {${EOL}    BAR${EOL}}${EOL}`);
  });

  it('should write primary constructor', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR', { arguments: ['0', '1'] })], {
        primaryConstructor: ktConstructor([ktParameter('x', 'Int'), ktParameter('y', 'Int')]),
      })
    );
    expect(builder.toString(false)).toBe(`enum class Foo(x: Int, y: Int) {${EOL}    BAR(0, 1)${EOL}}${EOL}`);
  });

  it('should write members', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR'), ktEnumValue('BAZ')], { members: ['// Comment 1', '// Comment 2'] })
    );
    expect(builder.toString(false)).toBe(
      `enum class Foo {${EOL}    BAR, BAZ;${EOL}${EOL}    // Comment 1${EOL}    // Comment 2${EOL}}${EOL}`
    );
  });

  it('should write implemented interfaces', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { implements: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe(`enum class Foo : Bar, Baz {${EOL}    BAR${EOL}}${EOL}`);
  });

  it('should write companion object', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { companionObject: ktObject() }));
    expect(builder.toString(false)).toBe(`enum class Foo {${EOL}    BAR;${EOL}${EOL}    companion object${EOL}}${EOL}`);
  });

  it('should write all options', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR', { arguments: ['0', '1'] })], {
        doc: ktDoc('This is a foo'),
        annotations: [ktAnnotation('Deprecated')],
        accessModifier: 'private',
        primaryConstructor: ktConstructor([ktParameter('x', 'Int'), ktParameter('y', 'Int')]),
        implements: ['Bar', 'Baz'],
        members: ['// Comment 1', '// Comment 2'],
        companionObject: ktObject(),
      })
    );
    expect(builder.toString(false)).toBe(
      `/**${EOL} * This is a foo${EOL} */${EOL}@Deprecated${EOL}private enum class Foo(x: Int, y: Int) : Bar, Baz {${EOL}    BAR(0, 1);${EOL}${EOL}    // Comment 1${EOL}    // Comment 2${EOL}${EOL}    companion object${EOL}}${EOL}`
    );
  });

  it('should render injections', () => {
    builder.append(ktEnum('Foo', [], { inject: { before: 'before', after: 'after' } }));
    expect(builder.toString(false)).toBe(`beforeenum class Foo${EOL}after`);
  });
});
