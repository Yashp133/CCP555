# tests/integration/delete-fragment-unauthorized.hurl
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain; charset=utf-8
file,./fixtures/text-unauthorized.txt;

HTTP/1.1 201
[Captures]
id: header "Location" replace "http://localhost:8080/v1/fragments/" ""

DELETE http://localhost:8080/v1/fragments/{{id}}
Authorization: Basic dW5hdXRoOndyb25ncGFzcw==

HTTP/1.1 401
