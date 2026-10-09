import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Heart, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { isAuthenticated, user } = useAuth();
  const collegeId = typeof user?.college === 'object' ? user?.college?._id : user?.college;

  return (
    <footer className="mt-auto w-full border-t border-white/[0.08] bg-black text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 pb-5 border-b border-white/[0.06]">
          {/* Brand & Mission */}
          <div className="md:col-span-6 lg:col-span-5 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                <span className="font-mono text-sm font-bold tracking-tighter text-white">CX</span>
              </div>
              <span className="font-extrabold text-base tracking-[0.2em] uppercase text-white">
                CAMPUX
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-sm leading-relaxed">
              The peer-to-peer campus marketplace built exclusively for college students. Buy, sell, and trade textbooks, electronics, and dorm gear right on campus.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[11px] text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Students
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[11px] text-zinc-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Zero Commission
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 lg:col-span-3 space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              Platform
            </p>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Explore Marketplace
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/profile" className="hover:text-white transition-colors">
                      My Student Profile
                    </Link>
                  </li>
                  {collegeId && (
                    <li>
                      <Link to={`/college/${collegeId}`} className="hover:text-white transition-colors">
                        My Campus Hub
                      </Link>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Register College Account
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-white transition-colors">
                      Student Sign In
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Guidelines & Safety */}
          <div className="md:col-span-3 lg:col-span-4 space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              Campus Safety
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Always meet in high-traffic campus zones like the library, student union, or college cafeteria for product handoffs and inspections.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Campus Network
              </span>
            </div>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} CAMPUX. Peer-to-Peer College Commerce.
          </p>
          <p className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
            <span>Built for students, by students</span>
            <Heart className="w-3 h-3 text-red-400 fill-red-400" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
