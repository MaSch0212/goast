/**
 * The C# sources of the helper types every generated HTTP client depends on. They are emitted once per
 * generation (not once per service) into the clients namespace.
 *
 * They are plain C# rather than AST: they are fixed code with no per-spec variation, and keeping them as source
 * makes them reviewable as C#. The `String.raw` tag keeps every backslash of the C# source intact.
 */

export type CSharpRuntimeFile = {
  /** The file name, without directory. */
  fileName: string;
  /** The namespaces the file needs `using` directives for. */
  usings: string[];
  /** The file body, placed below the file-scoped namespace declaration. */
  body: string;
};

const apiRuntime: CSharpRuntimeFile = {
  fileName: 'ApiRuntime.cs',
  usings: [
    'System',
    'System.Collections.Generic',
    'System.IO',
    'System.Linq',
    'System.Net.Http',
    'System.Net.Http.Headers',
    'System.Text',
    'System.Text.Json',
    'System.Text.Json.Nodes',
    'System.Threading',
    'System.Threading.Tasks',
  ],
  body: String.raw`/// <summary>
/// Helpers shared by the generated HTTP clients: JSON options, the encoding of parameters according to their OpenAPI
/// <c>style</c> and <c>explode</c>, request content creation and response reading.
/// </summary>
public static class ApiRuntime
{
    private const string ReservedCharacters = ":/?#[]@!$&'()*+,;=";

    /// <summary>
    /// The options used to serialize and deserialize JSON. Assign a different instance to customize serialization
    /// for every generated client.
    /// </summary>
    public static JsonSerializerOptions JsonOptions { get; set; } = CreateJsonOptions();

    /// <summary>Creates the default options: web defaults, with out-of-order metadata properties allowed.</summary>
    public static JsonSerializerOptions CreateJsonOptions()
    {
        return new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            AllowOutOfOrderMetadataProperties = true,
        };
    }

    // ---------------------------------------------------------------------------------------------------------
    // URL and parameters
    // ---------------------------------------------------------------------------------------------------------

    /// <summary>
    /// Combines the base address of <paramref name="client"/> (including its path) with <paramref name="path"/> and the
    /// already encoded <paramref name="query"/> entries.
    /// </summary>
    public static Uri BuildUri(HttpClient client, string path, IReadOnlyList<string>? query)
    {
        var relative = path.TrimStart('/');
        if (query is { Count: > 0 })
        {
            relative += "?" + string.Join("&", query);
        }

        if (client.BaseAddress is { } baseAddress)
        {
            var baseUri = baseAddress.GetLeftPart(UriPartial.Path);
            if (!baseUri.EndsWith('/'))
            {
                baseUri += "/";
            }

            return new Uri(baseUri + relative, UriKind.Absolute);
        }

        return new Uri(relative, UriKind.Relative);
    }

    /// <summary>Percent-encodes <paramref name="value"/>. With <paramref name="allowReserved"/>, reserved characters are kept.</summary>
    public static string Encode(string value, bool allowReserved = false)
    {
        if (!allowReserved)
        {
            return Uri.EscapeDataString(value);
        }

        var result = new StringBuilder();
        var run = new StringBuilder();
        foreach (var c in value)
        {
            if (ReservedCharacters.Contains(c))
            {
                if (run.Length > 0)
                {
                    result.Append(Uri.EscapeDataString(run.ToString()));
                    run.Clear();
                }

                result.Append(c);
            }
            else
            {
                run.Append(c);
            }
        }

        if (run.Length > 0)
        {
            result.Append(Uri.EscapeDataString(run.ToString()));
        }

        return result.ToString();
    }

    /// <summary>Encodes a path parameter (styles <c>simple</c>, <c>label</c> and <c>matrix</c>).</summary>
    public static string EncodePath(string name, object? value, string style = "simple", bool explode = false)
    {
        var node = ToNode(value) ?? throw new ArgumentNullException(name);
        var encodedName = Encode(name);

        switch (node)
        {
            case JsonArray array:
            {
                var items = array.Where(item => item is not null).Select(item => Encode(Scalar(item))).ToList();
                return style switch
                {
                    "label" => "." + string.Join(explode ? "." : ",", items),
                    "matrix" => explode
                        ? string.Concat(items.Select(item => $";{encodedName}={item}"))
                        : $";{encodedName}=" + string.Join(",", items),
                    _ => string.Join(",", items),
                };
            }
            case JsonObject obj:
            {
                var entries = obj
                    .Where(property => property.Value is not null)
                    .SelectMany(property => explode
                        ? new[] { $"{Encode(property.Key)}={Encode(Scalar(property.Value))}" }
                        : new[] { Encode(property.Key), Encode(Scalar(property.Value)) })
                    .ToList();
                return style switch
                {
                    "label" => "." + string.Join(explode ? "." : ",", entries),
                    "matrix" => explode
                        ? string.Concat(entries.Select(entry => ";" + entry))
                        : $";{encodedName}=" + string.Join(",", entries),
                    _ => string.Join(",", entries),
                };
            }
            default:
            {
                var encoded = Encode(Scalar(node));
                return style switch
                {
                    "label" => "." + encoded,
                    "matrix" => $";{encodedName}={encoded}",
                    _ => encoded,
                };
            }
        }
    }

    /// <summary>
    /// Adds a query parameter (styles <c>form</c>, <c>spaceDelimited</c>, <c>pipeDelimited</c> and <c>deepObject</c>).
    /// A <c>null</c> value adds nothing.
    /// </summary>
    public static void AddQuery(
        List<string> query,
        string name,
        object? value,
        string style = "form",
        bool explode = true,
        bool allowReserved = false)
    {
        var pairs = new List<KeyValuePair<string, string>>();
        AddPairs(pairs, name, ToNode(value), style, explode);
        foreach (var pair in pairs)
        {
            query.Add(EncodeKey(pair.Key) + "=" + Encode(pair.Value, allowReserved));
        }
    }

    /// <summary>Adds a header parameter (style <c>simple</c>). A <c>null</c> value adds nothing.</summary>
    public static void AddHeader(HttpRequestMessage request, string name, object? value, bool explode = false)
    {
        var node = ToNode(value);
        if (node is null)
        {
            return;
        }

        var text = node switch
        {
            JsonArray array => string.Join(",", array.Where(item => item is not null).Select(Scalar)),
            JsonObject obj => string.Join(
                ",",
                obj.Where(property => property.Value is not null)
                    .SelectMany(property => explode
                        ? new[] { $"{property.Key}={Scalar(property.Value)}" }
                        : new[] { property.Key, Scalar(property.Value) })),
            _ => Scalar(node),
        };
        request.Headers.TryAddWithoutValidation(name, text);
    }

    /// <summary>Adds a cookie parameter (style <c>form</c>). A <c>null</c> value adds nothing.</summary>
    public static void AddCookie(List<string> cookies, string name, object? value, bool explode = true)
    {
        var pairs = new List<KeyValuePair<string, string>>();
        AddPairs(pairs, name, ToNode(value), "form", explode);
        foreach (var pair in pairs)
        {
            cookies.Add(Encode(pair.Key) + "=" + Encode(pair.Value));
        }
    }

    /// <summary>Sends the collected cookies in one <c>Cookie</c> header.</summary>
    public static void ApplyCookies(HttpRequestMessage request, IReadOnlyList<string> cookies)
    {
        if (cookies.Count > 0)
        {
            request.Headers.TryAddWithoutValidation("Cookie", string.Join("; ", cookies));
        }
    }

    /// <summary>Sets the <c>Accept</c> header to the given media types.</summary>
    public static void SetAccept(HttpRequestMessage request, params string[] mediaTypes)
    {
        if (mediaTypes.Length > 0)
        {
            request.Headers.TryAddWithoutValidation("Accept", string.Join(", ", mediaTypes));
        }
    }

    // ---------------------------------------------------------------------------------------------------------
    // Request content
    // ---------------------------------------------------------------------------------------------------------

    /// <summary>
    /// Creates a JSON body. The value is serialized as <typeparamref name="T"/> (not as its runtime type), so that a
    /// subtype of a polymorphic base serialized through <typeparamref name="T"/> carries its type discriminator.
    /// </summary>
    public static HttpContent CreateJsonContent<T>(T value, string mediaType = "application/json")
    {
        return CreateStringContent(JsonSerializer.Serialize(value, typeof(T), JsonOptions), mediaType);
    }

    /// <summary>Creates a plain text body.</summary>
    public static HttpContent CreateTextContent(string value, string mediaType = "text/plain")
    {
        return CreateStringContent(value, mediaType);
    }

    /// <summary>
    /// Creates a raw binary body from a <see cref="Stream"/>, a <c>byte[]</c> or an <see cref="ApiFile"/>. The request
    /// disposes the stream once it is sent.
    /// </summary>
    public static HttpContent CreateBinaryContent(object value, string mediaType = "application/octet-stream")
    {
        HttpContent content = value switch
        {
            Stream stream => new StreamContent(stream),
            byte[] bytes => new ByteArrayContent(bytes),
            ApiFile file => new StreamContent(file.Content),
            _ => throw new NotSupportedException($"A binary body cannot be created from {value.GetType()}."),
        };
        content.Headers.ContentType = MediaTypeHeaderValue.Parse(mediaType);
        return content;
    }

    /// <summary>
    /// Creates an <c>application/x-www-form-urlencoded</c> body from the properties of <paramref name="value"/>
    /// (style <c>form</c>, exploded).
    /// </summary>
    public static HttpContent CreateFormContent<T>(T value)
    {
        var node = ToNode(value, typeof(T));
        if (node is not JsonObject obj)
        {
            throw new NotSupportedException("A form body must be serialized as an object.");
        }

        var pairs = new List<KeyValuePair<string, string>>();
        foreach (var property in obj)
        {
            if (property.Value is JsonObject nested)
            {
                pairs.Add(new KeyValuePair<string, string>(property.Key, nested.ToJsonString()));
            }
            else
            {
                AddPairs(pairs, property.Key, property.Value, "form", true);
            }
        }

        var text = string.Join("&", pairs.Select(pair => Encode(pair.Key) + "=" + Encode(pair.Value)));
        return CreateStringContent(text, "application/x-www-form-urlencoded");
    }

    /// <summary>Creates an empty <c>multipart/form-data</c> body to add parts to.</summary>
    public static MultipartFormDataContent CreateMultipartContent()
    {
        return new MultipartFormDataContent();
    }

    /// <summary>
    /// Adds the part(s) of one multipart field. Files (<see cref="ApiFile"/>, <see cref="Stream"/>, <c>byte[]</c>) become
    /// file parts, objects become <c>application/json</c> parts and primitives become text parts. Collections add one
    /// part per item. A <c>null</c> value adds nothing.
    /// </summary>
    public static void AddPart(MultipartFormDataContent content, string name, object? value)
    {
        switch (value)
        {
            case null:
                return;
            case ApiFile file:
                AddFilePart(content, name, file);
                return;
            case Stream stream:
                AddFilePart(content, name, new ApiFile(stream));
                return;
            case byte[] bytes:
                AddFilePart(content, name, new ApiFile(new MemoryStream(bytes)));
                return;
            case IEnumerable<ApiFile> files:
                foreach (var item in files)
                {
                    AddFilePart(content, name, item);
                }

                return;
            case IEnumerable<Stream> streams:
                foreach (var item in streams)
                {
                    AddFilePart(content, name, new ApiFile(item));
                }

                return;
        }

        var node = ToNode(value);
        if (node is JsonArray array)
        {
            foreach (var item in array)
            {
                AddNodePart(content, name, item);
            }
        }
        else
        {
            AddNodePart(content, name, node);
        }
    }

    /// <summary>A UTF-8 string body whose <c>Content-Type</c> is exactly <paramref name="mediaType"/>, without a charset parameter.</summary>
    private static StringContent CreateStringContent(string value, string mediaType)
    {
        var content = new StringContent(value, Encoding.UTF8);
        content.Headers.ContentType = MediaTypeHeaderValue.Parse(mediaType);
        return content;
    }

    private static void AddNodePart(MultipartFormDataContent content, string name, JsonNode? node)
    {
        switch (node)
        {
            case null:
                return;
            case JsonValue:
            {
                var part = new StringContent(Scalar(node));
                part.Headers.ContentType = null;
                AddNamedPart(content, part, name, null);
                return;
            }
            default:
                AddNamedPart(content, CreateStringContent(node.ToJsonString(JsonOptions), "application/json"), name, null);
                return;
        }
    }

    private static void AddFilePart(MultipartFormDataContent content, string name, ApiFile file)
    {
        var fileName = file.FileName ?? name;
        var part = new StreamContent(file.Content);
        part.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType ?? GuessContentType(fileName));
        AddNamedPart(content, part, name, fileName);
    }

    private static void AddNamedPart(MultipartFormDataContent content, HttpContent part, string name, string? fileName)
    {
        var disposition = new ContentDispositionHeaderValue("form-data") { Name = Quote(name) };
        if (fileName is not null)
        {
            var isAscii = fileName.All(c => c < 128);
            disposition.FileName = Quote(isAscii ? fileName : new string(fileName.Select(c => c < 128 ? c : '_').ToArray()));
            if (!isAscii)
            {
                disposition.FileNameStar = fileName;
            }
        }

        part.Headers.ContentDisposition = disposition;
        content.Add(part);
    }

    private static string Quote(string value)
    {
        return "\"" + value.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    }

    private static string GuessContentType(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".svg" => "image/svg+xml",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            ".html" or ".htm" => "text/html",
            ".json" => "application/json",
            ".xml" => "application/xml",
            ".pdf" => "application/pdf",
            ".zip" => "application/zip",
            _ => "application/octet-stream",
        };
    }

    // ---------------------------------------------------------------------------------------------------------
    // Responses
    // ---------------------------------------------------------------------------------------------------------

    /// <summary>
    /// Deserializes a JSON response body. An empty body yields <c>default</c> if <paramref name="allowEmpty"/> is set
    /// and a <see cref="JsonException"/> otherwise.
    /// </summary>
    public static async Task<T> ReadJsonAsync<T>(HttpResponseMessage response, bool allowEmpty, CancellationToken cancellationToken)
    {
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken).ConfigureAwait(false);
        if (bytes.Length == 0)
        {
            return allowEmpty ? default! : throw new JsonException("The response body is empty.");
        }

        return JsonSerializer.Deserialize<T>(bytes, JsonOptions)!;
    }

    /// <summary>Reads a text response body.</summary>
    public static async Task<string> ReadTextAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        return await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Reads a binary response body. The body is buffered, so the returned stream does not depend on the response and
    /// can be read and disposed at any time.
    /// </summary>
    public static async Task<Stream> ReadStreamAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken).ConfigureAwait(false);
        return new MemoryStream(bytes, writable: false);
    }

    /// <summary>The headers of a response, including its content headers.</summary>
    public static IReadOnlyDictionary<string, IReadOnlyList<string>> GetHeaders(HttpResponseMessage response)
    {
        var headers = new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase);
        foreach (var header in response.Headers)
        {
            headers[header.Key] = header.Value.ToList();
        }

        foreach (var header in response.Content.Headers)
        {
            headers[header.Key] = header.Value.ToList();
        }

        return headers;
    }

    /// <summary>Reads the body of an error response as text. An empty body yields an empty string.</summary>
    public static async Task<string> ReadErrorBodyAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        return await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Deserializes the JSON body of an error response, or returns <c>default</c> if the body is empty or does not
    /// match <typeparamref name="T"/>. The raw body stays available on the exception either way.
    /// </summary>
    public static T? TryDeserialize<T>(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(body, JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    // ---------------------------------------------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------------------------------------------

    private static JsonNode? ToNode(object? value, Type? type = null)
    {
        return value switch
        {
            null => null,
            JsonNode node => node,
            _ => JsonSerializer.SerializeToNode(value, type ?? value.GetType(), JsonOptions),
        };
    }

    private static string Scalar(JsonNode? node)
    {
        return node switch
        {
            null => string.Empty,
            JsonValue value when value.GetValueKind() == JsonValueKind.String => value.GetValue<string>(),
            _ => node.ToJsonString(),
        };
    }

    private static string Delimiter(string style)
    {
        return style switch
        {
            "spaceDelimited" => " ",
            "pipeDelimited" => "|",
            _ => ",",
        };
    }

    private static string EncodeKey(string key)
    {
        return Encode(key).Replace("%5B", "[").Replace("%5D", "]");
    }

    private static void AddPairs(List<KeyValuePair<string, string>> pairs, string name, JsonNode? node, string style, bool explode)
    {
        switch (node)
        {
            case null:
                return;
            case JsonArray array:
            {
                var items = array.Where(item => item is not null).Select(Scalar).ToList();
                if (explode || style == "deepObject")
                {
                    foreach (var item in items)
                    {
                        pairs.Add(new KeyValuePair<string, string>(name, item));
                    }
                }
                else
                {
                    pairs.Add(new KeyValuePair<string, string>(name, string.Join(Delimiter(style), items)));
                }

                return;
            }
            case JsonObject obj:
            {
                var properties = obj.Where(property => property.Value is not null).ToList();
                if (style == "deepObject")
                {
                    foreach (var property in properties)
                    {
                        AddPairs(pairs, $"{name}[{property.Key}]", property.Value, style, explode);
                    }
                }
                else if (explode)
                {
                    foreach (var property in properties)
                    {
                        if (property.Value is JsonObject nested)
                        {
                            pairs.Add(new KeyValuePair<string, string>(property.Key, nested.ToJsonString()));
                        }
                        else
                        {
                            AddPairs(pairs, property.Key, property.Value, "form", true);
                        }
                    }
                }
                else
                {
                    var flat = properties.SelectMany(property => new[] { property.Key, Scalar(property.Value) });
                    pairs.Add(new KeyValuePair<string, string>(name, string.Join(Delimiter(style), flat)));
                }

                return;
            }
            default:
                pairs.Add(new KeyValuePair<string, string>(name, Scalar(node)));
                return;
        }
    }
}`,
};

