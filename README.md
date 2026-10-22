# AICTE Veritas — Stage 1 Foundation

> **Smart India Hackathon • Problem Statement SIH26261**  
> *“AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification”*

AICTE Veritas is an institutional application review platform designed for the All India Council for Technical Education (AICTE). It provides a secure, role-based environment for technical institutions to submit Extension of Approval (EoA) applications and for council scrutiny officers to inspect documents, issue clarification notices, and record preliminary human scrutiny findings.

---

## 1. Executive Summary & Problem Alignment

Technical institutions seeking annual Extension of Approval (EoA) or expansion must provide numerous legal, academic, and infrastructural documents. Traditional manual scrutiny creates backlogs and administrative delays.

**AICTE Veritas** operates as a reviewer copilot:
- It eliminates administrative friction through automated format and cryptographic integrity checks (MIME magic-byte verification and SHA-256 fingerprinting).
- It provides a transparent, bi-directional clarification and re-attestation loop between applicants and reviewers.
- It enforces strict server-side state machines and logs an immutable audit trail for every action.
- It maintains human authority: statutory determinations remain strictly in the hands of council officials.

---

## 2. Stage 1 Scope & Boundaries

### What IS Delivered in Stage 1
- **Dual Role-Based Portals:** Institution Portal (applicant) and AICTE Reviewer Portal (scrutiny officer) operating on a single backend and database.
- **Demonstration Role Management:** Clearly labelled demo authentication provider with server-side role and cross-institution data isolation.
- **Real Application Lifecycle:** Strict state machine transitions:  
  `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `NEEDS_CLARIFICATION` → `RESUBMITTED` → `UNDER_REVIEW` → `PRELIMINARY_REVIEW_COMPLETE`.
- **Cryptographic Document Intake:** PDF, PNG, and JPG/JPEG support with magic-byte verification, SHA-256 duplicate fingerprinting, isolated UUID file storage, and versioning.
- **Authorized File Access:** Documents are stored privately outside public web paths and streamed via authorized endpoints only.
- **Interactive Clarification Loop:** Reviewers raise specific deficiency queries; institutions submit written responses and revised document versions.
- **Scrutiny Observations:** Reviewers record categorised findings (Documentation, Faculty Cadre, Infrastructure) with severity ratings (Info, Warning, Deficiency).
- **Audit Event Log:** Append-only timeline tracing all uploads, state changes, and reviewer actions with timestamps.
- **Synthetic Demo Seeder:** Reproducible dataset featuring fictional institutions (*Northstar Institute of Technology*, *Apex Academy*, *Vanguard Polytechnic*).

### What IS Explicitly Deferred to Future Stages
- Automated multi-page OCR and text extraction (planned for Stage 2).
- Automated cross-document entity consistency checks (e.g., cross-referencing survey numbers across deeds and NOCs).
- Regulatory rulebooks (AICTE Approval Process Handbook algorithmic checklist).
- External issuing-authority verification connectors (DigiLocker, State Fire Dept APIs).
- Automated document forgery or biometric tamper detection.

---

## 3. Technology Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Vite 5
  - Tailwind CSS
  - React Router DOM v6
  - Lucide React (Icons)
- **Backend:**
  - Python 3.11+
  - FastAPI
  - Pydantic v2 & Pydantic-Settings
  - SQLAlchemy 2.0 (ORM)
  - Python-Multipart (File streaming)
- **Database:**
  - SQLite (Local development & demonstration)
  - Schema architected for migration to PostgreSQL
- **Testing:**
  - Pytest with TestClient & in-memory SQLite

---

## 4. Repository Structure

```
AICTE-VERITAS/
├── .env.example              # Environment variables template
├── .gitignore                # Comprehensive git exclusions
├── README.md                 # Project guide and instructions
├── docs/
│   ├── architecture.md       # Architectural blueprints & Mermaid diagrams
│   ├── api-contract.md       # Complete REST API specifications
│   └── stage-1-demo.md       # Step-by-step evaluator walkthrough
├── backend/
│   ├── requirements.txt      # Python dependencies
│   └── app/
│       ├── main.py           # FastAPI entrypoint, lifespan & CORS
│       ├── core/             # Configuration, database & security
│       ├── models/           # SQLAlchemy persistent models
│       ├── schemas/          # Pydantic validation schemas
│       ├── services/         # Storage, lifecycle state machine & seeder
│       ├── api/              # API v1 routers (/cases, /documents, etc.)
│       └── tests/            # Pytest test suite (14 test cases)
└── frontend/
    ├── package.json          # Node dependencies
    ├── vite.config.ts        # Vite build config & proxy
    ├── tailwind.config.js    # Tailwind institutional design system
    ├── tsconfig.json         # TypeScript strict configuration
    └── src/
        ├── App.tsx           # Router and demo context provider
        ├── main.tsx          # DOM mount
        ├── context/          # Demo session and role switching
        ├── services/         # API client with auth headers
        ├── types/            # Shared TypeScript interfaces
        ├── layouts/          # Root layout and government banner
        ├── components/       # Status badges, header, navigation
        └── pages/            # Landing, Institution, and Reviewer views
