import { join } from 'node:path';

import { describe, it } from '@std/testing/bdd';

import { OpenApiParser } from '@goast/core';
import { declutterApiData, discoverSpecs, serializeNormalized, snapshotRootDir, verifyText } from '@goast/test-harness';

const specs = await discoverSpecs();

describe('core model', () => {
  for (const spec of specs) {
    it(`${spec.versionDir}/${spec.name}`, async () => {
      const data = await new OpenApiParser().parseApisAndTransform(spec.files);

      // The dereferenced document is a huge cyclic graph and is not what this snapshot is about.
      for (const schema of Object.values(data.schemas)) {
        delete (schema.$src as Record<string, unknown>).document;
      }
      declutterApiData(data);

      await verifyText(
        join(snapshotRootDir, 'core', spec.versionDir, spec.name, 'model.txt'),
        // Paths are rewritten on the value, not on the rendered text: `util.inspect` picks its line
        // breaks from the raw width, so normalizing afterwards would bake this checkout's path
        // length into the snapshot.
        serializeNormalized(data) + '\n',
      );
    });
  }
});
