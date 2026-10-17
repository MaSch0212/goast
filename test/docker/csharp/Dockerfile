FROM mcr.microsoft.com/dotnet/sdk:10.0

# NUGET_PACKAGES is the global packages folder the warmup restore populates; it lives in this image
# layer, so editing the synthesized build never invalidates it. DOTNET_* keep the run quiet and
# hermetic: no telemetry, no first-run banner, no update checks.
ENV NUGET_PACKAGES=/opt/nuget \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1 \
    DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 \
    DOTNET_GENERATE_ASPNET_CERTIFICATE=false \
    MSBUILDDISABLENODEREUSE=1

WORKDIR /opt/warmup
COPY warmup/ ./
RUN dotnet restore Warmup.csproj && rm -rf /opt/warmup

# The synthesized solution, projects and nuget.config are mounted read-only at /seed and copied into
# /work (kept off any host bind mount; see runCSharp). The committed trees are read-only at /output.
# The seeded nuget.config clears every package source, so a package the warmup did not restore fails
# the build instead of reaching for the network. Restore resolves each exact version from NUGET_PACKAGES.
WORKDIR /work
ENTRYPOINT ["sh", "-c", "cp -r /seed/. /work/ && exec dotnet build /work/goast-compile-gate.slnx -m -nologo -clp:NoSummary"]
