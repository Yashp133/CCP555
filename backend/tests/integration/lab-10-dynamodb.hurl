# Integration test for AWS S3 + DynamoDB (Lab 10)

# 1️ POST JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
testuser:testtest

`{"service":"DynamoDB"}`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 2️ GET the JSON fragment content
GET {{fragment1_url}}
[BasicAuth]
testuser:testtest

HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
body == "{\"service\":\"DynamoDB\"}"

# 3️ POST Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
testuser:testtest

`DynamoDB is **great**.`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 4️ GET the Markdown fragment content
GET {{fragment2_url}}
[BasicAuth]
testuser:testtest

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body == "DynamoDB is **great**."

# 5️ GET all fragment IDs (no expand)
GET http://localhost:8080/v1/fragments
[BasicAuth]
testuser:testtest

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# 6️ DELETE first fragment
DELETE {{fragment1_url}}
[BasicAuth]
testuser:testtest

HTTP/1.1 200

# 7️ GET deleted fragment (should 404)
GET {{fragment1_url}}
[BasicAuth]
testuser:testtest

HTTP/1.1 404

# 8️ GET all fragment IDs again (only second should remain)
GET http://localhost:8080/v1/fragments
[BasicAuth]
testuser:testtest

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" not contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"