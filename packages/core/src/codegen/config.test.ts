import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { defaultOpenApiGeneratorConfig } from './config.ts';

describe('defaultOpenApiGeneratorConfig', () => {
  it('defaults outputDir to generated', () => {
    expect(defaultOpenApiGeneratorConfig.outputDir).toBe('generated');
  });

  it('clears the output directory by default', () => {
    expect(defaultOpenApiGeneratorConfig.clearOutputDir).toBe(true);
  });

  it('errors on an existing file by default, rather than overwriting or counting', () => {
    expect(defaultOpenApiGeneratorConfig.existingFileBehavior).toBe('error');
  });
});
