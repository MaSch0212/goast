import { EOL } from 'os';

import { ktAnnotation } from '.';
import { ktConstructor, writeKtPrimaryConstructor } from './constructor';
import { ktParameter } from './parameter';
import { KotlinFileBuilder } from '../../file-builder';

describe('ktConstructor', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write an empty constructor', () => {
    builder.append(ktConstructor([], null));
    expect(builder.toString(false)).toBe('constructor() {}');
  });

  it('should write a constructor with parameters', () => {
    builder.append(ktConstructor([ktParameter('x', 'Int')], null));
    expect(builder.toString(false)).toBe('constructor(x: Int) {}');
  });

  it('should write a constructor with a body', () => {
    builder.append(ktConstructor([], 'println("Hello")'));
    expect(builder.toString(false)).toBe(`constructor() {${EOL}    println("Hello")${EOL}}`);
  });

  it('should write access modifiers if they exist', () => {
    builder.append(ktConstructor([], null, { accessibility: 'private' }));
    expect(builder.toString(false)).toBe('private constructor() {}');
  });

  it('should write all annotations', () => {
    builder.append(ktConstructor([], null, { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
    expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}constructor() {}`);
  });

  it('should write delegation without arguments', () => {
    builder.append(ktConstructor([], null, { delegateTarget: 'this' }));
    expect(builder.toString(false)).toBe('constructor() : this() {}');
  });

  it('should write delegation with arguments', () => {
    builder.append(ktConstructor([], null, { delegateTarget: 'super', delegateArguments: ['42', 'true'] }));
    expect(builder.toString(false)).toBe('constructor() : super(42, true) {}');
  });

  it('should write all the parts of the constructor', () => {
    builder.append(
      ktConstructor([ktParameter('x', 'Int')], 'println("Hello")', {
        accessibility: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        delegateTarget: 'this',
        delegateArguments: ['42', 'true'],
      })
    );
    expect(builder.toString(false)).toBe(
      `@Inject${EOL}@Optional${EOL}private constructor(x: Int) : this(42, true) {${EOL}    println("Hello")${EOL}}`
    );
  });

  it('should render injections', () => {
    builder.append(ktConstructor([], null, { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeconstructor() {}after`);
  });
});

describe('ktPrimaryConstructor', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should not write anything if there are no parameters, accessibility, or annotations', () => {
    writeKtPrimaryConstructor(builder, ktConstructor());
    expect(builder.toString(false)).toBe('');
  });

  it('should not write body', () => {
    writeKtPrimaryConstructor(builder, ktConstructor([], 'println("Hello")'));
    expect(builder.toString(false)).toBe('');
  });

  it('should write accessibility', () => {
    writeKtPrimaryConstructor(builder, ktConstructor([], null, { accessibility: 'private' }));
    expect(builder.toString(false)).toBe(' private constructor()');
  });

  it('should write annotations', () => {
    writeKtPrimaryConstructor(
      builder,
      ktConstructor([], null, { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] })
    );
    expect(builder.toString(false)).toBe(' @Inject @Optional constructor()');
  });

  it('should write parameters', () => {
    writeKtPrimaryConstructor(builder, ktConstructor([ktParameter('x', 'Int')], null));
    expect(builder.toString(false)).toBe('(x: Int)');
  });

  it('should write all the parts of the primary constructor', () => {
    writeKtPrimaryConstructor(
      builder,
      ktConstructor([ktParameter('x', 'Int')], 'println("Hello")', {
        accessibility: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
      })
    );
    expect(builder.toString(false)).toBe(' @Inject @Optional private constructor(x: Int)');
  });
});
