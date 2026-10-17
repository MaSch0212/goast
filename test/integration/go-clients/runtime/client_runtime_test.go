package client

import (
	"context"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func mustTime(s string) time.Time {
	v, err := time.Parse(time.RFC3339Nano, s)
	if err != nil {
		panic(err)
	}
	return v
}

func TestPathParamEscapesReservedCharacters(t *testing.T) {
	got := pathParam("id", "simple", false, false, []string{"a/b c%?#"})
	if want := "a%2Fb%20c%25%3F%23"; got != want {
		t.Fatalf("got %q, want %q", got, want)
	}

	var seen string
	mux := http.NewServeMux()
	mux.HandleFunc("GET /pets/{id}", func(w http.ResponseWriter, r *http.Request) { seen = r.PathValue("id") })
	srv := httptest.NewServer(mux)
	defer srv.Close()
	c := newClient(srv.URL, "", nil)
	req := c.newRequest("GET", "/pets/"+got)
	resp, err := c.do(context.Background(), req, nil)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if seen != "a/b c%?#" {
		t.Fatalf("server saw %q", seen)
	}
}

func TestPathParamStyles(t *testing.T) {
	ab := []string{"a", "b"}
	cases := []struct {
		style   string
		explode bool
		array   bool
		values  []string
		want    string
	}{
		{"simple", false, true, ab, "a,b"},
		{"label", true, true, ab, ".a.b"},
		{"label", false, true, ab, ".a,b"},
		{"matrix", true, true, ab, ";id=a;id=b"},
		{"matrix", false, true, ab, ";id=a,b"},
		{"matrix", false, false, []string{"a"}, ";id=a"},
	}
	for _, c := range cases {
		if got := pathParam("id", c.style, c.explode, c.array, c.values); got != c.want {
			t.Errorf("%s explode=%v: got %q, want %q", c.style, c.explode, got, c.want)
		}
	}
}

func TestQueryParamStyles(t *testing.T) {
	var got url.Values
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r.URL.Query()
	}))
	defer server.Close()
	c := newClient(server.URL, "", nil)
	req := c.newRequest("GET", "/")
	req.query("a", "form", true, false, []string{"a+b&c=d"})
	req.query("b", "form", true, false, []string{"x y"})
	req.query("s", "spaceDelimited", false, true, []string{"a", "b"})
	req.query("p", "pipeDelimited", false, true, []string{"a", "b"})
	req.query("e", "form", true, true, []string{"1", "2"})
	req.query("f", "form", false, true, []string{"1", "2"})
	resp, err := c.do(context.Background(), req, nil)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	check := func(name string, want ...string) {
		t.Helper()
		if v := got[name]; strings.Join(v, "\x00") != strings.Join(want, "\x00") {
			t.Errorf("%s: got %q, want %q", name, v, want)
		}
	}
	check("a", "a+b&c=d")
	check("b", "x y")
	check("s", "a b")
	check("p", "a|b")
	check("e", "1", "2")
	check("f", "1,2")
}

func TestJoinURLWithPathAndTrailingSlash(t *testing.T) {
	var got string
	transport := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		got = r.URL.String()
		return &http.Response{StatusCode: 200, Body: http.NoBody, Header: http.Header{}}, nil
	})
	c := newClient("https://h/v1/", "", []ClientOption{WithHTTPClient(&http.Client{Transport: transport})})
	resp, err := c.do(context.Background(), c.newRequest("GET", "/pets"), nil)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if got != "https://h/v1/pets" {
		t.Fatalf("got %q", got)
	}
}

func TestDoWithoutBaseURL(t *testing.T) {
	hit := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { hit = true }))
	defer server.Close()
	for _, base := range []string{"", "/v1"} {
		c := newClient(base, "", nil)
		_, err := c.do(context.Background(), c.newRequest("GET", "/pets"), nil)
		if err == nil || !strings.Contains(err.Error(), "no base URL") {
			t.Errorf("base %q: got %v", base, err)
		}
	}
	if hit {
		t.Fatal("a request was sent without a base URL")
	}
	// The default base URL is used when none is given.
	c := newClient("", server.URL, nil)
	resp, err := c.do(context.Background(), c.newRequest("GET", "/pets"), nil)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if !hit {
		t.Fatal("default base URL not used")
	}
}

