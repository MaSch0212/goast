import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

import { ApiConfiguration } from './api-configuration';

/**
 * Base class for API services.
 */
export abstract class ApiBaseService {
  protected config = inject(ApiConfiguration);
  protected http = inject(HttpClient);
  private _rootUrl: string = '';

  /**
   * Gets or sets the root URL for API operations provided by this service.
   * Falls back to `ApiConfiguration.rootUrl` if not set in this service.
   */
  public get rootUrl(): string {
    return this._rootUrl || this.config.rootUrl;
  }
  public set rootUrl(value: string) {
    this._rootUrl = value;
  }
}
