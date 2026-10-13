/**
 * Removes this checkout's persistent Gradle project dir volume, so the next Kotlin compile gate runs
 * cold. Backs `test:compile:clean`; see `cleanGradleWorkCache` in `test/compile-tests/runners/kotlin.ts`.
 */
import { cleanGradleWorkCache } from '../test/compile-tests/runners/kotlin.ts';

await cleanGradleWorkCache();
