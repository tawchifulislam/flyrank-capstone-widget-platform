# Build Log

## Where AI helped

- Planned the capstone phases and the order of the build
- Drafted the design document sections (problem, data model, API contracts, embed flow)
- Generated the first version of docker-compose, the migrations, the migrate script, signup and login, the auth middleware, and the widget repository, service, and routes
- Arranged the curl test commands so each one shows its HTTP status code
- Wrote the first version of the public submission endpoint: CORS middleware, per-widget validation built from the widget field definitions, and the repository insert
- Wrote scripts/test-submissions.sh so all submission tests run together and the output is captured to a file
- Designed the two-layer rate limiter (per IP and widget, plus per IP overall) and the honeypot check
- Wrote scripts/test-abuse.sh so the burst, the recovery, and the honeypot tests run in one go
- Designed the geo enrichment service with a provider A then provider B fallback chain, and the mock mode used to prove it
- Wrote scripts/test-geo.sh so the three fallback cases run together
- Designed the email side effect as a background job with 3 attempts, growing waits, and a final ALERT log
- Wrote scripts/test-sideeffect.sh to run the working and the failing email case together
- Designed the public config endpoint with a short cache time and an ETag, and wrote scripts/test-config.sh
- Designed the two layer delivery: a stable loader URL with a short cache, and a content-hash bundle URL with a one year immutable cache
- Wrote the first version of the widget bundle (form rendering from the config, hidden honeypot field, submit and error messages) and scripts/test-bundle.sh

## Where AI was wrong or needed fixing

- The first signup and login curl calls returned "Cannot POST /api/auth/signup" because the auth routes were not mounted in server.js. I replaced server.js with the full corrected version.
- The command to extract a token with node and readFileSync(0) failed in Git Bash with "stdin is not a tty". I replaced it with grep and cut.
- The editor showed red errors on migrations/001_init.sql. The cause was the MSSQL extension checking Postgres syntax with SQL Server rules, not a real SQL problem. npm run migrate and the table list proved the SQL was correct.
- The expected result for owner B's widget list was an empty list. It was not empty because owner B had created its own widget earlier. The result is still correct, because B only sees its own widget.
- My first test commands printed their output straight to the terminal, so most of it scrolled away and I could not paste it into EVIDENCE.md. I fixed this with a script that writes everything to a file.
- psql opened a pager after the last query, so the terminal showed only a colon. I fixed it by passing -P pager=off in the script.
- Nothing broke in this step. One limit of the design: a burst on one widget blocks that visitor on that widget until the 10 second window ends, so the test for "legitimate traffic still works" uses a different widget and the health endpoint.
- Nothing broke in this step. A real lookup cannot be shown from localhost because the visitor IP is ::1, which no provider can locate. That is why the proof uses mock providers.
- The test script output does not contain the server log, so the proof of the retries and the ALERT could not come from the script file alone. I copied the server log lines from the terminal that runs the server.
- The first run of the config test printed empty output because the server was not answering and curl -s hid the connection failure. I checked the server terminal and the order of the lines in src/server.js, fixed it, restarted the server, and the test passed.
- My first check that an old bundle URL stops working used the placeholder text PURANO_HASH instead of the real old hash. The 404 it printed proved nothing, because that text is never a valid hash. I reran it with the real old hash (b604ead95f) and got 404 for old and 200 for new.

## What I changed and why

- Moved HttpError into src/errors.js so every service shares one error type
- Chose my own JWT signup and login with bcryptjs instead of Supabase, so the project runs with docker compose and no external keys
- Keep TOKEN_A and TOKEN_B in my local .env for quick testing. The .env file is git-ignored and the tokens expire after one hour.
- Cross-owner access returns 404 instead of 403, so a widget id does not reveal that it exists for another owner
- The public CORS middleware allows any origin on /submissions only, because customer sites can be anywhere and no cookies are used. The admin routes have no CORS.
- Validation builds a zod schema from the widget's own field list and rejects unknown fields, so a visitor can only send what the widget defines
- The request body limit is 10kb, so oversized payloads fail with 413 before reaching business logic
- owner_id is copied from the widget row, never from the request body
- The limiter is keyed on IP plus widget id, so a flood against one widget cannot stop other widgets. A second limiter per IP across all widgets stops a bot that rotates widget ids.
- Limits live in .env (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_MS, IP_RATE_LIMIT_MAX) so they can be changed without code changes
- A filled honeypot returns a normal looking 201 and stores nothing, so the bot gets no hint about why it was dropped
- The rate limit counters are in memory. They reset on restart and are not shared between several server copies. This goes into the README limitations note.
- GEO_MODE=mock uses two local fake providers with different answers, so the evidence shows exactly which provider enriched each row. GEO_MODE=real uses ip-api.com first and ipapi.co second.
- The X-Mock-Geo-Down header only works in mock mode, so a real deployment cannot be switched by a visitor. It lets me turn a provider off per request without restarting the server.
- Every provider call has a timeout (GEO_TIMEOUT_MS) and every failure is caught, so a slow or dead provider can never break or delay a submission for long
- Private and loopback addresses are not sent to real providers
- The email job runs after the row is stored and does not block the response. It uses setImmediate, so the visitor always gets the 201 first.
- Retry waits are 200 ms and then 400 ms, and after the third failure the job logs an ALERT line that a log monitor could match
- Only the mock email mode exists. It writes the email to the console. Replacing sendEmail in src/services/notificationService.js is the only change needed for a real mail server.
- The job lives in memory, so a server crash during the retries loses it. This goes into the README limitations note.
- The config payload carries only what the browser needs to draw the form (type, texts, fields, display options, version) and never the owner id
- The config is cached for 60 seconds so a busy customer site does not hit the database on every page view, and the ETag lets a browser check cheaply for changes after that
- The config is public and allows any origin, because the widget runs on customer sites
- The embed snippet stays /widget.js?id=..., so customers who already pasted it never have to change anything. Only the loader behind it knows the current bundle URL.
- The bundle hash is computed from the file content when the server starts, so a release is just a changed file plus a restart
- The bundle writes every owner supplied text with textContent, never innerHTML, so a widget title cannot inject HTML or scripts into a customer site
- The honeypot input is named hp_url and hidden off screen, and the bundle sends its value in the honeypot field
- Known limit: after a release the old bundle URL returns 404. A customer page that cached the old loader (up to 5 minutes) can fail to load the widget until the cache expires. This goes into the README limitations note.
