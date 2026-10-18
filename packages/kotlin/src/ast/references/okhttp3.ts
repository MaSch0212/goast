/**
 * Pre-built references to OkHttp3 types.
 *
 * Each `export const` is a factory that creates a `KtReference` with the given name and package, so the
 * generated code imports the type automatically. See `KtReferenceFactory` for the optional `options`.
 */

import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// okhttp3
/** Reference to `Factory` nested in `okhttp3.Call`, used as the type of generated `client` parameters. */
export const okHttpClient: KtReferenceFactory = ktReference.factory('Factory', 'okhttp3.Call');
/** Reference to `HttpUrl` from the `okhttp3` package. */
export const httpUrl: KtReferenceFactory = ktReference.factory('HttpUrl', 'okhttp3');
