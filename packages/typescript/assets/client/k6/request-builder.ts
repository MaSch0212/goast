// @deno-types="npm:@types/k6/http"
import http, { Params, Response } from 'k6/http';
// @ts-ignore
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

/**
 * Defines the options for appending a parameter
 */
type ParameterOptions = {
  style?: string;
  explode?: boolean;
};

type BuildOptions = {
  accept?: string;
  params?: Params;
};

/**
 * Base class for a parameter
 */
abstract class Parameter {
  public readonly name: string;
  public readonly value: any;
  public readonly options: ParameterOptions;

  constructor(name: string, value: any, options: ParameterOptions, defaultStyle: string, defaultExplode: boolean) {
    this.name = name;
    this.value = value;
    this.options = options || {};
    if (this.options.style === null || this.options.style === undefined) {
      this.options.style = defaultStyle;
    }
    if (this.options.explode === null || this.options.explode === undefined) {
      this.options.explode = defaultExplode;
    }
  }

  public serializeValue(value: any, separator = ','): string {
    if (value === null || value === undefined) {
      return '';
    } else if (value instanceof Array) {
      return value
        .map((v) => this.serializeValue(v).split(separator).join(encodeURIComponent(separator)))
        .join(separator);
    } else if (typeof value === 'object') {
      const array: string[] = [];
      for (const key of Object.keys(value)) {
        let propVal = value[key];
        if (propVal !== null && propVal !== undefined) {
          propVal = this.serializeValue(propVal).split(separator).join(encodeURIComponent(separator));
          if (this.options.explode) {
            array.push(`${key}=${propVal}`);
          } else {
            array.push(key);
            array.push(propVal);
          }
        }
      }
      return array.join(separator);
    } else {
      return String(value);
    }
  }
}

/**
 * A parameter in the operation path
 */
class PathParameter extends Parameter {
  constructor(name: string, value: any, options: ParameterOptions) {
    super(name, value, options, 'simple', false);
  }

  public append(path: string): string {
    let value = this.value;
    if (value === null || value === undefined) {
      value = '';
    }
    let prefix = this.options.style === 'label' ? '.' : '';
    const separator = this.options.explode ? (prefix === '' ? ',' : prefix) : ',';
    let alreadySerialized = false;
    if (this.options.style === 'matrix') {
      // The parameter name is just used as prefix, except in some cases...
      prefix = `;${this.name}=`;
      if (this.options.explode && typeof value === 'object') {
        prefix = ';';
        if (value instanceof Array) {
          // For arrays we have to repeat the name for each element
          value = value.map((v) => `${this.name}=${this.serializeValue(v, ';')}`);
          value = value.join(';');
          alreadySerialized = true;
        } else {
          // For objects we have to put each the key / value pairs
          value = this.serializeValue(value, ';');
          alreadySerialized = true;
        }
      }
    }
    value = prefix + (alreadySerialized ? value : this.serializeValue(value, separator));
    // Replace both the plain variable and the corresponding variant taking in the prefix and explode into account
    path = path.replace(`{${this.name}}`, value);
    path = path.replace(`{${prefix}${this.name}${this.options.explode ? '*' : ''}}`, value);
    return path;
  }

  public override serializeValue(value: any, separator = ','): string {
    let result = typeof value === 'string' ? encodeURIComponent(value) : super.serializeValue(value, separator);
    result = result.replace(/%3D/g, '=');
    result = result.replace(/%3B/g, ';');
    result = result.replace(/%2C/g, ',');
    return result;
  }
}

/**
 * A parameter in the query
 */
class QueryParameter extends Parameter {
  constructor(name: string, value: any, options: ParameterOptions) {
    super(name, value, options, 'form', true);
  }

  public append(params: string): string {
    if (this.value instanceof Array) {
      // Array serialization
      if (this.options.explode) {
        for (const v of this.value) {
          params = `${params}${params ? '&' : '?'}${encodeURIComponent(this.name)}=${this.serializeValue(v)}`;
        }
      } else {
        const separator = this.options.style === 'spaceDelimited'
          ? ' '
          : this.options.style === 'pipeDelimited'
          ? '|'
          : ',';
        return `${params}${params ? '&' : '?'}${encodeURIComponent(this.name)}=${
          this.serializeValue(this.value, separator)
        }`;
      }
    } else if (this.value !== null && typeof this.value === 'object') {
      // Object serialization
      if (this.options.style === 'deepObject') {
        // Append a parameter for each key, in the form `name[key]`
        for (const key of Object.keys(this.value)) {
          const propVal = this.value[key];
          if (propVal !== null && propVal !== undefined) {
            params = `${params}${params ? '&' : '?'}${encodeURIComponent(this.name)}[${
              encodeURIComponent(
                key,
              )
            }]=${this.serializeValue(propVal)}`;
          }
        }
      } else if (this.options.explode) {
        // Append a parameter for each key without using the parameter name
        for (const key of Object.keys(this.value)) {
          const propVal = this.value[key];
          if (propVal !== null && propVal !== undefined) {
            params = `${params}${params ? '&' : '?'}${encodeURIComponent(key)}=${this.serializeValue(propVal)}`;
          }
        }
      } else {
        // Append a single parameter whose values are a comma-separated list of key,value,key,value...
        const array: unknown[] = [];
        for (const key of Object.keys(this.value)) {
          const propVal = this.value[key];
          if (propVal !== null && propVal !== undefined) {
            array.push(key);
            array.push(propVal);
          }
        }
        params = `${params}${params ? '&' : '?'}${encodeURIComponent(this.name)}=${this.serializeValue(array)}`;
      }
    } else if (this.value !== null && this.value !== undefined) {
      // Plain value
      params = `${params}${params ? '&' : '?'}${encodeURIComponent(this.name)}=${this.serializeValue(this.value)}`;
    }
    return params;
  }
}

