# Team-Up — Operational Work Coordination Engine

> **High-concurrency operational coordination platform for scaling organizations (500+ employees), replacing chaotic spreadsheet, email, and Slack triage with server-enforced correctness, atomic claiming, optimistic concurrency control, and Google OAuth 2.0.**

---

## 1. System Architecture & Overview

Team-Up is built for high-stakes operational environments—incident triage, payment investigations, customer escalations, and compliance reviews—where lost updates, double claiming, and unauthorized state transitions carry severe financial or operational penalties.

```
                              ┌──────────────────────────────────────────────┐
                              │            React 18 + TypeScript             │
                              │  (Dual Light/Dark Theme, Google GIS SDK)     │
                              └──────────────────────┬───────────────────────┘
                                                     │ HTTP (REST + JSON)
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │            FastAPI Backend Engine            │
                              │  - Server-Enforced RBAC & Gated Approvals    │
                              │  - Optimistic Concurrency Control (OCC)      │
                              │  - Atomic Race Condition Claiming            │
                              │  - Google OAuth 2.0 Token Verification       │
                              │  - AI-Assisted Triage Copilot (Gemini API)   │
                              └──────────────────────┬───────────────────────┘
                                                     │ asyncpg (NullPool)
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │       PostgreSQL Database (Supabase)         │
                              │  - Tables: users, teams, members, items      │
                              │  - Immutable Audit Events (JSONB Diffs)      │
                              │  - Resilient Background Jobs Queue           │
                              └──────────────────────────────────────────────┘
```

### Technology Stack
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, `asyncpg`, `httpx`.
- **Database**: PostgreSQL hosted on Supabase (Session Pooler IPv4).
- **Frontend**: React 18, Vite, TypeScript, Vanilla CSS Design System (Custom token-driven, dual Light/Dark operational interface).
- **Authentication**: Google OAuth 2.0 via Google Identity Services (GIS) + Server-side JWT verification against Google Tokeninfo API + 1-Click Persona Switcher for live evaluator testing.
- **Testing**: `pytest`, `pytest-asyncio`, `httpx` (100% automated pass rate across concurrency, OCC, and RBAC).

---

## 2. "Beyond CRUD" Distributed Problems Solved

| Problem | Failure Mode Without Team-Up | How Team-Up Solves It | HTTP Response |
| :--- | :--- | :--- | :--- |
| **Atomic Claiming** | Two operators both click "Take Ownership" on an urgent P0 incident at the exact same millisecond; both believe they own it. | Atomic conditional update: `UPDATE work_items SET assignee_id = :uid, version = version + 1 WHERE id = :id AND assignee_id IS NULL`. Exactly one transaction claims it; the loser is safely rejected. | `200 OK` (Claimant)<br>`409 Conflict` (Loser) |
| **Optimistic Concurrency Control (OCC)** | Operator A opens ticket to change priority; Operator B updates description while A was thinking. Operator A clicks save and silently destroys Operator B's updates. | Strict integer `version` counter checked on every update: `WHERE id = :id AND version = :client_version`. Returns structured server diff on collision. | `409 Conflict`<br>(Structured Diff) |
| **Server-Enforced RBAC & Gated Approvals** | Rogue client or front-end spoofing allows unauthorized employees to approve sensitive refunds or close incidents. | Department-scoped roles (`LEAD`, `MEMBER`, `OBSERVER`) enforced strictly on the server. Only team `LEAD` can authorize gated requests. | `403 Forbidden` |
| **State Machine Invariants** | An incident is marked `RESOLVED` directly from `NEW` without going through `TRIAGED` or `IN_PROGRESS`. | Hardcoded transition state machine graph enforced in the domain service layer. | `422 Unprocessable` |
| **Immutable Audit Trail** | Compliance auditors cannot prove who authorized a payment refund or whether values were tampered with. | Append-only `audit_events` recording actor, action, timestamp, and granular `old_values` vs `new_values` JSONB diffs. | Stored forever |
| **Google OAuth 2.0 Security** | Manual login inputs or unverified email spoofing. | Google Identity Services JWT token verified cryptographically via Google's OAuth2 endpoints; auto-provisions profile in Supabase. | `200 OK` / `401 Unauthorized` |

---

