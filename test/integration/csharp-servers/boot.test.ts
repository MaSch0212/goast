import { describe, expect, it } from 'vitest';

import { requireDocker } from '@goast/test-harness';

import { SERVER_UNITS } from './build.ts';
import { withServer } from './server.ts';

/** Same gate as the rest of tier 4's Docker legs: `pnpm test` must never start a container. */
const enabled = (process.env.GOAST_INTEGRATION ?? '') !== '';

if (enabled) await requireDocker();

describe.skipIf(!enabled)('integration/csharp-servers boot', () => {
  // One unit, not all three: this asserts the *infrastructure* — the offline restore and build, `dotnet run`, the
  // published port, readiness polling, and that the generated routes are mapped. `integration.test.ts` covers all
  // three. FastEndpoints is the one that needs a package, so it is the one whose offline restore can regress.
  const unit = SERVER_UNITS.find((u) => u.id === 'csharp/fastendpoints')!;

  it(
    'boots the generated server and routes a request to it',
    async () => {
      await withServer(unit, async (baseUrl, container) => {
        const response = await fetch(`${baseUrl}/pets/abc`);
        await response.body?.cancel();

        // Not a specific status: the case table decides what is correct. `404` is the failure that matters here — it
        // means the generated endpoints were never mapped, which could silently be wrong while the app still starts.
        expect(response.status, `GET /pets/abc\n${container.output()}`).not.toBe(404);
      });
    },
    20 * 60 * 1000,
  );
});
