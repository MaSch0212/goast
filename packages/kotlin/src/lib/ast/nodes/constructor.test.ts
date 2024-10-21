import { EOL } from 'node:os';

import { normalizeEOL } from '@goast/test-utils';

import { ktAnnotation } from './annotation.ts';
import { ktConstructor } from './constructor.ts';
import { ktParameter } from './parameter.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

describe('ktConstructor', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write an empty constructor', () => {
    builder.append(ktConstructor([], null));
    expect(builder.toString(false)).toBe(`constructor() {}${EOL}`);
  });

  it('should write a constructor with parameters', () => {
    builder.append(ktConstructor([ktParameter('x', 'Int')], null));
    expect(builder.toString(false)).toBe(`constructor(x: Int) {}${EOL}`);
  });

  it('should write a constructor with a body', () => {
    builder.append(ktConstructor([], 'println("Hello")'));
    expect(builder.toString(false)).toBe(`constructor() {${EOL}    println("Hello")${EOL}}${EOL}`);
  });

  it('should write access modifiers if they exist', () => {
    builder.append(ktConstructor([], null, { accessModifier: 'private' }));
    expect(builder.toString(false)).toBe(`private constructor() {}${EOL}`);
  });

  it('should write all annotations', () => {
    builder.append(ktConstructor([], null, { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
    expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}constructor() {}${EOL}`);
  });

  it('should write delegation without arguments', () => {
    builder.append(ktConstructor([], null, { delegateTarget: 'this' }));
    expect(builder.toString(false)).toBe(`constructor() : this() {}${EOL}`);
  });

  it('should write delegation with arguments', () => {
    builder.append(ktConstructor([], null, { delegateTarget: 'super', delegateArguments: ['42', 'true'] }));
    expect(builder.toString(false)).toBe(`constructor() : super(42, true) {}${EOL}`);
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
      normalizeEOL(8)(
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
      normalizeEOL(8)(
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
