import { cs } from '../../../ast/index.ts';
import type { CSharpFileBuilder } from '../../../file-builder.ts';

type Builder = CSharpFileBuilder;

/** A generated support type: its declaration and the namespaces its raw code needs `using` directives for. */
export type SupportClass = {
  /** The name of the type, which is also the name of the file. */
  name: string;
  declaration: cs.Class<Builder>;
  /** The namespaces the declaration uses. Register them on the file builder before writing the declaration. */
  usings: string[];
};

/** Removes the common indentation of a block of code and its surrounding blank lines. */
function dedent(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  const indent = Math.min(...lines.filter((x) => x.trim() !== '').map((x) => x.length - x.trimStart().length));
  return lines.map((x) => x.slice(indent)).join('\n');
}

const code = (strings: TemplateStringsArray, ...substitutions: string[]): string =>
  dedent(String.raw({ raw: strings.raw }, ...substitutions));

function supportClass(name: string, doc: string, usings: string[], members: string[]): SupportClass {
  return {
    name,
    usings,
    declaration: cs.class<Builder>(name, {
      doc: cs.doc(doc),
      accessModifier: 'public',
      static: true,
      members,
    }),
  };
}

/**
 * The JSON settings all generated server code serializes and deserializes with: the web defaults of
 * `System.Text.Json`, out-of-order metadata properties (so a polymorphic body may carry its discriminator anywhere)
 * and serialization through the polymorphic base type of a value, so the discriminator is written.
 */
export function buildApiJsonSupportClass(name = 'ApiJsonSupport'): SupportClass {
  return supportClass(
    name,
    'The JSON settings shared by all generated server code.',
    [
      'System',
      'System.Collections.Concurrent',
      'System.IO',
      'System.Text.Json',
      'System.Text.Json.Serialization',
      'System.Threading',
      'System.Threading.Tasks',
    ],
    [
      code`
        private static readonly ConcurrentDictionary<Type, Type> SerializedTypes = new();
      `,
      code`
        /// <summary>The options every request body is deserialized and every response body is serialized with.</summary>
        public static JsonSerializerOptions Options { get; } = CreateOptions();
      `,
      code`
        private static JsonSerializerOptions CreateOptions()
        {
            return new JsonSerializerOptions(JsonSerializerDefaults.Web)
            {
                AllowOutOfOrderMetadataProperties = true,
            };
        }
      `,
      code`
        /// <summary>
        /// The type to serialize a value of <paramref name="type"/> as. For a subtype of a polymorphic
        /// (<c>[JsonPolymorphic]</c>) base record this is the base, because the discriminator is only written when the
        /// serialized type is the polymorphic one.
        /// </summary>
        public static Type GetSerializedType(Type type)
        {
            return SerializedTypes.GetOrAdd(type, static t =>
            {
                var result = t;
                for (var baseType = t.BaseType; baseType is not null && baseType != typeof(object); baseType = baseType.BaseType)
                {
                    if (baseType.IsDefined(typeof(JsonPolymorphicAttribute), inherit: false))
                    {
                        result = baseType;
                    }
                }

                return result;
            });
        }
      `,
      code`
        /// <summary>Serializes <paramref name="value"/> to a JSON string.</summary>
        public static string Serialize(object value)
        {
            return JsonSerializer.Serialize(value, GetSerializedType(value.GetType()), Options);
        }
      `,
      code`
        /// <summary>Serializes <paramref name="value"/> as JSON to <paramref name="utf8Json"/>.</summary>
        public static Task SerializeAsync(Stream utf8Json, object value, CancellationToken cancellationToken)
        {
            return JsonSerializer.SerializeAsync(utf8Json, value, GetSerializedType(value.GetType()), Options, cancellationToken);
        }
      `,
    ],
  );
}

/**
 * The exception the request-binding glue throws for a request it cannot bind (a value of the wrong format, a missing
 * or malformed body, an unsupported content type). Server generators answer it with its `StatusCode`.
 */
