import { cs } from '../../../ast/index.ts';

/** References to the helper types generated once per generation (see `runtime.ts`). */
export function getReferenceFactories(namespace: string): {
  apiRuntime: cs.ReferenceFactory;
  apiException: cs.ReferenceFactory;
  apiFile: cs.ReferenceFactory;
} {
  return {
    apiRuntime: cs.reference.factory('ApiRuntime', namespace),
    apiException: cs.reference.factory('ApiException', namespace),
    apiFile: cs.reference.factory('ApiFile', namespace),
  };
}
