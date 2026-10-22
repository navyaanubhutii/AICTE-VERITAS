# AICTE Veritas — Architecture Document (Stage 1 Foundation)

## 1. Problem Statement Alignment

**SIH Problem Statement 26261:** *“AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification.”*

Technical institutions in India submit complex regulatory applications (such as Extension of Approval — EoA, Increase in Intake, or New Institution Establishment) to the All India Council for Technical Education (AICTE). These applications require extensive supporting evidence: registered land title deeds, previous year approval letters, faculty cadre and salary disbursement statements, and municipal fire safety occupancy certificates.

Reviewing these thousands of voluminous applications manually is time-consuming and prone to human oversight.

**AICTE Veritas** is designed as a secure, human-in-the-loop regulatory copilot. Rather than replacing statutory committee decisions or attempting fully autonomous approval/rejection, AICTE Veritas assists regulatory officers by:
1. Validating document structures and cryptographic integrity (SHA-256 fingerprints and genuine magic-byte signatures).
2. Enforcing a strict, auditable institutional application lifecycle.
3. Providing a bidirectional clarification loop between institutions and council scrutiny officers.
4. Logging an immutable audit trail of every intake, upload, and reviewer observation.

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["Presentation Layer (Vite + React + TypeScript + Tailwind)"]
        IP["Institution Portal\n• Case Intake & Checklist\n• Secure Upload (PDF/PNG/JPEG)\n• Clarification Response Desk"]
        RP["Reviewer Portal\n• Unified Scrutiny Queue\n• Cryptographic Hash Inspection\n• Clarification Issuance\n• Preliminary Human Observations"]
    end

    subgraph Gateway["API & Security Boundary (FastAPI)"]
        AUTH["Role & Scope Security Dependency\n(X-Demo-Role, X-Demo-Institution-Ref)"]
        ROUTERS["API v1 Routers\n(/cases, /documents, /clarifications, /observations, /demo)"]
    end

    subgraph CoreServices["Domain Services Layer"]
        LIFECYCLE["Lifecycle State Machine\n(Transition Rules & Validation)"]
        STORAGE["Secure Storage Service\n(Magic Bytes, SHA-256, Isolated Filenames)"]
        AUDIT["Audit Service\n(Immutable Event Logging)"]
    end

    subgraph Persistence["Storage & Persistence Layer"]
        DB[(SQLite / PostgreSQL Schema\nCases, Documents, Clarifications, Observations, Audits)]
        LOCAL_STORAGE[("Private Local Storage\n(data/storage/ - Non-Public Files)")]
    end

    IP --> AUTH
    RP --> AUTH
    AUTH --> ROUTERS
    ROUTERS --> LIFECYCLE
    ROUTERS --> STORAGE
    ROUTERS --> AUDIT
    LIFECYCLE --> DB
    AUDIT --> DB
    STORAGE --> DB
    STORAGE --> LOCAL_STORAGE
```

---

## 3. Application Lifecycle State Machine

AICTE Veritas enforces explicit, validated server-side state transitions. Institutions cannot alter reviewer fields or bypass review; reviewers cannot tamper with original institutional document contents.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Institution Creates Case
    DRAFT --> SUBMITTED : Institution Submits (>=1 active document)
    SUBMITTED --> UNDER_REVIEW : Reviewer Marks Under Review
    UNDER_REVIEW --> NEEDS_CLARIFICATION : Reviewer Issues Clarification Notice
    NEEDS_CLARIFICATION --> RESUBMITTED : Institution Responds & annexes docs
    RESUBMITTED --> UNDER_REVIEW : Reviewer Resumes Scrutiny
    UNDER_REVIEW --> PRELIMINARY_REVIEW_COMPLETE : Reviewer Records Preliminary Outcome
    PRELIMINARY_REVIEW_COMPLETE --> [*]
```

### Transition Authority Matrix

| From State | To State | Authorized Role | Preconditions / Side Effects |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `SUBMITTED` | `institution` | Requires at least 1 active supporting document uploaded. |
| `SUBMITTED` | `UNDER_REVIEW` | `reviewer` | Case locked from institutional edits. Audit event logged. |
| `UNDER_REVIEW` | `NEEDS_CLARIFICATION`| `reviewer` | Reviewer supplies deficiency description. Clarification created with `OPEN` status. |
| `NEEDS_CLARIFICATION`| `RESUBMITTED` | `institution` | Institution submits explanation and may upload revised document versions. |
| `RESUBMITTED` | `UNDER_REVIEW` | `reviewer` | Reviewer acknowledges response and resumes scrutiny. |
| `UNDER_REVIEW` | `PRELIMINARY_REVIEW_COMPLETE` | `reviewer` | Reviewer records preliminary scrutiny findings and notes. |

