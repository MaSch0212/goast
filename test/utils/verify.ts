// @deno-types="npm:@types/fs-extra"
import { toKebabCase } from '@std/text';
import fs from 'fs-extra';
import { spawn } from 'node:child_process';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as util from 'node:util';
import { repoRootDir } from './paths.ts';

type VerifyError = 'no-expect-file' | 'verify-failed';

export class MultipartData extends Array<[key: string, value: unknown]> {}

export async function verify(t: Deno.TestContext, data: unknown): Promise<void> {
  const { expectFile, actualFile } = await getVerifyFilePaths(t);
  const text = dataToText(data);

  const error = await verifyText(text, expectFile);

  if (error) {
    await fs.writeFile(actualFile, text);
    openDiffTool(actualFile, expectFile);
    throw new Error(getErrorMessage(error, actualFile));
  } else if (await fs.exists(actualFile)) {
    await fs.remove(actualFile);
  }
}

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function cutString(text: string, length: number) {
  return text.length > length ? text.substring(0, length) : text;
}

function dataToText(data: unknown, depth: number = 100): string {
  if (typeof data === 'string') {
    return data;
  }

  let text: string;

  if (data instanceof MultipartData) {
    text = data
      .map(([key, value]) => {
        const normalizedKey = normalizePaths(key);
        return `${header(normalizedKey)}${dataToText(value, depth)}\n${footer(normalizedKey)}`;
      })
      .join('\n\n');
  } else {
    text = typeof data === 'string' ? data : util.inspect(data, { depth, sorted: true });
  }

  return normalizePaths(text);
}

function normalizePaths(text: string): string {
  const rootPathRegex = escapeRegExp(repoRootDir).replace(/\\\\/g, '(\\\\|\\\\\\\\|\\/)');
  const pathRegex = new RegExp(`${rootPathRegex}[a-zA-Z0-9-_\\\\\\/.]*`, 'g');
  return text.replace(
    pathRegex,
    (path) => '<root>/' + relative(repoRootDir, resolve(path.replace(/\\\\/g, '\\'))).replace(/\\/g, '/'),
  );
}

function header(name: string): string {
  const width = Math.max(40, name.length + 4);
  return (
    '' + `┌${'─'.repeat(width - 2)}┐\n` + `│ ${name}${' '.repeat(width - name.length - 4)} │\n` +
    `├${'─'.repeat(width - 2)}┤\n`
  );
}

function footer(name: string): string {
  const width = Math.max(40, name.length + 4);
  return `└${'─'.repeat(width - 2)}┘`;
}

async function getVerifyFilePaths(t: Deno.TestContext): Promise<{ expectFile: string; actualFile: string }> {
  const currentTestName = getFullTestName(t);
  const testPath = fileURLToPath(t.origin);
  if (!currentTestName || !testPath) {
    throw new Error('Unable to determine test name or path.');
  }

  const verifyDir = join(dirname(testPath), '.verify', basename(testPath).replace(/\.test\.[tj]s$/, ''));
  await fs.ensureDir(verifyDir);

  const kebabTestName = cutString(toKebabCase(currentTestName), 80);
  const verifyFileBase = join(verifyDir, kebabTestName);
  const expectFile = verifyFileBase + '.expect.txt';
  const actualFile = verifyFileBase + '.actual.txt';

  return { expectFile, actualFile };
}

function getFullTestName(t: Deno.TestContext): string {
  return t.parent ? getFullTestName(t.parent) + ' ' + t.name : t.name;
}

async function verifyText(text: string, expectFile: string): Promise<VerifyError | undefined> {
  if (await fs.exists(expectFile)) {
    const expected = (await fs.readFile(expectFile)).toString();

    if (text.replace(/\r/g, '') !== expected.replace(/\r/g, '')) {
      return 'verify-failed';
    }
  } else {
    await fs.writeFile(expectFile, '');
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
