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

## Where AI was wrong or needed fixing

- The first signup and login curl calls returned "Cannot POST /api/auth/signup" because the auth routes were not mounted in server.js. I replaced server.js with the full corrected version.
- The command to extract a token with node and readFileSync(0) failed in Git Bash with "stdin is not a tty". I replaced it with grep and cut.
- The editor showed red errors on migrations/001_init.sql. The cause was the MSSQL extension checking Postgres syntax with SQL Server rules, not a real SQL problem. npm run migrate and the table list proved the SQL was correct.
- The expected result for owner B's widget list was an empty list. It was not empty because owner B had created its own widget earlier. The result is still correct, because B only sees its own widget.
- My first test commands printed their output straight to the terminal, so most of it scrolled away and I could not paste it into EVIDENCE.md. I fixed this with a script that writes everything to a file.
- psql opened a pager after the last query, so the terminal showed only a colon. I fixed it by passing -P pager=off in the script.
- Nothing broke in this step. One limit of the design: a burst on one widget blocks that visitor on that widget until the 10 second window ends, so the test for "legitimate traffic still works" uses a different widget and the health endpoint.

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
