import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Tag, 
  Clock, 
  MapPin, 
  User as UserIcon,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ListingDetailModal = ({ listing, isOpen, onClose }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen || !listing) return null;

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : [];

  const activeImage = images[activeImageIndex]?.url || null;

  const sellerName = listing.seller?.name || 'Campus Student';
  const sellerUsername = listing.seller?.username || 'student';
  const sellerEmail = listing.seller?.email || '';
  const sellerPic = listing.seller?.profilePic || '';
  const collegeName = listing.college?.name || listing.college?.shortName || 'Campus';
  const collegeId = listing.college?._id || listing.college;

  const handleCopyEmail = () => {
    if (!sellerEmail) return;
    navigator.clipboard.writeText(sellerEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const formattedDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl sm:rounded-3xl bg-[#0a0a0a] text-zinc-100 border border-white/10 shadow-2xl relative my-6 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {listing.category}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {listing.status || 'Available'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-[#0a0a0a]">
          
          {/* Image Showcase Gallery */}
          {images.length > 0 ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-[#121212] border border-white/10 flex items-center justify-center">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-zinc-600 flex flex-col items-center">
                    <ShoppingBag className="w-12 h-12 mb-2" />
                    <span className="text-xs">No image available</span>
                  </div>
                )}

                {/* Left/Right navigation arrows if multiple images */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[11px] font-mono text-white border border-white/10">
                      {activeImageIndex + 1} / {images.length}
                    </span>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-white ring-2 ring-white/20'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl aspect-[16/9] bg-[#121212] border border-white/10 flex flex-col items-center justify-center text-zinc-600">
              <ShoppingBag className="w-12 h-12 mb-2" />
              <span className="text-xs">No photos provided by seller</span>
            </div>
          )}

          {/* Pricing & Title Info */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ₹{Number(listing.price).toLocaleString()}
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300">
                Condition: <strong className="text-white">{listing.condition}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {listing.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                Listed on {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                {collegeName}
              </span>
            </div>
          </div>

          {/* Item Description */}
          <div className="p-4 rounded-2xl bg-[#121212] border border-white/10 space-y-2">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Description & Handover Notes
            </h3>
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-light">
              {listing.description}
            </p>
          </div>

          {/* Seller Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121212] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-inner overflow-hidden shrink-0">
                {sellerPic ? (
                  <img
                    src={sellerPic}
                    alt={sellerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  sellerName[0]?.toUpperCase() || 'S'
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {sellerName}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                    Seller
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">@{sellerUsername}</p>
              </div>
            </div>

            {/* Contact Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {sellerEmail && (
                <>
                  <a
                    href={`mailto:${sellerEmail}?subject=Regarding your listing: ${encodeURIComponent(listing.title)}`}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Seller</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Copy seller email"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Safety Handover Advisory */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950 border border-white/5 text-zinc-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Peer-to-peer safety reminder: Meet in high-footfall campus locations (Library entrance, canteen, student center) to inspect the item before paying.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ListingDetailModal;
