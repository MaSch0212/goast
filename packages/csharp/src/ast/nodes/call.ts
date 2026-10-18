import {
  type ArrayItem,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsGenericParameters } from '../utils/write-cs-generic-parameters.ts';
import { writeCsNodes } from '../utils/write-cs-node.ts';
import { type CsArgument, csArgument } from './argument.ts';
import type { CsType, CsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The parts of the call target, joined with `.` (e.g. `[Guid, 'NewGuid']` -> `Guid.NewGuid`). */
    path: Nullable<CsType<TBuilder> | CsValue<TBuilder>>[];
    /** The type arguments of the call, written after the last path part (`Foo<T>()`). */
    generics?: Nullable<Nullable<CsType<TBuilder>>[]>;
    /** The arguments. If omitted, no parentheses are written (member access); use `[]` for a call without arguments. */
    arguments?: Nullable<Nullable<CsArgument<TBuilder> | CsValue<TBuilder>>[]>;
    /** Prefixes the call with `await`. */
    await?: Nullable<boolean>;
  }
>;

export class CsCall<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public path: (CsType<TBuilder> | CsValue<TBuilder>)[];
  public generics: CsType<TBuilder>[];
  public arguments: (CsArgument<TBuilder> | CsValue<TBuilder>)[] | null;
  public await: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.path = options.path.filter(notNullish);
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.arguments = options.arguments?.filter(notNullish) ?? null;
    this.await = options.await ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.await) builder.append('await ');

    writeCsNodes(builder, this.path, { separator: '.' });
    writeCsGenericParameters(builder, this.generics);

    if (this.arguments) {
      csArgument.write(builder, this.arguments);
    }
  }
}

const createCall = <TBuilder extends SourceBuilder>(
  path: Options<TBuilder>['path'] | ArrayItem<Options<TBuilder>['path']>,
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'path' | 'arguments'>>,
): CsCall<TBuilder> => new CsCall<TBuilder>({ ...options, path: Array.isArray(path) ? path : [path], arguments: args });

export const csCall: typeof createCall & { write: typeof writeCsNodes } = Object.assign(createCall, {
  write: writeCsNodes,
});
