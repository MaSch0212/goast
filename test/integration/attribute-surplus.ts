/**
 * Attribution of surplus requests to the client cases that produced them, shared by the tier-4 client legs that
 * can fail before a request reaches the network (the Kotlin and Go legs).
 */
import type { ApiCase, RecordedRequest } from '../cases/cases.ts';

/**
 * Turns `/pets/{id}` into a pattern requiring a placeholder to stay within one path segment — the same
 * rule the reference server's own routing pattern uses (`ref-server.ts`'s `templateToPattern`). Tried
 * first, in {@link attributeSurplus} below, because it cannot conflate two *different* declared routes:
 * a strict single-segment match never swallows a trailing static segment another route requires (e.g.
 * `/pets/{id}` never matches `/pets/abc/photo`, which belongs to `/pets/{id}/photo`).
 */
function strictPathPattern(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

/**
 * Turns `/pets/{id}` into a pattern matching `/pets/` followed by *anything*, including embedded `/`
 * characters. A generated client that fails to percent-encode a `/` inside a path parameter produces
 * exactly this shape: the static portions of the template survive untouched, only the placeholder's
 * segment boundary breaks — measured directly against `spring-reactive-web-clients@sb3`'s `getEncoded`
 * case (see {@link attributeSurplus}'s doc comment).
 *
 * Deliberately only a fallback, tried in {@link attributeSurplus} after {@link strictPathPattern} finds
 * no match: on its own this pattern is not route-safe (`/pets/{id}` loosely matches `/pets/abc/photo`
 * too), so using it first could, for some future pair of routes, attribute a surplus request to the
 * wrong case.
 */
function loosePathPattern(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '.+');
  return new RegExp(`^${escaped}$`);
}

/**
 * Attributes each surplus (unmatched-route) request to the unmatched case whose route plausibly produced
 * it, and removes attributed entries from `surplusQueue` in place.
 *
 * Two passes, not one: {@link strictPathPattern} runs first over every unmatched case, so a request that
 * merely hit the wrong-but-well-formed route is never stolen by a looser pattern that happens to overlap
 * it. Only once every case has had its strict shot does {@link loosePathPattern} run over whatever is
 * left, to catch the one shape strict matching cannot: a placeholder's segment boundary breaking because
 * a generated client failed to percent-encode an embedded `/` — measured directly against
 * `spring-reactive-web-clients@sb3`, where `uploadPetPhoto/ok` (table position 7) never sends a request
 * at all while `getEncoded/ok` (position 19) sends one that lands in `surplus[0]` this way. Running the
 * loose pass second, over only what strict matching left unattributed, is what keeps it from attributing
 * a request to the wrong case if some future route pair happened to overlap under it.
 *
 * Within either pass, `unmatchedCases`' table order still decides which candidate among several sharing
 * one route (`updatePet/json`/`updatePet/form`, both `PUT /pets/{id}`) claims the next matching entry —
 * `server.surplus` preserves arrival order, and the driver issues calls in table order, so the two orders
 * coincide within one route exactly as `fetch-clients` relies on.
 */
export function attributeSurplus(
  unmatchedCases: readonly ApiCase[],
  surplusQueue: RecordedRequest[],
): Map<string, RecordedRequest> {
  const attributed = new Map<string, RecordedRequest>();
  for (const pattern of [strictPathPattern, loosePathPattern]) {
    for (const apiCase of unmatchedCases) {
      if (attributed.has(apiCase.id)) continue;
      const route = pattern(apiCase.pathTemplate);
      const index = surplusQueue.findIndex((req) => req.method === apiCase.method && route.test(req.path));
      if (index === -1) continue;
      attributed.set(apiCase.id, surplusQueue[index]);
      surplusQueue.splice(index, 1);
    }
  }
  return attributed;
}
