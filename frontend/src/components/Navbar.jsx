import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PanelLeft, ChevronRight, LogOut, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast('You have been signed out.', 'success');
    navigate('/login');
  };

  // Determine dynamic breadcrumbs matching template
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') {
      return { section: 'Campus Hub', current: 'Marketplace Feed' };
    }
    if (path.startsWith('/post/new') || path.startsWith('/create-post')) {
      return { section: 'Marketplace', current: 'Post New Item' };
    }
    if (path.startsWith('/post/') || path.startsWith('/listing/')) {
      return { section: 'Marketplace', current: 'Post Details' };
    }
    if (path.startsWith('/messages')) {
      return { section: 'Activities', current: 'Messages & Chat' };
    }
    if (path.startsWith('/offers')) {
      return { section: 'Activities', current: 'Offers & Negotiations' };
    }
    if (path.startsWith('/profile') || path.startsWith('/user/')) {
      return { section: 'Account', current: 'Student Profile' };
    }
    if (path.startsWith('/college')) {
      return { section: 'Community', current: 'College Hub' };
    }
    if (path === '/login') {
      return { section: 'Account', current: 'Sign In' };
    }
    if (path === '/register') {
      return { section: 'Account', current: 'Register' };
    }
    return { section: 'Campus', current: 'Overview' };
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-[#0c0c0e]/95 px-3 sm:px-6 backdrop-blur-md">
      {/* Left side: Toggle button (logged in only) or Logo + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#16161a] text-zinc-300 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2 mr-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18181c] border border-white/10 text-amber-400 font-extrabold text-sm select-none">
              ✱
            </span>
            <span className="font-extrabold text-base tracking-tight text-white font-heading">
              campux
            </span>
          </Link>
        )}

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">
            {breadcrumbs.section}
          </span>
          <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
          <span className="font-semibold text-zinc-100 truncate max-w-[130px] sm:max-w-[220px]">
            {breadcrumbs.current}
          </span>
        </nav>
      </div>

      {/* Right side: Action items */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Post Item Action Button (Authenticated only) */}
        {isAuthenticated && (
          <Link
            to="/post/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Post Item</span>
          </Link>
        )}

        {/* Authenticated User pill vs Clean Sign In / Register buttons (NO GOOGLE) */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white text-black px-3 py-1.5 text-xs font-bold hover:bg-zinc-200 transition-all shadow-sm"
            >
              <div className="h-4 w-4 rounded-full bg-black text-white flex items-center justify-center text-[9px] overflow-hidden shrink-0">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <span className="hidden sm:inline truncate max-w-[90px]">{user.name?.split(' ')[0] || user.username}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/30 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all shadow-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