const apiException: CSharpRuntimeFile = {
  fileName: 'ApiException.cs',
  usings: ['System', 'System.Collections.Generic', 'System.Net'],
  body: String.raw`/// <summary>
/// Thrown by a generated client for every response whose status code is not a success (2xx) status, whether the
/// operation documents it or not. A documented response is thrown as a subclass with a typed body.
/// </summary>
/// <remarks>
/// Failures that are not an HTTP status (an unreachable host, a timeout, a cancellation) are never wrapped: they
/// surface as whatever <see cref="System.Net.Http.HttpClient"/> throws.
/// </remarks>
public class ApiException : Exception
{
    /// <summary>Creates the exception for a response.</summary>
    /// <param name="statusCode">The HTTP status code of the response.</param>
    /// <param name="responseHeaders">The headers of the response, including its content headers.</param>
    /// <param name="responseBody">The body of the response as text, or an empty string if it has none.</param>
    public ApiException(
        int statusCode,
        IReadOnlyDictionary<string, IReadOnlyList<string>> responseHeaders,
        string responseBody)
        : base($"The request failed with status code {statusCode} ({(HttpStatusCode)statusCode}).")
    {
        StatusCode = statusCode;
        ResponseHeaders = responseHeaders;
        ResponseBody = responseBody;
    }

    /// <summary>The HTTP status code of the response.</summary>
    public int StatusCode { get; }

    /// <summary>The headers of the response, including its content headers.</summary>
    public IReadOnlyDictionary<string, IReadOnlyList<string>> ResponseHeaders { get; }

    /// <summary>The body of the response as text, or an empty string if it has none.</summary>
    public string ResponseBody { get; }
}`,
};

const apiFile: CSharpRuntimeFile = {
  fileName: 'ApiFile.cs',
  usings: ['System.IO'],
  body: String.raw`/// <summary>
/// A file sent as a part of a <c>multipart/form-data</c> request. A <see cref="Stream"/> converts to it implicitly.
/// The request disposes the stream once it is sent.
/// </summary>
/// <param name="Content">The content of the file.</param>
/// <param name="FileName">The file name sent to the server. Defaults to the name of the form field.</param>
/// <param name="ContentType">The media type of the file. Defaults to a guess from the file name.</param>
public sealed record ApiFile(Stream Content, string? FileName = null, string? ContentType = null)
{
    /// <summary>Wraps a stream as a file without a file name or media type.</summary>
    public static implicit operator ApiFile(Stream stream) => new(stream);
}`,
};

export const csharpClientRuntimeFiles: readonly CSharpRuntimeFile[] = [apiRuntime, apiException, apiFile];
