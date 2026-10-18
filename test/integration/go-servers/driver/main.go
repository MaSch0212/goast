// The application under test for tier 4's `go-servers` leg: the generated kitchen-sink server package, the
// services below, and nothing else.
//
// The services are the server direction's assertion, like the Spring leg's delegates: the host can only
// observe HTTP responses, so a value the generated decoder bound wrongly has to become a distinguishable
// response. A service returns a `mismatch` error for that, which the error handler renders as `599` with
// the detail as a plain-text body, so it lands verbatim in the committed deviation artifact. Every other
// error goes to the generated `DefaultErrorHandler`, which is part of what is under test.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"reflect"

	"example.com/generated/api"
)

// mismatch is returned by a service when a decoded value is not what the case table says was sent.
type mismatch struct{ detail string }

func (e *mismatch) Error() string { return e.detail }

// expect returns a mismatch unless actual equals expected.
func expect(name string, expected, actual any) error {
	if !reflect.DeepEqual(expected, actual) {
		return &mismatch{fmt.Sprintf("%s expected <%v> but was <%v>", name, show(expected), show(actual))}
	}
	return nil
}

// show dereferences pointers, so a message shows the value rather than an address.
func show(v any) any {
	rv := reflect.ValueOf(v)
	if rv.Kind() == reflect.Pointer {
		if rv.IsNil() {
			return "nil"
		}
		return fmt.Sprintf("%+v", rv.Elem().Interface())
	}
	return fmt.Sprintf("%+v", v)
}

// first returns the first non-nil error.
func first(errs ...error) error {
	for _, err := range errs {
		if err != nil {
			return err
		}
	}
	return nil
}

func ptr[T any](v T) *T { return &v }

type pets struct{}

func (pets) GetPet(_ context.Context, req api.GetPetRequest) (api.GetPetResponse, error) {
	if err := expect("getPet.id", "abc", req.ID); err != nil {
		return nil, err
	}
	return api.GetPet200Response{Body: api.Pet{ID: "abc", Name: "Rex"}}, nil
}

// UpdatePet serves `updatePet/json` and `updatePet/form`, which send the same values with different
// content types and declare the same response, so the service cannot and need not tell them apart.
func (pets) UpdatePet(_ context.Context, req api.UpdatePetRequest) (api.UpdatePetResponse, error) {
	if err := first(
		expect("updatePet.id", "abc", req.ID),
		expect("updatePet.body", api.PetUpdate{Name: ptr("Rex"), Age: ptr(4)}, req.Body),
	); err != nil {
		return nil, err
	}
	return api.UpdatePet200Response{Body: api.Pet{ID: "abc", Name: "Rex", Age: ptr(int32(4))}}, nil
}

func (pets) DeletePet(_ context.Context, req api.DeletePetRequest) (api.DeletePetResponse, error) {
	if err := expect("deletePet.id", "abc", req.ID); err != nil {
		return nil, err
	}
	return api.DeletePet204Response{}, nil
}

func (pets) CreatePet(_ context.Context, req api.CreatePetRequest) (api.CreatePetResponse, error) {
	if err := expect("createPet.body", api.Pet{ID: "new1", Name: "Fido"}, req.Body); err != nil {
		return nil, err
	}
	return api.CreatePet201Response{Body: api.Pet{ID: "new1", Name: "Fido"}}, nil
}

func (pets) UploadPetPhoto(_ context.Context, req api.UploadPetPhotoRequest) (api.UploadPetPhotoResponse, error) {
	if err := expect("uploadPetPhoto.id", "abc", req.ID); err != nil {
		return nil, err
	}
	if req.Body.File == nil {
		return nil, &mismatch{"uploadPetPhoto.file was nil"}
	}
	file, err := req.Body.File.Open()
	if err != nil {
		return nil, err
	}
	defer file.Close()
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}
	if err := first(
		expect("uploadPetPhoto.file.filename", "photo.png", req.Body.File.Filename),
		expect("uploadPetPhoto.file.content", "binarydata", string(content)),
		expect("uploadPetPhoto.caption", ptr("A good boy"), req.Body.Caption),
	); err != nil {
		return nil, err
	}
	return api.UploadPetPhoto200Response{}, nil
}

func (pets) AddPetNote(_ context.Context, req api.AddPetNoteRequest) (api.AddPetNoteResponse, error) {
	if err := first(
		expect("addPetNote.id", "abc", req.ID),
		expect("addPetNote.body", "plain text body", req.Body),
	); err != nil {
		return nil, err
	}
	return api.AddPetNote200Response{Body: api.Pet{ID: "abc", Name: "Rex"}}, nil
}

type widgets struct{}

