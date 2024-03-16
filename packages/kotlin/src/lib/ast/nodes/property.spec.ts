import { EOL } from 'os';

import { ktAnnotation, ktDoc } from '.';
import { ktProperty, ktPropertyAccessor, writeKtPropertyAccessor } from './property';
import { KotlinFileBuilder } from '../../file-builder';

describe('ktProperty', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write a property', () => {
    builder.append(ktProperty('x'));
    expect(builder.toString(false)).toBe(`val x: Any?${EOL}`);
  });

  it('should write a property with a default value', () => {
    builder.append(ktProperty('x', { default: '42' }));
    expect(builder.toString(false)).toBe(`val x = 42${EOL}`);
  });

  it('should write a mutable property', () => {
    builder.append(ktProperty('x', { mutable: true }));
    expect(builder.toString(false)).toBe(`var x: Any?${EOL}`);
  });

  it('should write a property with a type', () => {
    builder.append(ktProperty('x', { type: 'Int' }));
    expect(builder.toString(false)).toBe(`val x: Int${EOL}`);
  });

  it('should write all annotations', () => {
    builder.append(ktProperty('x', { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
    expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}val x: Any?${EOL}`);
  });

  it('should write the const keyword if configured', () => {
    builder.append(ktProperty('x', { const: true }));
    expect(builder.toString(false)).toBe(`const val x: Any?${EOL}`);
  });

  it('should write the lateinit keyword if configured', () => {
    builder.append(ktProperty('x', { lateinit: true }));
    expect(builder.toString(false)).toBe(`lateinit val x: Any?${EOL}`);
  });

  it('should write the open keyword if configured', () => {
    builder.append(ktProperty('x', { open: true }));
    expect(builder.toString(false)).toBe(`open val x: Any?${EOL}`);
  });

  it('should write the override keyword if configured', () => {
    builder.append(ktProperty('x', { override: true }));
    expect(builder.toString(false)).toBe(`override val x: Any?${EOL}`);
  });

  it('should write the abstract keyword if configured', () => {
    builder.append(ktProperty('x', { abstract: true }));
    expect(builder.toString(false)).toBe(`abstract val x: Any?${EOL}`);
  });

  it('should write the delegate if it exists', () => {
    builder.append(ktProperty('x', { delegate: 'lazy' }));
    expect(builder.toString(false)).toBe(`val x: Any? by lazy${EOL}`);
  });

  it('should write the delegate with arguments if they exist', () => {
    builder.append(ktProperty('x', { delegate: 'lazy', delegateArguments: ['42', 'true'] }));
    expect(builder.toString(false)).toBe(`val x: Any? by lazy(42, true)${EOL}`);
  });

  it('should write the getter if it exists', () => {
    builder.append(ktProperty('x', { getter: ktPropertyAccessor() }));
    expect(builder.toString(false)).toBe(`val x: Any?${EOL}    get${EOL}`);
  });

  it('should write the setter if it exists', () => {
    builder.append(ktProperty('x', { setter: ktPropertyAccessor() }));
    expect(builder.toString(false)).toBe(`var x: Any?${EOL}    set${EOL}`);
  });

  it('should write documentation if it exists', () => {
    builder.append(ktProperty('x', { doc: ktDoc('Hello') }));
    expect(builder.toString(false)).toBe(`/**${EOL} * Hello${EOL} */${EOL}val x: Any?${EOL}`);
  });

  it('should write all the parts of the property', () => {
    builder.append(
      ktProperty('x', {
        doc: ktDoc('Hello'),
        default: '42',
        mutable: true,
        type: 'Int',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        const: true,
        lateinit: true,
        open: true,
        override: true,
        abstract: true,
        delegate: 'lazy',
        delegateArguments: ['42', 'true'],
        getter: ktPropertyAccessor(),
        setter: ktPropertyAccessor(),
      })
    );
    expect(builder.toString(false)).toBe(
      `/**${EOL} * Hello${EOL} */${EOL}@Inject${EOL}@Optional${EOL}const lateinit abstract override open var x: Int = 42 by lazy(42, true)${EOL}    get${EOL}    set${EOL}`
    );
  });

  it('should render injections', () => {
    builder.append(ktProperty('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeval x: Any?${EOL}after`);
  });
});

describe('ktPropertyAccessor', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write the kind of the accessor', () => {
    writeKtPropertyAccessor(builder, ktPropertyAccessor(), 'get');
    expect(builder.toString(false)).toBe('get');
  });

  it('should write the get body if it exists', () => {
    writeKtPropertyAccessor(builder, ktPropertyAccessor({ body: 'println("Hello")' }), 'get');
    expect(builder.toString(false)).toBe(`get() {${EOL}    println("Hello")${EOL}}`);
  });

  it('should write the get body with a single expression', () => {
    writeKtPropertyAccessor(builder, ktPropertyAccessor({ body: '42', singleExpression: true }), 'get');
    expect(builder.toString(false)).toBe('get() = 42');
  });

  it('should write the set body if it exists', () => {
    writeKtPropertyAccessor(builder, ktPropertyAccessor({ body: 'println("Hello")' }), 'set');
    expect(builder.toString(false)).toBe(`set(value) {${EOL}    println("Hello")${EOL}}`);
  });

  it('should write the set body with a single expression', () => {
    writeKtPropertyAccessor(builder, ktPropertyAccessor({ body: '42', singleExpression: true }), 'set');
    expect(builder.toString(false)).toBe('set(value) = 42');
  });

  it('should write all annotations', () => {
    writeKtPropertyAccessor(
      builder,
      ktPropertyAccessor({ annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }),
      'get'
    );
    expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}get`);
  });

  it('should write the accessibility if it exists', () => {
    writeKtPropertyAccessor(builder, ktPropertyAccessor({ accessibility: 'private' }), 'get');
    expect(builder.toString(false)).toBe('private get');
  });

  it('should write all the parts of the accessor', () => {
    writeKtPropertyAccessor(
      builder,
      ktPropertyAccessor({
        body: 'println("Hello")',
        accessibility: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
      }),
      'get'
    );
    expect(builder.toString(false)).toBe(
      `@Inject${EOL}@Optional${EOL}private get() {${EOL}    println("Hello")${EOL}}`
    );
  });

  it('should render injections', () => {
    writeKtPropertyAccessor(builder, ktPropertyAccessor({ inject: { before: ['before'], after: ['after'] } }), 'get');
    expect(builder.toString(false)).toBe('beforegetafter');
  });
});
