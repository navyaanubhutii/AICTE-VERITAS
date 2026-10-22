import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoProvider } from './context/DemoContext';
import { RootLayout } from './layouts/RootLayout';
import { LandingPage } from './pages/LandingPage';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { CreateApplicationPage } from './pages/CreateApplicationPage';
import { InstitutionCaseDetail } from './pages/InstitutionCaseDetail';
import { ReviewerDashboard } from './pages/ReviewerDashboard';
import { ReviewerCaseDetail } from './pages/ReviewerCaseDetail';

export const App: React.FC = () => {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="institution" element={<InstitutionDashboard />} />
            <Route path="institution/new-case" element={<CreateApplicationPage />} />
            <Route path="institution/cases/:id" element={<InstitutionCaseDetail />} />
            <Route path="reviewer" element={<ReviewerDashboard />} />
            <Route path="reviewer/cases/:id" element={<ReviewerCaseDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  );
};

export default App;
