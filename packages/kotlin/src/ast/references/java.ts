/**
 * Pre-built references to Java standard library types.
 *
 * The `java.lang` package is in the default `globalImports`, so no `import` is emitted for its references unless
 * `globalImports` is changed. References from the other packages in this file always emit an `import`.
 */
import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// java.io
/** Reference to `File` from the `java.io` package. */
export const file: KtReferenceFactory = ktReference.factory('File', 'java.io');
/** Reference to `IOException` from the `java.io` package. */
export const ioException: KtReferenceFactory = ktReference.factory('IOException', 'java.io');

// java.lang
/** Reference to `IllegalStateException` from the `java.lang` package. */
export const illegalStateException: KtReferenceFactory = ktReference.factory('IllegalStateException', 'java.lang');
/** Reference to `System` from the `java.lang` package. */
export const system: KtReferenceFactory = ktReference.factory('System', 'java.lang');
/** Reference to `UnsupportedOperationException` from the `java.lang` package. */
export const unsupportedOperationException: KtReferenceFactory = ktReference.factory(
  'UnsupportedOperationException',
  'java.lang',
);
/** Reference to `Void` from the `java.lang` package. Named `void_` because `void` is reserved in TypeScript. */
export const void_: KtReferenceFactory = ktReference.factory('Void', 'java.lang');

// java.net
/** Reference to `URI` from the `java.net` package. */
export const uri: KtReferenceFactory = ktReference.factory('URI', 'java.net');

// java.time
/** Reference to `OffsetDateTime` from the `java.time` package. */
export const offsetDateTime: KtReferenceFactory = ktReference.factory('OffsetDateTime', 'java.time');
/** Reference to `OffsetTime` from the `java.time` package. */
export const offsetTime: KtReferenceFactory = ktReference.factory('OffsetTime', 'java.time');
/** Reference to `LocalDateTime` from the `java.time` package. */
export const localDateTime: KtReferenceFactory = ktReference.factory('LocalDateTime', 'java.time');
/** Reference to `LocalDate` from the `java.time` package. */
export const localDate: KtReferenceFactory = ktReference.factory('LocalDate', 'java.time');
/** Reference to `LocalTime` from the `java.time` package. */
export const localTime: KtReferenceFactory = ktReference.factory('LocalTime', 'java.time');

// java.util
/** Reference to `Optional` from the `java.util` package. Takes one type argument. */
export const optional: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('Optional', 'java.util');
