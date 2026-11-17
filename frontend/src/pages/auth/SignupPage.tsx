import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { extractErrorMessage } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ required: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = displayName.trim();
    const mail = email.trim();

    if (!name) {
      setErrorMessage('Full name / display name is required.');
      return;
    }
    if (!mail) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup({
        display_name: name,
        email: mail,
        password,
        role_code: 'event_reporter',
      });

      if (res.email_confirmation_required) {
        setSuccessInfo({
          required: true,
          message: res.message || 'Please check your email to confirm your account before logging in.',
        });
      } else {
        // Automatically logged in and session saved
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Registration failed. Please check the provided information.');
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
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy-950 text-gold-400 border-2 border-gold-500/30 shadow-xs mb-3">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold-700">
            University Personnel Registration
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-950 mt-0.5">
            Create System Account
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Register as an Authorized Campus Incident Reporter
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

        {successInfo ? (
          <div className="mt-6 space-y-4">
            <Alert
              type="success"
              title="Registration Successful"
              message={successInfo.message}
            />
            <Button
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-1.5">
                Full Name / Official Display Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Officer Jane Doe"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-1.5">
                Official University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jdoe@campus.edu"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-1.5">
                Password (min. 8 characters)
              </label>
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-navy-700 focus:outline-none focus:ring-1 focus:ring-navy-700 transition-colors"
                />
              </div>
            </div>

            <div className="rounded-md bg-navy-50/70 p-3 text-[11px] text-navy-950 border border-navy-200/80">
              <span className="font-bold text-navy-950">Institutional role: </span>
              Standard onboarding grants the <code className="font-mono font-semibold text-navy-800">event_reporter</code> role. Advanced investigator and administrative scopes are granted by the Campus Safety Directorate.
            </div>

            <Button
              type="submit"
              className="w-full mt-3 py-2.5 text-sm"
              size="lg"
              isLoading={isLoading}
            >
              Complete Registration
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Already have an authorized account?{' '}
            <Link
              to="/login"
              className="font-bold text-navy-900 hover:text-navy-700 underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

