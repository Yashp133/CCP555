# Test posting without authentication
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`Unauthenticated content`

HTTP/1.1 401