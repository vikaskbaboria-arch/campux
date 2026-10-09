import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Plus, ShoppingBag, ArrowUpRight, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import AddListingModal from './AddListingModal';
import ListingDetailModal from './ListingDetailModal';
import { deleteListing, markListingAsSold } from '../services/listingService';
import { getFriendlyErrorMessage } from '../utils/userFeedback';
import { useToast } from '../context/ToastContext';

const EMPTY_LISTINGS = [];
const SAMPLE_LISTINGS = [
  {
    _id: 'sample-1',
    title: 'Higher Engineering Mathematics - B.S. Grewal',
    price: 420,
    category: 'Books',
    condition: 'Like New',
    status: 'Available',
    images: [],
    createdAt: '2 days ago',
  },
  {
    _id: 'sample-2',
    title: 'Casio Scientific Calculator FX-991EX ClassWiz',
    price: 950,
    category: 'Electronics',
    condition: 'Used',
    status: 'Available',
    images: [],
    createdAt: '5 days ago',
  },
  {
    _id: 'sample-3',
    title: 'Drafter + Engineering Drawing Board Set',
    price: 600,
    category: 'Accessories',
    condition: 'Used',
    status: 'Sold',
    images: [],
    createdAt: '1 week ago',
  },
];

const ListingsSection = ({
  isOwner,
  userName,
  listings = SAMPLE_LISTINGS,
  isLoading = false,
  error = '',
  onListingCreated,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState(listings);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState('');

  // Sync items if prop changes
  React.useEffect(() => {
    setItems(listings || EMPTY_LISTINGS);
  }, [listings]);

  const filteredItems = items.filter((item) => {
    if (filter === 'All') return true;
    return item.status === filter;
  });

  const handleCreated = (newItem) => {
    if (newItem) {
      setItems((prev) => [newItem, ...prev]);
    }
    if (onListingCreated) {
      onListingCreated(newItem);
    }
  };

  const handleMarkAsSold = async (item) => {
    setActionLoadingId(item._id);
    try {
      const updatedListing = await markListingAsSold(item._id);
      setItems((current) => current.map((listing) =>
        listing._id === item._id ? updatedListing : listing
      ));
      showToast('Listing marked as sold.', 'success');
    } catch (requestError) {
      showToast(getFriendlyErrorMessage(requestError, 'Could not mark this listing as sold.'), 'error');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;
    const item = listingToDelete;
    setActionLoadingId(item._id);
    try {
      await deleteListing(item._id);
      setItems((current) => current.filter((listing) => listing._id !== item._id));
      setListingToDelete(null);
      showToast('Listing deleted.', 'success');
    } catch (requestError) {
      showToast(getFriendlyErrorMessage(requestError, 'Could not delete this listing.'), 'error');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <div className="mt-12 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isOwner ? 'My Campus Listings' : `${userName}'s Listings`}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 font-mono">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Goods, textbooks, and essentials listed for trade & sale in college
          </p>
        </div>

        {/* Filter controls and add item action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0a0a0a] p-1 rounded-full border border-white/10">
            {['All', 'Available', 'Sold'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full transition-all font-medium cursor-pointer ${
                  filter === f
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {isOwner && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Post Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Listings Grid or Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading listings
        </div>
      ) : error ? (
        <div role="alert" className="py-8 text-sm text-red-300">
          {error}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const coverImage = item.images?.[0]?.url || null;
            const hasListingPage = /^[a-f\d]{24}$/i.test(String(item._id || ''));
            return (
              <article
                key={item._id || item.id}
                className="group flex min-w-0 flex-col transition-transform duration-300 hover:-translate-y-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (hasListingPage) {
                      navigate(`/listing/${item._id}`);
                    } else {
                      setSelectedListing(item);
                    }
                  }}
                  className="w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
                >
                {/* Image / Item Banner Placeholder */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#111]">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 transition-colors group-hover:text-zinc-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}

                  {/* Category tag */}
                  <span className="absolute left-3 top-3 text-[10px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-zinc-100">
                    {item.category}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-white/5'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Item Info */}
                <div className="flex flex-1 flex-col justify-between pt-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-lg font-bold text-white tracking-tight">
                        ₹{Number(item.price).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {item.condition}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {item.createdAt
                        ? typeof item.createdAt === 'string' && item.createdAt.includes('ago')
                          ? item.createdAt
                          : new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                        : 'Recent'}
                    </span>
                    <span className="text-zinc-300 hover:text-white flex items-center gap-1 font-medium group-hover:underline">
                      View <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                </button>

                {isOwner && hasListingPage && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {item.status !== 'Sold' && (
                      <button
                        type="button"
                        disabled={Boolean(actionLoadingId)}
                        onClick={() => handleMarkAsSold(item)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:cursor-wait disabled:opacity-50"
                      >
                        {actionLoadingId === item._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Mark as sold
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={Boolean(actionLoadingId)}
                      onClick={() => {
                        setListingToDelete(item);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition hover:border-red-400/30 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-[#0a0a0a] border border-white/10 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No items found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
            {isOwner
              ? "You haven't listed any textbooks, cycles, or dorm goods for sale yet."
              : 'No listings are available here yet.'}
          </p>
          {isOwner && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Post Your First Item</span>
            </button>
          )}
        </div>
      )}

      {/* Add Listing Modal */}
      {isOwner && (
        <AddListingModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onListingCreated={handleCreated}
        />
      )}

      {/* Listing Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        isOpen={Boolean(selectedListing)}
        onClose={() => setSelectedListing(null)}
      />

      {listingToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-listing-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
          >
            <h2 id="delete-listing-title" className="text-lg font-bold text-white">
              Delete this listing?
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              “{listingToDelete.title}” will be permanently removed. Are you sure you want to continue?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(actionLoadingId)}
                onClick={() => setListingToDelete(null)}
                className="rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(actionLoadingId)}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-400 disabled:cursor-wait disabled:opacity-50"
              >
                {actionLoadingId === listingToDelete._id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsSection;
