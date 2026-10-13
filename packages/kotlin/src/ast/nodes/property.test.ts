import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';
import { ktDoc } from './doc.ts';
import { ktProperty } from './property.ts';

describe('ktProperty', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write a property', () => {
    builder.append(ktProperty('x'));
    expect(builder.toString(false)).toBe('val x: Any?\n');
  });

  it('should write a property with a default value', () => {
    builder.append(ktProperty('x', { default: '42' }));
    expect(builder.toString(false)).toBe('val x = 42\n');
  });

  it('should write a mutable property', () => {
    builder.append(ktProperty('x', { mutable: true }));
    expect(builder.toString(false)).toBe('var x: Any?\n');
  });

  it('should write a property with a type', () => {
    builder.append(ktProperty('x', { type: 'Int' }));
    expect(builder.toString(false)).toBe('val x: Int\n');
  });

  it('should write all annotations', () => {
    builder.append(ktProperty('x', { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
    expect(builder.toString(false)).toBe('@Inject\n@Optional\nval x: Any?\n');
  });

  it('should write the const keyword if configured', () => {
    builder.append(ktProperty('x', { const: true }));
    expect(builder.toString(false)).toBe('const val x: Any?\n');
  });

  it('should write the lateinit keyword if configured', () => {
    builder.append(ktProperty('x', { lateinit: true }));
    expect(builder.toString(false)).toBe('lateinit val x: Any?\n');
  });

  it('should write the open keyword if configured', () => {
    builder.append(ktProperty('x', { open: true }));
    expect(builder.toString(false)).toBe('open val x: Any?\n');
  });

  it('should write the override keyword if configured', () => {
    builder.append(ktProperty('x', { override: true }));
    expect(builder.toString(false)).toBe('override val x: Any?\n');
  });

  it('should write the abstract keyword if configured', () => {
    builder.append(ktProperty('x', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract val x: Any?\n');
  });

  it('should write the delegate if it exists', () => {
    builder.append(ktProperty('x', { delegate: 'lazy' }));
    expect(builder.toString(false)).toBe('val x: Any? by lazy\n');
  });

  it('should write the delegate with arguments if they exist', () => {
    builder.append(ktProperty('x', { delegate: 'lazy', delegateArguments: ['42', 'true'] }));
    expect(builder.toString(false)).toBe('val x: Any? by lazy(42, true)\n');
  });

  it('should write the getter if it exists', () => {
    builder.append(ktProperty('x', { getter: ktProperty.getter() }));
    expect(builder.toString(false)).toBe('val x: Any?\n    get\n');
  });

  it('should write the setter if it exists', () => {
    builder.append(ktProperty('x', { setter: ktProperty.setter() }));
    expect(builder.toString(false)).toBe('var x: Any?\n    set\n');
  });

  it('should write documentation if it exists', () => {
    builder.append(ktProperty('x', { doc: ktDoc('Hello') }));
    expect(builder.toString(false)).toBe('/**\n * Hello\n */\nval x: Any?\n');
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
      '/**\n * Hello\n */\n@Inject\n@Optional\nconst lateinit abstract override open var x: Int = 42 by lazy(42, true)\n    get\n    set\n',
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
      dedent(8)(
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
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write the kind of the accessor', () => {
    ktProperty.getter().write(builder);
    expect(builder.toString(false)).toBe('get\n');
  });

  it('should write the get body if it exists', () => {
    ktProperty.getter({ body: 'println("Hello")' }).write(builder);
    expect(builder.toString(false)).toBe('get() {\n    println("Hello")\n}\n');
  });

  it('should write the get body with a single expression', () => {
    ktProperty.getter({ body: '42', singleExpression: true }).write(builder);
    expect(builder.toString(false)).toBe('get() = 42\n');
  });

  it('should write the set body if it exists', () => {
    ktProperty.setter({ body: 'println("Hello")' }).write(builder);
    expect(builder.toString(false)).toBe('set(value) {\n    println("Hello")\n}\n');
  });

  it('should write the set body with a single expression', () => {
    ktProperty.setter({ body: '42', singleExpression: true }).write(builder);
    expect(builder.toString(false)).toBe('set(value) = 42\n');
  });

  it('should write all annotations', () => {
    ktProperty.getter({ annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }).write(builder);
    expect(builder.toString(false)).toBe('@Inject\n@Optional\nget\n');
  });

  it('should write the accessModifier if it exists', () => {
    ktProperty.getter({ accessModifier: 'private' }).write(builder);
    expect(builder.toString(false)).toBe('private get\n');
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
      '@Inject\n@Optional\nprivate get() {\n    println("Hello")\n}\n',
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
      '║b║║ba║@Inject\n@Optional\n║aa║║bm║private ║am║get║bp║()║ap║ ║bb║{\n    println("Hello")\n}║ab║\n║a║',
    );
  });
});
