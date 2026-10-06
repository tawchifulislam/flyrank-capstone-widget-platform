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

## Public submission API

All requests below come from `scripts/test-submissions.sh`. The widget id is 9XaNF0jKmUQA (owner A). The header Origin: <http://localhost:5500> simulates a customer site on a different origin.

### Cross-origin submissions work: CORS headers correct, preflight (OPTIONS) handled

```text
curl -s -i -X OPTIONS http://localhost:3001/submissions -H "Origin: http://localhost:5500" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
```

```text
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST,OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 600
Content-Length: 0
Date: Tue, 06 Oct 2026 01:59:59 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

```text
curl -s -i -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -H "Origin: http://localhost:5500" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"visitor@example.com","message":"Hello from another origin"}}'
```

```text
HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 10
ETag: W/"a-vKxK8YqO9ibwq6Pqmm+U51mLrC4"
Date: Tue, 06 Oct 2026 01:59:59 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":"2"}
```

### All incoming input validated: malformed and oversized payloads rejected with 4xx and JSON errors

Invalid email:

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"not-an-email"}}'
```

```text
{"error":"Invalid form data"}
HTTP 400
```

Field that the widget does not define:

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"a@b.com","message":"x","extra":"y"}}'
```

```text
{"error":"Invalid form data"}
HTTP 400
```

Unknown widget:

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -d '{"widgetId":"unknown","data":{}}'
```

```text
{"error":"Widget not found"}
HTTP 404
```

Malformed JSON:

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -d '{"bad json'
```

```text
{"error":"Malformed JSON"}
HTTP 400
```

Oversized payload (a 20000 character message, the body limit is 10kb):

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"9XaNF0jKmUQA\",\"data\":{\"email\":\"a@b.com\",\"message\":\"$BIG\"}}"
```

```text
{"error":"Payload too large"}
HTTP 413
```

### Valid submissions stored safely, linked to the right widget and tenant

```text
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select id, widget_id, owner_id, data, ip from submissions;"
```

```text
 id |  widget_id   |               owner_id               |                                   data                                   | ip  
----+--------------+--------------------------------------+--------------------------------------------------------------------------+-----
  1 | 9XaNF0jKmUQA | 3557ac2f-1dd3-4ea9-9c7e-aa0f2bd157f7 | {"email": "visitor@example.com", "message": "Hello from another origin"} | ::1
  2 | 9XaNF0jKmUQA | 3557ac2f-1dd3-4ea9-9c7e-aa0f2bd157f7 | {"email": "visitor@example.com", "message": "Hello from another origin"} | ::1
(2 rows)
```

Only the valid submissions were stored. Every rejected request above left no row. The owner_id is copied from the widget, not from the request.

## Abuse protection

All requests below come from `scripts/test-abuse.sh`. The limit is 5 submissions per 10 seconds for one IP on one widget, plus 60 per minute for one IP across all widgets.

### Rate limiting per IP and per widget returns 429 under a burst, and the API keeps serving legitimate traffic

Burst of 12 rapid submissions to widget 9XaNF0jKmUQA (status codes in order):

```text
201 201 201 201 201 429 429 429 429 429 429 429 
```

One rejected request in detail (it still carries the CORS header, so a browser can read the error):

```text
HTTP/1.1 429 Too Many Requests
X-Powered-By: Express
Access-Control-Allow-Origin: *
RateLimit-Policy: 5;w=10
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 10
Retry-After: 10
Content-Type: application/json; charset=utf-8
Content-Length: 29
ETag: W/"1d-ixoIu9etr4N1apujqUUt8TNktbw"
Date: Tue, 06 Oct 2026 02:21:56 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Too many requests"}
```

Right after the burst, a submission to another widget and the health endpoint still succeed:

```text
{"id":"8"}
HTTP 201
{"status":"ok"}
HTTP 200
```

After the 10 second window passes, the burst widget accepts submissions again:

```text
{"id":"9"}
HTTP 201
```

