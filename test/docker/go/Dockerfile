FROM golang:1.27-alpine

# The generated code uses the standard library only, so warming the build cache with it is all the
# image needs to check a unit offline and fast.
ENV CGO_ENABLED=0 GOTOOLCHAIN=local
RUN go build std && go vet std >/dev/null 2>&1 || true

COPY check.sh /opt/goast/check.sh

# The committed trees are read-only at /tree. check.sh copies each unit into /work, gives it a go.mod and
# runs gofmt, go build and go vet there, so the gate writes nothing into reviewed output.
WORKDIR /work
ENTRYPOINT ["sh", "/opt/goast/check.sh"]
