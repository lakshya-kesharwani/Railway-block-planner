# Automatic Block Planning — Integrated Project

This package merges three previously-separate pieces into one working
system:

1. **`railway-unified-backend/`** — real backend. Was two separate FastAPI
   apps (`railway-block-planner-backend` + `Kalm storm`), now merged into
   ONE FastAPI app so the frontend only needs one base URL.
2. **`frontend/`** — the React/Vite dashboard (`project`), now wired to
   call the real backend for login, with a ready-to-use API client for
   everything else.

## Run it

**Backend:**
```bash
cd railway-unified-backend
python -m venv venv
venv\Scripts\activate        # Windows, or: source venv/bin/activate on Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs on `http://localhost:8000`. Interactive API docs at `/docs`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` (Vite default) and is already configured
via `.env` (`VITE_API_BASE_URL=http://localhost:8000`) to talk to the
backend above.

---

## What got fixed

### Backend A (`railway-block-planner-backend` → now `app/`)
- **All `__init__.py` files were misnamed** — `_init__.py`, `_init_.py`,
  even `_inti_.py` (typo) across `Schemas/`, `conflict/`, `core/`, `db/`,
  `models/`, `planner/`, `priority/`, `routes/`. Didn't break anything
  (Python 3 namespace packages tolerate this) but was non-standard and
  confusing. Renamed all of them properly; added a missing one for
  `app/service/`.
- **No `requirements.txt` existed at all.** Created one from the actual
  installed package versions in the project's own `.venv`.
- **No CORS middleware.** The frontend runs on a different origin
  (`localhost:5173`) than the backend (`localhost:8000`) — without CORS
  enabled, every browser request from the frontend would have been
  silently blocked. Added `CORSMiddleware`, configurable via
  `CORS_ORIGINS_RAW` in `.env`.
- **`PUT /maintenance/blocks/{id}/status` took `status` as a raw query
  parameter** (`?status=Approved`) instead of a JSON body — unusual for a
  REST API and an easy footgun for whoever builds the frontend call.
  Changed to a proper Pydantic body (`{"status": "Approved"}`), restricted
  to the two valid values via `Literal["Approved", "Rejected"]`.
- **`GET /maintenance/analyze/{request_id}` crashed with an unhandled 500**
  if given a malformed ID (invalid MongoDB ObjectId format), instead of a
  clean 404. Fixed.
- **Real MongoDB Atlas credentials and a JWT secret were committed in
  `.env`.** Left functional (so the project still runs), but you should
  **rotate the Mongo password and JWT secret** before this repo is ever
  made public — anyone with the zip currently has write access to your
  database.

### Backend B (`Kalm storm` → now `app/ml/`)
Same three bugs as the version fixed earlier this session, re-applied here
since this upload was the original broken copy, not the fixed one:
- `/generate-schedule` (now `/ml/generate-schedule`) had **no `return`
  statement** — the loop body was cut off mid-way through a refactor, so
  every call returned `null`. Rebuilt the full pipeline (Isolation Forest →
  XGBoost → Random Forest → delay model → OR-Tools) with a proper return.
- A ~190-line block of dead code was sitting inert inside a stray
  `"""...""" ` string (never executed). Removed.
- `/what-if` (now `/ml/what-if`) was defined **twice** — the second
  definition was unreachable dead code since FastAPI matches the first
  registered route. Removed the duplicate.
- `/storm-mode` (now `/ml/storm-mode`) fed models raw positional Python
  lists instead of named `DataFrame` columns (fragile — a silent
  miscalculation waiting to happen if column order ever changed).
  Standardized to match every other endpoint's pattern.

### Frontend (`project` → now `frontend/`)
- **No `.gitignore` existed at all** — the `.env` file (containing your
  real Groq API key) would have been committed to git the first time
  someone ran `git add .`. Added one.
- **Zero real backend integration existed.** Every screen ran entirely on
  generated mock data; `AuthContext.login()` only checked a hardcoded
  `DEMO_USERS` list. See "What's wired" below for exactly what changed.

---

## What's wired vs. what's still mock

**Wired to the real backend:**
- **Login** (`AuthContext.login`) — tries the real backend first
  (`POST /auth/login` with email + password → JWT), and **falls back to
  the local demo accounts** if the backend is unreachable or the
  credentials don't match a real account. This means the app still works
  standalone for a demo even if the backend isn't running, but also
  supports real registered users when it is. The JWT is stored as
  `authToken` in `AuthContext` (and `localStorage`) for use in further API
  calls.
- **`src/utils/apiClient.ts`** — a complete, typed client covering every
  backend endpoint (auth, maintenance requests, block planning, and all 7
  `/ml/*` ML/OR-Tools endpoints). Fully implemented and ready to call from
  any component.
- **`src/utils/roleMapping.ts`** — translates between the backend's role/
  department enums (`control_officer`, `Signal_Telecom`, ...) and the
  frontend's (`control`, `Signal & Telecom`, ...), since the two projects
  modeled these differently.

**Still using generated mock/demo data** (by design — see below):
- Dashboard analytics, Gantt scheduling view, Storm Mode / What-If
  simulator screens, and the "New Request" form. These use a considerably
  richer data model (corridor, track km, OHE power cuts, crew requirements,
  simulated AI scoring breakdowns, etc.) than either backend currently
  stores. Forcing them onto the real backend's simpler schema would mean
  either silently dropping most of the demo's visual richness or a much
  larger backend schema migration — bigger than "integrate the pieces you
  gave me," so I left them as-is and documented the gap instead of
  guessing. `apiClient.ts` already has everything needed
  (`createMaintenanceRequestApi`, `generateScheduleMlApi`, etc.) to wire
  these up further whenever you're ready.

## New: the rule-engine ↔ ML-engine bridge

`GET /maintenance/analyze-ml/{request_id}` is new. It takes a **real**
MongoDB-backed maintenance request and runs it through **both** engines on
the same record:
- the original rule-based Priority Engine (deterministic, explainable), and
- the KALM Storm ML pipeline (Isolation Forest → XGBoost → Random Forest →
  delay model).

**Honest limitation, documented in the response itself:** the two
projects' asset schemas barely overlap. MongoDB only tracks criticality,
age, defect severity, and previous-failure count; the ML models were
trained on a richer synthetic feature set (traffic intensity, load factor,
environmental/weather risk, congestion, etc.) that the current database
schema doesn't capture. Rather than inventing fake sensor data, the
response explicitly lists which fields came from real data
(`fieldsFromRealData`) and which were filled with the training dataset's
mean value as a placeholder (`fieldsDefaulted`). Extend the `assets`
collection if you want the defaulted fields to become real.

## Testing notes

Neither this sandbox had network access to install `ortools`, `fastapi`,
`pymongo`, etc. (Python) or run `npm install` (frontend), so live
end-to-end testing wasn't possible here. Everything was instead verified with:
- `python -m py_compile` on every backend file (no syntax errors),
- an offline import/wiring test using lightweight stand-ins for FastAPI/
  pydantic/pymongo/ortools, confirming all 16 routes register with no path
  collisions and no import errors,
- direct calls to the fixed ML endpoints and the new bridge endpoint with
  realistic input, confirming they return fully populated responses
  instead of `null`.

**Please still run both sides for real** (`uvicorn app.main:app --reload`
+ `npm run dev`) before your demo — this covers logic and wiring
correctness, not a substitute for an actual run.
