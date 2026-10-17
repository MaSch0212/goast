/**
 * The case lines a tier-4 client driver prints, shared by every leg that runs a driver in a container.
 */

/** Sentinel prefix a driver puts on every line of case output, distinguishing it from Gradle's own noise. */
export const CASE_LINE_PREFIX = '##GOAST-CASE##';

/**
 * Extracts every case result a driver reported from a run's combined stdout/stderr.
 *
 * Only lines starting with {@link CASE_LINE_PREFIX} are considered; everything else (a build tool's task
 * headers, download noise, the final `BUILD SUCCESSFUL` banner of Gradle) is ignored rather than rejected, since
 * a driver's own case output is interleaved with Gradle's console output in the same stream.
 *
 * A sentinel line that fails to parse as JSON throws immediately, naming the offending line, rather
 * than being silently dropped: a dropped line would understate coverage, and a drift check comparing
 * reported case ids against the declared case table would then fail with "this case was never
 * reported" — a confusing symptom that points at the driver rather than at the real cause, which is
 * this line specifically.
 */
export function parseCaseLines(output: string): { caseId: string; result: unknown }[] {
  const results: { caseId: string; result: unknown }[] = [];

  for (const line of output.split('\n')) {
    if (!line.startsWith(CASE_LINE_PREFIX)) continue;
    const payload = line.slice(CASE_LINE_PREFIX.length);
    try {
      results.push(JSON.parse(payload) as { caseId: string; result: unknown });
    } catch (cause) {
      throw new Error(`Malformed ${CASE_LINE_PREFIX} line, could not parse as JSON: ${line}`, { cause });
    }
  }

  return results;
}
