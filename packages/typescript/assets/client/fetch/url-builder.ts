export class UrlBuilder {
  private path: string = '';
  private pathParams: Record<string, string> = {};
  private queryParams: Record<string, string> = {};

  constructor(private readonly baseUrl?: string) {}

  public withPath(path: string) {
    this.path += path.startsWith('/') ? path : '/' + path;
    return this;
  }

  public withPathParam(name: string, value: unknown) {
    this.pathParams[name] = String(value);
    return this;
  }

  public withQueryParam(name: string, value: unknown) {
    if (value === undefined || value === null) {
      if (name in this.queryParams) {
        delete this.queryParams[name];
      }
    } else {
      this.queryParams[name] = String(value);
    }
    return this;
  }

  public build() {
    const queryString = Object.keys(this.queryParams)
      .map((key) => `${key}=${this.queryParams[key]}`)
      .join('&');
    const path = this.path.replace(/\{([^}]+)\}/g, (_, name) => this.pathParams[name]);
    const url = `${this.baseUrl}${path || '/'}${queryString ? '?' + queryString : ''}`;
    return url.replace(/(?<!:)[\\/]+(?=\/)|[\\/](?=\?)/g, '');
  }
}
