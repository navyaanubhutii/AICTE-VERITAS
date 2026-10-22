import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, DemoRole } from '../types';
import { getStoredSession, setStoredSession, api } from '../services/api';

interface DemoContextType {
  session: UserSession;
  setSession: (session: UserSession) => void;
  switchRole: (role: DemoRole) => void;
  setInstitutionPreset: (instRef: string, instName: string) => void;
  resetDemoData: () => Promise<void>;
  isLoading: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<UserSession>(getStoredSession());
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setStoredSession(session);
  }, [session]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const setSession = (newSession: UserSession) => {
    setSessionState(newSession);
  };

  const switchRole = (role: DemoRole) => {
    if (role === 'reviewer') {
      setSessionState({
        role: 'reviewer',
        institutionRef: '',
        institutionName: 'AICTE National Review Cell',
        userName: 'S. Sengupta (Senior Scrutiny Officer)',
      });
      showToast('Switched to AICTE Reviewer Demonstration Portal');
    } else {
      setSessionState({
        role: 'institution',
        institutionRef: 'NIT-DEMO-01',
        institutionName: 'Northstar Institute of Technology',
        userName: 'Dr. R. Sharma (Principal)',
      });
      showToast('Switched to Institution Demonstration Portal');
    }
  };

  const setInstitutionPreset = (instRef: string, instName: string) => {
    setSessionState((prev) => ({
      ...prev,
      role: 'institution',
      institutionRef: instRef,
      institutionName: instName,
      userName: `Representative (${instRef})`,
    }));
    showToast(`Switched institution to ${instName}`);
  };

  const resetDemoData = async () => {
    setIsLoading(true);
    try {
      const res = await api.resetDemoData();
      showToast(`Demo data reset: ${res.case_count} synthetic cases reloaded.`);
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        session,
        setSession,
        switchRole,
        setInstitutionPreset,
        resetDemoData,
        isLoading,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 animate-slide-up text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-3 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};