func TestDecodeJSONEmptyBody(t *testing.T) {
	type pet struct{ Name string }
	for _, resp := range []*http.Response{
		{StatusCode: 204, Body: http.NoBody},
		{StatusCode: 200, Body: io.NopCloser(strings.NewReader(""))},
	} {
		got, err := decodeJSON[pet](resp)
		if err != nil || got != (pet{}) {
			t.Errorf("status %d: got %v, %v", resp.StatusCode, got, err)
		}
	}
	got, err := decodeJSON[pet](&http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"Name":"x"}`))})
	if err != nil || got.Name != "x" {
		t.Errorf("got %v, %v", got, err)
	}
	if _, err := decodeJSON[pet](&http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`nope`))}); err == nil {
		t.Error("expected a decode error")
	}
}

func TestResponseErrorInvalidJSON(t *testing.T) {
	type apiError struct{ Message string }
	decode := func(status int, body []byte) any { return decodeErrorJSON[apiError](body) }

	resp := &http.Response{StatusCode: 404, Status: "404 Not Found", Header: http.Header{"X": {"y"}}, Body: io.NopCloser(strings.NewReader("not json"))}
	var err error = newResponseError(resp, decode)
	var re *ResponseError
	if !errors.As(err, &re) {
		t.Fatal("errors.As failed")
	}
	if string(re.Body) != "not json" || re.Value != nil || re.StatusCode != 404 || re.Header.Get("X") != "y" {
		t.Fatalf("got %+v", re)
	}
	if want := "unexpected status 404 Not Found: not json"; re.Error() != want {
		t.Fatalf("got %q, want %q", re.Error(), want)
	}

	resp = &http.Response{StatusCode: 400, Body: io.NopCloser(strings.NewReader(`{"Message":"bad"}`))}
	re = newResponseError(resp, decode)
	if v, ok := re.Value.(*apiError); !ok || v.Message != "bad" {
		t.Fatalf("got %#v", re.Value)
	}

	re = newResponseError(&http.Response{StatusCode: 500, Body: io.NopCloser(strings.NewReader(""))}, nil)
	if re.Value != nil || re.Error() != "unexpected status 500 Internal Server Error" {
		t.Fatalf("got %q", re.Error())
	}
}

func TestRequestEditorsOrder(t *testing.T) {
	var got string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r.Header.Get("X-Order") + "|" + r.Header.Get("X-Extra")
	}))
	defer server.Close()
	c := newClient(server.URL, "", []ClientOption{WithRequestEditor(func(ctx context.Context, req *http.Request) error {
		req.Header.Set("X-Order", "client")
		return nil
	})})
	resp, err := c.do(context.Background(), c.newRequest("GET", "/"), []RequestOption{
		WithEditor(func(ctx context.Context, req *http.Request) error {
			req.Header.Set("X-Order", req.Header.Get("X-Order")+",call")
			return nil
		}),
		WithRequestHeader("X-Extra", "1"),
	})
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if got != "client,call|1" {
		t.Fatalf("got %q", got)
	}

	failing := errors.New("editor failed")
	_, err = c.do(context.Background(), c.newRequest("GET", "/"), []RequestOption{
		WithEditor(func(ctx context.Context, req *http.Request) error { return failing }),
	})
	if !errors.Is(err, failing) {
		t.Fatalf("got %v", err)
	}
}

func TestMultipartFile(t *testing.T) {
	var name, ctype, content, field string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(1 << 20); err != nil {
			t.Error(err)
			return
		}
		fh := r.MultipartForm.File["f"][0]
		name, ctype = fh.Filename, fh.Header.Get("Content-Type")
		f, _ := fh.Open()
		b, _ := io.ReadAll(f)
		content = string(b)
		field = r.FormValue("n")
	}))
	defer server.Close()
	c := newClient(server.URL, "", nil)
	req := c.newRequest("POST", "/")
	err := req.multipartBody(func(w *multipart.Writer) error {
		if err := writeFormField(w, "n", "v"); err != nil {
			return err
		}
		return writeFormFile(w, "f", File{Name: "a.txt", ContentType: "text/plain", Content: strings.NewReader("hello")})
	})
	if err != nil {
		t.Fatal(err)
	}
	resp, err := c.do(context.Background(), req, nil)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if name != "a.txt" || ctype != "text/plain" || content != "hello" || field != "v" {
		t.Fatalf("got %q %q %q %q", name, ctype, content, field)
	}
}

func TestBodiesHeadersAndCookies(t *testing.T) {
	type body struct{ A int }
	var gotType, gotBody, gotCookie, gotHeader string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		gotType, gotBody = r.Header.Get("Content-Type"), string(b)
		gotCookie = ""
		if ck, err := r.Cookie("k"); err == nil {
			gotCookie = ck.Value
		}
		gotHeader = strings.Join(r.Header.Values("X-H"), ";")
		w.Header().Set("Content-Type", "text/plain")
		_, _ = w.Write([]byte("hi"))
	}))
	defer server.Close()
	c := newClient(server.URL, "", nil)
	send := func(r *request) *http.Response {
		t.Helper()
		resp, err := c.do(context.Background(), r, nil)
		if err != nil {
			t.Fatal(err)
		}
		return resp
	}

	r := c.newRequest("POST", "/")
	if err := r.jsonBody(body{A: 1}); err != nil {
		t.Fatal(err)
	}
	r.header("X-H", []string{"a", "b"})
	r.cookie("k", []string{"x", "y"})
	resp := send(r)
	if text, err := decodeText(resp); err != nil || text != "hi" {
		t.Errorf("text: %q %v", text, err)
	}
	if gotType != "application/json" || strings.TrimSpace(gotBody) != `{"A":1}` || gotCookie != "x,y" || gotHeader != "a,b" {
		t.Errorf("json: %q %q %q %q", gotType, gotBody, gotCookie, gotHeader)
	}

	r = c.newRequest("POST", "/")
	r.formBody(url.Values{"a": {"b c"}})
	send(r).Body.Close()
	if gotType != "application/x-www-form-urlencoded" || gotBody != "a=b+c" {
		t.Errorf("form: %q %q", gotType, gotBody)
	}

	r = c.newRequest("POST", "/")
	r.textBody("text/plain", "abc")
	send(r).Body.Close()
	if gotType != "text/plain" || gotBody != "abc" {
		t.Errorf("text: %q %q", gotType, gotBody)
	}

	r = c.newRequest("POST", "/")
	r.rawBody("application/octet-stream", strings.NewReader("raw"))
	resp = send(r)
	if b, err := decodeBytes(resp); err != nil || string(b) != "hi" {
		t.Errorf("bytes: %q %v", b, err)
	}
	if gotType != "application/octet-stream" || gotBody != "raw" {
		t.Errorf("raw: %q %q", gotType, gotBody)
	}
}

func TestIsSuccess(t *testing.T) {
	for status, want := range map[int]bool{199: false, 200: true, 204: true, 299: true, 301: false, 404: false} {
		if got := isSuccess(&http.Response{StatusCode: status}); got != want {
			t.Errorf("%d: got %v", status, got)
		}
	}
}

func TestFormatting(t *testing.T) {
	type name string
	type count int32
	type ratio float32
	type flag bool
	if formatString(name("n")) != "n" || formatInt(count(-3)) != "-3" || formatFloat(ratio(0.5)) != "0.5" ||
		formatFloat(1.5e21) != "1.5e+21" || formatBool(flag(true)) != "true" {
		t.Error("scalars")
	}
	if formatBytes([]byte("hi")) != "aGk=" {
		t.Error("formatBytes")
	}
	if s := formatTime(mustTime("2024-01-02T03:04:05.5Z")); s != "2024-01-02T03:04:05.5Z" {
		t.Errorf("formatTime %q", s)
	}
	if s, err := formatJSON(map[string]int{"a": 1}); err != nil || s != `{"a":1}` {
		t.Errorf("formatJSON %q %v", s, err)
	}
	if got := formatAll([]int{1, 2}, formatInt[int]); strings.Join(got, ",") != "1,2" {
		t.Errorf("formatAll %v", got)
	}
}
