# RepoRounder

Real-time collaborative AI code review platform.

## What it does

- Accepts pull-request diffs and queues asynchronous AI analysis.
- Shows side-by-side code changes with inline, line-specific findings.
- Lets teams share reviews, manage members, and assign roles.
- Streams analysis results and collaborative annotations over WebSockets.

## Tech stack

| Layer | Technology | Why |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind | Fast interactive review workspace |
| Data API | FastAPI, Pydantic | Typed HTTP and WebSocket APIs |
| Identity | MySQL, SQLAlchemy, JWT | Relational users, teams, and roles |
| Review data | MongoDB, Motor | Flexible diff, findings, and annotations |
| Queue/events | Redis Lists and Pub/Sub | Async jobs plus cross-instance events |
| AI | OpenAI-compatible provider | Structured code-review findings |
| Runtime | Docker Compose, Nginx | Reproducible local and deployable services |

## Architecture

RepoRounder intentionally uses two databases. MySQL owns strongly relational identity and authorization data: users, teams, and team memberships. MongoDB owns review documents because diffs, findings, and collaborative annotations are naturally document-shaped and can evolve without joining several relational tables for every review read. A review stores its author and optional team ID; every read checks the current user's personal or team membership access in MySQL before reading MongoDB.

Review creation is deliberately asynchronous. The API writes a pending review to MongoDB and pushes its ID to a Redis List. A separate worker blocks on the queue, calls the configured AI provider, validates the returned JSON with Pydantic, and writes the findings back to MongoDB. After completion it publishes a `findings_ready` event to Redis Pub/Sub. FastAPI WebSocket rooms subscribe to those events and broadcast them to every browser viewing that review, so React Query can invalidate its cache immediately while two-second polling remains a fallback.

## Local development

### Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 20+
- An AI provider key for successful analysis (optional for auth/team/UI work)

### Quick start with Docker

Create `backend/.env` from `backend/.env.example`, then start the complete stack:

```powershell
docker compose up --build
```

Open the frontend at http://localhost:3000 and the API docs at http://localhost:8000/docs.

Stop the stack with:

```powershell
docker compose down
```

### Manual start for development

Start infrastructure first:

```powershell
docker compose up -d mysql mongo redis
```

Run the API:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Run the worker in another terminal:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m app.worker.worker
```

Run the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

## Running tests

Backend:

```powershell
cd backend
python -m pytest tests/ -v
```

Frontend:

```powershell
cd frontend
npm test -- --run
```

The backend tests use an isolated in-memory SQLite database for team/auth behavior and mock Mongo/Redis/AI boundaries where needed. Frontend tests run in jsdom with Vitest and React Testing Library.

## Deployment

The production templates are [backend/.env.production](backend/.env.production) and [frontend/.env.production](frontend/.env.production). Replace every placeholder and keep real secrets outside git.

### Services needed

- Railway or Render for the FastAPI API and worker
- PlanetScale or Railway MySQL
- MongoDB Atlas
- Upstash Redis
- Vercel or Netlify for the React frontend

The worker must be deployed as a separate long-running process. The API and worker share the same environment variables, especially MongoDB, Redis, JWT, and AI settings.

Generate a production JWT secret with:

```bash
openssl rand -hex 32
```

## API reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | No | API health and environment |
| POST | `/api/v1/auth/register` | No | Create an account |
| POST | `/api/v1/auth/login` | No | Issue access and refresh tokens |
| POST | `/api/v1/auth/refresh` | No | Refresh an access token |
| GET | `/api/v1/auth/me` | JWT | Get the current user |
| POST | `/api/v1/teams` | JWT | Create a team as owner |
| GET | `/api/v1/teams/me` | JWT | List the user's teams |
| POST | `/api/v1/teams/{id}/invite` | JWT owner | Invite a viewer by email |
| PUT | `/api/v1/teams/{id}/members/{uid}/role` | JWT owner | Change a member role |
| POST | `/api/v1/reviews` | JWT | Create a personal or team review |
| GET | `/api/v1/reviews` | JWT | List accessible reviews, optionally filtered by team |
| GET | `/api/v1/reviews/{id}` | JWT | Fetch a review and findings |
| GET | `/api/v1/reviews/{id}/status` | JWT | Fetch analysis status |
| WS | `/api/v1/reviews/{id}/ws?token=...` | JWT query token | Live findings and annotation events |

## Interview talking points

1. **Dual database ownership:** MySQL handles relational authorization; MongoDB handles evolving review documents. The service layer joins the authorization decision without duplicating membership data into every document.
2. **Redis has three roles:** the List is a durable-enough work queue for the worker, Pub/Sub is the shared real-time event bus, and Redis connectivity is centralized behind one async client factory.
3. **Async boundary:** the request returns a pending review immediately; a worker performs slow AI work and validates its output before publishing completion.
4. **Realtime with fallback:** WebSockets provide low-latency updates across API instances through Redis Pub/Sub, while React Query polling keeps the product correct if a browser connection drops.
