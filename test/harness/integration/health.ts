/** Options for {@link waitForHttpReady}. */
export type WaitForHttpReadyOptions = {
  timeoutMs: number;
  /** False once the process being waited on has died. Polling stops immediately when it does. */
  isAlive: () => boolean;
  /** Called only on death, to build the error message. Should return the process's output. */
  describeDeath: () => string;
};

/**
 * Polls `url` until it answers with any HTTP status.
 *
 * *Any* status, deliberately: a Spring Boot app with no actuator and no route for this path answers
 * `404`, and `404` is proof the server is listening and routing. Requiring `2xx` would mean either
 * adding a health endpoint to the app under test — changing what is being measured — or depending on a
 * generated route, which is one of the things this phase is measuring and therefore cannot rely on.
 *
 * `isAlive` is checked every iteration so a container that died during startup fails here with its own
 * log instead of being waited out for the full timeout and reported as a timeout — which would bury a
 * compile error under a misleading symptom.
 */
export async function waitForHttpReady(url: string, options: WaitForHttpReadyOptions): Promise<void> {
  const deadline = Date.now() + options.timeoutMs;

  while (Date.now() < deadline) {
    if (!options.isAlive()) {
      throw new Error(`The process serving ${url} exited before becoming ready.\n\n${options.describeDeath()}`);
    }
    try {
      // The response body must be consumed or Deno leaks the connection and the test runner reports a
      // leaked resource, which reads like a bug in whatever test happened to run next.
      const response = await fetch(url);
      await response.body?.cancel();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`${url} did not become ready within ${options.timeoutMs}ms.\n\n${options.describeDeath()}`);
}
