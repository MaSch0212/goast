/**
 * The visibility modifier written before a declaration, such as `private` in `private interface Foo`.
 * A declaration with no visibility modifier is written without a keyword, so Kotlin's default of `public` applies.
 */
export type KtAccessModifier = 'public' | 'protected' | 'internal' | 'private';
