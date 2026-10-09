import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Landing from './Landing';
import AddListingModal from '../components/AddListingModal';
import EditProfileModal from '../components/EditProfileModal';
import { fetchListings } from '../services/listingService';
import { getFriendlyErrorMessage } from '../utils/userFeedback';
import { 
  Search, 
  Plus, 
  Building2, 
  MapPin,
  Tag, 
  SlidersHorizontal, 
  ArrowUpRight, 
  ShoppingBag, 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Layers,
  Sparkles,
  X
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Books',
  'Electronics',
  'Accessories',
  'Notes',
  'Furniture',
  'Clothing',
  'Other',
];

const CONDITIONS = [
  'All',
  'Like New',
  'Used',
  'New',
  'Refurbished',
];

const SORT_OPTIONS = [
  { label: 'Newest First', sortBy: 'createdAt', sortType: 'desc' },
  { label: 'Price: Low to High', sortBy: 'price', sortType: 'asc' },
  { label: 'Price: High to Low', sortBy: 'price', sortType: 'desc' },
  { label: 'Oldest First', sortBy: 'createdAt', sortType: 'asc' },
];

const Home = () => {
  const { isAuthenticated, user, updateProfile } = useAuth();

  // If not logged in, render the sleek landing page
  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedHome user={user} updateProfile={updateProfile} />;
};