```

---

## 5. Prerequisites

- **Python 3.11+** installed (`python --version`)
- **Node.js v18+** and **npm** installed (`node --version`, `npm --version`)
- **Git** (`git --version`)

---

## 6. Setup & Installation Instructions

### 1. Clone & Switch to Feature Branch
```bash
git clone https://github.com/navyaanubhutii/AICTE-VERITAS.git
cd AICTE-VERITAS
git checkout stage-1-foundation
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

---

## 7. Running the Application

### Start Backend Service (Port 8000)
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health`

### Start Frontend Service (Port 5173)
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 8. Running Automated Tests & Verification

### Run Backend Pytest Suite
```bash
cd backend
python -m pytest -v
```
All 14 integration tests verify:
- Access control and 401/403 rejection.
- Cross-institution data isolation.
- File magic-byte validation and rejection of spoofed extensions.
- End-to-end lifecycle progression (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `NEEDS_CLARIFICATION` → `RESUBMITTED` → `PRELIMINARY_REVIEW_COMPLETE`).
- Audit event generation.

### Run Frontend Typecheck & Production Build
```bash
cd frontend
npm run build
```
Executes `tsc` and Vite production bundling with 0 warnings/errors.

---

## 9. Demonstration Workflow

1. Open `http://localhost:5173`.
2. Notice the government header and amber demo disclaimer.
3. Select **Institution Portal (Demo)** to view *Northstar Institute of Technology* (`NIT-DEMO-01`).
4. Inspect case `VERITAS-2026-0001` in `NEEDS_CLARIFICATION` state; view the deficiency query regarding the Land Lease Deed.
5. Click **Write Clarification Response**, submit an explanation, and observe the status transition to `RESUBMITTED`.
6. Click **New Application** to create an EoA application, upload a sample document, and submit it.
7. Switch to **Reviewer Portal (Demo)** using the header toggle.
8. Filter cases, inspect document metadata and SHA-256 hashes, mark the case under review, add observations, and record the preliminary scrutiny outcome.
9. Verify the updated status and the complete immutable **Audit Event Log**.

*To reset the database with fresh synthetic cases at any point, click **Reset Demo Data** in the top warning banner.*

---

## 10. Security Notes

- **Input Validation:** Strict Pydantic models validate all incoming request bodies and form fields.
- **Server-Side Authorization:** Hiding buttons in the UI is not treated as security. Every API endpoint enforces role checks on the server.
- **Private File Storage:** Uploaded files are renamed with UUIDs and stored in `backend/data/storage/` outside the web root. Download routes require authentication.
- **Zero Sensitive Data in Git:** `.gitignore` excludes all databases (`*.db`), storage folders (`data/storage/`), environment files (`.env`), and node packages.
