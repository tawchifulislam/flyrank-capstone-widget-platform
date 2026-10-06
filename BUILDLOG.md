# Build Log

## Where AI helped

- Planned the capstone phases and the order of the build
- Drafted the design document sections (problem, data model, API contracts, embed flow)
- Generated the first version of docker-compose, the migrations, the migrate script, signup and login, the auth middleware, and the widget repository, service, and routes
- Arranged the curl test commands so each one shows its HTTP status code

## Where AI was wrong or needed fixing

- The first signup and login curl calls returned "Cannot POST /api/auth/signup" because the auth routes were not mounted in server.js. I replaced server.js with the full corrected version.
- The command to extract a token with node and readFileSync(0) failed in Git Bash with "stdin is not a tty". I replaced it with grep and cut.
- The editor showed red errors on migrations/001_init.sql. The cause was the MSSQL extension checking Postgres syntax with SQL Server rules, not a real SQL problem. npm run migrate and the table list proved the SQL was correct.
- The expected result for owner B's widget list was an empty list. It was not empty because owner B had created its own widget earlier. The result is still correct, because B only sees its own widget.

## What I changed and why

- Moved HttpError into src/errors.js so every service shares one error type
- Chose my own JWT signup and login with bcryptjs instead of Supabase, so the project runs with docker compose and no external keys
- Keep TOKEN_A and TOKEN_B in my local .env for quick testing. The .env file is git-ignored and the tokens expire after one hour.
- Cross-owner access returns 404 instead of 403, so a widget id does not reveal that it exists for another owner
