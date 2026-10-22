# AICTE Veritas — Stage 1 Demonstration Guide

This guide walks an evaluator or teammate through the complete Stage 1 end-to-end workflow of **AICTE Veritas** for SIH Problem Statement 26261.

---

## 1. Quick Service Startup

Ensure both backend and frontend are running:

### Terminal 1: Backend
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
Backend will start at: `http://localhost:8000`  
Swagger API Docs: `http://localhost:8000/docs`

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```
Frontend will start at: `http://localhost:5173`

---

## 2. Seeded Synthetic Demo Data

The platform automatically initializes a clean synthetic dataset on startup:

| Institution | Demo Code | Case Reference | Initial Status | Context |
| :--- | :--- | :--- | :--- | :--- |
| **Northstar Institute of Technology** | `NIT-DEMO-01` | `VERITAS-2026-0001` | `NEEDS_CLARIFICATION` | Land Deed missing sub-registrar endorsement seal. Open query issued. |
| **Apex Academy of Engineering & Tech** | `AAET-DEMO-02` | `VERITAS-2026-0002` | `SUBMITTED` | 2 active documents uploaded. Awaiting initial scrutiny. |
| **Vanguard Polytechnic College** | `VPC-DEMO-03` | `VERITAS-2026-0003` | `DRAFT` | Fresh intake. Needs document uploads before submission. |
| **Horizon Institute of Technology** | `HIT-DEMO-04` | `VERITAS-2026-0004` | `PRELIMINARY_REVIEW_COMPLETE` | Scrutiny completed with baseline validation remarks. |

*You can reset the database at any moment by clicking **Reset Demo Data** in the top warning banner.*

---

## 3. Step-by-Step Demonstration Workflow

### Step 1: Entry & Role Selection
1. Open your browser to `http://localhost:5173`.
2. Notice the government-styled header with the amber disclaimer banner:
   > *"SIH26261 PROTOTYPE DEMONSTRATION ENVIRONMENT • SYNTHETIC INSTITUTIONAL DATA ONLY"*
3. The landing page displays two dedicated portals:
   - **Institution Portal (Demo)** — Technical institution applicant.
   - **AICTE Reviewer Portal (Demo)** — Council regulatory reviewer.
4. Click **Enter Institution Portal (Demo)**.

---

### Step 2: Institution Portal Experience
1. You arrive at the **Institution Dashboard** for *Northstar Institute of Technology* (`NIT-DEMO-01`).
2. Notice the high-level metrics:
   - Total Applications: 1
   - Under Review: 0
   - Requiring Action: 1
   - Completed: 0
3. In the application table, click **Manage** next to `VERITAS-2026-0001`.
4. In the case details page, observe:
   - **Prominent Amber Deficiency Notice:**
     > *"The registered land lease deed document appears to be missing the sub-registrar endorsement seal on page 4..."*
   - **Checklist of Mandatory Documents:** Land deed, Previous EoA letter, and Faculty salary statement already present with SHA-256 digests.
   - Click **View/Download** on any document to verify that the file opens directly from the secure backend stream.
5. Click **Write Clarification Response**:
   - Enter response: *"Attested revenue copy with sub-registrar seal on survey numbers 42/1 & 42/2 has been annexed."*
   - Click **Submit Clarification**.
6. The status immediately updates to **`RESUBMITTED`** and an immutable audit event is appended to the timeline!

---

### Step 3: Create a Fresh Application Case
1. Return to the dashboard and click **New Application**.
2. Fill in the form:
   - Institution Name: *Northstar Institute of Technology*
   - Permanent Demo ID: `NIT-DEMO-01`
   - Category: *Extension of Approval (EoA)*
   - Academic Year: *2026-2027*
   - Campus Location: *Electronic City, Bengaluru*
   - Email: *principal@northstar-tech.edu.in*
   - Phone: *+91-80-2852-0199*
3. Click **Create Draft Case**.
4. The system generates a unique case reference (e.g., `VERITAS-2026-XXXX`) in **`DRAFT`** status.
5. Notice that clicking **Submit Application** right now is blocked with an alert: *Please upload at least one required supporting document before submitting.*
6. In the checklist, click **Upload Document** on *Land & Building Registered Title*:
   - Select any sample PDF, PNG, or JPG file from your local machine.
   - Click **Upload Document**.
   - The file is verified via magic bytes, hashed with SHA-256, and marked `ACTIVE (v1)`.
7. Now click **Submit Application** and confirm.
8. The case transitions to **`SUBMITTED`**!

---

### Step 4: AICTE Reviewer Portal Experience
1. In the top navigation bar, toggle the role pill from **Institution Demo** to **Reviewer Demo**.
2. You are navigated to the **Reviewer Scrutiny Desk**.
3. Notice:
   - Reviewer identity: *S. Sengupta (AICTE Senior Reviewer)*.
   - The queue displays all applications across all institutions (`NIT-DEMO-01`, `AAET-DEMO-02`, etc.).
   - Use the status tabs to switch between *All Cases*, *Awaiting Scrutiny*, *Clarifications*, and *Completed*.
4. Open the case you resubmitted in Step 2 (`VERITAS-2026-0001`):
   - Notice the updated status is **`RESUBMITTED`**.
   - Inspect the **Clarification Notices & Responses** log to read the institution's response.
5. Click **Mark Under Review** in the top action bar:
   - Status changes to **`UNDER_REVIEW`**.
6. Click **Add Observation**:
   - Category: `DOCUMENTATION`
   - Severity: `INFO`
   - Notes: *"Revenue seal verified against survey numbers. Clear title confirmed."*
   - Click **Save Observation**.
7. Click **Record Review Outcome**:
   - Select determination: `Preliminary Review Complete`.
   - Remarks: *"Mandatory documents structurally validated for 2026-27 EoA."*
   - Click **Submit Outcome**.
8. Status transitions to **`PRELIMINARY_REVIEW_COMPLETE`**!

---

### Step 5: Verification of Updated State & Audit Trail
1. Switch back to **Institution Demo** using the role toggle.
2. In the Institution Dashboard, observe that `VERITAS-2026-0001` now displays the green badge: **`Preliminary Review Complete`**.
3. Open the case detail and scroll to the **Application Lifecycle Audit Events** section.
4. Verify the complete chronological audit trail:
   - `CASE_CREATED` (Institution)
   - `DOCUMENT_UPLOADED` (Institution)
   - `CASE_SUBMITTED` (Institution)
   - `REVIEW_STARTED` (Reviewer)
   - `CLARIFICATION_REQUESTED` (Reviewer)
   - `CLARIFICATION_RESPONDED` (Institution)
   - `REVIEW_STARTED` (Reviewer)
   - `OBSERVATION_RECORDED` (Reviewer)
   - `PRELIMINARY_REVIEW_COMPLETED` (Reviewer)

---

## 4. Resetting the Environment

To reset the demonstration environment to its clean initial state at any time:
1. Click the **Reset Demo Data** button in the top amber header.
2. Confirm the prompt.
3. The backend database and storage will be reseeded with fresh synthetic cases.
