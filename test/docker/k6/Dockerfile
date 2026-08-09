FROM grafana/k6:2.1.0

# No layers of our own. This exists so the image goes through `buildImage`'s content-hash tagging like every
# other tier-4 image, rather than a test hardcoding an upstream tag — pinning the base here means the tag
# changes if the pin changes, and a stale image cannot be silently reused.
