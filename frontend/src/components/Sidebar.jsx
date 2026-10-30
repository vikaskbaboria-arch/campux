import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Tag,
  MessageSquare,
  Building2,
  User,
  LogOut,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItemClass = (active) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      active
        ? 'bg-[#1a1a22] text-white border border-white/[0.08] shadow-sm'
        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
    }`;

  const collegeId =
    typeof user?.college === 'object' ? user?.college?._id : user?.college;
  const collegeName =
    typeof user?.college === 'object'
      ? user?.college?.shortName || user?.college?.name
      : 'My College';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-60 flex-col border-r border-white/[0.08] bg-[#0c0c0e] transition-transform duration-300 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0 md:shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18181c] border border-white/10 group-hover:border-amber-500/50 transition-colors">
              <span className="text-amber-400 font-extrabold text-sm select-none">✱</span>
            </div>
            <span className="font-extrabold text-base tracking-tight text-white font-heading">
              campux
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Essential Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {/* Feed / Home */}
          <Link
            to="/"
            onClick={onClose}
            className={navItemClass(location.pathname === '/')}
          >
            <LayoutDashboard className={`h-4 w-4 ${location.pathname === '/' ? 'text-amber-400' : 'text-zinc-400'}`} />
            <span>Feed & Listings</span>
          </Link>

          {/* Post New Item */}
          <Link
            to="/post/new"
            onClick={onClose}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="h-4 w-4 text-amber-400" />
              <span>Post an Item</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
              Sell
            </span>
          </Link>

          {/* Offers */}
          <Link
            to="/offers"
            onClick={onClose}
            className={navItemClass(isActive('/offers'))}
          >
            <Tag className={`h-4 w-4 ${isActive('/offers') ? 'text-amber-400' : 'text-zinc-400'}`} />
            <span>Offers & Bids</span>
          </Link>

          {/* Messages */}
          <Link
            to="/messages"
            onClick={onClose}
            className={navItemClass(isActive('/messages'))}
          >
            <MessageSquare className={`h-4 w-4 ${isActive('/messages') ? 'text-amber-400' : 'text-zinc-400'}`} />
            <span>Messages</span>
          </Link>

          {/* College Community (if affiliated) */}
          {collegeId && (
            <Link
              to={`/college/${collegeId}`}
              onClick={onClose}
              className={navItemClass(isActive('/college'))}
            >
              <Building2 className={`h-4 w-4 ${isActive('/college') ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span className="truncate">{collegeName}</span>
            </Link>
          )}

          {/* Profile */}
          <Link
            to="/profile"
            onClick={onClose}
            className={navItemClass(isActive('/profile'))}
          >
            <User className={`h-4 w-4 ${isActive('/profile') ? 'text-amber-400' : 'text-zinc-400'}`} />
            <span>My Profile</span>
          </Link>
        </div>

        {/* User Footer with Sign Out */}
        {user && (
          <div className="border-t border-white/[0.06] p-3 bg-[#0a0a0c]">
            <div className="flex items-center justify-between gap-2">
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden ring-1 ring-white/10">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user.name || user.username}</p>
                  <p className="text-[10px] text-zinc-500 truncate">@{user.username || 'student'}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
