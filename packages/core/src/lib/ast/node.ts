import { AppendValue, Prettify, StringBuilder } from '../utils';

export type AstNode<TLang extends string, TKind extends string, TBuilder extends StringBuilder = StringBuilder> = {
  lang: TLang;
  kind: TKind;
  inject: {
    before: AppendValue<TBuilder>;
    after: AppendValue<TBuilder>;
  };
};

export type AstNodeOptions<
  TNode,
  TOmit extends Exclude<keyof TNode, 'kind' | 'lang' | 'inject'> = never,
  TRequired extends Exclude<keyof TNode, 'kind' | 'lang' | 'inject'> = never
> = Prettify<
  {
    [K in TRequired]: TNode[K];
  } & {
    [K in Exclude<keyof TNode, TRequired | TOmit | 'kind' | 'lang' | 'inject'>]?: TNode[K];
  } & (TNode extends { inject: object } ? { inject?: Partial<TNode['inject']> } : {})
>;

export function astNode<TLang extends string, TKind extends string, TBuilder extends StringBuilder = StringBuilder>(
  lang: TLang,
  kind: TKind,
  options?: AstNodeOptions<AstNode<TLang, TKind, TBuilder>>
): AstNode<TLang, TKind, TBuilder> {
  return {
    lang,
    kind,
    inject: { before: options?.inject?.before, after: options?.inject?.after },
  };
}

export function isAstNode<TBuilder extends StringBuilder = StringBuilder>(
  value: unknown
): value is AstNode<string, string, TBuilder>;
export function isAstNode<TLang extends string, TBuilder extends StringBuilder = StringBuilder>(
  value: unknown,
  lang: TLang
): value is AstNode<TLang, string, TBuilder>;
export function isAstNode<TLang extends string, TKind extends string, TBuilder extends StringBuilder = StringBuilder>(
  value: unknown,
  lang: TLang,
  kind: TKind
): value is AstNode<TLang, TKind, TBuilder>;
export function isAstNode<TLang extends string, TKind extends string, TBuilder extends StringBuilder = StringBuilder>(
  value: unknown,
  lang?: TLang,
  kind?: TKind
): value is AstNode<TLang, TKind, TBuilder> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lang' in value &&
    (lang === undefined || value.lang === lang) &&
    'kind' in value &&
    (kind === undefined || value.kind === kind)
  );
}
