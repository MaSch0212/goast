// Drives the generated C# HTTP clients against the reference server.
//
// Arguments are hardcoded rather than read from the case table: writing `pets.GetPetAsync("abc")` in
// typed C# *is* the assertion that the generated signature is usable. Emission order below matches
// `casesFor('csharp/http-clients', 'client')` table order, because the reference server consumes one
// queue per (method, pathTemplate) and two cases share `PUT /pets/{id}`.
//
// Result encoding, mirroring the other client drivers:
//   - a call that returns a value reports that value, serialized with the generated models' own
//     System.Text.Json attributes;
//   - a call that returns nothing (`Task`) gives a caller no way to read the status from its return
//     value, so those cases report `{"status": <n>}` from a `DelegatingHandler` on the HttpClient that
//     remembers the last response's status code, the way the okhttp3 driver reads `WithHttpInfo`;
//   - a non-2xx response is caught as the operation's *typed* exception (`GetWidgetBadRequestException`
//     and friends) and reports its decoded `Body`, which is exactly what the case table's
//     `expectResult` declares. Catching the specific subclass is deliberate: if the client threw the
//     base `ApiException` instead, the `catch` below would not match and the case would report an
//     `{"error": ...}` instead of conforming;
//   - anything else a call throws is reported as `{"error": <type>, "message": <text>}`, so one broken
//     case cannot abort the other 18.
//
// Auth is not part of the generated surface: the client takes a plain `HttpClient`, so the
// `Authorization` and `x-api-key` headers the cases require are attached the way any caller would, with
// `DefaultRequestHeaders`.

using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using OpenApi.Generated.Clients;
using OpenApi.Generated.Models;

internal sealed class StatusRecorder : DelegatingHandler
{
    public int LastStatus { get; private set; }

    public StatusRecorder() : base(new HttpClientHandler()) { }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken).ConfigureAwait(false);
        LastStatus = (int)response.StatusCode;
        return response;
    }
}

internal static class Program
{
    private const string Prefix = "##GOAST-CASE##";

    private static void Emit(string caseId, string resultJson) =>
        Console.Out.WriteLine($"{Prefix}{{\"caseId\":{JsonSerializer.Serialize(caseId)},\"result\":{resultJson}}}");

    private static async Task RunCase(string caseId, Func<Task<string>> block)
    {
        string resultJson;
        try
        {
            resultJson = await block().ConfigureAwait(false);
        }
        catch (Exception e)
        {
            resultJson = JsonSerializer.Serialize(new { error = e.GetType().FullName, message = e.Message });
        }

        Emit(caseId, resultJson);
    }

    private static async Task<int> Main()
    {
        var baseUrl = Environment.GetEnvironmentVariable("GOAST_BASE_URL")
            ?? throw new InvalidOperationException("GOAST_BASE_URL is not set");

        var recorder = new StatusRecorder();
        using var http = new HttpClient(recorder) { BaseAddress = new Uri(baseUrl) };
        http.DefaultRequestHeaders.Add("Authorization", "Bearer secret-token");
        http.DefaultRequestHeaders.Add("x-api-key", "secret-key");

        IPetsClient pets = new PetsClient(http);
        IWidgetsClient widgets = new WidgetsClient(http);
        IBlobsClient blobs = new BlobsClient(http);
        IParamsClient paramsClient = new ParamsClient(http);

        string Status() => JsonSerializer.Serialize(new { status = recorder.LastStatus });

        await RunCase("getPet/ok", async () => JsonSerializer.Serialize(await pets.GetPetAsync("abc")));

        await RunCase(
            "updatePet/json",
            async () => JsonSerializer.Serialize(
                await pets.UpdatePetAsync("abc", new PetUpdate { Name = "Rex", Age = 4 })));

        await RunCase(
            "updatePet/form",
            async () => JsonSerializer.Serialize(
                await pets.UpdatePetAsync("abc", new PetUpdate { Name = "Rex", Age = 4 })));

        await RunCase(
            "addPetNote/text",
            async () => JsonSerializer.Serialize(await pets.AddPetNoteAsync("abc", "plain text body")));

        await RunCase("deletePet/noContent", async () =>
        {
            await pets.DeletePetAsync("abc");
            return Status();
        });

        await RunCase(
            "createPet/created",
            async () => JsonSerializer.Serialize(
                await pets.CreatePetAsync(new Pet { Id = "new1", Name = "Fido" })));

        await RunCase("uploadPetPhoto/ok", async () =>
        {
            // Only the file name is given: the content type is left to the client's guess from it.
            var photo = new ApiFile(new MemoryStream(Encoding.UTF8.GetBytes("binarydata")), "photo.png");
            await pets.UploadPetPhotoAsync("abc", photo, "A good boy");
            return Status();
        });

        await RunCase("getWidget/ok", async () => JsonSerializer.Serialize(await widgets.GetWidgetAsync("w1")));

        await RunCase("getWidget/badRequest", async () =>
        {
            try
            {
                return JsonSerializer.Serialize(await widgets.GetWidgetAsync("bad"));
            }
            catch (GetWidgetBadRequestException e)
            {
                return JsonSerializer.Serialize(e.Body);
            }
        });

        await RunCase("getWidget/notFound", async () =>
        {
            try
            {
                return JsonSerializer.Serialize(await widgets.GetWidgetAsync("missing"));
            }
            catch (GetWidgetNotFoundException e)
            {
                return JsonSerializer.Serialize(e.Body);
            }
        });

        await RunCase("getWidget/serverError", async () =>
        {
            try
            {
                return JsonSerializer.Serialize(await widgets.GetWidgetAsync("boom"));
            }
            catch (GetWidgetInternalServerErrorException e)
            {
                return JsonSerializer.Serialize(e.Body);
            }
        });

        await RunCase("getWidget/unexpectedError", async () =>
        {
            try
            {
                return JsonSerializer.Serialize(await widgets.GetWidgetAsync("other"));
            }
            catch (GetWidgetDefaultException e)
            {
                return JsonSerializer.Serialize(e.Body);
            }
        });

        await RunCase(
            "uploadBlob/ok",
            async () => JsonSerializer.Serialize(
                await blobs.UploadBlobAsync(new MemoryStream(Encoding.UTF8.GetBytes("hello")))));

        await RunCase("allLocations/ok", async () =>
        {
            await paramsClient.AllLocationsAsync("loc1", "q1", "h1", "abc123");
            return Status();
        });

        await RunCase("styleMatrix/formExploded", async () =>
        {
            await paramsClient.StyleMatrixAsync(formExploded: new[] { "a", "b" });
            return Status();
        });

        await RunCase("styleMatrix/formUnexploded", async () =>
        {
            await paramsClient.StyleMatrixAsync(formUnexploded: new[] { "a", "b" });
            return Status();
        });

        await RunCase("styleMatrix/spaceDelimited", async () =>
        {
            await paramsClient.StyleMatrixAsync(spaceDelimited: new[] { "a", "b" });
            return Status();
        });

        await RunCase("pathStyleSimple/ok", async () =>
        {
            await paramsClient.PathStyleSimpleAsync(new[] { "a", "b" });
            return Status();
        });

        await RunCase("getEncoded/ok", async () =>
        {
            await paramsClient.GetEncodedAsync("abc def/x", "a&b=c");
            return Status();
        });

        return 0;
    }
}
