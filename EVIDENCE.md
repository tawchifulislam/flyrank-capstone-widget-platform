# Evidence

Tokens are replaced by the shell variables $TOKEN_A and $TOKEN_B (two different owners). Owner A created widget 9XaNF0jKmUQA.

## Widget management

### Authenticated CRUD endpoints; requests without valid auth are rejected

Create a widget as owner A:

```text
curl -s -X POST http://localhost:3001/api/widgets -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{"type":"contact","title":"Contact us","description":"Send us a message","buttonText":"Send","fields":[{"name":"email","label":"Email","type":"email","required":true},{"name":"message","label":"Message","type":"textarea","required":true}]}'
```

```text
{"id":"9XaNF0jKmUQA","type":"contact","title":"Contact us","description":"Send us a message","buttonText":"Send","fields":[{"name":"email","type":"email","label":"Email","required":true},{"name":"message","type":"textarea","label":"Message","required":true}],"displayOptions":{},"version":1,"createdAt":"2026-10-06T01:44:38.720Z","updatedAt":"2026-10-06T01:44:38.720Z","embedSnippet":"<script src=\"http://localhost:3001/widget.js?id=9XaNF0jKmUQA\"></script>"}
```

Request without a token is rejected:

```text
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3001/api/widgets
```

```text
{"error":"Missing or invalid token"}
HTTP 401
```

List as owner A:

```text
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3001/api/widgets -H "Authorization: Bearer $TOKEN_A"
```

```text
[{"id":"9XaNF0jKmUQA","type":"contact","title":"Contact us","description":"Send us a message","buttonText":"Send","fields":[{"name":"email","type":"email","label":"Email","required":true},{"name":"message","type":"textarea","label":"Message","required":true}],"displayOptions":{},"version":1,"createdAt":"2026-10-06T01:44:38.720Z","updatedAt":"2026-10-06T01:44:38.720Z","embedSnippet":"<script src=\"http://localhost:3001/widget.js?id=9XaNF0jKmUQA\"></script>"}]
HTTP 200
```

Read as owner A:

```text
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3001/api/widgets/9XaNF0jKmUQA -H "Authorization: Bearer $TOKEN_A"
```

```text
{"id":"9XaNF0jKmUQA","type":"contact","title":"Contact us","description":"Send us a message","buttonText":"Send","fields":[{"name":"email","type":"email","label":"Email","required":true},{"name":"message","type":"textarea","label":"Message","required":true}],"displayOptions":{},"version":1,"createdAt":"2026-10-06T01:44:38.720Z","updatedAt":"2026-10-06T01:44:38.720Z","embedSnippet":"<script src=\"http://localhost:3001/widget.js?id=9XaNF0jKmUQA\"></script>"}
HTTP 200
```

Update as owner A (version goes from 1 to 2):

```text
curl -s -w "\nHTTP %{http_code}\n" -X PUT http://localhost:3001/api/widgets/9XaNF0jKmUQA -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{"type":"contact","title":"Contact us","description":"Send us a message","buttonText":"Send","fields":[{"name":"email","label":"Email","type":"email","required":true},{"name":"message","label":"Message","type":"textarea","required":true}]}'
```

```text
{"id":"9XaNF0jKmUQA","type":"contact","title":"Contact us","description":"Send us a message","buttonText":"Send","fields":[{"name":"email","type":"email","label":"Email","required":true},{"name":"message","type":"textarea","label":"Message","required":true}],"displayOptions":{},"version":2,"createdAt":"2026-10-06T01:44:38.720Z","updatedAt":"2026-10-06T01:46:39.129Z","embedSnippet":"<script src=\"http://localhost:3001/widget.js?id=9XaNF0jKmUQA\"></script>"}
HTTP 200
```

Invalid payload is rejected with a clean 4xx:

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/api/widgets -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{"type":"bad"}'
```

```text
{"error":"Invalid widget payload"}
HTTP 400
```

Create a temporary widget, delete it, then read it again:

```text
TMP_ID=$(curl -s -X POST http://localhost:3001/api/widgets -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{"type":"cta","title":"Temp"}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo $TMP_ID
curl -s -w "HTTP %{http_code}\n" -X DELETE http://localhost:3001/api/widgets/$TMP_ID -H "Authorization: Bearer $TOKEN_A"
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3001/api/widgets/$TMP_ID -H "Authorization: Bearer $TOKEN_A"
```

```text
p08EQ7PllaOY
HTTP 204
{"error":"Widget not found"}
HTTP 404
```

### Multi-tenant isolation: tenant A cannot read or modify tenant B's widgets or submissions

Owner B reads owner A's widget:

```text
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3001/api/widgets/9XaNF0jKmUQA -H "Authorization: Bearer $TOKEN_B"
```

```text
{"error":"Widget not found"}
HTTP 404
```

Owner B updates owner A's widget:

```text
curl -s -w "\nHTTP %{http_code}\n" -X PUT http://localhost:3001/api/widgets/9XaNF0jKmUQA -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_B" -d '{"type":"contact","title":"Hacked"}'
```

```text
{"error":"Widget not found"}
HTTP 404
```

Owner B deletes owner A's widget:

```text
curl -s -w "\nHTTP %{http_code}\n" -X DELETE http://localhost:3001/api/widgets/9XaNF0jKmUQA -H "Authorization: Bearer $TOKEN_B"
```

```text
{"error":"Widget not found"}
HTTP 404
```

Owner B lists widgets and sees only the one B created itself (KE_dFrE5YI0Y), not A's widget:

```text
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3001/api/widgets -H "Authorization: Bearer $TOKEN_B"
```

```text
[{"id":"KE_dFrE5YI0Y","type":"contact","title":"Contact us","description":"","buttonText":"Submit","fields":[{"name":"email","type":"email","label":"Email","required":true},{"name":"message","type":"textarea","label":"Message","required":true}],"displayOptions":{},"version":1,"createdAt":"2026-10-06T01:31:46.003Z","updatedAt":"2026-10-06T01:31:46.003Z","embedSnippet":"<script src=\"http://localhost:3001/widget.js?id=KE_dFrE5YI0Y\"></script>"}]
HTTP 200
```

Submission isolation is proven later, in the dashboard section.

### Embed snippet generated per widget

Every widget response includes the field embedSnippet. From the create output above:

```text
<script src="http://localhost:3001/widget.js?id=9XaNF0jKmUQA"></script>
```
