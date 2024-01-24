export type TypedResponse<T> = Response & {
  json(): Promise<T>;
};

export type FetchClientOptions = {
  readonly baseUrl?: string;
  readonly fetch?: typeof fetch;
  readonly headers?: Record<string, string>;
};
