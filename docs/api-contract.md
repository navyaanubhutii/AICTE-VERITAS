# AICTE Veritas — API Contract (Stage 1)

Base URL: `http://localhost:8000/api/v1`

All responses are formatted in JSON (`application/json`), except file download endpoints which return the original document stream (`application/pdf`, `image/png`, etc.).

---

## 1. Authentication Headers (Stage 1 Demo)

The API enforces server-side role and identity validation via HTTP headers:

| Header | Type | Description |
| :--- | :--- | :--- |
| `X-Demo-Role` | `string` | Required. Allowed values: `institution` or `reviewer`. |
| `X-Demo-Institution-Ref` | `string` | Required when role is `institution` (e.g. `NIT-DEMO-01`). Scopes all data access to this institution. |
| `X-Demo-User-Name` | `string` | Optional human-readable name of the acting user (e.g., `Dr. R. Sharma`). |

*Note for document downloads:* Browsers opening links directly may supply query parameters `?role=...&institution_ref=...` if headers cannot be set in simple anchor tags.

---

## 2. API Endpoints

### 2.1 System & Demo Management

#### `GET /api/v1/health`
Health and readiness probe.
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "AICTE Veritas",
  "version": "1.0.0-stage1",
  "environment": "development",
  "demo_mode": true,
  "database": "sqlite_connected"
}
```

#### `POST /api/v1/demo/reset`
Resets database to clean synthetic demonstration state.
- **Access:** Public / Demo Admin
- **Response `200 OK`:**
```json
{
  "status": "success",
  "message": "Demo database successfully reset with synthetic cases.",
  "case_count": 4,
  "document_count": 6,
  "is_synthetic": true
}
```

#### `GET /api/v1/demo/status`
Returns demo mode status and total synthetic records count.
- **Access:** Public

---

### 2.2 Application Cases

#### `POST /api/v1/cases`
Creates a new application case in `DRAFT` status.
- **Access:** `institution` only.
- **Request Body:**
```json
{
  "institution_name": "Northstar Institute of Technology",
  "institution_ref": "NIT-DEMO-01",
  "category": "Extension of Approval (EoA)",
  "academic_year": "2026-2027",
  "program_type": "Engineering & Technology",
  "campus_location": "Electronic City, Bengaluru, Karnataka",
  "contact_email": "principal@northstar-tech.edu.in",
  "contact_phone": "+91-80-2852-0199"
}
```
- **Response `201 Created`:** Full `CaseDetailResponse` object with generated `case_ref` (e.g. `VERITAS-2026-7814`).

#### `GET /api/v1/cases`
Lists application cases.
- **Access:** Both roles.
  - If `institution`: Automatically filters cases matching the caller's `institution_ref`.
  - If `reviewer`: Returns all cases across all institutions.
- **Query Parameters:**
  - `status` (`string`, optional): Filter by case status (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `NEEDS_CLARIFICATION`, `RESUBMITTED`, `PRELIMINARY_REVIEW_COMPLETE`).
  - `search` (`string`, optional): Case reference or institution name keyword.
- **Response `200 OK`:** Array of `CaseSummaryResponse`.

#### `GET /api/v1/cases/{case_id}`
Retrieves complete case details with documents, clarifications, observations, and audit events.
- **Access:** Both roles (enforces institution ownership).
- **Response `200 OK`:** `CaseDetailResponse`.
- **Response `403 Forbidden`:** If institution tries to access another institution's case.
- **Response `404 Not Found`:** If case does not exist.

#### `POST /api/v1/cases/{case_id}/submit`
Formally submits a `DRAFT` application to AICTE.
- **Access:** `institution` only.
- **Validation:** Must contain at least 1 active uploaded supporting document.
- **Status Change:** `DRAFT` → `SUBMITTED`.
- **Response `200 OK`:** Updated `CaseDetailResponse`.

#### `POST /api/v1/cases/{case_id}/mark-under-review`
Marks a submitted or resubmitted case as actively under scrutiny.
- **Access:** `reviewer` only.
- **Status Change:** `SUBMITTED` or `RESUBMITTED` → `UNDER_REVIEW`.
- **Response `200 OK`:** Updated `CaseDetailResponse`.

#### `POST /api/v1/cases/{case_id}/review-outcome`
Records preliminary review outcome.
- **Access:** `reviewer` only.
- **Request Body:**
```json
{
  "outcome_status": "PRELIMINARY_REVIEW_COMPLETE",
  "observation_notes": "All mandatory documents present and verified for EoA 2026-27."
}
```
- **Status Change:** `UNDER_REVIEW` → `PRELIMINARY_REVIEW_COMPLETE` (or `NEEDS_CLARIFICATION`).
- **Response `200 OK`:** Updated `CaseDetailResponse`.

#### `GET /api/v1/cases/{case_id}/history`
Fetches full chronological audit trail of the case.
- **Access:** Both roles (scoped to authorized cases).
- **Response `200 OK`:** Array of `AuditEventResponse`.

---

### 2.3 Supporting Documents

#### `POST /api/v1/cases/{case_id}/documents`
Uploads a supporting document.
- **Access:** `institution` only.
- **Form Data Parameters:**
  - `file`: Binary file (PDF, PNG, or JPG/JPEG; maximum 10MB).
  - `doc_type`: Enum (`LAND_BUILDING_DEED`, `PREVIOUS_EOA_LETTER`, `FACULTY_SALARY_STATEMENT`, `FIRE_SAFETY_CERTIFICATE`, `OTHER_SUPPORTING`).
  - `title` (`string`, optional): Custom title.
- **Processing Performed:**
  1. Magic-byte signature verification.
  2. SHA-256 calculation and duplicate hash detection.
  3. Versioning (if document of same `doc_type` exists, sets prior version `is_active=False` and increments `version`).
  4. Secure file write to private local directory.
- **Response `201 Created`:** `DocumentResponse`.
- **Response `400 Bad Request`:** Invalid file extension or spoofed magic bytes.

#### `GET /api/v1/cases/{case_id}/documents`
Lists documents for a case.
- **Query Parameters:** `active_only` (`boolean`, optional).
- **Response `200 OK`:** Array of `DocumentResponse`.

#### `GET /api/v1/cases/{case_id}/documents/{document_id}/download`
Streams authorized document content.
- **Access:** Both roles (authorized for the case).
- **Headers Returned:**
  - `Content-Type`: `application/pdf` or `image/png` or `image/jpeg`
  - `Content-Disposition`: `inline; filename="[original_filename]"`
  - `X-Document-SHA256`: Hash digest
  - `X-Document-Version`: Version number
- **Response `200 OK`:** Binary file stream.

---

### 2.4 Clarification Desk

#### `POST /api/v1/cases/{case_id}/clarifications`
Reviewer issues clarification / deficiency notice.
- **Access:** `reviewer` only.
- **Request Body:**
```json
{
  "request_message": "Land lease deed is missing sub-registrar endorsement on page 4.",
  "target_doc_type": "LAND_BUILDING_DEED"
}
```
- **Status Change:** Automatically sets case status to `NEEDS_CLARIFICATION`.
- **Response `201 Created`:** `ClarificationResponse`.

#### `POST /api/v1/cases/{case_id}/clarifications/{clarification_id}/respond`
Institution responds to clarification notice.
- **Access:** `institution` only.
- **Request Body:**
```json
{
  "response_message": "Attested certified copy with sub-registrar revenue seal annexed."
}
```
- **Status Change:** Transitions case status to `RESUBMITTED`. Clarification marked `RESPONDED`.
- **Response `200 OK`:** Updated `ClarificationResponse`.

---

### 2.5 Reviewer Observations

#### `POST /api/v1/cases/{case_id}/observations`
Reviewer records preliminary scrutiny observation.
- **Access:** `reviewer` only.
- **Request Body:**
```json
{
  "category": "DOCUMENTATION",
  "severity": "WARNING",
  "notes": "Fire NOC validity expires on 2026-11-30. Renewal notice recommended."
}
```
- **Response `201 Created`:** `ObservationResponse`.

---

## 3. Error Handling Schema

All errors follow standard RFC 7807-compatible JSON:
```json
{
  "detail": "Descriptive human-readable error explanation."
}
```

HTTP Status Codes used:
- `400 Bad Request`: Input validation failure, spoofed file content, or illegal state transition.
- `401 Unauthorized`: Missing `X-Demo-Role` header or role parameter.
- `403 Forbidden`: Insufficient role privileges or cross-institution access attempt.
- `404 Not Found`: Case or document record not found.
- `422 Unprocessable Entity`: Pydantic field validation error.
- `500 Internal Server Error`: Unhandled server exception.
