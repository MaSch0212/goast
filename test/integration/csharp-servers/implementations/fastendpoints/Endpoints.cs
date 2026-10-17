#nullable enable

using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using OpenApi.Generated.FastEndpoints;
using OpenApi.Generated.Models;

namespace Goast.Server;

// FastEndpoints secures an endpoint unless it says otherwise; the generated code leaves authorization to the
// implementation (`ConfigureEndpoint`), so every endpoint here allows anonymous access.

public sealed class GetPetEndpoint : GetPetEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<GetPetResult> GetPetAsync(string id, CancellationToken cancellationToken)
    {
        Expect.Param("getPet.id", "abc", id);
        return Task.FromResult(GetPetResult.Ok(CaseData.Rex));
    }
}

public sealed class UpdatePetEndpoint : UpdatePetEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<UpdatePetResult> UpdatePetAsync(string id, PetUpdate body, CancellationToken cancellationToken)
    {
        Expect.Param("updatePet.id", "abc", id);
        Expect.Param("updatePet.body", new PetUpdate { Name = "Rex", Age = 4 }, body);
        return Task.FromResult(UpdatePetResult.Ok(CaseData.RexAged));
    }
}

public sealed class DeletePetEndpoint : DeletePetEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<DeletePetResult> DeletePetAsync(string id, CancellationToken cancellationToken)
    {
        Expect.Param("deletePet.id", "abc", id);
        return Task.FromResult(DeletePetResult.NoContent());
    }
}

public sealed class CreatePetEndpoint : CreatePetEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<CreatePetResult> CreatePetAsync(Pet body, CancellationToken cancellationToken)
    {
        Expect.Param("createPet.body", CaseData.Fido, body);
        return Task.FromResult(CreatePetResult.Created(CaseData.Fido));
    }
}

public sealed class UploadPetPhotoEndpoint : UploadPetPhotoEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override async Task<UploadPetPhotoResult> UploadPetPhotoAsync(
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
}

public sealed class AddPetNoteEndpoint : AddPetNoteEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<AddPetNoteResult> AddPetNoteAsync(string id, string body, CancellationToken cancellationToken)
    {
        Expect.Param("addPetNote.id", "abc", id);
        Expect.Param("addPetNote.body", "plain text body", body);
        return Task.FromResult(AddPetNoteResult.Ok(CaseData.Rex));
    }
}

public sealed class GetWidgetEndpoint : GetWidgetEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<GetWidgetResult> GetWidgetAsync(string id, CancellationToken cancellationToken)
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

public sealed class UploadBlobEndpoint : UploadBlobEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override async Task<UploadBlobResult> UploadBlobAsync(Stream body, CancellationToken cancellationToken)
    {
        Expect.Param("uploadBlob.body", "hello", await Expect.ReadAsync(body));
        return UploadBlobResult.Created(new BlobRef { Id = "blob1" });
    }
}

public sealed class AllLocationsEndpoint : AllLocationsEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<AllLocationsResult> AllLocationsAsync(
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
}

public sealed class StyleMatrixEndpoint : StyleMatrixEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<StyleMatrixResult> StyleMatrixAsync(
        IReadOnlyList<string>? formExploded,
        IReadOnlyList<string>? formUnexploded,
        IReadOnlyList<string>? spaceDelimited,
        CancellationToken cancellationToken
    )
    {
        CaseData.StyleMatrix(formExploded, formUnexploded, spaceDelimited);
        return Task.FromResult(StyleMatrixResult.Ok());
    }
}

public sealed class PathStyleSimpleEndpoint : PathStyleSimpleEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<PathStyleSimpleResult> PathStyleSimpleAsync(IReadOnlyList<string> values, CancellationToken cancellationToken)
    {
        Expect.Sequence("pathStyleSimple.values", new[] { "a", "b" }, values);
        return Task.FromResult(PathStyleSimpleResult.Ok());
    }
}

public sealed class GetEncodedEndpoint : GetEncodedEndpointBase
{
    protected override void ConfigureEndpoint() => AllowAnonymous();

    protected override Task<GetEncodedResult> GetEncodedAsync(string value, string? raw, CancellationToken cancellationToken)
    {
        Expect.Param("getEncoded.value", "abc def/x", value);
        Expect.Param("getEncoded.raw", "a&b=c", raw);
        return Task.FromResult(GetEncodedResult.Ok());
    }
}
