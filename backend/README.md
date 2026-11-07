# Optional FastAPI demo API

The main app runs independently with Next.js route handlers. This FastAPI service provides an alternate local API implementation with the same broad demo workflows and interactive OpenAPI docs at `http://localhost:8000/docs`.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

This service is unauthenticated, in-memory, synthetic-only, and refuses to start when `AHOE_ENV=production`. Keep it bound to localhost. It does not connect to the PostGIS migration or enforce organization roles.

Run its dependency-free domain checks with `python -m unittest discover -s tests` from `backend/`.
