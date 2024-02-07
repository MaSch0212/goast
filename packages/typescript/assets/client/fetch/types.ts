type _VoidResponse = Omit<Response, 'json'> & {
  isVoidResponse: true;
};
type _TypedResponse<T> = Response & {
  json(): Promise<T>;
  isVoidResponse: false;
};
export type TypedResponse<T> = void extends T ? _VoidResponse : _TypedResponse<T>;

export type FetchClientOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
};
