# POST an image fragment (PNG)
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: image/png

file,fixtures/sample.png;
HTTP 201
[Asserts]
jsonpath "$.status" == "ok"
[Captures]
id_png: jsonpath "$.fragment.id"