/**
 * A parameter in the HTTP request header
 */
class HeaderParameter extends Parameter {
  constructor(name: string, value: any, options: ParameterOptions) {
    super(name, value, options, 'simple', false);
  }

  public append(headers: Record<string, string>): Record<string, string> {
    if (this.value !== null && this.value !== undefined) {
      if (this.value instanceof Array) {
        throw new Error('Array header values are not supported');
      } else {
        headers[this.name] = this.serializeValue(this.value);
      }
    }
    return headers;
  }
}

/**
 * Helper to build http requests from parameters
 */
export class RequestBuilder {
  private readonly _path: Map<string, PathParameter>;
  private readonly _query: Map<string, QueryParameter>;
  private readonly _header: Map<string, HeaderParameter>;
  private _bodyContent: any;
  private _bodyContentType: string | undefined;

  public readonly rootUrl: string;
  public readonly operationPath: string;
  public readonly method: string;

  constructor(rootUrl: string, operationPath: string, method: string) {
    this.rootUrl = rootUrl;
    this.operationPath = operationPath;
    this.method = method;
    this._path = new Map();
    this._query = new Map();
    this._header = new Map();
    this._bodyContent = null;
    this._bodyContentType = undefined;
  }

  /**
   * Sets a path parameter
   */
  public path(name: string, value: any, options: ParameterOptions) {
    this._path.set(name, new PathParameter(name, value, options || {}));
  }

  /**
   * Sets a query parameter
   */
  public query(name: string, value: any, options: ParameterOptions) {
    this._query.set(name, new QueryParameter(name, value, options || {}));
  }

  /**
   * Sets a header parameter
   */
  public header(name: string, value: any, options: ParameterOptions) {
    this._header.set(name, new HeaderParameter(name, value, options || {}));
  }

  /**
   * Sets the body content, along with the content type
   */
  public body(value: any, contentType = 'application/json') {
    this._bodyContentType = contentType;
    if (this._bodyContentType === 'application/x-www-form-urlencoded' && value !== null && typeof value === 'object') {
      // Handle URL-encoded data
      const pairs: [string, string][] = [];
      for (const key of Object.keys(value)) {
        let val = value[key];
        if (!(val instanceof Array)) {
          val = [val];
        }
        for (const v of val) {
          const formValue = this.formDataValue(v);
          if (formValue !== null) {
            pairs.push([key, formValue]);
          }
        }
      }
      this._bodyContent = pairs.map((p) => `${encodeURIComponent(p[0])}=${encodeURIComponent(p[1])}`).join('&');
    } else if (this._bodyContentType === 'multipart/form-data' && value !== null && typeof value === 'object') {
      const fd = new FormData();
      for (const key in value) {
        fd.append(key, this.formDataValue(value[key]));
      }
      this._bodyContent = fd.body();
      this._bodyContentType = 'multipart/form-data; boundary=' + fd.boundary;
    } else if (this._bodyContentType.indexOf('json') !== -1 && value !== null && typeof value === 'object') {
      this._bodyContent = JSON.stringify(value);
    } else {
      // The body is the plain content
      this._bodyContent = value;
    }
  }

  private formDataValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    if (this.isFile(value)) {
      return value;
    }
    return { data: JSON.stringify(value), content_type: 'application/json' };
  }

  private isFile(value: any): value is http.FileData {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value &&
      (typeof value.data === 'string' || value.data instanceof ArrayBuffer) &&
      (!('filename' in value) || typeof value.filename === 'string') &&
      (!('content_type' in value) || typeof value.content_type === 'string') &&
      Object.keys(value).every((key) => key === 'data' || key === 'filename' || key === 'content_type')
    );
  }

  /**
   * Builds the request with the current set parameters
   */
  public build(options?: BuildOptions): Response {
    // Perform the request
    return http.request(...this.buildRequestParams(options));
  }

  /**
   * Builds the request with the current set parameters
   */
  public buildAsync(options?: BuildOptions): Promise<Response> {
    // Perform the request
    return http.asyncRequest(...this.buildRequestParams(options));
  }

  private buildRequestParams(options?: BuildOptions): Parameters<typeof http.request> {
    options = options || {};

    // Path parameters
    let path = this.operationPath;
    for (const pathParam of this._path.values()) {
      path = pathParam.append(path);
    }
    const url = this.rootUrl + path;

    // Query parameters
    let httpParams = '';
    for (const queryParam of this._query.values()) {
      httpParams = queryParam.append(httpParams);
    }

    // Header parameters
    let httpHeaders: Record<string, string> = {};
    if (options.accept) {
      httpHeaders['Accept'] = options.accept;
    }
    for (const headerParam of this._header.values()) {
      httpHeaders = headerParam.append(httpHeaders);
    }

    // Request content headers
    if (this._bodyContentType) {
      httpHeaders['Content-Type'] = this._bodyContentType;
    }

    return [
      this.method.toUpperCase(),
      url + httpParams,
      this._bodyContent,
      Object.assign({}, options.params, {
        headers: Object.assign({}, httpHeaders, options.params ? options.params.headers : {}),
        tags: {
          ...options.params?.tags,
          name: this.operationPath,
        },
      }),
    ];
  }
}
