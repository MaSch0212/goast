/**
 * The NuGet packages the C# compile gate (and, later, the C# integration drivers) restore.
 *
 * This is the single source of truth for versions. `test/docker/csharp/warmup/Warmup.csproj` restores
 * these exact versions at image build time so every later build runs offline, and `dependencies.test.ts`
 * fails when the two drift. `Microsoft.AspNetCore.App` is a framework reference, not a package, so it
 * has no entry: the `Microsoft.NET.Sdk.Web` SDK brings it (and `IHttpClientFactory`) along.
 */
export const CSHARP_PACKAGES = {
  /** Server generators: endpoint base classes and `Send*Async` helpers. */
  FastEndpoints: '8.3.0',
  /** `IHttpClientFactory` for non-Web projects (the Web SDK already includes it in the shared framework). */
  'Microsoft.Extensions.Http': '10.0.13',
} as const satisfies Readonly<Record<string, string>>;

/** The target framework every synthesized project and the warmup project use. */
export const CSHARP_TARGET_FRAMEWORK = 'net10.0';

/** `<PackageReference …/>` lines for the packages a synthesized compile project references. */
export function csharpPackageReferences(names: readonly (keyof typeof CSHARP_PACKAGES)[]): string[] {
  return names.map((name) => `<PackageReference Include="${name}" Version="${CSHARP_PACKAGES[name]}" />`);
}
