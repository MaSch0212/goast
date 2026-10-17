#nullable enable

using FastEndpoints;
using Goast.Server;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://0.0.0.0:{GoastHost.Port}");
builder.Services.AddFastEndpoints();

var app = builder.Build();
app.UseGoastHost();
// The generated routes are the spec's paths, so FastEndpoints' default `/api` prefix is dropped.
app.UseFastEndpoints(config => config.Endpoints.RoutePrefix = null);
app.Run();
