// @ts-check

import http from 'k6/http';

/**
 * Defines the options for appending a parameter
 * @typedef {object} ParameterOptions
 * @property {string} [style]
 * @property {boolean} [explode]
 */

/**
 * Base class for a parameter
 * @abstract
 * @property {string} name
 * @property {*} value
 * @property {ParameterOptions} options
 */
class Parameter {
  /**
   * @param {string} name
   * @param {*} value
   * @param {ParameterOptions} options
   * @param {string} defaultStyle
   * @param {boolean} defaultExplode
   */
  constructor(name, value, options, defaultStyle, defaultExplode) {
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

  /**
   * @param {*} value
   * @param {string} separator
   * @returns {string}
   */
  serializeValue(value, separator = ',') {
    if (value === null || value === undefined) {
      return '';
    } else if (value instanceof Array) {
      return value
        .map((v) => this.serializeValue(v).split(separator).join(encodeURIComponent(separator)))
        .join(separator);
    } else if (typeof value === 'object') {
      /** @type {string[]} */
      const array = [];
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
 * @param {string} name
 * @param {*} value
 * @param {ParameterOptions} options
 */
class PathParameter extends Parameter {
  /**
   * @param {string} name
   * @param {*} value
   * @param {ParameterOptions} options
   */
  constructor(name, value, options) {
    super(name, value, options, 'simple', false);
  }

  /**
   * @param {string} path
   * @returns {string}
   */
  append(path) {
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

  /**
   * @param {*} value
   * @param {string} separator
   * @returns {string}
   */
  serializeValue(value, separator = ',') {
    let result = typeof value === 'string' ? encodeURIComponent(value) : super.serializeValue(value, separator);
    result = result.replace(/%3D/g, '=');
    result = result.replace(/%3B/g, ';');
    result = result.replace(/%2C/g, ',');
    return result;
  }
}

/**
 * A parameter in the query
 * @param {string} name
 * @param {*} value
 * @param {ParameterOptions} options
 */
class QueryParameter extends Parameter {
  /**
   * @param {string} name
   * @param {*} value
   * @param {ParameterOptions} options
   */
  constructor(name, value, options) {
    super(name, value, options, 'form', true);
  }

  /**
   * @param {string} params
   * @returns {string}
   */
  append(params) {
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
        const array = [];
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
  /**
   * @param {string} name
   * @param {*} value
   * @param {ParameterOptions} options
   */
  constructor(name, value, options) {
    super(name, value, options, 'simple', false);
  }

  /**
   * @param {Object.<string, string>} headers
   * @returns {Object.<string, string>}
   */
  append(headers) {
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
 * @property {string} rootUrl
 * @property {string} operationPath
 * @property {string} method
 */
export class RequestBuilder {
  /**
   * @param {string} rootUrl
   * @param {string} operationPath
   * @param {string} method
   */
  constructor(rootUrl, operationPath, method) {
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
   * @param {string} name
   * @param {*} value
   * @param {ParameterOptions} [options]
   */
  path(name, value, options) {
    this._path.set(name, new PathParameter(name, value, options || {}));
  }

  /**
   * Sets a query parameter
   * @param {string} name
   * @param {*} value
   * @param {ParameterOptions} [options]
   */
  query(name, value, options) {
    this._query.set(name, new QueryParameter(name, value, options || {}));
  }

  /**
   * Sets a header parameter
   * @param {string} name
   * @param {*} value
   * @param {ParameterOptions} [options]
   */
  header(name, value, options) {
    this._header.set(name, new HeaderParameter(name, value, options || {}));
  }

  /**
   * Sets the body content, along with the content type
   * @param {*} value
   * @param {string} [contentType]
   */
  body(value, contentType = 'application/json') {
    this._bodyContentType = contentType;
    if (this._bodyContentType === 'application/x-www-form-urlencoded' && value !== null && typeof value === 'object') {
      // Handle URL-encoded data
      /** @type {[string, string][]} */
      const pairs = [];
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
    } else if (this._bodyContentType.indexOf('json') !== -1 && value !== null && typeof value === 'object') {
      this._bodyContent = JSON.stringify(value);
    } else {
      // The body is the plain content
      this._bodyContent = value;
    }
  }

  /**
   * @private
   * @param {*} value
   * @returns {*}
   */
  formDataValue(value) {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * @typedef {object} BuildOptions
   * @property {string} [accept]
   * @property {import('k6/http').Params} [params]
   */

  /**
   * Builds the request with the current set parameters
   * @param {BuildOptions} [options]
   * @returns {import('k6/http').Response}
   */
  build(options) {
    // Perform the request
    return http.request(...this.buildRequestParams(options));
  }

  /**
   * Builds the request with the current set parameters
   * @param {BuildOptions} [options]
   * @returns {Promise<import('k6/http').Response>}
   */
  buildAsync(options) {
    // Perform the request
    return http.asyncRequest(...this.buildRequestParams(options));
  }

  /**
   * @private
   * @param {BuildOptions} [options]
   * @returns {Parameters<typeof import('k6/http').request>}
   */
  buildRequestParams(options) {
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
    /** @type {Object.<string, string>} */
    let httpHeaders = {};
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
      }),
    ];
  }
}
