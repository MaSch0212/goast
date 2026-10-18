#nullable enable

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Goast.Server;

/// <summary>
/// Thrown when a parameter the framework bound is not what the case table says the request carried.
///
/// The implementations are the server direction's assertion, the way a typed call is the client direction's:
/// the only channel the test can observe is the HTTP response, so a mis-bound parameter has to become a
/// distinguishable response. <see cref="GoastHost"/> renders this as 599 with the detail as a plain-text body,
/// which lands verbatim in the committed deviation artifact.
/// </summary>
public sealed class GoastMismatch : Exception
{
    public GoastMismatch(string detail)
        : base(detail)
    {
    }
}

/// <summary>
/// Thrown when the generated result type cannot express the response the case table declares. Rendered as 598.
/// Signalling it explicitly keeps an artifact honest: substituting another available status would record a smaller,
/// wrong deviation and hide the actual gap.
/// </summary>
public sealed class GoastUnexpressible : Exception
{
    public GoastUnexpressible(string detail)
        : base(detail)
    {
    }
}

/// <summary>Assertions of the bound parameters against the case table.</summary>
public static class Expect
{
    /// <summary>Asserts one bound value, and returns it so callers can chain.</summary>
    public static T Param<T>(string name, T expected, T actual)
    {
        if (!EqualityComparer<T>.Default.Equals(expected, actual))
        {
            throw new GoastMismatch($"{name} expected <{Render(expected)}> but was <{Render(actual)}>");
        }

        return actual;
    }

    /// <summary>Asserts a list value element by element.</summary>
    public static void Sequence(string name, IReadOnlyList<string> expected, IReadOnlyList<string>? actual)
    {
        if (actual is null || !expected.SequenceEqual(actual))
        {
            throw new GoastMismatch($"{name} expected <{Render(expected)}> but was <{Render(actual)}>");
        }
    }

    /// <summary>Reads a stream to the end as UTF-8 text.</summary>
    public static async Task<string> ReadAsync(Stream stream)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return await reader.ReadToEndAsync();
    }

    /// <summary>Asserts that a multipart file arrived with the given name, content type and content.</summary>
    public static async Task FileAsync(string name, IFormFile? file, string fileName, string contentType, string content)
    {
        if (file is null)
        {
            throw new GoastMismatch($"{name} expected a file but was <null>");
        }

        Param($"{name}.filename", fileName, file.FileName);
        Param($"{name}.contentType", contentType, file.ContentType);
        Param($"{name}.content", content, await ReadAsync(file.OpenReadStream()));
    }

    private static string Render<T>(T value)
    {
        return value switch
        {
            null => "null",
            string text => text,
            IEnumerable<string> items => "[" + string.Join(", ", items) + "]",
            _ => value.ToString() ?? "null",
        };
    }
}

/// <summary>The (status, body) pair <c>getWidget</c> must answer for one widget id.</summary>
public sealed record WidgetCase(int Status, OpenApi.Generated.Models.Widget? Widget, OpenApi.Generated.Models.Error? Error);

/// <summary>The data the case table declares, shared by the three frameworks.</summary>
public static class CaseData
{
    public static OpenApi.Generated.Models.Pet Rex => new() { Id = "abc", Name = "Rex" };

    public static OpenApi.Generated.Models.Pet RexAged => new() { Id = "abc", Name = "Rex", Age = 4 };

    public static OpenApi.Generated.Models.Pet Fido => new() { Id = "new1", Name = "Fido" };

    /// <summary>
    /// The response <c>getWidget</c> must answer for one widget id. The id discriminates the five cases, which makes this
    /// both the response selector and the assertion that the path parameter bound correctly.
    /// </summary>
    public static WidgetCase Widget(string id)
    {
        return id switch
        {
            "w1" => new WidgetCase(200, new OpenApi.Generated.Models.Widget { Id = "w1", Name = "Sprocket", Price = 9.99 }, null),
            "bad" => new WidgetCase(400, null, Error("Invalid widget id", 400)),
            "missing" => new WidgetCase(404, null, Error("Widget not found", 404)),
            "boom" => new WidgetCase(500, null, Error("Internal error", 500)),
            "other" => new WidgetCase(503, null, Error("Unexpected error", 503)),
            _ => throw new GoastMismatch($"getWidget.id was <{id}>, which no case declares"),
        };
    }

    /// <summary>
    /// Asserts that exactly one of <c>styleMatrix</c>'s three query parameters arrived, carrying <c>["a", "b"]</c>.
    /// The three cases each send one parameter and declare the same response, so which one arrived is what distinguishes
    /// them, and the decoded value is the point: <c>a,b</c> and <c>a b</c> must both arrive as two items.
    /// </summary>
    public static void StyleMatrix(
        IReadOnlyList<string>? formExploded,
        IReadOnlyList<string>? formUnexploded,
        IReadOnlyList<string>? spaceDelimited
    )
    {
        var present = new[]
        {
            ("formExploded", formExploded),
            ("formUnexploded", formUnexploded),
            ("spaceDelimited", spaceDelimited),
        }.Where(x => x.Item2 is not null).ToList();

        if (present.Count != 1)
        {
            throw new GoastMismatch(
                "styleMatrix expected exactly one non-null parameter but got "
                    + $"formExploded=<{Describe(formExploded)}> formUnexploded=<{Describe(formUnexploded)}> spaceDelimited=<{Describe(spaceDelimited)}>"
            );
        }

        Expect.Sequence($"styleMatrix.{present[0].Item1}", new[] { "a", "b" }, present[0].Item2);
    }

    private static string Describe(IReadOnlyList<string>? values)
    {
        return values is null ? "null" : "[" + string.Join(", ", values) + "]";
    }

    private static OpenApi.Generated.Models.Error Error(string message, int code)
    {
        return new OpenApi.Generated.Models.Error { Message = message, Code = code };
    }
}

/// <summary>The application shell shared by the three frameworks: port, readiness and failure rendering.</summary>
public static class GoastHost
{
    /// <summary>The port the server listens on inside the container.</summary>
    public const int Port = 8080;

    /// <summary>Answers the readiness probe and turns an implementation's own failure into a deterministic response.</summary>
    public static void UseGoastHost(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            if (context.Request.Path == "/__goast-readiness")
            {
                context.Response.StatusCode = StatusCodes.Status200OK;
                await context.Response.WriteAsync("ready");
                return;
            }

            try
            {
                await next(context);
            }
            catch (Exception exception) when (!context.Response.HasStarted)
            {
                // 599 and 598 render only text this repo wrote, so they are safe to commit. 597 interpolates a framework
                // exception's own message and may churn: a 597 in an artifact is a finding to investigate.
                var (status, body) = exception switch
                {
                    GoastMismatch => (599, "MISMATCH " + exception.Message),
                    GoastUnexpressible => (598, "UNEXPRESSIBLE " + exception.Message),
                    _ => (597, $"UNEXPECTED {exception.GetType().FullName}: {exception.Message}"),
                };
                context.Response.Clear();
                context.Response.StatusCode = status;
                context.Response.ContentType = "text/plain";
                await context.Response.WriteAsync(body);
            }
        });
    }
}
