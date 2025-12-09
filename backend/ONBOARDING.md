# Backend Onboarding — mancrel

This document is a step-by-step onboarding guide for a senior backend engineer joining the mancrel project. It explains what the project is, how the backend is organized, and gives explicit, runnable steps for setup, development, testing, and production readiness. For each action it also explains why it matters in the context of this repository and where the relevant files live.

---

**Quick summary (one-liner):** mancrel is a CRM-like full-stack application. The backend (Python) exposes a versioned REST API under `backend/src/api/v1/`, supports background workers, ML helpers, database models, and services. Your job: own and harden the backend — implement features, ensure reliability, secure the system, and document everything so others can follow.

---

## Table of contents
- Project overview
- Repo layout (what you'll work with)
- Local environment setup (step-by-step)
- Running the app and verifying endpoints
- Database and migrations
- Tests, linters, and formatting
- Implementing a feature (detailed example)
- Background workers & async tasks
- Security checklist
- Observability and monitoring
- CI/CD and deployment checklist
- Day-to-day workflow and PR expectations
- Useful commands reference
- Troubleshooting / FAQs

---

## Project overview — how this applies here
- Backend language & framework: Python (see `backend/src/`). The app appears to be structured in a modular API style with subpackages for `auth`, `users`, `messaging`, `crm`, `analytics`, `personalization`, etc. That means functionality is grouped by domain and each domain likely has `routes.py`, `controllers.py`, and service logic.
- API surface: versioned at `backend/src/api/v1/`. Expect route registration files and controllers here.
- Configuration & core helpers: `backend/src/core/` (contains `config.py`, `security.py`, `utils.py`). This is where environment-driven config, authentication helpers, and utilities live; changes here affect the whole app.
- DB: `backend/src/db/` holds database related code and models (or references to where models live). Migrations may be present elsewhere — search for Alembic or migration folder.
- ML: `backend/src/ml/` includes embedding, inference, training — likely asynchronous or service-backed features; be cautious with large binary dependencies.
- Workers: `backend/src/workers/` contains task queue code (Celery, RQ, or other). Worker config ties to `REDIS_URL`/broker.
- Tests: `backend/tests/` — unit and integration tests. Use these to validate local changes.

Why this matters: understanding this structure helps you quickly locate the right place for changes (e.g., DB/ORM changes go under `db/`/`models`, HTTP handlers under `api/v1/...`).

---

## Repo layout (quick map)
- `backend/` — backend app root
  - `Dockerfile` — container build instructions for the backend.
  - `README.md` — (empty in repo) should contain quick start; we'll add to it.
  - `requirements.txt` — Python deps (run `pip install -r requirements.txt`).
  - `src/` — application source
    - `app.py`, `main.py` — application entry points.
    - `api/v1/` — versioned API routes and controllers.
    - `core/` — config, security, utils.
    - `db/` — DB init, models (where to look for ORM usage).
    - `ml/` — ml utilities.
    - `models/`, `services/`, `workers/` — domain logic.
  - `tests/` — test suite.

---

## Local environment setup (exact commands)
These steps create an isolated environment and run the service locally.

1) Install Python 3.11+ (if not present)
   - Confirm version:

     ```zsh
     python --version
     # or
     python3 --version
     ```

   - If version is older than required, use `pyenv` or your OS package manager. The repo's runtime constraints are implied by `requirements.txt` (check for packages needing specific versions).

2) Create and activate a virtual environment

```zsh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
```

3) Install Python dependencies

```zsh
pip install -r requirements.txt
```

Note: If the repo uses a `pyproject.toml`/Poetry substitute appropriate steps.

4) Environment variables

- Copy example env if present:

```zsh
cp .env.example .env   # if .env.example exists
```

- Required variables you must set (examples):
  - `DATABASE_URL` — postgres connection string (postgresql://user:pass@localhost:5432/mancrel)
  - `REDIS_URL` — redis://localhost:6379/0
  - `JWT_SECRET` or `SECRET_KEY` — used for tokens
  - `SENTRY_DSN` — optional

Explain: `core/config.py` reads these values to configure DB, worker brokers, and security. If not set, many services may fail or run with unsafe defaults.

5) Start local Postgres & Redis (Docker recommended)

```zsh
# Postgres
docker run --name mancrel-postgres -e POSTGRES_USER=mancrel -e POSTGRES_PASSWORD=mancrel -e POSTGRES_DB=mancrel -p 5432:5432 -d postgres:15
# Redis
docker run --name mancrel-redis -p 6379:6379 -d redis:7
```

6) Run DB migrations (if Alembic present)

```zsh
# from backend/
alembic upgrade head
```

If Alembic is not present, check `backend/src/db` for a bootstrap script (e.g., `create_tables()` or SQL files).

7) Run the app locally (development)

```zsh
# from backend/
# If app uses uvicorn (ASGI)
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
# OR if using Flask
export FLASK_APP=src.app
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=8000
```

Confirm: open `http://localhost:8000/` or `http://localhost:8000/health`.

Why: these exact steps ensure you replicate the production runtime in local dev and that you have the necessary backing services.

---

## Tests, linters, formatting
1) Run tests

```zsh
cd backend
pytest -q
```

- If tests fail due to env vars, ensure `.env` is configured.
- Use `pytest -k <pattern>` to run a subset.