export function buildApiRequestExceptionClass(name = 'ApiRequestException'): SupportClass {
  const declaration = cs.class<Builder>(name, {
    doc: cs.doc('Signals that a request does not match the API contract and cannot be bound.'),
    accessModifier: 'public',
    sealed: true,
    extends: cs.refs.system.exception(),
    members: [
      code`
        /// <summary>Creates the exception.</summary>
        public ${name}(string message, int statusCode = 400, Exception? innerException = null)
            : base(message, innerException)
        {
            StatusCode = statusCode;
        }
      `,
      code`
        /// <summary>The HTTP status code the request is to be answered with.</summary>
        public int StatusCode { get; }
      `,
    ],
  });
  return { name, declaration, usings: ['System'] };
}

/**
 * The conversions from the wire form of request parameters and bodies to typed values, which server generators call
 * where a framework's own binding cannot follow the OpenAPI style, explode and content type rules.
 */
export function buildApiRequestSupportClass(
  options: {
    name?: string;
    jsonSupportName?: string;
    exceptionName?: string;
  } = {},
): SupportClass {
  const name = options.name ?? 'ApiRequestSupport';
  const json = options.jsonSupportName ?? 'ApiJsonSupport';
  const exception = options.exceptionName ?? 'ApiRequestException';

  return supportClass(
    name,
    'Converts the wire form of request parameters and bodies to typed values.',
    [
      'System',
      'System.Collections.Generic',
      'System.IO',
      'System.Reflection',
      'System.Text',
      'System.Text.Json',
      'System.Text.Json.Nodes',
      'System.Text.Json.Serialization',
      'System.Threading',
      'System.Threading.Tasks',
      'Microsoft.AspNetCore.Http',
      'Microsoft.AspNetCore.Http.Features',
      'Microsoft.Extensions.Primitives',
      'Microsoft.Net.Http.Headers',
    ],
    [
      code`
        /// <summary>
        /// Decodes the <c>%2F</c> that ASP.NET Core leaves encoded in the route value of a path segment (other escapes are
        /// decoded by the server already).
        /// </summary>
        public static string DecodePathSegment(string value)
        {
            return value.Replace("%2F", "/", StringComparison.OrdinalIgnoreCase);
        }
      `,
      code`
        /// <summary>
        /// Converts the wire form of a single value to <paramref name="type"/>, the way the JSON serializer would read
        /// it: enums by their wire names, dates and GUIDs in their ISO forms, objects and arrays as JSON.
        /// </summary>
        public static object? ParseValue(string? raw, Type type)
        {
            if (raw is null)
            {
                return null;
            }

            var target = Nullable.GetUnderlyingType(type) ?? type;
            if (target == typeof(string))
            {
                return raw;
            }

            try
            {
                return JsonSerializer.Deserialize(ToJsonNode(target, raw), target, ${json}.Options);
            }
            catch (Exception e) when (e is JsonException or FormatException or InvalidOperationException or NotSupportedException)
            {
                throw new ${exception}($"The value '{raw}' is not valid.", 400, e);
            }
        }
      `,
      code`
        /// <summary>
        /// Converts every value (a repeated query key, or form field) to <typeparamref name="T"/>. An optional parameter
        /// without any value is absent (<c>null</c>), a required one is an empty list.
        /// </summary>
        public static List<T>? ParseList<T>(IEnumerable<string>? values, bool required)
        {
            if (values is null)
            {
                return null;
            }

            var result = new List<T>();
            foreach (var value in values)
            {
                result.Add((T)ParseValue(value, typeof(T))!);
            }

            return result.Count == 0 && !required ? null : result;
        }
      `,
      code`
        /// <summary>Splits a single value at <paramref name="delimiter"/> and converts every part to <typeparamref name="T"/>.</summary>
        public static List<T>? ParseDelimitedList<T>(string? raw, string delimiter)
        {
            if (raw is null)
            {
                return null;
            }

            return raw.Length == 0 ? new List<T>() : ParseList<T>(raw.Split(delimiter), true);
        }
      `,
      code`
        /// <summary>Converts a path parameter in <c>label</c> or <c>matrix</c> style to a list of <typeparamref name="T"/>.</summary>
        public static List<T>? ParsePathList<T>(string? raw, string style, bool explode, string name)
        {
            return raw is null ? null : ParseList<T>(SplitPathValues(raw, style, explode, name), true);
        }
      `,
      code`
        /// <summary>Converts a path parameter in <c>label</c> or <c>matrix</c> style to <paramref name="type"/>.</summary>
        public static object? ParsePathValue(string? raw, Type type, string style, string name)
        {
            if (raw is null)
            {
                return null;
            }

            var values = SplitPathValues(raw, style, false, name);
            return values.Count == 0 ? null : ParseValue(values[0], type);
        }
      `,
      code`
        private static List<string> SplitPathValues(string raw, string style, bool explode, string name)
        {
            var result = new List<string>();
            switch (style)
            {
                case "label":
                {
                    var label = raw.StartsWith('.') ? raw[1..] : raw;
                    if (label.Length > 0)
                    {
                        result.AddRange(label.Split(explode ? "." : ","));
                    }

                    break;
                }

                case "matrix":
                {
                    var prefix = name + "=";
                    foreach (var part in raw.Split(';', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var value = part.StartsWith(prefix, StringComparison.Ordinal) ? part[prefix.Length..] : part;
                        if (explode)
                        {
                            result.Add(value);
                        }
                        else if (value.Length > 0)
                        {
                            result.AddRange(value.Split(','));
                        }
                    }

                    break;
                }

                default:
                    if (raw.Length > 0)
                    {
                        result.AddRange(raw.Split(','));
                    }

                    break;
            }

            return result;
        }
      `,
      code`
        /// <summary>
        /// Assembles an object (or converts a scalar) from the query string: <c>deepObject</c> reads
        /// <c>name[property]</c> keys, an exploded form reads one key per property and any other style reads a single
        /// delimited value of alternating property names and values.
        /// </summary>
        public static object? ReadQueryObject(HttpRequest request, Type type, string name, string style, bool explode)
        {
            var target = Nullable.GetUnderlyingType(type) ?? type;
            var query = request.Query;
            if (!IsObjectType(target))
            {
                return query.TryGetValue(name, out var single) ? ParseValue(single.ToString(), type) : null;
            }

            var values = new Dictionary<string, StringValues>();
            if (style == "deepObject")
            {
                var prefix = name + "[";
                foreach (var pair in query)
                {
                    if (pair.Key.StartsWith(prefix, StringComparison.Ordinal) && pair.Key.EndsWith(']'))
                    {
                        values[pair.Key.Substring(prefix.Length, pair.Key.Length - prefix.Length - 1)] = pair.Value;
                    }
                }
            }
            else if (explode)
            {
                foreach (var pair in query)
                {
                    values[pair.Key] = pair.Value;
                }
            }
            else if (query.TryGetValue(name, out var raw))
            {
                var delimiter = style switch
                {
                    "spaceDelimited" => " ",
                    "pipeDelimited" => "|",
                    _ => ",",
                };
                var parts = raw.ToString().Split(delimiter);
                for (var i = 0; i + 1 < parts.Length; i += 2)
                {
                    values[parts[i]] = new StringValues(parts[i + 1]);
                }
            }

            return values.Count == 0 ? null : BuildObject(target, values);
        }
      `,
      code`
        /// <summary>
        /// Reads the request body as <paramref name="type"/>: JSON (also for a missing content type), a URL-encoded form,
        /// text, bytes or the raw stream, depending on the content type of the request and the type.
        /// </summary>
        public static async Task<object?> ReadBodyAsync(HttpRequest request, Type type, bool required, CancellationToken cancellationToken)
        {
            var hasBody = request.HttpContext.Features.Get<IHttpRequestBodyDetectionFeature>()?.CanHaveBody
                ?? (request.ContentLength > 0 || request.Headers.ContainsKey(HeaderNames.TransferEncoding));
            if (!hasBody)
            {
                return required ? throw new ${exception}("A request body is required.") : null;
            }

            var target = Nullable.GetUnderlyingType(type) ?? type;
            if (target == typeof(Stream))
            {
                return request.Body;
            }

            var mediaType = request.ContentType?.Split(';')[0].Trim().ToLowerInvariant();
            if (mediaType == "application/x-www-form-urlencoded")
            {
                var form = await request.ReadFormAsync(cancellationToken);
                var fields = new Dictionary<string, StringValues>();
                foreach (var pair in form)
                {
                    fields[pair.Key] = pair.Value;
                }

                return BuildObject(target, fields);
            }

            var isJson = string.IsNullOrEmpty(mediaType)
                || mediaType == "application/json"
                || mediaType == "text/json"
                || mediaType.EndsWith("+json", StringComparison.Ordinal);
            if (!isJson)
            {
                if (target == typeof(string))
                {
                    using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
                    return await reader.ReadToEndAsync(cancellationToken);
                }

                if (target == typeof(byte[]))
                {
                    using var buffer = new MemoryStream();
                    await request.Body.CopyToAsync(buffer, cancellationToken);
                    return buffer.ToArray();
                }

                if (target != typeof(JsonElement) && target != typeof(object))
                {
                    throw new ${exception}($"The content type '{request.ContentType}' is not supported.", StatusCodes.Status415UnsupportedMediaType);
                }
            }

            try
            {
                var body = await JsonSerializer.DeserializeAsync(request.Body, type, ${json}.Options, cancellationToken);
                return body is null && required ? throw new ${exception}("A request body is required.") : body;
            }
            catch (JsonException e)
            {
                throw new ${exception}($"The request body is not valid: {e.Message}", 400, e);
            }
        }
      `,
      code`
        private static object? BuildObject(Type type, IReadOnlyDictionary<string, StringValues> values)
        {
            var node = new JsonObject();
            foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                var wireName = property.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name ?? property.Name;
                if (!values.TryGetValue(wireName, out var raw) || raw.Count == 0)
                {
                    continue;
                }

                var itemType = GetItemType(property.PropertyType);
                if (itemType is null)
                {
                    node[wireName] = ToJsonNode(property.PropertyType, raw.ToString());
                }
                else
                {
                    var array = new JsonArray();
                    foreach (var item in raw)
                    {
                        array.Add(item is null ? null : ToJsonNode(itemType, item));
                    }

                    node[wireName] = array;
                }
            }

            try
            {
                return JsonSerializer.Deserialize(node, type, ${json}.Options);
            }
            catch (Exception e) when (e is JsonException or InvalidOperationException or NotSupportedException)
            {
                throw new ${exception}($"The value is not a valid {type.Name}: {e.Message}", 400, e);
            }
        }
      `,
      code`
        private static bool IsObjectType(Type type)
        {
            return type.IsClass && type != typeof(string) && type != typeof(Uri) && type != typeof(byte[]) && GetItemType(type) is null
                && !type.IsAbstract;
        }
      `,
      code`
        private static Type? GetItemType(Type type)
        {
            if (type == typeof(string) || type == typeof(byte[]))
            {
                return null;
            }

            if (type.IsArray)
            {
                return type.GetElementType();
            }

            if (type.IsGenericType)
            {
                var definition = type.GetGenericTypeDefinition();
                if (definition == typeof(List<>) || definition == typeof(IList<>) || definition == typeof(ICollection<>)
                    || definition == typeof(IEnumerable<>) || definition == typeof(IReadOnlyList<>)
                    || definition == typeof(IReadOnlyCollection<>))
                {
                    return type.GetGenericArguments()[0];
                }
            }

            return null;
        }
      `,
      code`
        private static JsonNode? ToJsonNode(Type type, string raw)
        {
            if (ShouldQuote(type))
            {
                return JsonValue.Create(raw);
            }

            try
            {
                return JsonNode.Parse(raw);
            }
            catch (JsonException)
            {
                return JsonValue.Create(raw);
            }
        }
      `,
      code`
        private static bool ShouldQuote(Type type)
        {
            type = Nullable.GetUnderlyingType(type) ?? type;
            if (type.IsEnum)
            {
                // Integer enums are plain numbers; string enums carry a converter attribute.
                return type.IsDefined(typeof(JsonConverterAttribute), inherit: false);
            }

            return type == typeof(string) || type == typeof(Guid) || type == typeof(DateTimeOffset) || type == typeof(DateTime)
                || type == typeof(DateOnly) || type == typeof(TimeOnly) || type == typeof(TimeSpan) || type == typeof(Uri)
                || type == typeof(byte[]);
        }
      `,
    ],
  );
}

