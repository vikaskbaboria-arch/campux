import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getFriendlyErrorMessage } from '../utils/userFeedback';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, username, email, password, confirmPassword } = formData;

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      showToast('Complete all required fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Use a password with at least 6 characters.', 'error');
      return;
    }

    try {
      setLoading(true);
      await register({
        name,
        username,
        email,
        password,
      });

      // Attempt automatic sign in with new credentials
      try {
        await login({ identifier: username, password });
        showToast('Account created. Welcome to CAMPUX!', 'success');
        navigate('/profile');
      } catch {
        // Fallback to login redirect
        showToast('Account created. Please sign in to continue.', 'success');
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showToast(getFriendlyErrorMessage(err, 'Could not create your account. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 w-full">
      <div className="w-full max-w-md">
        {/* Stealth dark card */}
        <div className="rounded-3xl bg-[#0f1013] border border-white/[0.08] p-8 sm:p-10 shadow-2xl relative">
          {/* Subtle top indicator */}
          <div className="flex justify-center mb-6">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 bg-zinc-900/80 px-3.5 py-1 rounded-full border border-white/5">
              Registration
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Create an account
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2">
              Join the student network on CAMPUX
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Johnson"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. alexj"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. alex@university.edu"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
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

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-6 rounded-full bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 text-center text-xs text-zinc-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-white hover:underline font-medium ml-1 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
