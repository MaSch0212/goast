#nullable enable

using Goast.Server;
using OpenApi.Generated.MinimalApis;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://0.0.0.0:{GoastHost.Port}");

// Each generated API base is resolved from the service collection by its own type.
builder.Services.AddSingleton<PetsApiBase, PetsApi>();
builder.Services.AddSingleton<WidgetsApiBase, WidgetsApi>();
builder.Services.AddSingleton<BlobsApiBase, BlobsApi>();
builder.Services.AddSingleton<ParamsApiBase, ParamsApi>();

var app = builder.Build();
app.UseGoastHost();
app.MapPetsApi();
app.MapWidgetsApi();
app.MapBlobsApi();
app.MapParamsApi();
app.Run();
