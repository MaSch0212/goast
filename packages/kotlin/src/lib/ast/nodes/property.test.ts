import { EOL } from 'node:os';

import { normalizeEOL } from '@goast/test-utils';

import { ktAnnotation } from './annotation.ts';
import { ktDoc } from './doc.ts';
import { ktProperty } from './property.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

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
    builder.append(ktProperty('x', { getter: ktProperty.getter() }));
    expect(builder.toString(false)).toBe(`val x: Any?${EOL}    get${EOL}`);
  });

  it('should write the setter if it exists', () => {
    builder.append(ktProperty('x', { setter: ktProperty.setter() }));
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
        getter: ktProperty.getter(),
        setter: ktProperty.setter(),
      }),
    );
    expect(builder.toString(false)).toBe(
      `/**${EOL} * Hello${EOL} */${EOL}@Inject${EOL}@Optional${EOL}const lateinit abstract override open var x: Int = 42 by lazy(42, true)${EOL}    get${EOL}    set${EOL}`,
    );
  });

  it('should render injections', () => {
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
        getter: ktProperty.getter(),
        setter: ktProperty.setter(),
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDoc: '║bd║',
          afterDoc: '║ad║',
          beforeAnnotations: '║ba║',
          afterAnnotations: '║aa║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeType: '║bt║',
          afterType: '║at║',
          beforeDefault: '║bdf║',
          afterDefault: '║adf║',
          beforeDelegate: '║bdg║',
          afterDelegate: '║adg║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `║b║║bd║
        /**
         * Hello
         */
        ║ad║║ba║@Inject
        @Optional
        ║aa║║bm║const lateinit abstract override open ║am║var ║bn║x║an║: ║bt║Int║at║ = ║bdf║42║adf║ by ║bdg║lazy(42, true)║adg║
            get
            set
        ║a║`,
      ),
    );
  });
});

describe('ktPropertyAccessor', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write the kind of the accessor', () => {
    ktProperty.getter().write(builder);
    expect(builder.toString(false)).toBe(`get${EOL}`);
  });

  it('should write the get body if it exists', () => {
    ktProperty.getter({ body: 'println("Hello")' }).write(builder);
    expect(builder.toString(false)).toBe(`get() {${EOL}    println("Hello")${EOL}}${EOL}`);
  });

  it('should write the get body with a single expression', () => {
    ktProperty.getter({ body: '42', singleExpression: true }).write(builder);
    expect(builder.toString(false)).toBe(`get() = 42${EOL}`);
  });

  it('should write the set body if it exists', () => {
    ktProperty.setter({ body: 'println("Hello")' }).write(builder);
    expect(builder.toString(false)).toBe(`set(value) {${EOL}    println("Hello")${EOL}}${EOL}`);
  });

  it('should write the set body with a single expression', () => {
    ktProperty.setter({ body: '42', singleExpression: true }).write(builder);
    expect(builder.toString(false)).toBe(`set(value) = 42${EOL}`);
  });

  it('should write all annotations', () => {
    ktProperty.getter({ annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }).write(builder);
    expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}get${EOL}`);
  });

  it('should write the accessModifier if it exists', () => {
    ktProperty.getter({ accessModifier: 'private' }).write(builder);
    expect(builder.toString(false)).toBe(`private get${EOL}`);
  });

  it('should write all the parts of the accessor', () => {
    ktProperty
      .getter({
        body: 'println("Hello")',
        accessModifier: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
      })
      .write(builder);
    expect(builder.toString(false)).toBe(
      `@Inject${EOL}@Optional${EOL}private get() {${EOL}    println("Hello")${EOL}}${EOL}`,
    );
  });

  it('should render injections', () => {
    ktProperty
      .getter({
        body: 'println("Hello")',
        accessModifier: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        inject: {
          before: '║b║',
          after: '║a║',
          beforeAnnotations: '║ba║',
          afterAnnotations: '║aa║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeParams: '║bp║',
          afterParams: '║ap║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
        },
      })
      .write(builder);
    expect(builder.toString(false)).toBe(
      `║b║║ba║@Inject${EOL}@Optional${EOL}║aa║║bm║private ║am║get║bp║()║ap║ ║bb║{${EOL}    println("Hello")${EOL}}║ab║${EOL}║a║`,
    );
  });
});
