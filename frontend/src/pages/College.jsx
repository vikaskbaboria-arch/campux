import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCollegeById } from '../services/collegeService';
import { fetchListingsByCollege } from '../services/listingService';
import { getFriendlyErrorMessage } from '../utils/userFeedback';
import ListingsSection from '../components/ListingsSection';
import { 
  Building2, 
  MapPin, 
  Globe, 
  CheckCircle, 
  ArrowLeft, 
  ShoppingBag, 
  Users, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const College = () => {
  const { collegeId } = useParams();
  const [college, setCollege] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [error, setError] = useState('');
  const [listingsError, setListingsError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const fetchCollege = async () => {
      if (!collegeId) {
        if (isCurrent) {
          setError('No college ID provided');
          setLoading(false);
          setListingsLoading(false);
        }
        return;
      }

      setLoading(true);
      setListingsLoading(true);
      setError('');
      setListingsError('');

      const loadCollege = async () => {
        try {
          const data = await getCollegeById(collegeId);
          if (!isCurrent) return;
          if (data) {
            setCollege(data);
          } else {
            setError('College not found');
          }
        } catch (err) {
          console.error('Error fetching college by ID:', err);
          if (isCurrent) {
            setError(getFriendlyErrorMessage(err, 'Unable to load college details. Please try again.'));
          }
        } finally {
          if (isCurrent) setLoading(false);
        }
      };

      const loadListings = async () => {
        try {
          const results = await fetchListingsByCollege(collegeId);
          if (isCurrent) setListings(results);
        } catch (err) {
          console.error('Error fetching listings for college:', err);
          if (isCurrent) {
            setListingsError(getFriendlyErrorMessage(err, "Unable to load this college's listings."));
          }
        } finally {
          if (isCurrent) setListingsLoading(false);
        }
      };

      await Promise.all([loadCollege(), loadListings()]);
    };

    fetchCollege();
    return () => {
      isCurrent = false;
    };
  }, [collegeId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="rounded-3xl bg-[#0a0a0a] border border-white/10 p-10">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">College Campus Not Found</h2>
          <p className="text-sm text-zinc-400 mb-6">{error || 'This college does not exist in the database.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const locationText = [
    college.location?.city,
    college.location?.state,
    college.location?.pincode,
  ].filter(Boolean).join(', ') || 'Campus Location Available';

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Open campus identity and details */}
      <section className="pb-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          {/* Logo / Monogram and College info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {college.logo ? (
                <img
                  src={college.logo}
                  alt={college.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain p-2"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-900/80 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white">
                  {college.shortName || college.name?.[0]?.toUpperCase() || 'COL'}
                </div>
              )}
              {college.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400"></span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {college.name}
                </h1>
                {college.shortName && (
                  <span className="text-xs uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/5">
                    {college.shortName}
                  </span>
                )}
                {college.isVerified && (
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified Campus
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="font-medium text-zinc-300">{locationText}</span>
              </div>
            </div>
          </div>

          {/* Website Link action */}
          {college.collegeSite && (
            <div className="self-end sm:self-auto">
              <a
                href={college.collegeSite.startsWith('http') ? college.collegeSite : `https://${college.collegeSite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Official Campus Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Campus Hub stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 mt-5">
          <div className="py-4 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">Campus Code</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {college.shortName || 'CAMPUS'}
            </p>
          </div>

          <div className="py-4 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">City / State</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">
              {college.location?.city ? `${college.location.city}, ${college.location.state}` : 'India'}
            </p>
          </div>

          <div className="py-4 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">Marketplace</span>
            </div>
            <p className="text-sm font-semibold text-emerald-400">
              Active Hub
            </p>
          </div>

          <div className="py-4 border-b border-white/10 sm:border-b-0">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">Trade Radius</span>
            </div>
            <p className="text-sm font-medium text-zinc-300">
              On-Campus Handover
            </p>
          </div>
        </div>
      </section>

      {/* College Campus Listings Section */}
      <ListingsSection 
        isOwner={false} 
        userName={college.shortName || college.name} 
        listings={listings}
        isLoading={listingsLoading}
        error={listingsError}
      />
    </div>
  );
};

export default College;
