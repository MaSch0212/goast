/**
 * Empties the persistent Gradle work directory `.goast-cache/gradle-work`. Backs `test:compile:clean`.
 *
 * This used to be a bare `rm -rf`, which fails on Linux: the compile gate's containers write into that
 * directory as their own user, and the host user cannot delete what it does not own. The removal lives
 * beside the ephemeral one it shares a fallback with, in `test/compile-tests/runners/kotlin.ts`.
 */
import { cleanGradleWorkCache } from '../test/compile-tests/runners/kotlin.ts';

await cleanGradleWorkCache();
