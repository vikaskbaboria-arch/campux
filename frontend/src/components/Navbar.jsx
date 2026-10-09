import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ArrowRight, Menu, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    showToast('You have been signed out.', 'success');
    navigate('/login');
  };

  const isActive = (path) => path === '/messages'
    ? location.pathname.startsWith('/messages')
    : location.pathname === path;

  // Let the Blyss landing page display its own integrated hero navigation when not authenticated
  if (location.pathname === '/' && !isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
            <span className="font-mono text-sm font-bold tracking-tighter text-white">CX</span>
          </div>
          <span className="font-extrabold text-base tracking-[0.2em] uppercase text-white">
            CAMPUX
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-xs tracking-wider uppercase transition-colors ${
              isActive('/') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Home
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/profile"
                className={`text-xs tracking-wider uppercase transition-colors ${
                  isActive('/profile') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Profile
              </Link>
              <Link
                to="/offers"
                className={`text-xs tracking-wider uppercase transition-colors ${
                  isActive('/offers') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Offers
              </Link>
              <Link
                to="/messages"
                className={`text-xs tracking-wider uppercase transition-colors ${
                  isActive('/messages') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Messages
              </Link>
            </>
          )}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 hover:border-white/25 transition-all text-xs text-zinc-300 hover:text-white"
              >
                <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] text-white font-medium overflow-hidden shrink-0">
                  {user?.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user?.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{user?.username || 'User'}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent hover:border-white/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className={`text-xs uppercase tracking-wider font-medium px-4 py-2 rounded-full transition-colors ${
                  isActive('/login')
                    ? 'text-white bg-zinc-900 border border-white/15'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-sm"
              >
                Register
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          <ThemeToggle showLabel={false} />

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/5 transition-colors cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay covering the rest of the screen */}
          <div
            className="fixed inset-0 top-16 bg-black/75 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Floating dropdown menu overlay */}
          <div className="absolute top-full left-0 right-0 z-50 md:hidden border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl px-5 py-5 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors ${
                isActive('/') ? 'bg-zinc-900 text-white border border-white/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors ${
                    isActive('/profile') ? 'bg-zinc-900 text-white border border-white/10' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  My Profile
                </Link>
                <Link
                  to="/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors ${
                    isActive('/offers') ? 'bg-zinc-900 text-white border border-white/10' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Offers
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors ${
                    isActive('/messages') ? 'bg-zinc-900 text-white border border-white/10' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Messages
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-red-400 hover:bg-red-950/20 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Sign Out</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2 border-t border-white/5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-zinc-900 text-zinc-200 text-xs uppercase tracking-wider font-semibold hover:bg-zinc-800 transition-colors border border-white/10"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-zinc-200 transition-colors shadow-md"
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
