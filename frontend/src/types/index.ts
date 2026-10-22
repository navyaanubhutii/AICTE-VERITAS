export type CaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_CLARIFICATION'
  | 'RESUBMITTED'
  | 'PRELIMINARY_REVIEW_COMPLETE';

export type DocumentType =
  | 'LAND_BUILDING_DEED'
  | 'PREVIOUS_EOA_LETTER'
  | 'FACULTY_SALARY_STATEMENT'
  | 'FIRE_SAFETY_CERTIFICATE'
  | 'OTHER_SUPPORTING';

export type DocumentProcessingStatus = 'UPLOADED' | 'VERIFIED_MIME' | 'FLAGGED';

export type ClarificationStatus = 'OPEN' | 'RESPONDED' | 'RESOLVED';

export type ObservationCategory =
  | 'DOCUMENTATION'
  | 'REGULATORY_AFFILIATION'
  | 'FACULTY_CADRE'
  | 'INFRASTRUCTURE'
  | 'GENERAL';

export type ObservationSeverity = 'INFO' | 'WARNING' | 'DEFICIENCY';

export interface ApplicationDocument {
  id: string;
  case_id: string;
  doc_type: DocumentType;
  title: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  version: number;
  is_active: boolean;
  processing_status: DocumentProcessingStatus;
  uploaded_by_role: string;
  uploaded_by_name: string;
  created_at: string;
}

export interface ClarificationRequest {
  id: string;
  case_id: string;
  reviewer_name: string;
  requested_at: string;
  request_message: string;
  target_doc_type?: string | null;
  status: ClarificationStatus;
  response_message?: string | null;
  responded_at?: string | null;
  responded_by?: string | null;
}

export interface ReviewObservation {
  id: string;
  case_id: string;
  reviewer_name: string;
  category: ObservationCategory;
  severity: ObservationSeverity;
  notes: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  case_id: string;
  actor_role: 'INSTITUTION' | 'REVIEWER' | 'SYSTEM';
  actor_name: string;
  action: string;
  details?: string | null;
  created_at: string;
}

export interface ApplicationCaseSummary {
  id: string;
  case_ref: string;
  institution_name: string;
  institution_ref: string;
  category: string;
  academic_year: string;
  program_type: string;
  campus_location?: string | null;
  contact_email: string;
  contact_phone: string;
  status: CaseStatus;
  document_count: number;
  open_clarifications_count: number;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}

export interface ApplicationCaseDetail {
  id: string;
  case_ref: string;
  institution_name: string;
  institution_ref: string;
  category: string;
  academic_year: string;
  program_type: string;
  campus_location?: string | null;
  contact_email: string;
  contact_phone: string;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  documents: ApplicationDocument[];
  clarifications: ClarificationRequest[];
  observations: ReviewObservation[];
  audit_events: AuditEvent[];
}

export type DemoRole = 'institution' | 'reviewer';

export interface UserSession {
  role: DemoRole;
  institutionRef: string;
  institutionName: string;
  userName: string;
}