2) Linters and formatters

```zsh
# if flake8/ruff configured
flake8
# or
ruff check .
# formatting
black .
```

3) Pre-commit

```zsh
pre-commit install
pre-commit run --all-files
```

Why: maintain code quality and consistency across PRs.

---

## Implementing a feature: detailed example (Create User endpoint)
This example shows how to add a new endpoint end-to-end and where to place code.

1) Identify files to change:
   - `backend/src/api/v1/users/routes.py` — add route registration
   - `backend/src/api/v1/users/controllers.py` — implement request handling
   - `backend/src/services/users.py` — business logic (create user, send welcome)
   - `backend/src/models/user.py` — ORM model changes if needed
   - `backend/migrations/` — add Alembic migration to create users table
   - `backend/tests/` — add unit + integration tests

2) Controller responsibilities (small, testable):
   - Validate input JSON (use `pydantic` or manual validation)
   - Call service layer
   - Convert service output to HTTP response and status codes

3) Service responsibilities:
   - Validate business constraints (unique email)
   - Hash password (use `passlib`/`bcrypt`) — see `core/security.py`
   - Persist model via ORM
   - Publish domain event (e.g., `user.created`) or enqueue background tasks

4) Tests to add:
   - Unit tests for `services/users.py` mocking DB
   - Integration test for endpoint using test client (Flask/Starlette test client) with test DB

5) Documentation:
   - Update API docs or README with request/response JSON examples

Rationale: This separation makes the code easy to test and maintain; controllers remain thin, services contain business rules.

---

## Background workers & async tasks
- Inspect `backend/src/workers/` for Celery/RQ tasks. Worker config likely uses `REDIS_URL` and task modules.
- To run locally:

```zsh
# start worker (example Celery)
celery -A src.workers.app worker --loglevel=info
```

- Test by enqueueing a job from Python REPL or a route and verifying the worker processes it.

Why: background jobs offload heavy compute (emails, ML inference) and must be idempotent.

---

## Security checklist (practical steps)
- Password storage: ensure `core/security.py` uses `bcrypt`/`argon2` with secure parameters.
- Token secrets: ensure `JWT_SECRET` is random and not checked into git.
- TLS: enforce HTTPS in production and use secure cookie flags.
- Input validation: validate all user input with `pydantic`/schemas at controller boundary.
- Rate limiting: add for login and other abuse-prone endpoints.
- Dependency scanning: enable Dependabot or `pip-audit` in CI.

---

## Observability & monitoring
- Logging: Use structured JSON logs. Add a request id to each log line.
- Metrics: expose Prometheus endpoint; instrument request latencies and error rates.
- Tracing: OpenTelemetry optionally; useful for tracing requests through ML inference.
- Error reporting: configure Sentry in `core/config.py` and capture exceptions.

---

## CI/CD & deployment
- Check `backend/Dockerfile` and any `infrastructure/` folder for deploy manifests.
- Standard CI steps:
  - Linting
  - Unit tests
  - Build docker image
  - Push to registry
  - Deploy to staging
- Local Docker build:

```zsh
docker build -t mancrel-backend:local backend/
# run with env file
docker run --env-file backend/.env -p 8000:8000 mancrel-backend:local
```

- Rollbacks: prefer `--force-with-lease` and immutable tags in image registry.

---

## Day-to-day workflow and PR expectations
- Make small, focused PRs with a clear description and testing checklist.
- Each PR must include:
  - What changed and why
  - How to run locally
  - Test plan and results
  - Any schema/migrations and migration plan
  - Rollback instructions if relevant
- Document non-obvious decisions inline in code and in the `backend/` README or `docs/`.

---

## Useful commands reference (copyable)
```zsh
# dev env
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# start supporting services
docker run --name mancrel-postgres -e POSTGRES_USER=mancrel -e POSTGRES_PASSWORD=mancrel -e POSTGRES_DB=mancrel -p 5432:5432 -d postgres:15
docker run --name mancrel-redis -p 6379:6379 -d redis:7
# run migrations
alembic upgrade head
# run app
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
# tests
pytest -q
# linters and format
black .
flake8
# build docker
docker build -t mancrel-backend:local backend/
```

---

## Troubleshooting / FAQ
- "DB connection refused" — ensure Postgres is running, `DATABASE_URL` points to correct host/port. Use `psql` to test connectivity.
- "Missing env var X" — search `core/config.py` to see all required envs.
- "Tests failing due to migrations" — ensure test DB is migrated or test uses fixtures that create schema.
- "Worker not processing tasks" — ensure worker is pointed at same Redis broker and task modules are discoverable.

---

## Next immediate actions I recommend you take (priority)
1. Populate `backend/.env.example` with required variables and default local values (if missing). This dramatically lowers onboarding friction.
2. Add a short `backend/README.md` (or copy parts of this doc) with `quick start` section linking to this file.
3. Run the test suite and fix failing tests blocking CI.

---

If you want, I can:
- Create `backend/.env.example` with suggested variables and safe local defaults.
- Add a minimal `backend/README.md` that includes a Quick Start and link to this onboarding doc.
- Implement the example "Create user" endpoint (controller + service + tests) as a working PR.

Which of the 3 should I do next? 
