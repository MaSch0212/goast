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
import type { CsAttribute } from './attribute.ts';
import { type CsDoc, csDoc } from './doc.ts';
import { type CsGenericParameter, csGenericParameter } from './generic-parameter.ts';
import { CsInterface } from './interface.ts';
import { type CsParameter, csParameter } from './parameter.ts';
import type { CsType } from './types.ts';

type Injects =
  | 'doc'
  | 'attributes'
  | 'modifiers'
  | 'returnType'
  | 'name'
  | 'generics'
  | 'parameters'
  | 'constraints'
  | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<CsDoc<TBuilder>>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    accessModifier?: Nullable<CsAccessModifier>;
    generics?: Nullable<Nullable<CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** The parameters. Mark the first one with `this: true` to declare an extension method. */
    parameters?: Nullable<Nullable<CsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** The return type. Defaults to `void`. */
    returnType?: Nullable<CsType<TBuilder>>;
    /**
     * The body. Abstract methods, and methods without a body in an interface, are written as a declaration ending in
     * `;`. Any other method without a body gets an empty block.
     */
    body?: Nullable<CsAppendValue<TBuilder>>;
    /** Writes the body as an expression (`=> expr;`) instead of as a block. */
    singleExpression?: Nullable<boolean>;
    static?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    virtual?: Nullable<boolean>;
    override?: Nullable<boolean>;
    sealed?: Nullable<boolean>;
    async?: Nullable<boolean>;
    /** The `partial` modifier. A partial method without a body is a declaration terminated by `;`. */
    partial?: Nullable<boolean>;
  }
>;

export class CsMethod<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: CsDoc<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public generics: (CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public parameters: (CsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public returnType: CsType<TBuilder> | null;
  public body: CsAppendValue<TBuilder> | null;
  public singleExpression: boolean;
  public static: boolean;
  public abstract: boolean;
  public virtual: boolean;
  public override: boolean;
  public sealed: boolean;
  public async: boolean;
  public partial: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
    this.singleExpression = options.singleExpression ?? false;
    this.static = options.static ?? false;
    this.abstract = options.abstract ?? false;
    this.virtual = options.virtual ?? false;
    this.override = options.override ?? false;
    this.sealed = options.sealed ?? false;
    this.async = options.async ?? false;
    this.partial = options.partial ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    csDoc.get(this.doc, { generics: this.generics, parameters: this.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.abstract) builder.append('abstract ');
    if (this.virtual) builder.append('virtual ');
    if (this.sealed) builder.append('sealed ');
    if (this.override) builder.append('override ');
    if (this.partial) builder.append('partial ');
    if (this.async) builder.append('async ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeReturnType);
    writeCsNode(builder, this.returnType ?? 'void');
    builder.append(this.inject.afterReturnType, ' ');

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    csGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    builder.append(this.inject.beforeParameters);
    csParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParameters);

    builder.append(this.inject.beforeConstraints);
    csGenericParameter.writeConstraints(builder, this.generics);
    builder.append(this.inject.afterConstraints);

    const isInInterface = this.getParentNode(builder) instanceof CsInterface;
    if (this.abstract || (!this.body && (isInInterface || this.partial))) {
      builder.appendLine(';');
    } else if (this.singleExpression && this.body) {
      builder.append(' => ', this.inject.beforeBody);
      builder.indent((b) => writeCsNode(b, this.body));
      builder.appendLine(';', this.inject.afterBody);
    } else {
      builder.ensureCurrentLineEmpty().append(this.inject.beforeBody);
      builder.parenthesize('{}', (b) => writeCsNode(b, this.body), { multiline: true });
      builder.appendLine(this.inject.afterBody);
    }
  }
}

const createMethod = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsMethod<TBuilder> => new CsMethod<TBuilder>({ ...options, name });

export const csMethod: typeof createMethod & { write: typeof writeCsNodes } = Object.assign(createMethod, {
  write: writeCsNodes,
});
