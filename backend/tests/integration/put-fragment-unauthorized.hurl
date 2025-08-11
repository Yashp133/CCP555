# tests/integration/put-fragment-unauthorized.hurl
# Create fragment as testuser
POST http://localhost:8080/v1/fragments
Authorization: Basic dGVzdHVzZXI6dGVzdHRlc3Q=
Content-Type: text/plain
file,./fixtures/testuser-content.txt;

HTTP/1.1 201
[Captures]
id: header "Location" replace "http://localhost:8080/v1/fragments/" ""

# Try to update with different/no auth (should fail)
PUT http://localhost:8080/v1/fragments/{{id}}
Authorization: Basic bWFsaWNpb3VzOnVzZXI=
Content-Type: text/plain
file,./fixtures/malicious-update.txt;

HTTP/1.1 401
