import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Tag, 
  SlidersHorizontal, 
  ShoppingBag, 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Layers,
  Sparkles,
  BookOpen,
  Cpu,
  Bike,
  Package,
  Home as HomeIcon,
  Compass,
  ArrowRight,
  X,
  CheckCircle2,
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

// Reference Template Category Cards (matching Screenshot 1)
const FEATURED_ROLE_CATEGORIES = [
  {
    category: 'Books',
    title: 'Textbooks & Academics',
    description: 'Engineering math, programming concepts, syllabus reference books & semester papers.',
    icon: BookOpen,
    badgeText: '210+ Campus Books',
  },
  {
    category: 'Electronics',
    title: 'Scientific Calculators & Tech',
    description: 'FX-991EX calculators, laptop chargers, USB accessories, headphones & adaptors.',
    icon: Cpu,
    badgeText: '150+ Gadgets',
  },
  {
    category: 'Accessories',
    title: 'Lab Kits & Drafting Tools',
    description: 'Mini drafters, drawing board sets, lab coats, aprons, and dissection kits.',
    icon: Compass,
    badgeText: '95+ Study Kits',
  },
  {
    category: 'Notes',
    title: 'Handwritten Exam Notes',
    description: 'High-scoring lecture notes, past exam question solutions & quick revision sheets.',
    icon: Layers,
    badgeText: '320+ Notes Shared',
  },
  {
    category: 'Furniture',
    title: 'Dorm Living & Study Gear',
    description: 'Ergonomic study lamps, room heaters, foldable study desks & storage organizers.',
    icon: HomeIcon,
    badgeText: '80+ Dorm Essentials',
  },
  {
    category: 'Other',
    title: 'Campus Cycles & Mobility',
    description: 'Commuter bicycles, cycling helmets, cable locks & daily college transit gear.',
    icon: Bike,
    badgeText: '45+ Cycles & Gear',
  },
];

const getConditionColor = (condition) => {
  switch (condition?.toLowerCase()) {
    case 'new':
    case 'like new':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'used':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'refurbished':
      return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  }
};

const Home = () => {
  const { isAuthenticated, user, updateProfile } = useAuth();

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedHome user={user} updateProfile={updateProfile} />;
};

