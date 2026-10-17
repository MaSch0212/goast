import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { CsAccessModifier } from '../common.ts';
import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { type CsAppendValue, writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import { type CsArgument, csArgument } from './argument.ts';
import type { CsAttribute } from './attribute.ts';
import { type CsDoc, csDoc } from './doc.ts';
import { type CsParameter, csParameter } from './parameter.ts';
import type { CsValue } from './types.ts';

type Injects = 'doc' | 'attributes' | 'modifiers' | 'name' | 'parameters' | 'initializer' | 'body';

export type CsDelegateTarget = 'base' | 'this';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The class name. Defaults to the name of the enclosing class/record. */
    name?: Nullable<string>;
    doc?: Nullable<CsDoc<TBuilder>>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    accessModifier?: Nullable<CsAccessModifier>;
    parameters?: Nullable<Nullable<CsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** Chains to another constructor: `: base(...)` or `: this(...)`. */
    delegateTarget?: Nullable<CsDelegateTarget>;
    delegateArguments?: Nullable<Nullable<CsArgument<TBuilder> | CsValue<TBuilder>>[]>;
    body?: Nullable<CsAppendValue<TBuilder>>;
    /** Writes the body as an expression (`=> expr;`) instead of as a block. */
    singleExpression?: Nullable<boolean>;
    /** Declares a static constructor. */
    static?: Nullable<boolean>;
  }
>;

export class CsConstructor<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string | null;
  public doc: CsDoc<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public parameters: (CsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public delegateTarget: CsDelegateTarget | null;
  public delegateArguments: (CsArgument<TBuilder> | CsValue<TBuilder>)[];
  public body: CsAppendValue<TBuilder> | null;
  public singleExpression: boolean;
  public static: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name ?? null;
    this.doc = options.doc ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.delegateTarget = options.delegateTarget ?? null;
    this.delegateArguments = options.delegateArguments?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleExpression = options.singleExpression ?? false;
    this.static = options.static ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    const name = this.name ?? this.getEnclosingTypeName(builder);
    if (!name) {
      throw new Error('A constructor needs a name: either set `name` or write it inside a class or record.');
    }

    builder.append(this.inject.beforeDoc);
    csDoc.get(this.doc, { parameters: this.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeName, name, this.inject.afterName);

    builder.append(this.inject.beforeParameters);
    csParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParameters);

    if (this.delegateTarget) {
      builder.append(' : ', this.inject.beforeInitializer, this.delegateTarget);
      csArgument.write(builder, this.delegateArguments);
      builder.append(this.inject.afterInitializer);
    }

    if (this.singleExpression && this.body) {
      builder.append(' => ', this.inject.beforeBody);
      builder.indent((b) => writeCsNode(b, this.body));
      builder.appendLine(';', this.inject.afterBody);
    } else {
      builder.ensureCurrentLineEmpty().append(this.inject.beforeBody);
      builder.parenthesize('{}', (b) => writeCsNode(b, this.body), { multiline: true });
      builder.appendLine(this.inject.afterBody);
    }
  }

  private getEnclosingTypeName(builder: TBuilder): string | undefined {
    const parent = this.getParentNode(builder);
    return parent !== undefined && 'name' in parent && typeof parent.name === 'string' ? parent.name : undefined;
  }
}

const createConstructor = <TBuilder extends SourceBuilder>(
  parameters?: Options<TBuilder>['parameters'],
  body?: Options<TBuilder>['body'],
  options?: Prettify<Omit<Options<TBuilder>, 'parameters' | 'body'>>,
): CsConstructor<TBuilder> => new CsConstructor<TBuilder>({ ...options, parameters, body });

export const csConstructor: typeof createConstructor & { write: typeof writeCsNodes } = Object.assign(
  createConstructor,
  {
    write: writeCsNodes,
  },
);
