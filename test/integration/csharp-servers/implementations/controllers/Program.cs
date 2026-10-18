#nullable enable

using Goast.Server;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://0.0.0.0:{GoastHost.Port}");

// The generated controllers are in this assembly, so MVC discovers them with the implementations.
builder.Services.AddControllers();

var app = builder.Build();
app.UseGoastHost();
app.MapControllers();
app.Run();