/**
 * Writes a response from its parts: status code, headers and a body that is streamed, written as text or bytes, or
 * serialized as JSON, depending on the content type. Server generators call it from their framework's result type.
 */
export function buildApiResponseSupportClass(options: { name?: string; jsonSupportName?: string } = {}): SupportClass {
  const name = options.name ?? 'ApiResponseSupport';
  const json = options.jsonSupportName ?? 'ApiJsonSupport';

  return supportClass(
    name,
    'Writes the responses of generated server code.',
    [
      'System',
      'System.Collections',
      'System.Collections.Generic',
      'System.IO',
      'System.Text',
      'System.Text.Json',
      'System.Text.Json.Nodes',
      'System.Threading',
      'System.Threading.Tasks',
      'Microsoft.AspNetCore.Http',
    ],
    [
      code`
        /// <summary>
        /// Writes a response. A <see cref="Stream"/> body is copied as is, a <see cref="string"/> or
        /// <see cref="byte"/> array body of a non-JSON content type is written as text or bytes, and every other body is
        /// serialized as JSON.
        /// </summary>
        public static async Task WriteAsync(
            HttpResponse response,
            int statusCode,
            string? contentType,
            object? body,
            (string Name, object? Value)[] headers,
            CancellationToken cancellationToken)
        {
            response.StatusCode = statusCode;
            foreach (var (headerName, value) in headers)
            {
                var text = FormatHeaderValue(value);
                if (text is not null)
                {
                    response.Headers[headerName] = text;
                }
            }

            if (body is null)
            {
                return;
            }

            if (contentType is not null)
            {
                response.ContentType = contentType;
            }

            var isJson = contentType is null || IsJson(contentType);
            switch (body)
            {
                case Stream stream:
                    await using (stream)
                    {
                        await stream.CopyToAsync(response.Body, cancellationToken);
                    }

                    break;
                case byte[] bytes when !isJson:
                    response.ContentLength = bytes.Length;
                    await response.Body.WriteAsync(bytes, cancellationToken);
                    break;
                case string text when !isJson:
                    var encoded = Encoding.UTF8.GetBytes(text);
                    response.ContentLength = encoded.Length;
                    await response.Body.WriteAsync(encoded, cancellationToken);
                    break;
                default:
                    await ${json}.SerializeAsync(response.Body, body, cancellationToken);
                    break;
            }
        }
      `,
      code`
        /// <summary>Whether a content type carries JSON.</summary>
        public static bool IsJson(string contentType)
        {
            var mediaType = contentType.Split(';')[0].Trim().ToLowerInvariant();
            return mediaType == "application/json" || mediaType == "text/json" || mediaType.EndsWith("+json", StringComparison.Ordinal);
        }
      `,
      code`
        /// <summary>
        /// Formats the value of a response header: strings as they are, collections comma-separated and everything else
        /// the way it is written as JSON. <c>null</c> means the header is not sent.
        /// </summary>
        public static string? FormatHeaderValue(object? value)
        {
            switch (value)
            {
                case null:
                    return null;
                case string text:
                    return text;
                case IEnumerable items:
                    var parts = new List<string>();
                    foreach (var item in items)
                    {
                        var part = FormatHeaderValue(item);
                        if (part is not null)
                        {
                            parts.Add(part);
                        }
                    }

                    return string.Join(",", parts);
                default:
                    var node = JsonSerializer.SerializeToNode(value, value.GetType(), ${json}.Options);
                    return node is JsonValue jsonValue && jsonValue.TryGetValue<string>(out var asString)
                        ? asString
                        : node?.ToJsonString();
            }
        }
      `,
    ],
  );
}
