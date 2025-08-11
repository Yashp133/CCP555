# tests/integration/post-fragments-json.hurl
# POST JSON -> expect 201, then GET it back
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: application/json
file,./fixtures/sample.json;

# 1. POST should succeed
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25
[Captures]
url: header "Location"

# 2. GET it back
GET {{url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
header "Content-Type" contains "application/json"
header "Content-Length" == "25"
body == "{\"foo\":\"bar\",\"number\":42}"
