#!/bin/sh
# Checks Go units, each a directory under /tree given as an argument (e.g. `v3/simple-schemas`).
#
# For each unit it prints `##GOAST-UNIT## <unit>`, then a `##GOAST-GOFMT## <file>` line per file gofmt
# would change, then the output of `go build` (or of `go vet` when the build passes), and finally
# `##GOAST-EXIT## <code>` with the exit code of the last of them. File paths are relative to the unit.
set -u

for unit in "$@"; do
  echo "##GOAST-UNIT## $unit"
  work="/work/$unit"
  rm -rf "$work" && mkdir -p "$work"
  cp -R "/tree/$unit/." "$work/"
  printf 'module example.com/generated\n\ngo 1.22\n' > "$work/go.mod"
  cd "$work" || exit 1

  gofmt -l . | sed 's|^|##GOAST-GOFMT## |'
  go build ./... 2>&1
  code=$?
  if [ "$code" -eq 0 ]; then
    go vet ./... 2>&1
    code=$?
  fi
  echo "##GOAST-EXIT## $code"
  cd /work
done
