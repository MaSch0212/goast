import { AppendValue, Prettify, StringBuilder } from '../utils';

type _ClassMembers<T, R extends keyof T = never, X extends keyof T = never> = { [K in R]: T[K] } & {
  [K in keyof T as K extends R | X ? never : K]?: T[K];
};
export type AstNodeOptions<
  TNode extends InstanceType<TBase>,
  TBase extends abstract new (...args: any) => any,
  R extends keyof TNode = never,
  X extends keyof TNode = never
> = Prettify<
  _ClassMembers<TNode, R, X | Exclude<keyof InstanceType<TBase>, 'inject'>> &
    NonNullable<Omit<ConstructorParameters<TBase>[0], 'inject'>>
>;

export abstract class AstNode<TBuilder extends StringBuilder = StringBuilder, TInjects extends string = never> {
  public inject: {
    before?: AppendValue<TBuilder>;
    after?: AppendValue<TBuilder>;
  } & {
    [K in TInjects]?: AppendValue<TBuilder>;
  };

  constructor(options: _ClassMembers<AstNode<TBuilder>, never, 'write'>) {
    this.inject = options.inject ?? {};
  }

  public write(builder: TBuilder): void {
    this.writeWithInjects(builder, () => this.onWrite(builder));
  }

  protected abstract onWrite(builder: TBuilder): void;

  protected writeWithInjects(builder: TBuilder, write: () => void): void {
    builder.append(this.inject.before);
    write();
    builder.append(this.inject.after);
  }
}
