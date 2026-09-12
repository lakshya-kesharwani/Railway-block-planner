# Automatic Block Planning for Indian Railways (AI-Powered)

Ministry of Railways PS #27 — an AI system that integrates maintenance
data (defects, overdue tasks) from TMS/SMMS/TDMS with corridor block
availability from the Control Office Application, and generates optimized
weekly/monthly maintenance block schedules across Engineering, Traction
Distribution, and Signal & Telecom departments.

## Structure

```
railway-unified-backend/   FastAPI backend — auth, MongoDB, rule-based
                            priority engine, block planner, PLUS the AI/ML
                            layer (XGBoost, Random Forest, Isolation
                            Forest, delay prediction, OR-Tools scheduler)
                            mounted under /ml
frontend/                   React + TypeScript + Vite dashboard, with a
                            Groq-powered AI Assistant chatbot
INTEGRATION.md              Full write-up of every bug found/fixed and
                            exactly what's wired to the real backend vs.
                            still using demo data
```

## Quick start

**Backend** (`http://localhost:8000`, docs at `/docs`):
```bash
cd railway-unified-backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend** (`http://localhost:5173`):
```bash
cd frontend
npm install
npm run dev
```

The frontend is already pointed at `http://localhost:8000` via
`frontend/.env` (`VITE_API_BASE_URL`). Login works against the real
backend when it's running, and automatically falls back to the built-in
demo accounts if it isn't — so the frontend runs standalone for a demo
even without the backend up.

## Environment variables

Both `railway-unified-backend/` and `frontend/` have a `.env` (with real
values, already filled in for local dev) and a `.env.example` (safe
template, no secrets) — see each folder's `.env.example` for what's
needed. **`.env` files are gitignored and won't be pushed** — see
"Before you push" below.

## Tech stack

- **Backend:** FastAPI, MongoDB (PyMongo), JWT auth, scikit-learn,
  XGBoost, Google OR-Tools
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Groq (Llama /
  GPT-OSS) for the AI Assistant chatbot