const AuthenticatedHome = ({ user, updateProfile }) => {
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const collegeId =
    typeof user?.college === 'object' ? user?.college?._id : user?.college;

  const collegeName =
    typeof user?.college === 'object'
      ? user?.college?.name || user?.college?.shortName
      : 'Your College';

  const hasCollege = Boolean(collegeId);

  const loadListings = useCallback(
    async (pageToLoad = 1) => {
      if (!hasCollege) {
        setListings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await fetchListings({
          page: pageToLoad,
          limit: 12,
          query: submittedQuery,
          category: selectedCategory,
          condition: selectedCondition,
          sortBy: selectedSort.sortBy,
          sortType: selectedSort.sortType,
        });

        setListings(data.listing || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(getFriendlyErrorMessage(err, 'Failed to load marketplace listings.'));
      } finally {
        setLoading(false);
      }
    },
    [hasCollege, submittedQuery, selectedCategory, selectedCondition, selectedSort]
  );

  useEffect(() => {
    loadListings(1);
  }, [loadListings]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSubmittedQuery('');
  };

  const handleListingCreated = () => {
    loadListings(1);
  };

  const handleSaveProfile = async (payload) => {
    const res = await updateProfile(payload);
    loadListings(1);
    return res;
  };

  return (
    <div className="flex-1 w-full bg-black text-zinc-100 flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="max-w-[1216px] w-full mx-auto space-y-6">
        
        {/* Missing College Alert Banner */}
        {!hasCollege ? (
          <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-mono uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>College Affiliation Required</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Link your College to Browse Campus Listings
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                Campux shows goods, books, and gadgets listed exclusively by students inside your university. Affiliate with your campus to start buying and selling with zero commissions.
              </p>
            </div>
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="shrink-0 border-b border-white/30 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-200 transition-colors hover:border-white hover:text-white cursor-pointer"
            >
              Set College Now
            </button>
          </div>
        ) : (
          /* College Hero Header Banner */
          <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-7 md:flex-row md:items-end">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Campus Marketplace Live
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  • Zero Commission Peer Trade
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Campus Marketplace
                </h1>
                {collegeId && (
                  <Link
                    to={`/college/${collegeId}`}
                    className="inline-flex max-w-[min(55vw,280px)] items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                    title={`View ${collegeName} campus listings`}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="truncate">{collegeName}</span>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-zinc-500" />
                  </Link>
                )}
              </div>

              <p className="max-w-xl text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                Explore textbooks, electronics, cycles, and lab supplies listed by students on campus.
              </p>
            </div>

            {/* Top Post Item Button */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 md:w-auto sm:text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Post Item for Sale</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Filtering Bar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textbooks, calculators, cycles, lab aprons..."
                className="w-full border-0 border-b border-white/15 bg-transparent py-3 pl-11 pr-24 text-xs text-white placeholder-zinc-500 transition-colors focus:border-white/60 focus:outline-none focus:ring-0 sm:text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                  title="Clear query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:text-white cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Condition Filter */}
            <div className="flex items-center gap-3">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="border-0 border-b border-white/15 bg-transparent px-2 py-3 text-xs text-zinc-300 transition-colors focus:border-white/60 focus:outline-none cursor-pointer"
                title="Filter by condition"
              >
                <option value="All" className="bg-zinc-900 text-white">All Conditions</option>
                {CONDITIONS.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c} className="bg-zinc-900 text-white">
                    {c}
                  </option>
                ))}
              </select>

              {/* Sort By Dropdown */}
              <select
                value={`${selectedSort.sortBy}-${selectedSort.sortType}`}
                onChange={(e) => {
                  const [sb, st] = e.target.value.split('-');
                  const opt = SORT_OPTIONS.find(
                    (o) => o.sortBy === sb && o.sortType === st
                  );
                  if (opt) setSelectedSort(opt);
                }}
                className="border-0 border-b border-white/15 bg-transparent px-2 py-3 text-xs text-zinc-300 transition-colors focus:border-white/60 focus:outline-none cursor-pointer"
                title="Sort listings"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option
                    key={`${opt.sortBy}-${opt.sortType}`}
                    value={`${opt.sortBy}-${opt.sortType}`}
                    className="bg-zinc-900 text-white"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-white text-white'
                      : 'border-b-2 border-transparent text-zinc-500 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Active filter summary if any filter is set */}
          {(submittedQuery || selectedCategory !== 'All' || selectedCondition !== 'All') && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap pt-1">
              <span className="font-mono text-zinc-500">Filters:</span>
              {submittedQuery && (
                <span className="flex items-center gap-1.5 font-mono text-zinc-200">
                  &quot;{submittedQuery}&quot;
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-400"
                    onClick={handleClearSearch}
                  />
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="flex items-center gap-1.5 font-mono text-zinc-200">
                  Category: {selectedCategory}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-400"
                    onClick={() => setSelectedCategory('All')}
                  />
                </span>
              )}
              {selectedCondition !== 'All' && (
                <span className="flex items-center gap-1.5 font-mono text-zinc-200">
                  Condition: {selectedCondition}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-400"
                    onClick={() => setSelectedCondition('All')}
                  />
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSubmittedQuery('');
                  setSelectedCategory('All');
                  setSelectedCondition('All');
                }}
                className="text-xs text-zinc-400 hover:text-white underline ml-2 cursor-pointer"
              >
                Reset all
              </button>
            </div>
          )}
        </div>

        {/* Listings Grid / Content */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-zinc-500">Loading campus listings...</p>
          </div>
        ) : error ? (
          <div className="space-y-4 py-12 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-red-300" />
            <h3 className="text-base font-medium text-zinc-200">{error}</h3>
            <button
              onClick={() => loadListings(1)}
              className="inline-flex items-center gap-2 border-b border-white/30 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-200 transition-colors hover:text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-8">
            <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">The campus feed</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Find your next useful thing</h2>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-zinc-500">
                {pagination.total || listings.length} items
              </span>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {listings.map((item) => {
                const coverImage = item.images?.[0]?.url || null;
                const imageCount = item.images?.length || 0;
                const sellerName = item.seller?.name || 'Student';
                const sellerUsername = item.seller?.username || 'user';
                const sellerPic = item.seller?.profilePic || '';

                return (
                  <Link
                    key={item._id}
                    to={`/listing/${item._id}`}
                    className="group flex min-w-0 flex-col transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#111]">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 transition-colors group-hover:text-zinc-300">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}

                      {/* Top Category Badge */}
                      <span className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-wide text-white drop-shadow-md">
                        {item.category}
                      </span>

                      {/* Photo count indicator if multiple */}
                      {imageCount > 1 && (
                        <span className="absolute right-3 top-3 flex items-center gap-1 text-[10px] font-mono text-white drop-shadow-md">
                          <Layers className="w-3 h-3" />
                          {imageCount}
                        </span>
                      )}

                      {/* Condition badge */}
                      <span className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-wide text-white drop-shadow-md">
                        {item.condition}
                      </span>
                    </div>

                    {/* Card Details */}
                    <div className="flex flex-1 flex-col justify-between space-y-4 pt-4">
                      <div>
                        {/* Price */}
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xl font-extrabold text-white tracking-tight">
                            ₹{Number(item.price).toLocaleString()}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-emerald-400">
                            {item.status || 'Available'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white line-clamp-2 leading-snug transition-colors">
                          {item.title}
                        </h3>

                        {/* Description excerpt */}
                        <p className="text-xs text-zinc-400 font-light line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Seller Footer */}
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0">
                            {sellerPic ? (
                              <img src={sellerPic} alt={sellerName} className="w-full h-full object-cover" />
                            ) : (
                              sellerName[0]?.toUpperCase() || 'S'
                            )}
                          </div>
                          <span className="text-zinc-400 font-mono text-[11px] truncate">
                            {sellerName}
                          </span>
                        </div>

                        <span className="text-zinc-300 group-hover:text-white flex items-center gap-1 text-[11px] font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                          View <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <p className="text-xs font-mono text-zinc-400">
                  Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => loadListings(pagination.page - 1)}
                    className="flex items-center gap-1 px-2 py-2 text-xs font-medium text-zinc-400 transition-colors hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    disabled={!pagination.hasNextPage}
                    onClick={() => loadListings(pagination.page + 1)}
                    className="flex items-center gap-1 px-2 py-2 text-xs font-medium text-zinc-400 transition-colors hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State when no listings match */
          <div className="space-y-4 py-12 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-zinc-500" />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                No items found
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                {submittedQuery || selectedCategory !== 'All' || selectedCondition !== 'All'
                  ? 'No listings currently match your selected filters. Try broadening your search or resetting filters.'
                  : `There are currently no items posted in ${collegeName}. Be the first student to post an item for trade!`}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {(submittedQuery || selectedCategory !== 'All' || selectedCondition !== 'All') ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSubmittedQuery('');
                    setSelectedCategory('All');
                    setSelectedCondition('All');
                  }}
                  className="px-2 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : null}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 border-b border-white/30 px-1 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-200 transition-colors hover:text-white cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Your Item</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onListingCreated={handleListingCreated}
        onOpenProfileEdit={() => setIsEditProfileModalOpen(true)}
      />

      {/* Edit Profile Modal (for updating college if not set) */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default Home;
