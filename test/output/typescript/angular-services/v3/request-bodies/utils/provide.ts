import { BodiesService } from '../services/bodies.service';
import { ApiConfiguration } from './api-configuration';

import type { Provider } from '@angular/core';

/**
 * Provides all the API services.
 */
export function provideApi(config?: ApiConfiguration): Provider {
  return [config ? { provide: ApiConfiguration, useValue: config } : ApiConfiguration, BodiesService];
}
