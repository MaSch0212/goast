import { AlphaService } from '../services/alpha.service';
import { BetaService } from '../services/beta.service';
import { Service2Service } from '../services/service-2.service';
import { TagWithSpaceService } from '../services/tag-with-space.service';
import { ApiConfiguration } from './api-configuration';

import type { Provider } from '@angular/core';

/**
 * Provides all the API services.
 */
export function provideApi(config?: ApiConfiguration): Provider {
  return [
    config ? { provide: ApiConfiguration, useValue: config } : ApiConfiguration,
    AlphaService,
    Service2Service,
    BetaService,
    TagWithSpaceService
  ];
}
