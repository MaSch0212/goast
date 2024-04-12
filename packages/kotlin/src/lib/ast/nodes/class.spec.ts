import { EOL } from 'os';

import { appendValueGroup } from '@goast/core';
import { normalizeEOL } from '@goast/test/utils';

import { ktAnnotation } from './annotation';
import { ktClass } from './class';
import { ktConstructor } from './constructor';
import { ktDoc } from './doc';
import { ktFunction } from './function';
import { ktGenericParameter } from './generic-parameter';
import { ktInitBlock } from './init-block';
import { ktObject } from './object';
import { ktParameter } from './parameter';
import { ktProperty } from './property';
import { KotlinFileBuilder } from '../../file-builder';

describe('ktClass', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write class', () => {
    builder.append(ktClass('Foo'));
    expect(builder.toString(false)).toBe(`class Foo${EOL}`);
  });

  it('should write generics', () => {
    builder.append(ktClass('Foo', { generics: [ktGenericParameter('T'), ktGenericParameter('U')] }));
    expect(builder.toString(false)).toBe(`class Foo<T, U>${EOL}`);
  });

  it('should write primary constructor without body', () => {
    builder.append(ktClass('Foo', { primaryConstructor: ktConstructor([ktParameter.class('x', 'Int')], null) }));
    expect(builder.toString(false)).toBe(`class Foo(x: Int)${EOL}`);
  });

  it('should write primary constructor with body', () => {
    builder.append(
      ktClass('Foo', { primaryConstructor: ktConstructor([ktParameter.class('x', 'Int')], 'println(x)') }),
    );
    expect(builder.toString(false)).toBe(
      `class Foo(x: Int) {${EOL}    init {${EOL}        println(x)${EOL}    }${EOL}}${EOL}`,
    );
  });

  it('should write members', () => {
    builder.append(
      ktClass('Foo', {
        members: [
          ktConstructor([ktParameter('x', 'Int')], 'println(x)'),
          ktInitBlock('println("Hello")'),
          ktProperty('y', { type: 'Int?' }),
          ktProperty('z', { type: 'String?' }),
          ktFunction('bar', { parameters: [ktParameter('x', 'Int')], body: 'println(x)' }),
          ktClass('Bar'),
          '// Comment 1',
          appendValueGroup(['// Comment 2', '// Comment 3'], '\n'),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `class Foo {
            constructor(x: Int) {
                println(x)
            }

            init {
                println("Hello")
            }

            val y: Int?
            val z: String?

            fun bar(x: Int) {
                println(x)
            }

            class Bar

            // Comment 1
            // Comment 2
            // Comment 3
        }
        `,
      ),
    );
  });

  it('should write annotations', () => {
    builder.append(ktClass('Foo', { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
    expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}class Foo${EOL}`);
  });

  it('should write documentation', () => {
    builder.append(ktClass('Foo', { doc: ktDoc('This is a class') }));
    expect(builder.toString(false)).toBe(`/**${EOL} * This is a class${EOL} */${EOL}class Foo${EOL}`);
  });

  it('should write primary constructor parameter description', () => {
    builder.append(
      ktClass('Foo', {
        primaryConstructor: ktConstructor([ktParameter.class('x', 'Int', { description: 'The number' })]),
      }),
    );
    expect(builder.toString(false)).toBe(`/**${EOL} * @param x The number${EOL} */${EOL}class Foo(x: Int)${EOL}`);
  });

  it('should write primary constructor parameter property description', () => {
    builder.append(
      ktClass('Foo', {
        primaryConstructor: ktConstructor([
          ktParameter.class('x', 'Int', { property: 'readonly', propertyDescription: 'The number' }),
        ]),
      }),
    );
    expect(builder.toString(false)).toBe(
      `/**${EOL} * @property x The number${EOL} */${EOL}class Foo(val x: Int)${EOL}`,
    );
  });

  it('should ignore primary constructor parameter property description if property is not set', () => {
    builder.append(
      ktClass('Foo', {
        primaryConstructor: ktConstructor([ktParameter.class('x', 'Int', { propertyDescription: 'The number' })]),
      }),
    );
    expect(builder.toString(false)).toBe(`class Foo(x: Int)${EOL}`);
  });

  it('should write generic parameter description', () => {
    builder.append(ktClass('Foo', { generics: [ktGenericParameter('T', { description: 'The type' })] }));
    expect(builder.toString(false)).toBe(`/**${EOL} * @param T The type${EOL} */${EOL}class Foo<T>${EOL}`);
  });

  it('should write modifiers', () => {
    builder.append(ktClass('Foo', { accessModifier: 'private', open: true, abstract: true }));
    expect(builder.toString(false)).toBe(`private open abstract class Foo${EOL}`);
  });

  it('should write class kind', () => {
    builder.append(ktClass('Foo', { classKind: 'annotation' }));
    expect(builder.toString(false)).toBe(`annotation class Foo${EOL}`);
  });

  it('should write base class', () => {
    builder.append(ktClass('Foo', { extends: 'Bar' }));
    expect(builder.toString(false)).toBe(`class Foo : Bar${EOL}`);
  });

  it('should write base class constructor arguments', () => {
    builder.append(
      ktClass('Foo', {
        extends: 'Bar',
        primaryConstructor: ktConstructor([], null, { delegateTarget: 'super', delegateArguments: ['1337', '4711'] }),
      }),
    );
    expect(builder.toString(false)).toBe(`class Foo : Bar(1337, 4711)${EOL}`);
  });

  it('should write implemented interfaces', () => {
    builder.append(ktClass('Foo', { implements: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe(`class Foo : Bar, Baz${EOL}`);
  });

  it('should write companion object', () => {
    builder.append(ktClass('Foo', { companionObject: ktObject() }));
    expect(builder.toString(false)).toBe(`class Foo {${EOL}    companion object {}${EOL}}${EOL}`);
  });

  it('should write all parts of the class', () => {
    builder.append(
      ktClass('Foo', {
        generics: [ktGenericParameter('T'), ktGenericParameter('U')],
        primaryConstructor: ktConstructor([ktParameter.class('x', 'Int')], null, {
          delegateTarget: 'super',
          delegateArguments: ['x'],
        }),
        members: [ktProperty('y', { type: 'Int?' })],
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        doc: ktDoc('This is a class'),
        accessModifier: 'private',
        open: true,
        abstract: true,
        classKind: 'annotation',
        extends: 'Bar',
        implements: ['Baz'],
        companionObject: ktObject(),
      }),
    );
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `/**
         * This is a class
         */
        @Inject
        @Optional
        private open abstract annotation class Foo<T, U>(x: Int) : Bar(x), Baz {
            companion object {}

            val y: Int?
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      ktClass('Foo', {
        generics: [ktGenericParameter('T'), ktGenericParameter('U')],
        primaryConstructor: ktConstructor([ktParameter.class('x', 'Int')], null, {
          delegateTarget: 'super',
          delegateArguments: ['x'],
        }),
        members: [ktProperty('y', { type: 'Int?' })],
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        doc: ktDoc('This is a class'),
        accessModifier: 'private',
        open: true,
        abstract: true,
        classKind: 'annotation',
        extends: 'Bar',
        implements: ['Baz'],
        companionObject: ktObject(),
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
          beforeGenerics: '║bg║',
          afterGenerics: '║ag║',
          beforePrimaryConstructor: '║bpc║',
          afterPrimaryConstructor: '║apc║',
          beforeInheritList: '║bil║',
          afterInheritList: '║ail║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
          beforeMembers: '║bmb║',
          afterMembers: '║amb║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `║b║║bd║
        /**
         * This is a class
         */
        ║ad║║ba║@Inject
        @Optional
        ║aa║║bm║private open abstract annotation ║am║class ║bn║Foo║an║║bg║<T, U>║ag║║bpc║(x: Int)║apc║ : ║bil║Bar(x), Baz║ail║ ║bb║{
            ║bmb║companion object {}

            val y: Int?
            ║amb║
        }║ab║
        ║a║`,
      ),
    );
  });
});
