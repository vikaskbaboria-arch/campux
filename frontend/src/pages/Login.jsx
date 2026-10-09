import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getFriendlyErrorMessage } from '../utils/userFeedback';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('Enter your username or email.', 'error');
      return;
    }
    if (!password) {
      showToast('Enter your password.', 'error');
      return;
    }

    try {
      setLoading(true);
      await login({ identifier, password });
      showToast('Welcome back!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      showToast(getFriendlyErrorMessage(err, 'Could not sign in. Check your details and try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 w-full">
      <div className="w-full max-w-md">
        {/* Container with stealth dark styling */}
        <div className="rounded-3xl bg-[#0f1013] border border-white/[0.08] p-8 sm:p-10 shadow-2xl relative">
          {/* Subtle top pill accent */}
          <div className="flex justify-center mb-6">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 bg-zinc-900/80 px-3.5 py-1 rounded-full border border-white/5">
              Authentication
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2">
              Sign in with your email or username
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. john@university.edu or johndoe"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-8 text-center text-xs text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-white hover:underline font-medium ml-1 transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
