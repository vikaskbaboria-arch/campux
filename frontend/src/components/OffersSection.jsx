import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Loader2, ShoppingBag } from 'lucide-react';
import StartConversationButton from './StartConversationButton';
import { useToast } from '../context/ToastContext';
import { getFriendlyErrorMessage } from '../utils/userFeedback';
import { useAuth } from '../context/AuthContext';
import {
  acceptOffer,
  counterOffer,
  fetchReceivedOffers,
  fetchSentOffers,
  rejectOffer,
} from '../services/offerService';

const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const OffersSection = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [sentOffers, setSentOffers] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [counterOfferId, setCounterOfferId] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    Promise.all([fetchSentOffers(), fetchReceivedOffers()])
      .then(([sent, received]) => {
        if (!isCurrent) return;
        setSentOffers(sent);
        setReceivedOffers(received);
        const pendingCount = received.filter((offer) => offer.status === 'Pending').length;
        if (user?._id) {
          const storageKey = `campux_pending_offer_count_${user._id}`;
          try {
            const previousCount = Number(localStorage.getItem(storageKey) || 0);
            if (pendingCount > previousCount) {
              showToast(
                pendingCount === 1 ? 'You have a new offer waiting.' : `You have ${pendingCount} offers waiting.`,
                'info',
              );
            }
            localStorage.setItem(storageKey, String(pendingCount));
          } catch {
            // Keep offers usable when browser storage is unavailable.
          }
        }
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        showToast(getFriendlyErrorMessage(requestError, 'Could not load your offers. Please try again.'), 'error');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [showToast, user?._id]);

  const runOfferAction = async (offer, action, amount) => {
    setActionLoadingId(offer._id);

    try {
      let updatedOffer;
      if (action === 'accept') updatedOffer = await acceptOffer(offer._id);
      if (action === 'reject') updatedOffer = await rejectOffer(offer._id);
      if (action === 'counter') updatedOffer = await counterOffer(offer._id, amount);

      setSentOffers((current) => current.map((item) => item._id === offer._id ? updatedOffer : item));
      setReceivedOffers((current) => current.map((item) => item._id === offer._id ? updatedOffer : item));
      setCounterOfferId('');
      setCounterAmount('');
      const successMessages = {
        accept: 'Offer accepted.',
        reject: 'Offer declined.',
        counter: 'Counteroffer sent.',
      };
      showToast(successMessages[action], 'success');
    } catch (requestError) {
      showToast(getFriendlyErrorMessage(requestError, 'Could not update this offer. Please try again.'), 'error');
    } finally {
      setActionLoadingId('');
    }
  };

  const offers = activeTab === 'received' ? receivedOffers : sentOffers;

  return (
    <section className="mt-14" aria-labelledby="offers-heading">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="offers-heading" className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Offers
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Keep track of offers on your listings and the ones you have made.
          </p>
        </div>
        <div className="flex w-fit items-center rounded-full bg-white/[0.04] p-1">
          <button
            type="button"
            aria-pressed={activeTab === 'received'}
            onClick={() => setActiveTab('received')}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${activeTab === 'received' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Received ({receivedOffers.length})
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'sent'}
            onClick={() => setActiveTab('sent')}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${activeTab === 'sent' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Sent ({sentOffers.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading offers
        </div>
      ) : offers.length === 0 ? (
        <p className="py-8 text-sm text-zinc-500">
          {activeTab === 'received' ? 'You have not received any offers yet.' : 'You have not made any offers yet.'}
        </p>
      ) : (
        <div>
          {offers.map((offer) => {
            const listing = offer.listing || {};
            const otherUser = activeTab === 'received'
              ? offer.buyer || {}
              : listing.seller || {};
            const listingHref = listing._id ? `/listing/${listing._id}` : null;
            const userHref = otherUser._id ? `/profile/${otherUser._id}` : null;
            const imageUrl = listing.images?.[0]?.url;
            const sellerCanRespond = activeTab === 'received' && offer.status === 'Pending';
            const buyerCanRespond = activeTab === 'sent' && offer.status === 'Countered';
            const isUpdating = actionLoadingId === offer._id;
            const statusClass = offer.status === 'Accepted'
              ? 'bg-emerald-500/10 text-emerald-400'
              : offer.status === 'Rejected'
                ? 'bg-red-500/10 text-red-300'
                : offer.status === 'Countered'
                  ? 'bg-amber-500/10 text-amber-300'
                  : 'bg-white/[0.06] text-zinc-300';

            return (
              <article
                key={offer._id}
                className="flex flex-col gap-4 border-b border-white/[0.06] py-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] text-zinc-600">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    {listingHref ? (
                      <Link to={listingHref} className="block truncate text-sm font-semibold text-white hover:underline">
                        {listing.title || 'Listing'}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-semibold text-white">Listing unavailable</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">
                      {activeTab === 'received' ? 'From ' : 'To '}
                      {userHref ? (
                        <Link to={userHref} className="text-zinc-200 hover:underline">
                          {otherUser.name || `@${otherUser.username || 'student'}`}
                        </Link>
                      ) : (
                        <span>{otherUser.name || 'Campus student'}</span>
                      )}
                    </p>
                    {listing.price !== undefined && (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Asking price {formatPrice(listing.price)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        {offer.status === 'Accepted' ? 'Agreed amount' : 'Offer amount'}
                      </p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {formatPrice(offer.acceptedPrice ?? offer.offerPrice)}
                      </p>
                      <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass}`}>
                      {offer.status || 'Pending'}
                      </span>
                      {['Countered', 'Rejected'].includes(offer.status) && offer.counterOfferPrice !== undefined && (
                        <p className="mt-1 text-[11px] text-amber-300">
                          Counteroffer: {formatPrice(offer.counterOfferPrice)}
                        </p>
                      )}
                    </div>
                    {listingHref && (
                      <Link to={listingHref} aria-label={`View ${listing.title || 'listing'}`} className="text-zinc-500 transition hover:text-white">
                        {activeTab === 'received' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </Link>
                    )}
                  </div>

                  {(sellerCanRespond || buyerCanRespond) && (
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => runOfferAction(offer, 'accept')}
                        className="rounded-full bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {isUpdating ? 'Updating...' : buyerCanRespond ? 'Accept counter' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => runOfferAction(offer, 'reject')}
                        className="rounded-full border border-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      {sellerCanRespond && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => {
                            setCounterOfferId(counterOfferId === offer._id ? '' : offer._id);
                            setCounterAmount('');
                          }}
                          className="rounded-full border border-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                        >
                          Counter
                        </button>
                      )}
                    </div>
                  )}

                  {otherUser._id && (
                    <StartConversationButton
                      recipientId={otherUser._id}
                      context={{
                        kind: 'offer',
                        title: listing.title,
                        amount: formatPrice(offer.acceptedPrice ?? offer.counterOfferPrice ?? offer.offerPrice),
                        status: offer.status,
                      }}
                      className="px-3.5 py-2"
                    >
                      Chat about offer
                    </StartConversationButton>
                  )}

                  {sellerCanRespond && counterOfferId === offer._id && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        runOfferAction(offer, 'counter', Number(counterAmount));
                      }}
                      className="flex w-full flex-col gap-2 sm:w-64"
                    >
                      <label htmlFor={`counter-${offer._id}`} className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        Counter amount
                      </label>
                      <input
                        id={`counter-${offer._id}`}
                        type="number"
                        min="1"
                        max={Number(listing.price)}
                        step="1"
                        required
                        value={counterAmount}
                        onChange={(event) => setCounterAmount(event.target.value)}
                        placeholder="Enter counteroffer"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Maximum: {formatPrice(listing.price)}
                      </p>
                      <button
                        type="submit"
                        disabled={isUpdating || !counterAmount}
                        className="rounded-full bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {isUpdating ? 'Sending...' : 'Send counteroffer'}
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default OffersSection;
