import { AppendValue, Prettify, StringBuilder } from '../utils';

export type AstNodeInject<TBuilder extends StringBuilder, TInjects extends string> = {
  [K in `${'after' | 'before'}${Capitalize<TInjects>}`]?: AppendValue<TBuilder>;
};

export type AstNodeOptions<
  TBase extends abstract new (...args: any) => any,
  TExtensions extends object = {},
> = Prettify<TExtensions & ConstructorParameters<TBase>[0]>;

export abstract class AstNode<TBuilder extends StringBuilder = StringBuilder, TInjects extends string = never> {
  public inject: AstNodeInject<TBuilder, TInjects | ''>;

  constructor(options: { inject?: AstNode<TBuilder, TInjects>['inject'] }) {
    this.inject = options.inject ?? {};
  }

  public write(builder: TBuilder): void {
    builder.append(this.inject.before);
    this.onWrite(builder);
    builder.append(this.inject.after);
  }

  protected abstract onWrite(builder: TBuilder): void;
}
