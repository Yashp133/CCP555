# tests/integration/lab-9-s3.hurl

# 1. POST fragment to S3
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
testuser:testtest

`Hello S3!`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
[Captures]
url: header "Location"

# 2. GET the fragment
GET {{url}}
[BasicAuth]
testuser:testtest

HTTP/1.1 200
[Asserts]
body == "Hello S3!"
header "Content-Type" == "text/plain; charset=utf-8"

# 3. DELETE the fragment
DELETE {{url}}
[BasicAuth]
testuser:testtest

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# 4. Confirm 404 after deletion
GET {{url}}
[BasicAuth]
testuser:testtest

HTTP/1.1 404