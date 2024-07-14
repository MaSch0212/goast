import fs from 'fs-extra';
import path from 'path';

async function main() {
  const playgroundFile = path.resolve(import.meta.dirname, '../../playground/playground.ts');

  if (await fs.exists(playgroundFile)) return;

  console.log('Creating playground file...');
  await fs.writeFile(
    playgroundFile,
    `import { OpenApiGenerator } from '@goast/core';
import { TypeScriptModelsGenerator } from '@goast/typescript';

export async function main(): Promise<void> {
  await new OpenApiGenerator({ outputDir: 'out' })
    .useType(TypeScriptModelsGenerator)
    .parseAndGenerateFromDir('.openapi');
}
`,
  );
}

main();
