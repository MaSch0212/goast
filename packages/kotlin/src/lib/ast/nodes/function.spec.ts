import { EOL } from 'os';

import { ktAnnotation } from './annotation';
import { ktDoc } from './doc';
import { ktFunction } from './function';
import { ktGenericParameter } from './generic-parameter';
import { ktParameter } from './parameter';
import { KotlinFileBuilder } from '../../file-builder';

describe('ktFunction', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write an empty function', () => {
    builder.append(ktFunction('foo'));
    expect(builder.toString(false)).toBe('fun foo() {}');
  });

  it('should write a function with generics', () => {
    builder.append(ktFunction('foo', { generics: [ktGenericParameter('T')] }));
    expect(builder.toString(false)).toBe('fun <T> foo() {}');
  });

  it('should write a function with a single parameter', () => {
    builder.append(ktFunction('foo', { parameters: [ktParameter('x', 'Int')] }));
    expect(builder.toString(false)).toBe('fun foo(x: Int) {}');
  });

  it('should write a function with a return type', () => {
    builder.append(ktFunction('foo', { returnType: 'Int' }));
    expect(builder.toString(false)).toBe('fun foo(): Int {}');
  });

  it('should write a function with a body', () => {
    builder.append(ktFunction('foo', { body: 'println("Hello")' }));
    expect(builder.toString(false)).toBe(`fun foo() {${EOL}    println("Hello")${EOL}}`);
  });

  it('should write access modifiers if they exist', () => {
    builder.append(ktFunction('foo', { accessibility: 'private' }));
    expect(builder.toString(false)).toBe('private fun foo() {}');
  });

  it('should write all annotations', () => {
    builder.append(ktFunction('foo', { annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')] }));
    expect(builder.toString(false)).toBe(`@Inject${EOL}@Optional${EOL}fun foo() {}`);
  });

  it('should write receiver type if it exists', () => {
    builder.append(ktFunction('foo', { receiverType: 'String' }));
    expect(builder.toString(false)).toBe('fun String.foo() {}');
  });

  it('should write receiver annotations if they exist and a receiver type exists', () => {
    builder.append(ktFunction('foo', { receiverType: 'String', receiverAnnotations: [ktAnnotation('Fancy')] }));
    expect(builder.toString(false)).toBe(`fun @Fancy String.foo() {}`);
  });

  it('shoudl not write receiver annotations if they exist and a receiver type does not exist', () => {
    builder.append(ktFunction('foo', { receiverAnnotations: [ktAnnotation('Fancy')] }));
    expect(builder.toString(false)).toBe(`fun foo() {}`);
  });

  it('should write single expression if configured and body exists', () => {
    builder.append(ktFunction('foo', { body: '42', singleExpression: true }));
    expect(builder.toString(false)).toBe('fun foo() = 42');
  });

  it('should not write single expression if configured and body does not exist', () => {
    builder.append(ktFunction('foo', { singleExpression: true }));
    expect(builder.toString(false)).toBe('fun foo() {}');
  });

  it('should write open keyword if configured', () => {
    builder.append(ktFunction('foo', { open: true }));
    expect(builder.toString(false)).toBe('open fun foo() {}');
  });

  it('should write inline keyword if configured', () => {
    builder.append(ktFunction('foo', { inline: true }));
    expect(builder.toString(false)).toBe('inline fun foo() {}');
  });

  it('should write infix keyword if configured', () => {
    builder.append(ktFunction('foo', { infix: true }));
    expect(builder.toString(false)).toBe('infix fun foo() {}');
  });

  it('should write tailrec keyword if configured', () => {
    builder.append(ktFunction('foo', { tailrec: true }));
    expect(builder.toString(false)).toBe('tailrec fun foo() {}');
  });

  it('should write operator keyword if configured', () => {
    builder.append(ktFunction('foo', { operator: true }));
    expect(builder.toString(false)).toBe('operator fun foo() {}');
  });

  it('should write override keyword if configured', () => {
    builder.append(ktFunction('foo', { override: true }));
    expect(builder.toString(false)).toBe('override fun foo() {}');
  });

  it('should write abstract keyword if configured', () => {
    builder.append(ktFunction('foo', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract fun foo()');
  });

  it('should write documenation if it exists', () => {
    builder.append(ktFunction('foo', { doc: ktDoc('This is a function') }));
    expect(builder.toString(false)).toBe(`/**${EOL} * This is a function${EOL} */${EOL}fun foo() {}`);
  });

  it('should write all the parts of the function', () => {
    builder.append(
      ktFunction('foo', {
        generics: [ktGenericParameter('T')],
        parameters: [ktParameter('x', 'Int')],
        returnType: 'Int',
        doc: ktDoc('This is a function'),
        body: 'println("Hello")',
        accessibility: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        receiverType: 'String',
        receiverAnnotations: [ktAnnotation('Fancy')],
        singleExpression: true,
        open: true,
        inline: true,
        infix: true,
        tailrec: true,
        operator: true,
        override: true,
      })
    );
    expect(builder.toString(false)).toBe(
      `/**${EOL} * This is a function${EOL} */${EOL}@Inject${EOL}@Optional${EOL}private inline infix tailrec open override operator fun <T> @Fancy String.foo(x: Int): Int = println("Hello")`
    );
  });

  it('should render injections', () => {
    builder.append(
      ktFunction('foo', {
        generics: [ktGenericParameter('T')],
        parameters: [ktParameter('x', 'Int')],
        doc: ktDoc('This is a function'),
        returnType: 'Int',
        body: 'println("Hello")',
        accessibility: 'private',
        annotations: [ktAnnotation('Inject'), ktAnnotation('Optional')],
        receiverType: 'String',
        receiverAnnotations: [ktAnnotation('Fancy')],
        singleExpression: true,
        open: true,
        inline: true,
        infix: true,
        tailrec: true,
        operator: true,
        override: true,
        inject: {
          before: '[bg]',
          after: '[ag]',
          beforeGenerics: '[bgg]',
          afterGenerics: '[agg]',
          beforeKeywords: '[bk]',
          afterKeywords: '[ak]',
          beforeName: '[bn]',
          afterName: '[an]',
          beforeParameters: '[bp]',
          afterParameters: '[ap]',
          beforeReturnType: '[br]',
          afterReturnType: '[ar]',
          beforeReceiverType: '[brt]',
          afterReceiverType: '[art]',
          beforeReceiverAnnotations: '[bra]',
          afterReceiverAnnotations: '[ara]',
          beforeAnnotations: '[ba]',
          afterAnnotations: '[aa]',
          beforeDoc: '[bd]',
          afterDoc: '[ad]',
        },
      })
    );
    expect(builder.toString(false)).toBe(
      `[bg][bd]${EOL}/**${EOL} * This is a function${EOL} */${EOL}[ad][ba]@Inject${EOL}@Optional${EOL}[aa]private [bk]inline infix tailrec open override operator [ak]fun [bgg]<T>[agg] [bra]@Fancy [ara][brt]String[art].[bn]foo[an][bp](x: Int)[ap]: [br]Int[ar] = println("Hello")[ag]`
    );
  });
});
