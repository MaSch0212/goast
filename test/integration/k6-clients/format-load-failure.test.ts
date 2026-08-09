import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { formatLoadFailure } from './format-load-failure.ts';

// Captured against `grafana/k6:0.54.0` (see the plan's measurements section), with the timestamp left in place
// as a stand-in for "changes every run" — the second test below proves that value does not survive.
const SAMPLE = 'time="2026-08-09T17:57:23Z" level=error msg="GoError: The moduleSpecifier ' +
  '\\"../utils/request-builder\\" couldn\'t be found on local disk. Make sure that you\'ve specified the right ' +
  "path to the file. If you're running k6 using the Docker image make sure you have mounted the local " +
  "directory (-v /local/path/:/inside/docker/path) containing your script and modules so that they're " +
  'accessible by k6 from inside of the container, see ' +
  'https://grafana.com/docs/k6/latest/using-k6/modules/#using-local-modules-with-docker.\\n" ' +
  'hint="script exception"';

describe('formatLoadFailure', () => {
  it('keeps the msg payload, unescaped, and drops the time/level/hint fields', () => {
    expect(formatLoadFailure(SAMPLE)).toEqual(
      'GoError: The moduleSpecifier "../utils/request-builder" couldn\'t be found on local disk. Make sure ' +
        "that you've specified the right path to the file. If you're running k6 using the Docker image make " +
        'sure you have mounted the local directory (-v /local/path/:/inside/docker/path) containing your ' +
        "script and modules so that they're accessible by k6 from inside of the container, see " +
        'https://grafana.com/docs/k6/latest/using-k6/modules/#using-local-modules-with-docker.',
    );
  });

  it('is deterministic across two runs whose only difference is the timestamp', () => {
    const other = SAMPLE.replace('2026-08-09T17:57:23Z', '2099-01-01T00:00:00Z');

    expect(formatLoadFailure(other)).toEqual(formatLoadFailure(SAMPLE));
  });

  it('drops the timestamp entirely', () => {
    expect(formatLoadFailure(SAMPLE)).not.toContain('2026-08-09T17:57:23Z');
    expect(formatLoadFailure(SAMPLE)).not.toContain('time=');
  });

  it('returns an empty string when the output has no msg field', () => {
    expect(formatLoadFailure('some unrelated output with no logrus fields')).toEqual('');
  });
});
