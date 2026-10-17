// The application under test for tier 4's `go-clients` leg: the generated kitchen-sink clients, called with
// hardcoded arguments, and nothing else.
//
// Arguments are written in typed Go rather than read from the case table: writing `GetPet(ctx, "abc")` is the
// assertion that the generated signature is usable. The calls below follow `casesFor('go-clients', 'client')` in
// table order, because the reference server consumes one queue per (method, pathTemplate) and two cases share
// `PUT /pets/{id}`.
//
// Contract, as for the other client drivers: `GOAST_BASE_URL` names the reference server, and every case prints
// one `##GOAST-CASE##{"caseId":...,"result":...}` line. A call that succeeds prints the decoded body as JSON, or
// `{"status": n}` when the operation has no body. A `*client.ResponseError` prints the body it decoded for the
// status (`Value`, which the client fills from the response schemas of the API), or `{"status": n}` when it decoded
// none, and any other error prints `{"error": "<type>", "message": "..."}`. Unlike the Kotlin drivers, which can
// only report the status because their clients hand back raw text, this reports what the client itself decoded.
//
// Authentication is attached with `WithRequestEditor` at construction, which is the generated clients' way to set
// headers for every request of an instance. Cases that do not declare these headers are unaffected: `diffRequest`
// only compares headers a case names.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync/atomic"

	"example.com/generated/api"
	"example.com/generated/client"
)

const prefix = "##GOAST-CASE##"

// lastStatus records the status of the latest response, which is how a call without a body result reports its
// status: the generated method returns nothing but an error for it.
var lastStatus atomic.Int64

type statusTransport struct{ next http.RoundTripper }

func (t statusTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	resp, err := t.next.RoundTrip(req)
	if err == nil {
		lastStatus.Store(int64(resp.StatusCode))
	}
	return resp, err
}

func emit(caseID string, result any) {
	line, err := json.Marshal(map[string]any{"caseId": caseID, "result": result})
	if err != nil {
		line, _ = json.Marshal(map[string]any{
			"caseId": caseID,
			"result": map[string]any{"error": fmt.Sprintf("%T", err), "message": err.Error()},
		})
	}
	fmt.Println(prefix + string(line))
}

// failure describes an error as a result: the decoded body of a response error, or its status if the client decoded
// none, and the type and message otherwise.
func failure(err error) any {
	var responseError *client.ResponseError
	if errors.As(err, &responseError) {
		if responseError.Value != nil {
			return responseError.Value
		}
		return map[string]any{"status": responseError.StatusCode}
	}
	return map[string]any{"error": fmt.Sprintf("%T", err), "message": err.Error()}
}

// call reports the body a call returned, or why it failed.
func call[T any](caseID string, f func() (T, error)) {
	body, err := f()
	if err != nil {
		emit(caseID, failure(err))
		return
	}
	emit(caseID, body)
}

// callVoid reports the status of the response of a call that returns no body, or why it failed.
func callVoid(caseID string, f func() error) {
	lastStatus.Store(0)
	if err := f(); err != nil {
		emit(caseID, failure(err))
		return
	}
	emit(caseID, map[string]any{"status": lastStatus.Load()})
}

func ptr[T any](v T) *T { return &v }

func main() {
	baseURL := os.Getenv("GOAST_BASE_URL")
	if baseURL == "" {
		fmt.Fprintln(os.Stderr, "GOAST_BASE_URL is not set")
		os.Exit(1)
	}

	ctx := context.Background()
	options := []client.ClientOption{
		client.WithHTTPClient(&http.Client{Transport: statusTransport{next: http.DefaultTransport}}),
		client.WithRequestEditor(func(ctx context.Context, req *http.Request) error {
			req.Header.Set("Authorization", "Bearer secret-token")
			req.Header.Set("x-api-key", "secret-key")
			return nil
		}),
	}

	pets := client.NewPetsClient(baseURL, options...)
	widgets := client.NewWidgetsClient(baseURL, options...)
	blobs := client.NewBlobsClient(baseURL, options...)
	params := client.NewParamsClient(baseURL, options...)

	call("getPet/ok", func() (*api.Pet, error) { return pets.GetPet(ctx, "abc") })

	update := api.PetUpdate{Name: ptr("Rex"), Age: ptr(4)}
	call("updatePet/json", func() (*api.Pet, error) { return pets.UpdatePet(ctx, "abc", update) })

	call("updatePet/form", func() (*api.Pet, error) { return pets.UpdatePet(ctx, "abc", update) })

	call("addPetNote/text", func() (*api.Pet, error) { return pets.AddPetNote(ctx, "abc", "plain text body") })

	callVoid("deletePet/noContent", func() error { return pets.DeletePet(ctx, "abc") })

	call("createPet/created", func() (*api.Pet, error) {
		return pets.CreatePet(ctx, api.Pet{ID: "new1", Name: "Fido"})
	})

	callVoid("uploadPetPhoto/ok", func() error {
		return pets.UploadPetPhoto(ctx, "abc", client.UploadPetPhotoForm{
			File:    &client.File{Name: "photo.png", ContentType: "image/png", Content: strings.NewReader("binarydata")},
			Caption: ptr("A good boy"),
		})
	})

	call("getWidget/ok", func() (*api.Widget, error) { return widgets.GetWidget(ctx, "w1") })

	call("getWidget/badRequest", func() (*api.Widget, error) { return widgets.GetWidget(ctx, "bad") })

	call("getWidget/notFound", func() (*api.Widget, error) { return widgets.GetWidget(ctx, "missing") })

	call("getWidget/serverError", func() (*api.Widget, error) { return widgets.GetWidget(ctx, "boom") })

	call("getWidget/unexpectedError", func() (*api.Widget, error) { return widgets.GetWidget(ctx, "other") })

	call("uploadBlob/ok", func() (*api.BlobRef, error) {
		return blobs.UploadBlob(ctx, io.Reader(strings.NewReader("hello")))
	})

	callVoid("allLocations/ok", func() error {
		return params.AllLocations(ctx, "loc1", &client.AllLocationsParams{
			QueryParam:   ptr("q1"),
			XHeaderParam: ptr("h1"),
			Session:      ptr("abc123"),
		})
	})

	callVoid("styleMatrix/formExploded", func() error {
		return params.StyleMatrix(ctx, &client.StyleMatrixParams{FormExploded: []string{"a", "b"}})
	})

	callVoid("styleMatrix/formUnexploded", func() error {
		return params.StyleMatrix(ctx, &client.StyleMatrixParams{FormUnexploded: []string{"a", "b"}})
	})

	callVoid("styleMatrix/spaceDelimited", func() error {
		return params.StyleMatrix(ctx, &client.StyleMatrixParams{SpaceDelimited: []string{"a", "b"}})
	})

	callVoid("pathStyleSimple/ok", func() error { return params.PathStyleSimple(ctx, []string{"a", "b"}) })

	callVoid("getEncoded/ok", func() error {
		return params.GetEncoded(ctx, "abc def/x", &client.GetEncodedParams{Raw: ptr("a&b=c")})
	})
}
