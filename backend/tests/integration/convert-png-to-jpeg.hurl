# Create PNG
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: image/png

file,fixtures/sample.png;
HTTP 201
[Captures]
id_png: jsonpath "$.fragment.id"
# Convert PNG -> JPEG
GET http://localhost:8080/v1/fragments/{{id_png}}.jpg
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
HTTP 200
[Asserts]
header "Content-Type" startsWith "image/jpeg"