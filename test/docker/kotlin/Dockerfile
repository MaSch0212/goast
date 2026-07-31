FROM gradle:8.14-jdk21

# The warm dependency cache is what makes this job fast, and it must be its own layer so that editing
# the synthesized build never invalidates it.
WORKDIR /opt/warmup
COPY warmup/ ./
RUN gradle --no-daemon warm && rm -rf /opt/warmup

# GRADLE_USER_HOME holds the cache the layer above populated. The synthesized build is mounted at
# /work and the committed trees read-only at /output.
ENV GRADLE_USER_HOME=/home/gradle/.gradle
WORKDIR /work
ENTRYPOINT ["gradle", "--no-daemon", "--offline", "--parallel", "--continue", "compileKotlin"]
