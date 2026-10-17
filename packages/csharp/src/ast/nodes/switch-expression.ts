import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsValue } from './types.ts';

type Injects = never;

export type CsSwitchArm<TBuilder extends SourceBuilder> = {
  /** The pattern of the arm (`1`, `"a"`, `Foo foo`, `_`, ...). */
  pattern: CsValue<TBuilder>;
  /** An optional `when` guard. */
  when?: Nullable<CsValue<TBuilder>>;
  value: CsValue<TBuilder>;
};

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    subject: CsValue<TBuilder>;
    arms?: Nullable<Nullable<CsSwitchArm<TBuilder>>[]>;
  }
>;

/** A switch expression: `subject switch { pattern => value, _ => other }`. */
export class CsSwitchExpression<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public subject: CsValue<TBuilder>;
  public arms: CsSwitchArm<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.subject = options.subject;
    this.arms = options.arms?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    writeCsNode(builder, this.subject);
    builder.append(' switch').ensureCurrentLineEmpty();
    builder.parenthesize(
      '{}',
      (b) =>
        b.forEach(
          this.arms,
          (b, arm) => {
            writeCsNode(b, arm.pattern);
            if (arm.when) {
              b.append(' when ');
              writeCsNode(b, arm.when);
            }
            b.append(' => ');
            writeCsNode(b, arm.value);
          },
          { separator: ',\n' },
        ),
      { multiline: true },
    );
  }
}

const createSwitchExpression = <TBuilder extends SourceBuilder>(
  subject: Options<TBuilder>['subject'],
  arms?: Options<TBuilder>['arms'],
  options?: Prettify<Omit<Options<TBuilder>, 'subject' | 'arms'>>,
): CsSwitchExpression<TBuilder> => new CsSwitchExpression<TBuilder>({ ...options, subject, arms });

const createSwitchArm = <TBuilder extends SourceBuilder>(
  pattern: CsSwitchArm<TBuilder>['pattern'],
  value: CsSwitchArm<TBuilder>['value'],
  when?: CsSwitchArm<TBuilder>['when'],
): CsSwitchArm<TBuilder> => ({ pattern, value, when });

export const csSwitchExpression: typeof createSwitchExpression & {
  arm: typeof createSwitchArm;
  write: typeof writeCsNodes;
} = Object.assign(createSwitchExpression, {
  arm: createSwitchArm,
  write: writeCsNodes,
});
