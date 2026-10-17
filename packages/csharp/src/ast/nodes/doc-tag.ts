import {
  type AstNodeOptions,
  type Nullable,
  type Prettify,
  type SingleOrMultiple,
  type SourceBuilder,
} from '@goast/core';

import { CsNode } from '../node.ts';
import { type CsAppendValue, writeCsNodes } from '../utils/write-cs-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The XML element name, e.g. `param`, `returns`, `typeparam`, `remarks`, `exception`. */
    tag: string;
    /** XML attributes of the element, e.g. `{ name: 'id' }` for `<param name="id">`. */
    attributes?: Nullable<Record<string, string>>;
    /** The text content. `&`, `<` and `>` are escaped unless `raw` is set. Without text, a self-closing element is written. */
    text?: Nullable<string>;
    /** Do not escape `text`, e.g. because it already contains XML such as `<see cref="Foo"/>`. */
    raw?: Nullable<boolean>;
    /** Always write the content on separate lines between the opening and closing tags. */
    block?: Nullable<boolean>;
  }
>;

/** Escapes the characters of `value` that are significant in XML documentation comments. */
export function escapeXmlDoc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class CsDocTag<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public tag: string;
  public attributes: Record<string, string>;
  public text: string | null;
  public raw: boolean;
  public block: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.tag = options.tag;
    this.attributes = options.attributes ?? {};
    this.text = options.text ?? null;
    this.raw = options.raw ?? false;
    this.block = options.block ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    const attributes = Object.entries(this.attributes)
      .map(([name, value]) => ` ${name}="${escapeXmlDoc(value).replace(/"/g, '&quot;')}"`)
      .join('');

    if (!this.text) {
      builder.append(`<${this.tag}${attributes} />`);
      return;
    }

    const text = this.raw ? this.text : escapeXmlDoc(this.text);
    if (this.block || /[\r\n]/.test(text)) {
      builder.appendLine(`<${this.tag}${attributes}>`).appendLine(text).append(`</${this.tag}>`);
    } else {
      builder.append(`<${this.tag}${attributes}>${text}</${this.tag}>`);
    }
  }
}

type _CsDocTagOpt<TBuilder extends SourceBuilder> = Prettify<Omit<Options<TBuilder>, 'tag' | 'text'>>;

const createDocTag = <TBuilder extends SourceBuilder>(
  tag: string,
  text?: Options<TBuilder>['text'],
  options?: _CsDocTagOpt<TBuilder>,
): CsDocTag<TBuilder> => new CsDocTag<TBuilder>({ ...options, tag, text });

const createNamedDocTag =
  (tag: string) =>
  <TBuilder extends SourceBuilder>(
    name: string,
    text?: Options<TBuilder>['text'],
    options?: _CsDocTagOpt<TBuilder>,
  ): CsDocTag<TBuilder> =>
    new CsDocTag<TBuilder>({ ...options, tag, text, attributes: { name, ...options?.attributes } });

const createCrefDocTag =
  (tag: string) =>
  <TBuilder extends SourceBuilder>(
    cref: string,
    text?: Options<TBuilder>['text'],
    options?: _CsDocTagOpt<TBuilder>,
  ): CsDocTag<TBuilder> =>
    new CsDocTag<TBuilder>({ ...options, tag, text, attributes: { cref, ...options?.attributes } });

const createTextDocTag =
  (tag: string, block: boolean) =>
  <TBuilder extends SourceBuilder>(text: string, options?: _CsDocTagOpt<TBuilder>): CsDocTag<TBuilder> =>
    new CsDocTag<TBuilder>({ block, ...options, tag, text });

const writeDocTags = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<CsAppendValue<TBuilder>>>,
): void => {
  writeCsNodes(builder, nodes, { separator: '\n' });
};

export const csDocTag: typeof createDocTag & {
  summary: ReturnType<typeof createTextDocTag>;
  remarks: ReturnType<typeof createTextDocTag>;
  returns: ReturnType<typeof createTextDocTag>;
  example: ReturnType<typeof createTextDocTag>;
  param: ReturnType<typeof createNamedDocTag>;
  typeparam: ReturnType<typeof createNamedDocTag>;
  exception: ReturnType<typeof createCrefDocTag>;
  write: typeof writeDocTags;
} = Object.assign(createDocTag, {
  summary: createTextDocTag('summary', true),
  remarks: createTextDocTag('remarks', true),
  returns: createTextDocTag('returns', false),
  example: createTextDocTag('example', true),
  param: createNamedDocTag('param'),
  typeparam: createNamedDocTag('typeparam'),
  exception: createCrefDocTag('exception'),
  write: writeDocTags,
});
