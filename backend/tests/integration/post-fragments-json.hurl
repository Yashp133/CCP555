# tests/integration/post-fragments-json.hurl
# POST JSON -> expect 201, then GET it back

POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
testuser:testtest

`{"foo":"bar","number":42}`

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
[BasicAuth]
testuser:testtest

HTTP/1.1 200
Content-Type: application/json; charset=utf-8
Content-Length: 25
[Asserts]
body == "{\"foo\":\"bar\",\"number\":42}"