---

## 4. Data Model and Entity Relationships

```mermaid
erDiagram
    APPLICATION_CASE ||--o{ APPLICATION_DOCUMENT : "contains"
    APPLICATION_CASE ||--o{ CLARIFICATION_REQUEST : "has"
    APPLICATION_CASE ||--o{ REVIEW_OBSERVATION : "records"
    APPLICATION_CASE ||--o{ AUDIT_EVENT : "logs"

    APPLICATION_CASE {
        string id PK
        string case_ref UK
        string institution_name
        string institution_ref
        string category
        string academic_year
        string program_type
        string campus_location
        string contact_email
        string contact_phone
        enum status
        datetime created_at
        datetime updated_at
        datetime submitted_at
        datetime reviewed_at
    }

    APPLICATION_DOCUMENT {
        string id PK
        string case_id FK
        enum doc_type
        string title
        string original_filename
        string stored_filename
        string mime_type
        int file_size_bytes
        string sha256_hash
        int version
        bool is_active
        enum processing_status
        string uploaded_by_role
        string uploaded_by_name
        datetime created_at
    }

    CLARIFICATION_REQUEST {
        string id PK
        string case_id FK
        string reviewer_name
        datetime requested_at
        string request_message
        string target_doc_type
        enum status
        string response_message
        datetime responded_at
        string responded_by
    }

    REVIEW_OBSERVATION {
        string id PK
        string case_id FK
        string reviewer_name
        enum category
        enum severity
        string notes
        datetime created_at
    }

    AUDIT_EVENT {
        string id PK
        string case_id FK
        enum actor_role
        string actor_name
        string action
        string details
        datetime created_at
    }
```

---

## 5. Security & Trust Architecture

1. **Server-Side Access Isolation:** Every protected API route enforces role validation via FastAPI dependency injection. Institution representatives can access only application cases mapped to their registered institution ID (`institution_ref`). Attempted cross-access triggers `403 Forbidden`.
2. **File Signature & Magic-Byte Verification:** Uploaded files are inspected for authentic binary signatures (`%PDF` for PDF, `\x89PNG\r\n\x1a\n` for PNG, and `\xff\xd8\xff` for JPEG). Renaming an `.exe` or `.txt` to `.pdf` is immediately blocked with `400 Bad Request`.
3. **Isolated Private Storage:** Uploaded files are assigned cryptographic UUID filenames (`[uuid4].[ext]`) and saved in a dedicated local private folder (`backend/data/storage/`), completely isolated from the web root. No public URLs exist; access requires authorized backend streaming routes (`/download`).
4. **Cryptographic SHA-256 Hashing:** The backend computes a SHA-256 digest on every uploaded document stream. Identical document hashes across multiple institutions trigger a duplicate warning signal for reviewers.
5. **Separation of Concerns:** In Stage 1, demo roles are clearly isolated behind a clean authentication provider dependency (`get_current_actor`), ready to be replaced with OAuth2/JWT or DigiLocker institutional single sign-on in production.

---

## 6. Roadmap: Evolution to Future Stages

| Component | Stage 1 (Delivered Foundation) | Stage 2 (Planned Next Steps) |
| :--- | :--- | :--- |
| **Document Intake** | Magic bytes, SHA-256 hash, size validation, versioning | PDF multi-page text extraction and Tesseract OCR fallback |
| **Validation** | Format integrity, required checklist completeness | Cross-document field comparison (e.g. Survey No. in deed vs EoA) |
| **Rules Engine** | Server-side lifecycle state machine transitions | Versioned regulatory compliance rules (APH 2026-27 ruleset) |
| **Verification** | Cryptographic fingerprinting & duplicate detection | Issuing authority connectors (DigiLocker, State Fire Dept APIs) |
| **Reviewer Assist** | Preliminary observations & clarification desk | Evidence-linked discrepancy snippets & advisory findings |
| **Authentication** | Demo role simulation with server-side enforcement | AICTE Single Sign-On (SSO) / OAuth2 / PKI digital signatures |
