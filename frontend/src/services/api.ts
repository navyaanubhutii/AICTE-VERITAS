import {
  ApplicationCaseSummary,
  ApplicationCaseDetail,
  ApplicationDocument,
  ClarificationRequest,
  ReviewObservation,
  UserSession,
} from '../types';

const API_BASE = '/api/v1';

// Default Demo session if none saved
const DEFAULT_SESSION: UserSession = {
  role: 'institution',
  institutionRef: 'NIT-DEMO-01',
  institutionName: 'Northstar Institute of Technology',
  userName: 'Dr. R. Sharma (Principal)',
};

export const getStoredSession = (): UserSession => {
  try {
    const raw = localStorage.getItem('aicte_demo_session');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse demo session', e);
  }
  return DEFAULT_SESSION;
};

export const setStoredSession = (session: UserSession): void => {
  localStorage.setItem('aicte_demo_session', JSON.stringify(session));
};

const getHeaders = (session: UserSession, isFormData = false): HeadersInit => {
  const headers: Record<string, string> = {
    'X-Demo-Role': session.role,
    'X-Demo-Institution-Ref': session.institutionRef,
    'X-Demo-User-Name': session.userName,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; demo_mode: boolean; version: string }>(res);
  },

  async getCases(session: UserSession, params?: { status?: string; search?: string }): Promise<ApplicationCaseSummary[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const url = `${API_BASE}/cases${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getHeaders(session),
    });
    return handleResponse<ApplicationCaseSummary[]>(res);
  },

  async getCase(caseId: string, session: UserSession): Promise<ApplicationCaseDetail> {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, {
      headers: getHeaders(session),
    });
    return handleResponse<ApplicationCaseDetail>(res);
  },

  async createCase(
    payload: {
      institution_name: string;
      institution_ref: string;
      category: string;
      academic_year: string;
      program_type: string;
      campus_location?: string;
      contact_email: string;
      contact_phone: string;
    },
    session: UserSession
  ): Promise<ApplicationCaseDetail> {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: getHeaders(session),
      body: JSON.stringify(payload),
    });
    return handleResponse<ApplicationCaseDetail>(res);
  },

  async submitCase(caseId: string, session: UserSession): Promise<ApplicationCaseDetail> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/submit`, {
      method: 'POST',
      headers: getHeaders(session),
    });
    return handleResponse<ApplicationCaseDetail>(res);
  },

  async uploadDocument(
    caseId: string,
    file: File,
    docType: string,
    title?: string,
    session?: UserSession
  ): Promise<ApplicationDocument> {
    const sess = session || getStoredSession();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/cases/${caseId}/documents`, {
      method: 'POST',
      headers: getHeaders(sess, true),
      body: formData,
    });
    return handleResponse<ApplicationDocument>(res);
  },

  getDocumentDownloadUrl(caseId: string, documentId: string, session: UserSession): string {
    return `${API_BASE}/cases/${caseId}/documents/${documentId}/download?role=${session.role}&institution_ref=${encodeURIComponent(session.institutionRef)}&user_name=${encodeURIComponent(session.userName)}`;
  },

  async markUnderReview(caseId: string, session: UserSession): Promise<ApplicationCaseDetail> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/mark-under-review`, {
      method: 'POST',
      headers: getHeaders(session),
    });
    return handleResponse<ApplicationCaseDetail>(res);
  },

  async requestClarification(
    caseId: string,
    payload: { request_message: string; target_doc_type?: string },
    session: UserSession
  ): Promise<ClarificationRequest> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/clarifications`, {
      method: 'POST',
      headers: getHeaders(session),
      body: JSON.stringify(payload),
    });
    return handleResponse<ClarificationRequest>(res);
  },

  async respondToClarification(
    caseId: string,
    clarificationId: string,
    responseMessage: string,
    session: UserSession
  ): Promise<ClarificationRequest> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/clarifications/${clarificationId}/respond`, {
      method: 'POST',
      headers: getHeaders(session),
      body: JSON.stringify({ response_message: responseMessage }),
    });
    return handleResponse<ClarificationRequest>(res);
  },

  async addObservation(
    caseId: string,
    payload: { category: string; severity: string; notes: string },
    session: UserSession
  ): Promise<ReviewObservation> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/observations`, {
      method: 'POST',
      headers: getHeaders(session),
      body: JSON.stringify(payload),
    });
    return handleResponse<ReviewObservation>(res);
  },

  async recordReviewOutcome(
    caseId: string,
    outcomeStatus: string,
    notes: string,
    session: UserSession
  ): Promise<ApplicationCaseDetail> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/review-outcome`, {
      method: 'POST',
      headers: getHeaders(session),
      body: JSON.stringify({ outcome_status: outcomeStatus, observation_notes: notes }),
    });
    return handleResponse<ApplicationCaseDetail>(res);
  },

  async resetDemoData(): Promise<{ status: string; message: string; case_count: number }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ status: string; message: string; case_count: number }>(res);
  },
};
