import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { extractErrorMessage } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: trimmedEmail, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to sign in. Please verify your credentials.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/90 p-4 relative">
      {/* Top Academic Accent Banner */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-navy-950 via-navy-800 to-gold-500 z-10" />

      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* University Header & Insignia */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy-950 text-gold-400 border-2 border-gold-500/30 shadow-xs mb-3">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold-700">
            University Security Portal
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-950 mt-0.5">
            CAMPUS MEMORY
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Institutional Incident Intelligence & Provenance Repository
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6">
            <Alert
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-1.5">
              University Email / Identity
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@campus.edu"
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900">
                Security Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-10 text-sm placeholder:text-slate-400 focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-navy-900"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-3 py-2.5 text-sm"
            size="lg"
            isLoading={isLoading}
          >
            Authenticate Session
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Need an authorized account?{' '}
            <Link
              to="/signup"
              className="font-bold text-navy-900 hover:text-navy-700 underline-offset-4 hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>

        {/* Security Compliance Footer */}
        <div className="mt-4 rounded-md bg-slate-50 border border-slate-200/80 p-2.5 text-center">
          <p className="text-[10px] text-slate-500 leading-normal">
            Authorized Personnel Only • Immutable Audit Trails Active
          </p>
        </div>
      </div>
    </div>
  );
};

