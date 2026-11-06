import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-teal-400 shadow-md mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">404</h1>
      <h2 className="mt-2 text-lg font-semibold text-slate-700">Page Not Found</h2>
      <p className="mt-1 max-w-sm text-xs text-slate-500">
        The requested campus route or resource does not exist in the CAMPUS MEMORY directory.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button leftIcon={<Home className="h-4 w-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