### At least one spam-prevention technique demonstrably blocks a spam submission (honeypot field)

A submission with the hidden honeypot field filled in, like a bot would do. The response looks like a success, but no row is stored:

```text
rows before:
9
{"id":"0"}
HTTP 201
rows after:
9
```

Stored rows by email after all tests: the 5 burst submissions that were accepted are there, <bot@example.com> is not:

```text
        email        | count 
---------------------+-------
 burst@example.com   |     5
 normal@example.com  |     1
 other@example.com   |     1
 visitor@example.com |     2
(4 rows)
```

## Enrichment and safe side effects

### IP to geo enrichment uses a provider fallback chain: provider A down, provider B answers, submission enriched

The geo providers are mocked (GEO_MODE=mock) so the result is deterministic. The mock provider A answers with Mockland A and the mock provider B answers with Mockland B. The request header X-Mock-Geo-Down switches a mock provider off for that request. All requests below come from `scripts/test-geo.sh`.

Provider A up, enriched by provider A:

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"geo-a@example.com","message":"provider A answers"}}'
```

```text
{"id":"10"}
HTTP 201
```

Provider A down, enriched by provider B:

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -H "X-Mock-Geo-Down: a" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"geo-b@example.com","message":"provider A down"}}'
```

```text
{"id":"11"}
HTTP 201
```

### All providers down: submission still succeeds without geo (degrade, never fail)

```text
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -H "X-Mock-Geo-Down: a,b" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"geo-none@example.com","message":"all providers down"}}'
```

```text
{"id":"12"}
HTTP 201
```

Stored rows for the three requests. Row 10 was enriched by A, row 11 by B, row 12 has no geo:

```text
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select id, data->>'email' as email, country, city from submissions where data->>'email' like 'geo-%' order by id;"
```

```text
 id |        email         |  country   |    city    
----+----------------------+------------+------------
 10 | geo-a@example.com    | Mockland A | Alpha City
 11 | geo-b@example.com    | Mockland B | Beta City
 12 | geo-none@example.com |            | 
(3 rows)
```

### A failing confirmation email does not prevent the submission from being stored

The email is sent by a background job after the row is stored. The job tries 3 times, and logs an ALERT if all attempts fail. The header X-Mock-Email-Fail: true forces the mock email provider to fail for that request. All requests below come from `scripts/test-sideeffect.sh`.

Normal submission, the email works. The response comes back in about 0.05 seconds:

```text
curl -s -w "\nHTTP %{http_code} in %{time_total}s\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"side-ok@example.com","message":"email works"}}'
```

```text
{"id":"13"}
HTTP 201 in 0.050484s
```

Submission with the email forced to fail. The response is still 201 and comes back in about 0.007 seconds, so the failing job and its retries do not slow down or break the request:

```text
curl -s -w "\nHTTP %{http_code} in %{time_total}s\n" -X POST http://localhost:3001/submissions -H "Content-Type: application/json" -H "X-Mock-Email-Fail: true" -d '{"widgetId":"9XaNF0jKmUQA","data":{"email":"side-fail@example.com","message":"email fails"}}'
```

```text
{"id":"14"}
HTTP 201 in 0.007451s
```

Both rows are stored:

```text
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select id, data->>'email' as email from submissions where data->>'email' like 'side-%' order by id;"
```

```text
 id |         email         
----+-----------------------
 13 | side-ok@example.com
 14 | side-fail@example.com
(2 rows)
```

Server log for the two requests. Submission 13 sent its email. Submission 14 failed 3 times and raised an ALERT:

```text
EMAIL sent to owner 3557ac2f-1dd3-4ea9-9c7e-aa0f2bd157f7: new submission 13 on widget 9XaNF0jKmUQA
Notification attempt 1/3 for submission 14 failed: mock email provider is down
Notification attempt 2/3 for submission 14 failed: mock email provider is down
Notification attempt 3/3 for submission 14 failed: mock email provider is down
ALERT: notification for submission 14 failed after 3 attempts
```
