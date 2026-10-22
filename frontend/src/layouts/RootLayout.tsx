import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Shield, ExternalLink, HelpCircle } from 'lucide-react';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-300">AICTE Veritas</span>
            <span>• SIH26261 Demonstration Platform</span>
          </div>
          <p className="text-center md:text-left text-slate-400">
            For demonstration and preliminary review support only. Does not replace statutory AICTE inspections or council determinations.
          </p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Stage 1: Verified Full-Stack Slice</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
