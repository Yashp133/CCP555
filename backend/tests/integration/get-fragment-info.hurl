POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain

"Test content"

HTTP/1.1 201
[Captures]
id: header "Location" replace "http://localhost:8080/v1/fragments/" ""

GET http://localhost:8080/v1/fragments/{{id}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
header "Content-Type" contains "text/plain"
