import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [listing, setListing] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
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
          setError('This listing could not be found.');
          return;
        }
        setListing(result);
        setActiveImageIndex(0);
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setError(getFriendlyErrorMessage(requestError, 'Could not load this listing.'));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 text-center">
          <ShoppingBag className="mx-auto mb-4 h-9 w-9 text-zinc-500" />
          <h1 className="text-xl font-bold text-white">Listing unavailable</h1>
          <p className="mt-2 text-sm text-zinc-400">{error || 'This listing could not be found.'}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images || [];
  const seller = listing.seller && typeof listing.seller === 'object' ? listing.seller : {};
  const sellerId = seller._id || listing.seller;
  const isOwner = isAuthenticated && String(user?._id) === String(sellerId);
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
    showToast('Listing updated successfully.', 'success');
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
      showToast('Your offer was sent to the seller.', 'success');
    } catch (requestError) {
      showToast(getFriendlyErrorMessage(requestError, 'Could not send your offer. Please try again.'), 'error');
    } finally {
      setOfferSubmitting(false);
    }
  };

  return (
    <div className="flex-1 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-[1216px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit listing
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-black sm:aspect-[16/11]">
              {images[activeImageIndex]?.url ? (
                <img
                  src={images[activeImageIndex].url}
                  alt={`${listing.title} photo ${activeImageIndex + 1}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-zinc-600">
                  <ShoppingBag className="mb-2 h-12 w-12" />
                  <span className="text-xs">No photos for this item</span>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous listing photo"
                    onClick={() => setActiveImageIndex((index) => (index - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/70 p-2 text-white transition hover:bg-black"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next listing photo"
                    onClick={() => setActiveImageIndex((index) => (index + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/70 p-2 text-white transition hover:bg-black"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-2.5 py-1 font-mono text-[11px] text-white">
                    {activeImageIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={image.publicId || image.url || index}
                    type="button"
                    aria-label={`Show listing photo ${index + 1}`}
                    aria-pressed={activeImageIndex === index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition ${activeImageIndex === index ? 'border-white' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
                {listing.category}
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                {listing.status || 'Available'}
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">
              ₹{Number(listing.price).toLocaleString('en-IN')}
            </p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-400">
              <span>Condition: <strong className="font-medium text-zinc-200">{listing.condition}</strong></span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
                Listed {formattedDate}
              </span>
              {college && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                  {college.name || college.shortName}
                </span>
              )}
            </div>

            <div className="mt-7 border-t border-white/10 pt-6">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-200">{listing.description}</p>
            </div>

            {!isOwner && listing.status === 'Available' && (
              <div className="mt-7 border-t border-white/10 pt-6">
                <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Make an offer</h2>
                {isAuthenticated ? (
                  <form onSubmit={handleOfferSubmit} className="mt-4 space-y-3">
                    <label htmlFor="offer-price" className="block text-xs text-zinc-400">
                      Your amount (₹)
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        id="offer-price"
                        name="offerPrice"
                        type="number"
                        min="1"
                        max={Number(listing.price)}
                        step="1"
                        required
                        value={offerPrice}
                        onChange={(event) => {
                          setOfferPrice(event.target.value);
                          setOfferMessage('');
                        }}
                        placeholder="Enter your offer"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30"
                      />
                      <button
                        type="submit"
                        disabled={offerSubmitting || !offerPrice}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {offerSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {offerSubmitting ? 'Sending' : 'Send offer'}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Maximum offer: &#8377;{Number(listing.price).toLocaleString('en-IN')}
                    </p>
                    {offerMessage !== '' && (
                      <div className="flex flex-wrap items-center gap-3">
                        <StartConversationButton
                          recipientId={sellerId}
                          context={{
                            kind: 'offer',
                            title: listing.title,
                            amount: `INR ${Number(offerMessage).toLocaleString('en-IN')}`,
                            status: 'Pending',
                          }}
                          className="px-3 py-2 text-[10px]"
                        >
                          Discuss this offer
                        </StartConversationButton>
                      </div>
                    )}
                  </form>
                ) : (
                  <Link
                    to="/login"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200"
                  >
                    Log in to make an offer
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}

            <div className="mt-7 border-t border-white/10 pt-6">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Seller</h2>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <Link to={sellerId ? `/profile/${sellerId}` : '/'} className="flex min-w-0 items-center gap-3 group">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 text-sm font-bold text-white">
                    {seller.profilePic ? (
                      <img src={seller.profilePic} alt="" className="h-full w-full object-cover" />
                    ) : (
                      seller.name?.[0]?.toUpperCase() || 'S'
                    )}
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white group-hover:underline">
                      {seller.name || 'Campus student'}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">@{seller.username || 'student'}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-500 transition group-hover:text-white" />
                </Link>
                {!isOwner && sellerId && (
                  <StartConversationButton
                    recipientId={sellerId}
                    context={{ kind: 'listing', title: listing.title }}
                    className="px-4"
                  >
                    Message seller
                  </StartConversationButton>
                )}
              </div>
            </div>

            <div className="mt-7 flex items-start gap-3 border-t border-white/10 pt-5 text-xs leading-5 text-zinc-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p>Meet in a busy campus location and inspect the item before completing the exchange.</p>
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
