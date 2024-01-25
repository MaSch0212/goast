export type TypedResponse<T> = Response & {
  json(): Promise<T>;
};

export type FetchClientOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
};