const AuthenticatedHome = ({ user, updateProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

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
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0]);

  // Modals state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const collegeId =
    typeof user?.college === 'object' ? user?.college?._id : user?.college;

  const collegeName =
    typeof user?.college === 'object'
      ? user?.college?.name || user?.college?.shortName
      : 'Your College';

  const hasCollege = Boolean(collegeId);

  // Sync category param if URL changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && CATEGORIES.includes(cat)) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

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

  const handleSaveProfile = async (payload) => {
    const res = await updateProfile(payload);
    loadListings(1);
    return res;
  };

  const handleSelectFeaturedCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setSearchParams(categoryName === 'All' ? {} : { category: categoryName });
    // Scroll to feed section
    document.getElementById('campus-feed-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 w-full bg-[#08080a] text-zinc-100 flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8 font-sans">
      <div className="max-w-[1240px] w-full mx-auto space-y-9">
        
        {/* Missing College Alert */}
        {!hasCollege && (
          <div className="rounded-2xl border border-red-500/20 bg-[#140c0d] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Campus Link Required</span>
              </div>
              <h2 className="text-lg font-bold text-white font-heading">
                Connect your University to View Campus Listings
              </h2>
              <p className="text-xs text-zinc-400 max-w-xl">
                Campux displays verified student listings exclusively inside your college. Set your campus affiliation to buy and trade directly with seniors and batchmates.
              </p>
            </div>
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-colors shrink-0"
            >
              Affiliate College
            </button>
          </div>
        )}

        {/* Hero Header matching Screenshot 1: "Role-Wise Interview Questions" layout */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading">
                Campus Marketplace & Peer Hub
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans">
                Comprehensive university essentials organized by role & category — from Textbooks to Electronics, Lab Kits to Dorm Living
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/post/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Post Item for Sale</span>
              </Link>
            </div>
          </div>

          {/* Large Search Bar matching Screenshot 1 */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="relative flex items-center w-full rounded-xl border border-zinc-800 bg-[#121215] px-4 py-3 focus-within:border-amber-500/70 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all shadow-lg">
              <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings (books, electronics, lab kits...)"
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-zinc-400 hover:text-white mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Section 1: Template Category Cards Grid matching Screenshot 1 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white font-heading">
              Browse by Campus Category
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">
              {FEATURED_ROLE_CATEGORIES.length} Categories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURED_ROLE_CATEGORIES.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedCategory === item.category;

              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => handleSelectFeaturedCategory(item.category)}
                  className={`text-left rounded-xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full ${
                    isSelected
                      ? 'bg-[#15151a] border border-amber-500/80 ring-1 ring-amber-500/40 shadow-lg shadow-black/60'
                      : 'bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 hover:bg-[#16161b]'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Title */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isSelected 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-zinc-800/80 text-zinc-300 border border-white/5'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-tight font-heading">
                        {item.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-600">≡</span>
                      <span>{item.badgeText}</span>
                    </span>
                    <span className={`text-[10px] font-sans font-semibold uppercase ${
                      isSelected ? 'text-amber-400' : 'text-zinc-500'
                    }`}>
                      {isSelected ? 'Selected' : 'View'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: The Campus Feed with Filter Pills */}
        <div id="campus-feed-section" className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                ACTIVE LISTINGS
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-heading mt-0.5">
                {selectedCategory === 'All' ? 'All Campus Posts' : `${selectedCategory} Listings`}
              </h2>
            </div>

            {/* Condition & Sort Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#16161b] px-3 py-1.5 text-xs text-zinc-300 focus:border-amber-500/60 focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-zinc-900">All Conditions</option>
                {CONDITIONS.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">{c}</option>
                ))}
              </select>

              <select
                value={`${selectedSort.sortBy}-${selectedSort.sortType}`}
                onChange={(e) => {
                  const [sb, st] = e.target.value.split('-');
                  const opt = SORT_OPTIONS.find((o) => o.sortBy === sb && o.sortType === st);
                  if (opt) setSelectedSort(opt);
                }}
                className="rounded-lg border border-white/10 bg-[#16161b] px-3 py-1.5 text-xs text-zinc-300 focus:border-amber-500/60 focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={`${opt.sortBy}-${opt.sortType}`} value={`${opt.sortBy}-${opt.sortType}`} className="bg-zinc-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Horizontal Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase shrink-0 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 shadow-sm'
                      : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Feed Grid or Empty/Loading State */}
          {loading ? (
            <div className="min-h-[35vh] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-zinc-500">Loading campus posts...</p>
            </div>
          ) : error ? (
            <div className="space-y-3 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
              <h3 className="text-sm font-medium text-zinc-200">{error}</h3>
              <button
                onClick={() => loadListings(1)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {listings.map((item) => {
                const coverImage = item.images?.[0]?.url || null;
                const imageCount = item.images?.length || 0;
                const sellerName = item.seller?.name || 'Student';
                const sellerPic = item.seller?.profilePic || '';

                return (
                  <Link
                    key={item._id}
                    to={`/post/${item._id}`}
                    className="group flex flex-col rounded-xl border border-zinc-800/80 bg-[#121215] hover:border-amber-500/60 hover:ring-1 hover:ring-amber-500/30 transition-all duration-200 overflow-hidden shadow-md"
                  >
                    {/* Image Cover */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 bg-zinc-900">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}

                      {/* Category Badge */}
                      <span className="absolute left-2.5 top-2.5 bg-black/75 backdrop-blur-sm rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white border border-white/10">
                        {item.category}
                      </span>

                      {/* Condition badge */}
                      <span className={`absolute bottom-2.5 left-2.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border backdrop-blur-sm ${getConditionColor(item.condition)}`}>
                        {item.condition}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                      <div>
                        {/* Price */}
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-lg font-extrabold text-white tracking-tight font-heading">
                            ₹{Number(item.price).toLocaleString()}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">
                            {item.status || 'Available'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-amber-300 line-clamp-2 leading-snug transition-colors">
                          {item.title}
                        </h3>

                        {/* Description excerpt */}
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Footer Seller */}
                      <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0">
                            {sellerPic ? (
                              <img src={sellerPic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              sellerName[0]?.toUpperCase() || 'S'
                            )}
                          </div>
                          <span className="truncate text-[11px] text-zinc-400">{sellerName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          View Post →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-14 text-center rounded-2xl border border-white/[0.06] bg-[#121215]">
              <ShoppingBag className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <h3 className="text-sm font-semibold text-white">No items found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                No active listings match your current filters. Be the first to post an item in this category!
              </p>
              <Link
                to="/post/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post an Item</span>
              </Link>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => loadListings(pagination.page - 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.04]"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs font-mono text-zinc-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadListings(pagination.page + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.04]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Edit Profile Modal if needed */}
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
