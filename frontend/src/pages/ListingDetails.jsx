import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Loader2,
  Send,
  ShieldCheck,
  ShoppingBag,
  Share2,
  Tag,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EditListingModal from '../components/EditListingModal';
import { getListingById } from '../services/listingService';
import { createOffer } from '../services/offerService';
import StartConversationButton from '../components/StartConversationButton';
import { useToast } from '../context/ToastContext';
import { getFriendlyErrorMessage } from '../utils/userFeedback';

const ListingDetails = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [listing, setListing] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError('');

    getListingById(listingId)
      .then((result) => {
        if (!isCurrent) return;
        if (!result) {
          setError('This campus post could not be found.');
          return;
        }
        setListing(result);
        setActiveImageIndex(0);
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setError(getFriendlyErrorMessage(requestError, 'Could not load this post.'));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [listingId]);

  useEffect(() => {
    if (offerFormOpen) {
      document.getElementById('make-offer-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [offerFormOpen]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-400" />
          <p className="text-xs font-mono text-zinc-500">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121215] p-8 text-center shadow-xl">
          <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
          <h1 className="text-xl font-bold text-white font-heading">Post Unavailable</h1>
          <p className="mt-2 text-xs text-zinc-400">{error || 'This campus listing could not be found or has been removed.'}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images || [];
  const seller = listing.seller && typeof listing.seller === 'object' ? listing.seller : {};
  const sellerId = seller._id || listing.seller;
  const isOwner = isAuthenticated && String(user?._id) === String(sellerId);
  const isListingAvailable = !listing.status || listing.status === 'Available';
  const college = listing.college && typeof listing.college === 'object' ? listing.college : null;
  const formattedDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const handleListingUpdated = (updatedListing) => {
    setListing(updatedListing);
    setActiveImageIndex(0);
    showToast('Post updated successfully.', 'success');
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();
    setOfferSubmitting(true);
    setOfferMessage('');

    try {
      const submittedPrice = Number(offerPrice);
      await createOffer({ listingId, offerPrice: submittedPrice });
      setOfferPrice('');
      setOfferMessage(submittedPrice);
      showToast('Your offer was sent directly to the seller.', 'success');
    } catch (requestError) {
      showToast(getFriendlyErrorMessage(requestError, 'Could not send offer. Please try again.'), 'error');
    } finally {
      setOfferSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#08080a] text-zinc-100 py-6 sm:py-9 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 text-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Marketplace</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{listing.category}</span>
            <span className="text-zinc-600">/</span>
            <span className="font-semibold text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
              {listing.title}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              title="Share listing"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161b] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200 shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Post</span>
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Post Main Card Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left Column: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] flex items-center justify-center group shadow-xl">
              {images[activeImageIndex]?.url ? (
                <img
                  src={images[activeImageIndex].url}
                  alt={`${listing.title} photo ${activeImageIndex + 1}`}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600 py-16">
                  <ShoppingBag className="mb-2 h-14 w-14" />
                  <span className="text-xs font-medium">No photos provided</span>
                </div>
              )}

              {/* Navigation Arrows for multi-images */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setActiveImageIndex((index) => (index - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/75 p-2 text-white hover:bg-black transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setActiveImageIndex((index) => (index + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/75 p-2 text-white hover:bg-black transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/80 px-2.5 py-1 font-mono text-[10px] text-white backdrop-blur-sm border border-white/10">
                    {activeImageIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {images.map((image, index) => (
                  <button
                    key={image.publicId || image.url || index}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all ${
                      activeImageIndex === index
                        ? 'border-amber-400 ring-1 ring-amber-400/50 scale-95'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Campus Verified Tag */}
            <div className="rounded-xl border border-white/[0.06] bg-[#121215] p-3.5 flex items-center gap-3 text-xs text-zinc-400">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-zinc-200">Campus Verified Trade</p>
                <p className="text-[11px] text-zinc-500">Hand-to-hand exchange inside campus bounds.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Listing Details & Seller Card (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title & Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                  {listing.category}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                  isListingAvailable 
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' 
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                }`}>
                  {listing.status || 'Available'}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-300">
                  Condition: {listing.condition}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight font-heading">
                {listing.title}
              </h1>

              {/* Price display matching screenshot emphasis */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
                  ₹{Number(listing.price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-medium">
                  • In-Person Campus Handover
                </span>
              </div>
            </div>

            {/* Seller Info Card (Matching Screenshot Card Style) */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-4 sm:p-5 transition-all">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-3">
                POSTED BY STUDENT
              </p>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link
                  to={sellerId ? `/profile/${sellerId}` : '/'}
                  className="flex items-center gap-3 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-sm font-bold text-white overflow-hidden ring-1 ring-white/10 group-hover:ring-amber-500/40 transition-all shrink-0">
                    {seller.profilePic ? (
                      <img src={seller.profilePic} alt="" className="h-full w-full object-cover" />
                    ) : (
                      seller.name?.[0]?.toUpperCase() || 'S'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {seller.name || 'Campus Student'}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      @{seller.username || 'student'}
                    </p>
                    {college && (
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                        <Building2 className="h-3 w-3 text-zinc-500" />
                        <span>{college.name || college.shortName}</span>
                      </p>
                    )}
                  </div>
                </Link>

                {/* Seller actions */}
                {!isOwner && sellerId && (
                  <div className="flex items-center gap-2">
                    <StartConversationButton
                      recipientId={sellerId}
                      context={{ kind: 'listing', title: listing.title }}
                      className="px-4 py-2 text-xs font-semibold"
                    >
                      Chat with Seller
                    </StartConversationButton>
                  </div>
                )}
              </div>
            </div>

            {/* Instant Actions: Make Offer & Discuss */}
            {!isOwner && isListingAvailable && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Price Negotiation
                  </h3>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => setOfferFormOpen((prev) => !prev)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      {offerFormOpen ? 'Hide Offer Box' : 'Make an Offer (₹)'}
                    </button>
                  )}
                </div>

                {offerFormOpen && isAuthenticated ? (
                  <form onSubmit={handleOfferSubmit} className="space-y-3 pt-2 border-t border-white/[0.06]">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={Number(listing.price)}
                          step="1"
                          required
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          placeholder="Your best offer amount"
                          className="w-full rounded-xl border border-white/10 bg-[#16161b] pl-8 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500/70 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={offerSubmitting || !offerPrice}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {offerSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Send Offer</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-500">
                      Asking price: ₹{Number(listing.price).toLocaleString('en-IN')}. The seller will receive your notification instantly.
                    </p>

                    {offerMessage && (
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between">
                        <span>Offer of ₹{Number(offerMessage).toLocaleString('en-IN')} submitted!</span>
                        <StartConversationButton
                          recipientId={sellerId}
                          context={{
                            kind: 'offer',
                            title: listing.title,
                            amount: `₹${Number(offerMessage).toLocaleString('en-IN')}`,
                            status: 'Pending',
                          }}
                          className="px-2.5 py-1 text-[10px]"
                        >
                          Message about offer
                        </StartConversationButton>
                      </div>
                    )}
                  </form>
                ) : !isAuthenticated ? (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-zinc-400">Sign in to negotiate or make an offer on this item.</p>
                    <Link
                      to="/login"
                      className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : null}
              </div>
            )}

            {/* Description Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                Item Description
              </h2>
              <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-zinc-300 font-sans">
                {listing.description || 'No additional details provided by the seller.'}
              </p>
            </div>

            {/* Specifications Table */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                Post Overview
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">Category</p>
                  <p className="font-semibold text-zinc-200 mt-1">{listing.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">Condition</p>
                  <p className="font-semibold text-zinc-200 mt-1">{listing.condition}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">Listed On</p>
                  <p className="font-semibold text-zinc-200 mt-1">{formattedDate}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">Status</p>
                  <p className="font-semibold text-zinc-200 mt-1">{listing.status || 'Available'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] col-span-2">
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">Campus</p>
                  <p className="font-semibold text-zinc-200 mt-1 truncate">
                    {college?.name || college?.shortName || 'Registered College'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {isOwner && (
        <EditListingModal
          isOpen={isEditOpen}
          listing={listing}
          onClose={() => setIsEditOpen(false)}
          onUpdated={handleListingUpdated}
        />
      )}
    </div>
  );
};

export default ListingDetails;
