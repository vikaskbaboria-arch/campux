import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AnnouncementBanner = () => {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem('campux_announcement_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem('campux_announcement_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div className="relative z-50 flex items-center justify-between gap-3 bg-[#facc15] px-4 py-2 text-xs font-semibold text-black transition-all">
      <div className="mx-auto flex items-center gap-2 text-center truncate">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 fill-black text-black" />
        </span>
        <span className="truncate">
          <strong className="font-bold">Campux Peer Hub</strong> — Direct college student trades, verified peer listings & instant campus chat!
        </span>
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-0.5 underline font-bold hover:text-zinc-800 shrink-0"
        >
          Explore Listings <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
