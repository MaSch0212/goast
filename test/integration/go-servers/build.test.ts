import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { APP_DIR, buildCommand, DRIVER_DIR, MODULE_PATH, READINESS_PATH, SERVER_PORT, TREE_DIR } from './build.ts';

describe('buildCommand', () => {
  it('stops at the first failing step', () => {
    // Without it a failed build would still reach `exec`, and the container would die with a message about a
    // missing binary instead of the compiler's.
    expect(buildCommand().split('\n')[0]).toBe('set -e');
  });

  it('starts the server in the foreground as the last thing it does', () => {
    expect(buildCommand().trimEnd().endsWith(`exec ${APP_DIR}/server`)).toBe(true);
  });

  it('declares the module the generated package and the driver import', () => {
    expect(buildCommand()).toContain(`module ${MODULE_PATH}`);
    expect(readFileSync(join(DRIVER_DIR, 'main.go'), 'utf8')).toContain(`"${MODULE_PATH}/api"`);
  });
});

describe('the mounted trees', () => {
  it('mounts the directory that contains the generated api package', () => {
    expect(existsSync(join(TREE_DIR, 'api', 'server_runtime.go'))).toBe(true);
  });

  it('serves readiness and listens on the port the test publishes', () => {
    const driver = readFileSync(join(DRIVER_DIR, 'main.go'), 'utf8');

    expect(driver).toContain(`"GET ${READINESS_PATH}"`);
    expect(driver).toContain(`":${SERVER_PORT}"`);
  });
});
