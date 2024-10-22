import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// okhttp3
export const okHttpClient: KtReferenceFactory = ktReference.factory('OkHttpClient', 'okhttp3');
export const httpUrl: KtReferenceFactory = ktReference.factory('HttpUrl', 'okhttp3');
