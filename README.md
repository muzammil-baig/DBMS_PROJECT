# CAMPUS MEMORY

Campus Memory is a React/Vite frontend backed by a FastAPI API and Supabase
PostgreSQL/Auth.

## Requirements

- Python 3.11 or 3.12
- Node.js 22.x and npm 10.x
- A Supabase project with PostgreSQL and Auth configured
- A database connection string for the backend runtime role

## Configure and run on Windows

Open two PowerShell terminals from the project root.

### Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit `backend\.env` and set:

- `DATABASE_URL`: the Supabase PostgreSQL connection string for the backend
  runtime role. Use SSL (`sslmode=require`) and the session-mode pooler if your
  machine cannot reach the direct host.
- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_PUBLISHABLE_KEY`: your Supabase publishable key. Never use a
  service-role key here.

Then start the API from the `backend` directory:

```powershell
uvicorn app.main:app --reload --app-dir .
```

The API is at `http://127.0.0.1:8000`; its Swagger page is
`http://127.0.0.1:8000/docs`.

### Frontend

In the second terminal:

```powershell
cd frontend
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

The frontend is at `http://localhost:5173`. `frontend\.env` uses
`VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1` to connect to the local API.

## Notes

- `.env` files contain local configuration and are ignored by Git. Never commit
  real credentials.
- Both `.env` files are present as starter files in this checkout; update them
  with your own Supabase values before using database or authentication features.
- Frontend packages are declared in `frontend\package.json` and locked in
  `frontend\package-lock.json`. Backend packages are listed in
  `backend\requirements.txt`; no separate package installation is needed.
- See [backend/README.md](backend/README.md) for database role details and
  backend tests, and [frontend/README.md](frontend/README.md) for frontend
  features and scripts.
