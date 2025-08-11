# Integration test for AWS S3 + DynamoDB (Lab 10)
# 1️⃣ POST JSON fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: application/json
file,./fixtures/dynamodb.json;

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 2️⃣ GET the JSON fragment content
GET {{fragment1_url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
header "Content-Type" contains "application/json"
body == "{\"service\":\"DynamoDB\"}"

# 3️⃣ POST Text fragment
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain
file,./fixtures/dynamodb.txt;

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 4️⃣ GET the Text fragment content
GET {{fragment2_url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
header "Content-Type" contains "text/plain"
body == "DynamoDB is **great**."

# 5️⃣ GET all fragment IDs (no expand)
GET http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# 6️⃣ DELETE first fragment
DELETE {{fragment1_url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200

# 7️⃣ GET deleted fragment (should 404)
GET {{fragment1_url}}
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 404

# 8️⃣ GET all fragment IDs again (only second should remain)
GET http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" not contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"