// GetWidget serves the five `getWidget` cases, told apart by the id each one sends. That makes the id
// both the response selector and the assertion that it was bound correctly: an id no case declares can
// only mean the server bound something other than what the reference client sent.
func (widgets) GetWidget(_ context.Context, req api.GetWidgetRequest) (api.GetWidgetResponse, error) {
	switch req.ID {
	case "w1":
		return api.GetWidget200Response{Body: api.Widget{ID: "w1", Name: "Sprocket", Price: ptr(9.99)}, XRateLimit: ptr(42)}, nil
	case "bad":
		return api.GetWidget400Response{Body: api.Error{Message: "Invalid widget id", Code: ptr(400)}}, nil
	case "missing":
		return api.GetWidget404Response{Body: api.Error{Message: "Widget not found", Code: ptr(404)}}, nil
	case "boom":
		return api.GetWidget500Response{Body: api.Error{Message: "Internal error", Code: ptr(500)}}, nil
	case "other":
		// 503 is none of the declared statuses, so only the `default` response can carry it.
		return api.GetWidgetDefaultResponse{StatusCode: 503, Body: api.Error{Message: "Unexpected error", Code: ptr(503)}}, nil
	}
	return nil, &mismatch{fmt.Sprintf("getWidget.id was <%s>, which no case declares", req.ID)}
}

type blobs struct{}

func (blobs) UploadBlob(_ context.Context, req api.UploadBlobRequest) (api.UploadBlobResponse, error) {
	content, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	if err := expect("uploadBlob.body", "hello", string(content)); err != nil {
		return nil, err
	}
	return api.UploadBlob201Response{Body: api.BlobRef{ID: "blob1"}}, nil
}

type params struct{}

func (params) AllLocations(_ context.Context, req api.AllLocationsRequest) (api.AllLocationsResponse, error) {
	if err := first(
		expect("allLocations.pathParam", "loc1", req.PathParam),
		expect("allLocations.queryParam", ptr("q1"), req.QueryParam),
		expect("allLocations.xHeaderParam", ptr("h1"), req.XHeaderParam),
		expect("allLocations.session", ptr("abc123"), req.Session),
	); err != nil {
		return nil, err
	}
	return api.AllLocations200Response{}, nil
}

// StyleMatrix serves the three `styleMatrix` cases, each of which sends exactly one of the parameters,
// carrying the items `a` and `b`.
func (params) StyleMatrix(_ context.Context, req api.StyleMatrixRequest) (api.StyleMatrixResponse, error) {
	present := map[string][]string{}
	for name, values := range map[string][]string{
		"formExploded":   req.FormExploded,
		"formUnexploded": req.FormUnexploded,
		"spaceDelimited": req.SpaceDelimited,
	} {
		if values != nil {
			present[name] = values
		}
	}
	if len(present) != 1 {
		return nil, &mismatch{fmt.Sprintf("styleMatrix expected exactly one parameter but got formExploded=<%q> formUnexploded=<%q> spaceDelimited=<%q>", req.FormExploded, req.FormUnexploded, req.SpaceDelimited)}
	}
	for name, values := range present {
		if err := expect("styleMatrix."+name, []string{"a", "b"}, values); err != nil {
			return nil, err
		}
	}
	return api.StyleMatrix200Response{}, nil
}

func (params) PathStyleSimple(_ context.Context, req api.PathStyleSimpleRequest) (api.PathStyleSimpleResponse, error) {
	if err := expect("pathStyleSimple.values", []string{"a", "b"}, req.Values); err != nil {
		return nil, err
	}
	return api.PathStyleSimple200Response{}, nil
}

// GetEncoded is the encoding case: the reference client sends `/encoded/abc%20def%2Fx?raw=a%26b%3Dc`, so
// a correct server hands the service the decoded values.
func (params) GetEncoded(_ context.Context, req api.GetEncodedRequest) (api.GetEncodedResponse, error) {
	if err := first(
		expect("getEncoded.value", "abc def/x", req.Value),
		expect("getEncoded.raw", ptr("a&b=c"), req.Raw),
	); err != nil {
		return nil, err
	}
	return api.GetEncoded200Response{}, nil
}

func handleError(w http.ResponseWriter, r *http.Request, err error) {
	var m *mismatch
	if errors.As(err, &m) {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(599)
		_, _ = io.WriteString(w, "MISMATCH "+m.detail)
		return
	}
	api.DefaultErrorHandler(w, r, err)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /__goast-readiness", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	opts := []api.ServerOption{api.WithErrorHandler(handleError)}
	api.RegisterPetsRoutes(mux, pets{}, opts...)
	api.RegisterWidgetsRoutes(mux, widgets{}, opts...)
	api.RegisterBlobsRoutes(mux, blobs{}, opts...)
	api.RegisterParamsRoutes(mux, params{}, opts...)

	log.Println("##LISTENING## :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
