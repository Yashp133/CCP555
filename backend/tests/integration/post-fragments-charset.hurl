# tests/integration/post-fragments-charset.hurl
# POST with charset -> expect 201, then GET it back
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain; charset=utf-8
file,./fixtures/charset-text.txt;

# 1. POST should succeed
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"
jsonpath "$.fragment.size" == 32
[Captures]
url: header "Location"

# 2. GET it back
GET {{url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
header "Content-Type" contains "text/plain"
header "Content-Length" == "32"
body == "This is a fragment with charset!"
