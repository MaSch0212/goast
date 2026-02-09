import { resolve } from 'node:path';

const rootDir = import.meta.dirname ? resolve(import.meta.dirname, '..') : '.';
const npmDir = resolve(rootDir, 'npm', Deno.args[0]);

const args = ['publish', '--access', 'public'];

const packageJson = JSON.parse(await Deno.readTextFile(resolve(npmDir, 'package.json')));
if (packageJson.version.includes('-')) {
  args.push('--tag', 'next');
}

const command = new Deno.Command('npm', {
  args,
  cwd: npmDir,
  stdout: 'inherit',
  stderr: 'inherit',
});
const { code } = await command.spawn().status;

if (code !== 0) {
  throw new Error(`npm publish failed with exit code ${code}`);
}
