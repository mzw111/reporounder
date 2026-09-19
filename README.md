# RepoRounder

Backend API foundation for RepoRounder.

## Start the local databases

Make sure Docker Desktop is running, then from the project root run:

```powershell
docker compose up -d
```

## Run locally on Windows

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

The API startup checks MySQL, MongoDB, and Redis. Then open http://localhost:8000/docs.

To stop the database containers:

```powershell
docker compose down
```
