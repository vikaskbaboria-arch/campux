import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { isAuthenticated, user } = useAuth();
  const collegeId = typeof user?.college === 'object' ? user?.college?._id : user?.college;

  return (
    <footer className="mt-auto w-full border-t border-white/[0.08] bg-black text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Mini Tagline */}
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                <span className="font-mono text-xs font-bold tracking-tighter text-white">CX</span>
              </div>
              <span className="font-extrabold text-sm tracking-[0.18em] uppercase text-white">
                CAMPUX
              </span>
            </Link>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Campus peer-to-peer commerce
            </span>
          </div>

          {/* Inline Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs">
            <Link to="/" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hover:text-white transition-colors">
                  Profile
                </Link>
                <Link to="/offers" className="hover:text-white transition-colors">
                  Offers
                </Link>
                {collegeId && (
                  <Link to={`/college/${collegeId}`} className="hover:text-white transition-colors">
                    Campus Hub
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Credits & Copyright */}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>© {new Date().getFullYear()} CAMPUX</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
              <span>By students</span>
              <Heart className="w-3 h-3 text-red-400 fill-red-400" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
