import { dirname, join, relative, resolve, basename } from 'path';
import { ensureDir, pathExists, readFile, remove, writeFile } from 'fs-extra';
import * as util from 'util';
import { spawn } from 'child_process';
import { toCasing } from '@goast/core/utils';
import { nxRootDir } from './paths';

type VerifyError = 'no-expect-file' | 'verify-failed';

export async function verify(data: unknown): Promise<void> {
  const { expectFile, actualFile } = await getVerifyFilePaths();
  const text = dataToText(data);

  const error = await verifyText(text, expectFile);

  if (error) {
    await writeFile(actualFile, text);
    openDiffTool(actualFile, expectFile);
    throw new Error(getErrorMessage(error, actualFile));
  } else {
    await remove(actualFile);
  }
}

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function cutString(text: string, length: number) {
  return text.length > length ? text.substring(0, length) : text;
}

function dataToText(data: unknown, depth: number = 100): string {
  let text = typeof data === 'string' ? data : util.inspect(data, { depth });
  text = text.replace(new RegExp(escapeRegExp(nxRootDir.replace(/\\/g, '\\\\')), 'g'), '<root>');
  return text;
}

async function getVerifyFilePaths(): Promise<{ expectFile: string; actualFile: string }> {
  const { currentTestName, testPath } = expect.getState();
  if (!currentTestName || !testPath) {
    throw new Error('Unable to determine test name or path.');
  }

  const verifyDir = join(dirname(testPath), '.verify', basename(testPath, '.spec.ts'));
  await ensureDir(verifyDir);

  const kebabTestName = cutString(toCasing(currentTestName, 'kebab'), 80);
  const verifyFileBase = join(verifyDir, kebabTestName);
  const expectFile = verifyFileBase + '.expect.txt';
  const actualFile = verifyFileBase + '.actual.txt';

  return { expectFile, actualFile };
}

async function verifyText(text: string, expectFile: string): Promise<VerifyError | undefined> {
  if (await pathExists(expectFile)) {
    const expected = (await readFile(expectFile)).toString();

    if (text.replace(/\r/g, '') !== expected.replace(/\r/g, '')) {
      return 'verify-failed';
    }
  } else {
    await writeFile(expectFile, '');
    return 'no-expect-file';
  }

  return undefined;
}

function openDiffTool(actualFile: string, expectFile: string): void {
  if (!process.env['CI']) {
    spawn('code', ['--diff', actualFile, expectFile], { detached: true, shell: true });
  }
}

function getErrorMessage(error: VerifyError, actualFile: string): string {
  switch (error) {
    case 'no-expect-file':
      return `Check "${actualFile}" for actual results and rename to '.expect.txt' if everything is right.`;
    case 'verify-failed':
      return `Verify failed. Check "${actualFile}" for actual results.`;
  }
}
