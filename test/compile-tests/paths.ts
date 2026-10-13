import { join } from 'node:path';

import { repoRootDir } from '@goast/test-harness';

/**
 * Root of the committed compile diagnostics.
 *
 * Deliberately outside `test/output`, which means "written by a generator": mixing in files written by
 * a compiler would blur that, and tier 2's orphan sweep walks `test/output` and would report every
 * diagnostics file as an orphan.
 */
export const compileRootDir: string = join(repoRootDir, 'test', 'compile');
