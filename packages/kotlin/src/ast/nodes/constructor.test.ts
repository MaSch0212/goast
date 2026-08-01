import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';
import { ktConstructor } from './constructor.ts';
import { ktParameter } from './parameter.ts';

describe('ktConstructor', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write an empty constructor', () => {
    builder.append(ktConstructor([], null));
    expect(builder.toString(false)).toBe('constructor() {}\n');
  });

  it('should write a constructor with parameters', () => {
    builder.append(ktConstructor([ktParameter('x', 'Int')], null));
    expect(builder.toString(false)).toBe('constructor(x: Int) {}\n');
  });

  it('should write a constructor with a body', () => {
    builder.append(ktConstructor([], 'println("Hello")'));
    expect(builder.toString(false)).toBe('constructor() {\n    println("Hello")\n}\n');
  });

  it('should write access modifiers if they exist', () => {
    builder.append(ktConstructor([], null, { accessModifier: 'private' }));
    expect(builder.toString(false)).toBe('private constructor() {}\n');
  });

  it('should write all annotations', () => {
    builder.append(ktConstructor([], null, { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
    expect(builder.toString(false)).toBe('@Inject\n@Optional\nconstructor() {}\n');
  });

  it('should write delegation without arguments', () => {
    builder.append(ktConstructor([], null, { delegateTarget: 'this' }));
    expect(builder.toString(false)).toBe('constructor() : this() {}\n');
  });

  it('should write delegation with arguments', () => {
    builder.append(ktConstructor([], null, { delegateTarget: 'super', delegateArguments: ['42', 'true'] }));
    expect(builder.toString(false)).toBe('constructor() : super(42, true) {}\n');
  });

  it('should write all the parts of the constructor', () => {
    builder.append(
      ktConstructor([ktParameter('x', 'Int')], 'println("Hello")', {
        accessModifier: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        delegateTarget: 'this',
        delegateArguments: ['42', 'true'],
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `@Inject
        @Optional
        private constructor(x: Int) : this(42, true) {
            println("Hello")
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      ktConstructor([ktParameter('x', 'Int')], 'println("Hello")', {
        accessModifier: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        delegateTarget: 'this',
        delegateArguments: ['42', 'true'],
        inject: {
          before: '║b║',
          after: '║a║',
          beforeAnnotations: '║ba║',
          afterAnnotations: '║aa║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeParams: '║bp║',
          afterParams: '║ap║',
          beforeDelegate: '║bd║',
          afterDelegate: '║ad║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `║b║║ba║@Inject
        @Optional
        ║aa║║bm║private ║am║constructor║bp║(x: Int)║ap║ : ║bd║this(42, true)║ad║ ║bb║{
            println("Hello")
        }║ab║
        ║a║`,
      ),
    );
  });
});

describe('ktPrimaryConstructor', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should not write anything if there are no parameters, accessModifier, or annotations', () => {
    ktConstructor().writeAsPrimary(builder);
    expect(builder.toString(false)).toBe('');
  });

  it('should not write body', () => {
    ktConstructor([], 'println("Hello")').writeAsPrimary(builder);
    expect(builder.toString(false)).toBe('');
  });

  it('should write accessModifier', () => {
    ktConstructor([], null, { accessModifier: 'private' }).writeAsPrimary(builder);
    expect(builder.toString(false)).toBe(' private constructor()');
  });

  it('should write annotations', () => {
    ktConstructor([], null, { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }).writeAsPrimary(
      builder,
    );
    expect(builder.toString(false)).toBe(' @Inject @Optional constructor()');
  });

  it('should write parameters', () => {
    ktConstructor([ktParameter('x', 'Int')], null).writeAsPrimary(builder);
    expect(builder.toString(false)).toBe('(x: Int)');
  });

  it('should write all the parts of the primary constructor', () => {
    ktConstructor([ktParameter('x', 'Int')], 'println("Hello")', {
      accessModifier: 'private',
      annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
    }).writeAsPrimary(builder);
    expect(builder.toString(false)).toBe(' @Inject @Optional private constructor(x: Int)');
  });

  it('should render injections', () => {
    ktConstructor([ktParameter('x', 'Int')], 'println("Hello")', {
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
        beforeDelegate: '║bd║',
        afterDelegate: '║ad║',
        beforeBody: '║bb║',
        afterBody: '║ab║',
      },
    }).writeAsPrimary(builder);
    expect(builder.toString(false)).toBe(
      '║b║ ║ba║@Inject @Optional ║aa║║bm║private ║am║constructor║bp║(x: Int)║ap║║a║',
    );
  });
});
