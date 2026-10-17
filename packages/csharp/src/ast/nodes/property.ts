import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import type { CsAccessModifier } from '../common.ts';
import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { type CsAppendValue, writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsAttribute } from './attribute.ts';
import type { CsDoc } from './doc.ts';
import type { CsType, CsValue } from './types.ts';

export type CsPropertyAccessorKind = 'get' | 'set' | 'init';

type AccessorInjects = 'attributes' | 'modifiers' | 'body';

type AccessorOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | AccessorInjects>,
  {
    kind: CsPropertyAccessorKind;
    /** A more restrictive access modifier than the property's, e.g. `private set`. */
    accessModifier?: Nullable<CsAccessModifier>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    /** The body. Without a body, an auto-implemented accessor (`get;`) is written. */
    body?: Nullable<CsAppendValue<TBuilder>>;
    /** Writes the body as an expression (`get => expr;`) instead of as a block. */
    singleExpression?: Nullable<boolean>;
  }
>;

export class CsPropertyAccessor<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | AccessorInjects
> {
  public kind: CsPropertyAccessorKind;
  public accessModifier: CsAccessModifier | null;
  public attributes: CsAttribute<TBuilder>[];
  public body: CsAppendValue<TBuilder> | null;
  public singleExpression: boolean;

  constructor(options: AccessorOptions<TBuilder, TInjects>) {
    super(options);
    this.kind = options.kind;
    this.accessModifier = options.accessModifier ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleExpression = options.singleExpression ?? false;
  }

  /** Writes the accessor without a trailing line break. */
  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: false });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.kind);

    if (!this.body) {
      builder.append(';');
    } else if (this.singleExpression) {
      builder.append(' => ', this.inject.beforeBody);
      builder.indent((b) => writeCsNode(b, this.body));
      builder.append(';', this.inject.afterBody);
    } else {
      builder.ensureCurrentLineEmpty().append(this.inject.beforeBody);
      builder.parenthesize('{}', (b) => writeCsNode(b, this.body), { multiline: true });
      builder.append(this.inject.afterBody);
    }
  }
}

type Injects = 'doc' | 'attributes' | 'modifiers' | 'type' | 'name' | 'accessors' | 'initializer' | 'expressionBody';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<CsDoc<TBuilder>>;
    name: string;
    type: CsType<TBuilder>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    accessModifier?: Nullable<CsAccessModifier>;
    /**
     * The accessors. The kind names are shorthands for auto-implemented accessors. Defaults to `['get', 'set']`, or to
     * no accessors if an `expressionBody` is given.
     */
    accessors?: Nullable<Nullable<CsPropertyAccessorKind | CsPropertyAccessor<TBuilder>>[]>;
    /** The initializer of an auto-implemented property: `{ get; set; } = value;`. */
    initializer?: Nullable<CsValue<TBuilder>>;
    /** An expression body: `Type Name => expr;`. */
    expressionBody?: Nullable<CsAppendValue<TBuilder>>;
    static?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    virtual?: Nullable<boolean>;
    override?: Nullable<boolean>;
    sealed?: Nullable<boolean>;
    /** The C# 11 `required` modifier. */
    required?: Nullable<boolean>;
  }
>;

export class CsProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: CsDoc<TBuilder> | null;
  public name: string;
  public type: CsType<TBuilder>;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public accessors: CsPropertyAccessor<TBuilder>[];
  public initializer: CsValue<TBuilder> | null;
  public expressionBody: CsAppendValue<TBuilder> | null;
  public static: boolean;
  public abstract: boolean;
  public virtual: boolean;
  public override: boolean;
  public sealed: boolean;
  public required: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.name = options.name;
    this.type = options.type;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.expressionBody = options.expressionBody ?? null;
    this.accessors = (options.accessors ?? (this.expressionBody ? [] : ['get', 'set']))
      .filter(notNullish)
      .map((a) => (typeof a === 'string' ? new CsPropertyAccessor<TBuilder>({ kind: a }) : a));
    this.initializer = options.initializer ?? null;
    this.static = options.static ?? false;
    this.abstract = options.abstract ?? false;
    this.virtual = options.virtual ?? false;
    this.override = options.override ?? false;
    this.sealed = options.sealed ?? false;
    this.required = options.required ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
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
    if (this.required) builder.append('required ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeType);
    writeCsNode(builder, this.type);
    builder.append(this.inject.afterType, ' ');

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.expressionBody) {
      builder.append(' => ', this.inject.beforeExpressionBody);
      builder.indent((b) => writeCsNode(b, this.expressionBody));
      builder.append(this.inject.afterExpressionBody, ';');
    } else if (this.accessors.length > 0) {
      builder.append(this.inject.beforeAccessors);
      if (this.accessors.every((a) => !a.body && a.attributes.length === 0)) {
        builder.append(' { ');
        builder.forEach(this.accessors, (b, a) => a.write(b), { separator: ' ' });
        builder.append(' }');
      } else {
        builder.ensureCurrentLineEmpty();
        builder.parenthesize(
          '{}',
          (b) =>
            b.forEach(this.accessors, (b, a) => {
              a.write(b);
              b.ensureCurrentLineEmpty();
            }),
          { multiline: true },
        );
      }
      builder.append(this.inject.afterAccessors);

      if (this.initializer) {
        builder.append(' = ', this.inject.beforeInitializer);
        writeCsNode(builder, this.initializer);
        builder.append(this.inject.afterInitializer, ';');
      }
    }

    builder.appendLine();
  }
}

const createPropertyAccessor = <TBuilder extends SourceBuilder>(
  kind: CsPropertyAccessorKind,
  options?: Prettify<Omit<AccessorOptions<TBuilder>, 'kind'>>,
): CsPropertyAccessor<TBuilder> => new CsPropertyAccessor<TBuilder>({ ...options, kind });

const createProperty = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsProperty<TBuilder> => new CsProperty<TBuilder>({ ...options, name });

export const csProperty: typeof createProperty & {
  accessor: typeof createPropertyAccessor;
  write: typeof writeCsNodes;
} = Object.assign(createProperty, {
  accessor: createPropertyAccessor,
  write: writeCsNodes,
});