## 3. Quickstart & Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (with `npm`)

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Verify your `backend/.env` file:
   ```ini
   APP_NAME=Team-Up
   PORT=8000
   DATABASE_URL=postgresql://postgres.spxubgqotdzdhjudaqaf:Project4Newtonite%401810@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
   GEMINI_API_KEY=your_gemini_api_key
   CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
   GOOGLE_CLIENT_ID=
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API interactive documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

---

## 4. Google OAuth 2.0 Configuration

Team-Up supports both **Live Google OAuth 2.0** and **Sandbox Demo Mode**:

### Option A: Live Google OAuth 2.0 (Using your Google Account)
1. In the Google Cloud Console, create an **OAuth 2.0 Client ID** (Web application).
2. Add `http://localhost:5173` to **Authorized JavaScript Origins**.
3. Set your Client ID in `frontend/.env`:
   ```ini
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
   *(Alternatively, open the Auth Modal in Team-Up, click **Settings**, and paste your Client ID directly into the app).*
4. Click **Sign in with Google**—the authentic Google account chooser popup will open, verify your identity cryptographically, and provision your user in Supabase PostgreSQL!

### Option B: Sandbox Demo Mode (Zero Configuration)
If you do not have a Google Cloud Console project handy:
1. Click **Sign In** on the Landing Page.
2. Click **Test Google OAuth Flow (Demo Profile)**.
3. The system executes the exact same auto-provisioning and team attachment logic in PostgreSQL without needing a Google Cloud API key.

---

## 5. Seed Employee Roster & RBAC Personas

Team-Up includes realistic seed personas across different departments and role tiers to demonstrate server-enforced RBAC:

| Name | Corporate Email | Primary Team | Team Role | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Aarav Sharma** | `aarav.sharma@teamup.internal` | Payments & Fraud | **LEAD** | Authorizes high-risk wire transfers, reviews flagged fraud items. |
| **Samir Patel** | `samir.patel@teamup.internal` | Engineering & Infrastructure | **LEAD** | Authorizes critical infrastructure changes, signs off on P0 outages. |
| **Ananya Iyer** | `ananya.iyer@teamup.internal` | Compliance & Regulatory | **LEAD** | Signs off on GDPR right-to-be-forgotten and regulatory erasure audits. |
| **Rohan Mehta** | `rohan.mehta@teamup.internal` | Customer Experience | **MEMBER** | Frontline triage operator; claims and resolves customer escalations. |
| **Pooja Verma** | `pooja.verma@teamup.internal` | Customer Experience | **OBSERVER** | Read-only auditor; can inspect tickets and audit trails. |
| **Priya Nair** | `priya.nair@teamup.internal` | Operations & Governance | **ADMIN** | System administrator; manages team rosters and access rights. |

> **Pro Tip**: Use the **Active Persona** switcher dropdown in the top-right header or in the Auth Modal to instantly switch identities and test authorization invariants live in the browser!

---

## 6. Automated Risk-Based Testing

Automated tests target the highest-risk failure modes in high-concurrency operations.

To run the full test suite, run the following in the `backend/` directory:
```bash
pytest -v
```

### Test Suite Coverage:
1. `tests/test_concurrency_claim.py`:
   - Simulates two workers racing to claim the same unassigned work item concurrently.
   - Verifies that exactly one receives `200 OK` and the second receives `409 Conflict`.
2. `tests/test_occ_conflicts.py`:
   - Tests Optimistic Concurrency Control by issuing an update with a stale `version` integer.
   - Verifies that the server returns `409 Conflict` with the latest server state and diff.
3. `tests/test_authorization_rbac.py`:
   - Verifies that a non-member is rejected with `403 Forbidden` when attempting to claim cross-department tickets.
   - Verifies that a standard `MEMBER` is rejected with `403 Forbidden` when attempting to approve a gated request, while a `LEAD` succeeds.
4. `tests/test_state_machine.py`:
   - Enforces workflow invariants: prevents illegal status jumps (e.g., `NEW` &rarr; `RESOLVED`).
5. `tests/test_google_auth.py`:
   - Verifies rejection of invalid Google tokens (`401 Unauthorized`) and successful user provisioning upon verified Google token payload.

---

## 7. Database Maintenance & Cleanup

To purge temporary test tickets generated during automated test runs while keeping pristine seed records:
```bash
cd backend
python -m app.cleanup_test_data
```
