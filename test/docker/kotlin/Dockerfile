FROM gradle:8.14-jdk21

# The warm dependency cache is what makes this job fast, and it must be its own layer so that editing
# the synthesized build never invalidates it.
WORKDIR /opt/warmup
COPY warmup/ ./
RUN gradle --no-daemon warm && rm -rf /opt/warmup

# GRADLE_USER_HOME holds the cache the layer above populated. The synthesized build files are mounted
# read-only at /seed and copied into /work, the project dir, which stays off any host bind mount (see
# gradleWorkStorage in test/compile-tests/runners/kotlin.ts). The committed trees are read-only at /output.
ENV GRADLE_USER_HOME=/home/gradle/.gradle
WORKDIR /work
ENTRYPOINT ["sh", "-c", "cp /seed/* /work/ && exec gradle --no-daemon --offline --parallel --continue compileKotlin"]
