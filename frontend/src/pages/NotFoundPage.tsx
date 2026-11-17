import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/70 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-navy-950 text-gold-400 shadow-md ring-1 ring-gold-500/30 mb-5">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div className="text-xs font-bold uppercase tracking-widest text-navy-900 mb-1">
        CAMPUS MEMORY • REGISTRY EXCEPTION
      </div>
      <h1 className="text-5xl font-serif font-bold tracking-tight text-navy-950">404</h1>
      <h2 className="mt-2 text-base font-bold text-slate-800">Resource Not Registered in Master Docket</h2>
      <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
        The requested routing path or dossier identifier does not exist within the institutional memory index.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button leftIcon={<Home className="h-4 w-4" />}>
            Return to Incident Command
          </Button>
        </Link>
      </div>
      <div className="mt-12 text-[11px] font-mono text-slate-400 uppercase tracking-widest">
        Institutional Record System • Campus Provenance Engine
      </div>
    </div>
  );
};

