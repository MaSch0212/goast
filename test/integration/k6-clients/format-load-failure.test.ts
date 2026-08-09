import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { formatLoadFailure } from './format-load-failure.ts';

// Captured verbatim against `grafana/k6:2.1.0` — the version `test/docker/k6/Dockerfile` pins — with the
// timestamp left in place as a stand-in for "changes every run"; the second test below proves that value does
// not survive.
//
// The envelope is version-specific and this sample must be recaptured whenever the pin moves: on `0.54.0` the
// same failure reads `GoError: The moduleSpecifier …`, whereas 2.x wraps it as
// `could not initialize '…': could not load JS test '…': The moduleSpecifier …`. The specifier itself —
// `../utils/request-builder`, the defect being recorded — is the part that is stable across both.
const SAMPLE_TIMESTAMP = '2026-08-09T18:03:50Z';

const SAMPLE = `time="${SAMPLE_TIMESTAMP}" level=error ` +
  "msg=\"could not initialize '/scripts/probe.js': could not load JS test 'file:///scripts/probe.js': " +
  'The moduleSpecifier \\"../utils/request-builder\\" couldn\'t be found on local disk. Make sure that ' +
  "you've specified the right path to the file. If you're running k6 using the Docker image make sure you " +
  'have mounted the local directory (-v /local/path/:/inside/docker/path) containing your script and ' +
  "modules so that they're accessible by k6 from inside of the container, see " +
  'https://grafana.com/docs/k6/latest/using-k6/modules/#use-modules-with-docker."';

describe('formatLoadFailure', () => {
  it('keeps the msg payload, unescaped, and drops the time/level/hint fields', () => {
    expect(formatLoadFailure(SAMPLE)).toEqual(
      "could not initialize '/scripts/probe.js': could not load JS test 'file:///scripts/probe.js': " +
        'The moduleSpecifier "../utils/request-builder" couldn\'t be found on local disk. Make sure that ' +
        "you've specified the right path to the file. If you're running k6 using the Docker image make sure " +
        'you have mounted the local directory (-v /local/path/:/inside/docker/path) containing your script ' +
        "and modules so that they're accessible by k6 from inside of the container, see " +
        'https://grafana.com/docs/k6/latest/using-k6/modules/#use-modules-with-docker.\n',
    );
  });

  // The whole point of the artifact: whatever the envelope, the unresolved specifier has to survive, because
  // that string *is* the recorded defect.
  it('preserves the unresolved specifier, which is the finding', () => {
    expect(formatLoadFailure(SAMPLE)).toContain('"../utils/request-builder"');
  });

  // Not cosmetic: every other committed tier-4 artifact ends with a newline, and without one git reports
  // `\ No newline at end of file` on every future diff of this file.
  it('ends with exactly one trailing newline', () => {
    const formatted = formatLoadFailure(SAMPLE);

    expect(formatted.endsWith('\n')).toBe(true);
    expect(formatted.endsWith('\n\n')).toBe(false);
  });

  // The empty return is a sentinel meaning "not a recognizable k6 error", and `verifyTargetLoadFailure` keys
  // its delete-the-stale-file branch off exactly that, so it must stay empty rather than becoming a bare "\n".
  it('returns an empty string, not a newline, when there is no msg field', () => {
    expect(formatLoadFailure('nothing here')).toBe('');
  });

  // `SAMPLE_TIMESTAMP` rather than a literal. An earlier revision hardcoded a timestamp that no longer appeared
  // in `SAMPLE` after it was recaptured against a newer k6, which made `replace` a no-op — so this test compared
  // `formatLoadFailure(SAMPLE)` with itself and would have passed with the timestamp left in. The assertion
  // below proves the substitution actually changed the input, so the tautology cannot come back.
  it('is deterministic across two runs whose only difference is the timestamp', () => {
    const other = SAMPLE.replace(SAMPLE_TIMESTAMP, '2099-01-01T00:00:00Z');

    expect(other, 'SAMPLE_TIMESTAMP no longer occurs in SAMPLE — recapture one or the other').not.toEqual(SAMPLE);
    expect(formatLoadFailure(other)).toEqual(formatLoadFailure(SAMPLE));
  });

  it('drops the timestamp entirely', () => {
    expect(formatLoadFailure(SAMPLE)).not.toContain(SAMPLE_TIMESTAMP);
    expect(formatLoadFailure(SAMPLE)).not.toContain('time=');
  });

  it('returns an empty string when the output has no msg field', () => {
    expect(formatLoadFailure('some unrelated output with no logrus fields')).toEqual('');
  });

  // Latent until k6 emits more than one log line, which it is free to do at any release: without the
  // `level=error` anchor this took the *first* `msg=` and would have recorded "warming up" as the finding.
  it('takes the error line, not an earlier info line', () => {
    const noisy = `time="2026-01-01T00:00:00Z" level=info msg="warming up"\n${SAMPLE}`;

    expect(formatLoadFailure(noisy)).toEqual(formatLoadFailure(SAMPLE));
    expect(formatLoadFailure(noisy)).not.toContain('warming up');
  });

  // Sequential `\n`-then-`\"` replacements mangle this: the first turns the escaped-backslash's `n` into a real
  // newline and leaves a stray backslash behind.
  it('unescapes a literal backslash without splitting it', () => {
    const withPath = 'level=error msg="cannot open C:\\\\next\\\\file"';

    expect(formatLoadFailure(withPath)).toEqual('cannot open C:\\next\\file\n');
  });
});
