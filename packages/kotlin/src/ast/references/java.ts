import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// java.io
export const file: KtReferenceFactory = ktReference.factory('File', 'java.io');
export const ioException: KtReferenceFactory = ktReference.factory('IOException', 'java.io');

// java.lang
export const illegalStateException: KtReferenceFactory = ktReference.factory('IllegalStateException', 'java.lang');
export const system: KtReferenceFactory = ktReference.factory('System', 'java.lang');
export const unsupportedOperationException: KtReferenceFactory = ktReference.factory(
  'UnsupportedOperationException',
  'java.lang',
);

// java.time
export const offsetDateTime: KtReferenceFactory = ktReference.factory('OffsetDateTime', 'java.time');

// java.util
export const optional: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('Optional', 'java.util');
