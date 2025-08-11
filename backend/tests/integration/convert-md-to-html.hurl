POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain

"Sample text"

HTTP/1.1 201
[Asserts]
header "Content-Type" contains "application/json"
