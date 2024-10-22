import {
  type AppendValue,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import type { KtDoc } from './doc.ts';
import type { KtType, KtValue } from './types.ts';

type AccessorInjects = 'annotations' | 'modifiers' | 'params' | 'body';

type AccessorOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | AccessorInjects>,
  {
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    singleExpression?: Nullable<boolean>;
  }
>;

export abstract class KtPropertyAccessor<
  TBuilder extends SourceBuilder,
  TInjects extends string = never,
> extends KtNode<TBuilder, TInjects | AccessorInjects> {
  public abstract get kind(): 'get' | 'set';
  public accessModifier: KtAccessModifier | null;
  public annotations: KtAnnotation<TBuilder>[];
  public body: AppendValue<TBuilder> | null;
  public singleExpression: boolean;

  constructor(options: AccessorOptions<TBuilder, TInjects>) {
    super(options);
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleExpression = options.singleExpression ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.kind);

    if (this.body) {
      builder.append(this.inject.beforeParams);
      builder.append(this.kind === 'set' ? '(value)' : '()');
      builder.append(this.inject.afterParams);

      if (this.singleExpression) {
        builder.append(' = ', this.inject.beforeBody);
        builder.indent(this.body);
      } else {
        builder.append(' ', this.inject.beforeBody);
        builder.parenthesize('{}', this.body, { multiline: true });
      }
      builder.append(this.inject.afterBody);
    }

    builder.appendLine();
  }
}
export class KtPropertyGetter<TBuilder extends SourceBuilder> extends KtPropertyAccessor<TBuilder> {
  public override readonly kind = 'get' as const;
}
export class KtPropertySetter<TBuilder extends SourceBuilder> extends KtPropertyAccessor<TBuilder> {
  public override readonly kind = 'set' as const;
}

type Injects = 'doc' | 'annotations' | 'modifiers' | 'name' | 'type' | 'default' | 'delegate';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<KtDoc<TBuilder>>;
    name: string;
    type?: KtType<TBuilder>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    getter?: Nullable<KtPropertyGetter<TBuilder>>;
    setter?: Nullable<KtPropertySetter<TBuilder>>;
    default?: Nullable<KtValue<TBuilder>>;
    delegate?: Nullable<KtType<TBuilder>>;
    delegateArguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
    mutable?: Nullable<boolean>;
    const?: Nullable<boolean>;
    lateinit?: Nullable<boolean>;
    open?: Nullable<boolean>;
    override?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
  }
>;

export class KtProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: KtDoc<TBuilder> | null;
  public name: string;
  public type: KtType<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier | null;
  public getter: KtPropertyGetter<TBuilder> | null;
  public setter: KtPropertySetter<TBuilder> | null;
  public default: KtValue<TBuilder> | null;
  public delegate: KtType<TBuilder> | null;
  public delegateArguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[] | null;
  public mutable: boolean;
  public const: boolean;
  public lateinit: boolean;
  public open: boolean;
  public override: boolean;
  public abstract: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.name = options.name;
    this.type = options.type ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.getter = options.getter ?? null;
    this.setter = options.setter ?? null;
    this.default = options.default ?? null;
    this.delegate = options.delegate ?? null;
    this.delegateArguments = options.delegateArguments?.filter(notNullish) ?? null;
    this.mutable = options.mutable ?? false;
    this.const = options.const ?? false;
    this.lateinit = options.lateinit ?? false;
    this.open = options.open ?? false;
    this.override = options.override ?? false;
    this.abstract = options.abstract ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.const) builder.append('const ');
    if (this.lateinit) builder.append('lateinit ');
    if (this.abstract) builder.append('abstract ');
    if (this.override) builder.append('override ');
    if (this.open) builder.append('open ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.mutable || !!this.setter ? 'var ' : 'val ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.type || (!this.default && !this.getter?.body)) {
      builder.append(': ', this.inject.beforeType);
      writeKtNode(builder, this.type ?? 'Any?');
      builder.append(this.inject.afterType);
    }

    if (this.default) {
      builder.append(' = ', this.inject.beforeDefault);
      writeKtNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }

    if (this.delegate) {
      builder.append(' by ', this.inject.beforeDelegate);
      writeKtNode(builder, this.delegate);
      if (this.delegateArguments) {
        ktArgument.write(builder, this.delegateArguments);
      }
      builder.append(this.inject.afterDelegate);
    }

    builder.appendLine();

    if (this.getter || this.setter) {
      builder.indent((b) => {
        this.getter?.write(b);
        this.setter?.write(b);
      });
    }

    builder.ensureCurrentLineEmpty();
  }
}

const createPropertyGetter = <TBuilder extends SourceBuilder>(
  options?: AccessorOptions<TBuilder>,
): KtPropertyGetter<TBuilder> => new KtPropertyGetter<TBuilder>(options ?? {});

const createPropertySetter = <TBuilder extends SourceBuilder>(
  options?: AccessorOptions<TBuilder>,
): KtPropertySetter<TBuilder> => new KtPropertySetter<TBuilder>(options ?? {});

const createProperty = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): KtProperty<TBuilder> => new KtProperty<TBuilder>({ ...options, name });

export const ktProperty: typeof createProperty & {
  getter: typeof createPropertyGetter;
  setter: typeof createPropertySetter;
  write: typeof writeKtNodes;
} = Object.assign(createProperty, {
  getter: createPropertyGetter,
  setter: createPropertySetter,
  write: writeKtNodes,
});
