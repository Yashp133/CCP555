# tests/integration/post-fragments-charset.hurl
# POST with charset -> expect 201, then GET it back

POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
testuser:testtest

`This is a fragment with charset!`

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
[BasicAuth]
testuser:testtest

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 32
[Asserts]
body == "This is a fragment with charset!"
