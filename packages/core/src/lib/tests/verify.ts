import { dirname, join, relative } from 'path';
import { toCasing } from '../utils/string.utils.js';
import { ensureDir, pathExists, readFile, remove, writeFile } from 'fs-extra';
import * as util from 'util';
import { spawn } from 'child_process';

export async function verify(data: unknown): Promise<void> {
  let text = typeof data === 'string' ? data : util.inspect(data, undefined, 100);
  text = text.replace(new RegExp(escapeRegExp(__dirname.replace(/\\/g, '\\\\')), 'g'), '<root>');

  const jestState = expect.getState();
  const kebabTestName = toCasing(jestState.currentTestName!, 'kebab');
  const fileSafeTestName =
    kebabTestName.length > 80 ? kebabTestName.substring(0, 100) : kebabTestName;
  const verifyFileBase = join(
    __dirname,
    '.verify',
    removeExtension(relative(__dirname, jestState.testPath!)) + '-' + fileSafeTestName
  );
  const expectFile = verifyFileBase + '.expect.txt';
  const actualFile = verifyFileBase + '.actual.txt';

  await ensureDir(dirname(expectFile));
  let error: string | undefined;
  if (await pathExists(expectFile)) {
    const expected = (await readFile(expectFile)).toString();

    if (text.replace(/\r/g, '') !== expected.replace(/\r/g, '')) {
      error = 'Verify failed. Check ' + actualFile + ' for actual results.';
    }
  } else {
    await writeFile(expectFile, '');
    error =
      'Check ' +
      actualFile +
      " for actual results and rename to '.expect.txt' if everything is right.";
  }

  if (error) {
    await writeFile(actualFile, text);
    spawn('code', ['--diff', actualFile, expectFile], { detached: true, shell: true });
    throw new Error(error);
  } else if (await pathExists(actualFile)) {
    await remove(actualFile);
  }
}

function removeExtension(path: string) {
  return path.replace(/\.spec\.ts$/, '');
}

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
