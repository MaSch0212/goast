import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// okhttp3
export const okHttpClient: KtReferenceFactory = ktReference.factory('Factory', 'okhttp3.Call');
export const httpUrl: KtReferenceFactory = ktReference.factory('HttpUrl', 'okhttp3');
