# tests/integration/delete-fragments.hurl
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain; charset=utf-8
file,./fixtures/text-delete.txt;

HTTP/1.1 201
[Captures]
id: header "Location" replace "http://localhost:8080/v1/fragments/" ""

DELETE http://localhost:8080/v1/fragments/{{id}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200

GET http://localhost:8080/v1/fragments/{{id}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 404
