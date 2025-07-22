POST http://localhost:8080/v1/fragments
Content-Type: application/xml
[BasicAuth]
testuser:testtest

# We expect a 415 Unsupported Media Type
HTTP/1.1 415
