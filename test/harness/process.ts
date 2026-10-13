import { spawn } from 'node:child_process';
import { constants } from 'node:os';

export type StdioMode = 'pipe' | 'ignore' | 'inherit';

export type RunCommandOptions = {
  /** Defaults to `pipe`. Only a piped stream is captured into the result. */
  stdout?: StdioMode;
  /** Defaults to `pipe`. Only a piped stream is captured into the result. */
  stderr?: StdioMode;
  /** Aborting SIGKILLs the process; the result then still resolves with its exit code. */
  signal?: AbortSignal;
};

export type CommandOutput = { code: number; stdout: string; stderr: string };

/**
 * Runs `command` to completion and captures its piped output as UTF-8.
 *
 * Resolves with any exit code, non-zero included. Rejects only when the process could not be spawned
 * (e.g. `ENOENT` for a missing executable).
 */
export function runCommand(command: string, args: readonly string[], options: RunCommandOptions = {}): Promise<CommandOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', options.stdout ?? 'pipe', options.stderr ?? 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', (error) => {
      reject(new Error(`Failed to run \`${command} ${args.join(' ')}\`: ${error.message}`, { cause: error }));
    });
    const kill = () => child.kill('SIGKILL');
    options.signal?.addEventListener('abort', kill, { once: true });
    child.on('close', (code, signal) => {
      options.signal?.removeEventListener('abort', kill);
      resolve({
        code: exitCode(code, signal),
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      });
    });
  });
}

/** A signal-killed process reports `128 + signo`, the shell convention. */
export function exitCode(code: number | null, signal: NodeJS.Signals | null): number {
  if (code !== null) return code;
  return 128 + (signal === null ? 0 : constants.signals[signal]);
}
