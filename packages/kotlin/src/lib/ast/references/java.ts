import { ktReference } from '../nodes/reference';

// java.lang
export const system = ktReference.factory('System', 'java.lang');
export const illegalStateException = ktReference.factory('IllegalStateException', 'java.lang');
export const unsupportedOperationException = ktReference.factory('UnsupportedOperationException', 'java.lang');

// java.io
export const ioException = ktReference.factory('IOException', 'java.io');

// java.time
export const offsetDateTime = ktReference.factory('OffsetDateTime', 'java.time');

// java.util
export const optional = ktReference.genericFactory<1>('Optional', 'java.util');
