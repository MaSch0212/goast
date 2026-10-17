#nullable enable

using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using OpenApi.Generated.MinimalApis;
using OpenApi.Generated.Models;

namespace Goast.Server;

/// <summary>The implementation of the generated Pets API: returns each case's expected response.</summary>
public sealed class PetsApi : PetsApiBase
{
    public override Task<GetPetResult> GetPetAsync(string id, CancellationToken cancellationToken)
    {
        Expect.Param("getPet.id", "abc", id);
        return Task.FromResult(GetPetResult.Ok(CaseData.Rex));
    }

    public override Task<UpdatePetResult> UpdatePetAsync(string id, PetUpdate body, CancellationToken cancellationToken)
    {
        Expect.Param("updatePet.id", "abc", id);
        Expect.Param("updatePet.body", new PetUpdate { Name = "Rex", Age = 4 }, body);
        return Task.FromResult(UpdatePetResult.Ok(CaseData.RexAged));
    }

    public override Task<DeletePetResult> DeletePetAsync(string id, CancellationToken cancellationToken)
    {
        Expect.Param("deletePet.id", "abc", id);
        return Task.FromResult(DeletePetResult.NoContent());
    }

    public override Task<CreatePetResult> CreatePetAsync(Pet body, CancellationToken cancellationToken)
    {
        Expect.Param("createPet.body", CaseData.Fido, body);
        return Task.FromResult(CreatePetResult.Created(CaseData.Fido));
    }

    public override async Task<UploadPetPhotoResult> UploadPetPhotoAsync(
        string id,
        IFormFile file,
        string? caption,
        CancellationToken cancellationToken
    )
    {
        Expect.Param("uploadPetPhoto.id", "abc", id);
        await Expect.FileAsync("uploadPetPhoto.file", file, "photo.png", "image/png", "binarydata");
        Expect.Param("uploadPetPhoto.caption", "A good boy", caption);
        return UploadPetPhotoResult.Ok();
    }

    public override Task<AddPetNoteResult> AddPetNoteAsync(string id, string body, CancellationToken cancellationToken)
    {
        Expect.Param("addPetNote.id", "abc", id);
        Expect.Param("addPetNote.body", "plain text body", body);
        return Task.FromResult(AddPetNoteResult.Ok(CaseData.Rex));
    }
}

/// <summary>The implementation of the generated Widgets API.</summary>
public sealed class WidgetsApi : WidgetsApiBase
{
    public override Task<GetWidgetResult> GetWidgetAsync(string id, CancellationToken cancellationToken)
    {
        var data = CaseData.Widget(id);
        return Task.FromResult(
            data.Status switch
            {
                200 => GetWidgetResult.Ok(data.Widget!, 42),
                400 => GetWidgetResult.BadRequest(data.Error!),
                404 => GetWidgetResult.NotFound(data.Error!),
                500 => GetWidgetResult.InternalServerError(data.Error!),
                _ => GetWidgetResult.Default(data.Status, data.Error!),
            }
        );
    }
}

/// <summary>The implementation of the generated Blobs API.</summary>
public sealed class BlobsApi : BlobsApiBase
{
    public override async Task<UploadBlobResult> UploadBlobAsync(System.IO.Stream body, CancellationToken cancellationToken)
    {
        Expect.Param("uploadBlob.body", "hello", await Expect.ReadAsync(body));
        return UploadBlobResult.Created(new BlobRef { Id = "blob1" });
    }
}

/// <summary>The implementation of the generated Params API.</summary>
public sealed class ParamsApi : ParamsApiBase
{
    public override Task<AllLocationsResult> AllLocationsAsync(
        string pathParam,
        string? queryParam,
        string? xHeaderParam,
        string? session,
        CancellationToken cancellationToken
    )
    {
        Expect.Param("allLocations.pathParam", "loc1", pathParam);
        Expect.Param("allLocations.queryParam", "q1", queryParam);
        Expect.Param("allLocations.xHeaderParam", "h1", xHeaderParam);
        Expect.Param("allLocations.session", "abc123", session);
        return Task.FromResult(AllLocationsResult.Ok());
    }

    public override Task<StyleMatrixResult> StyleMatrixAsync(
        IReadOnlyList<string>? formExploded,
        IReadOnlyList<string>? formUnexploded,
        IReadOnlyList<string>? spaceDelimited,
        CancellationToken cancellationToken
    )
    {
        CaseData.StyleMatrix(formExploded, formUnexploded, spaceDelimited);
        return Task.FromResult(StyleMatrixResult.Ok());
    }

    public override Task<PathStyleSimpleResult> PathStyleSimpleAsync(IReadOnlyList<string> values, CancellationToken cancellationToken)
    {
        Expect.Sequence("pathStyleSimple.values", new[] { "a", "b" }, values);
        return Task.FromResult(PathStyleSimpleResult.Ok());
    }

    public override Task<GetEncodedResult> GetEncodedAsync(string value, string? raw, CancellationToken cancellationToken)
    {
        Expect.Param("getEncoded.value", "abc def/x", value);
        Expect.Param("getEncoded.raw", "a&b=c", raw);
        return Task.FromResult(GetEncodedResult.Ok());
    }
}
