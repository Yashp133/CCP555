POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain

"Hello S3!"

HTTP/1.1 201
[Captures]
url: header "Location"

GET {{url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
body contains "Hello S3!"

DELETE {{url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200