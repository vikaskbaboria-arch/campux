import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EditProfileModal from '../components/EditProfileModal';
import ListingsSection from '../components/ListingsSection';
import StartConversationButton from '../components/StartConversationButton';
import { fetchListingsBySeller, fetchMyListings } from '../services/listingService';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Mail, 
  Calendar, 
  Edit3, 
  ArrowLeft,
  ArrowUpRight,
  AlertCircle,
  Camera
} from 'lucide-react';
import { getCollegeById } from '../services/collegeService';
import { getFriendlyErrorMessage } from '../utils/userFeedback';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, updateProfile, fetchProfile } = useAuth();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileListings, setProfileListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState('');

  // Check if viewing own profile
  const isOwner = !userId || (currentUser && currentUser._id === userId);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        if (isOwner) {
          // If own profile, ensure fresh data from getProfile
          if (currentUser) {
            setProfileData(currentUser);
          }
          const fresh = await fetchProfile();
          if (fresh) {
            setProfileData(fresh);
          }
        } else {
          // Fetch public profile by id from backend: GET /api/v1/users/:userId
          const res = await api.get(`/users/${userId}`);
          if (res.data?.data) {
            setProfileData(res.data.data);
          } else {
            setError('User not found');
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(getFriendlyErrorMessage(err, 'Could not load this student profile.'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser?._id]);

  useEffect(() => {
    let isCurrent = true;

    if (!isOwner && !userId) {
      setProfileListings([]);
      setListingsLoading(false);
      setListingsError('');
      return () => {
        isCurrent = false;
      };
    }

    setListingsLoading(true);
    setListingsError('');
    (isOwner ? fetchMyListings() : fetchListingsBySeller(userId))
      .then((listings) => {
        if (isCurrent) setProfileListings(listings);
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setListingsError(getFriendlyErrorMessage(requestError, "Could not load this student's listings."));
      })
      .finally(() => {
        if (isCurrent) setListingsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOwner, userId, currentUser?._id]);

  const handleSaveProfile = async (payload) => {
    const res = await updateProfile(payload);
    showToast('Profile updated successfully.', 'success');
    if (res?.data) {
      setProfileData((prev) => ({ ...prev, ...res.data }));
    } else {
      const fresh = await fetchProfile();
      if (fresh) setProfileData(fresh);
    }
    return res;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="rounded-3xl bg-[#0a0a0a] border border-white/10 p-10">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Student Profile Not Found</h2>
          <p className="text-sm text-zinc-400 mb-6">{error || 'This user profile does not exist.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const collegeId =
    typeof profileData.college === 'object'
      ? profileData.college?._id
      : profileData.college;

  const collegeName =
    typeof profileData.college === 'object'
      ? profileData.college?.name || profileData.college?.shortName || 'College Unaffiliated'
      : profileData.college || 'College Unaffiliated';

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Main Profile Showcase Card in black palette */}
      <section className="pb-7">
        {/* Top actions & Identity banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          {/* Avatar and basic info */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-900 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white overflow-hidden">
                {profileData.profilePic ? (
                  <img
                    src={profileData.profilePic}
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  profileData.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity duration-200 cursor-pointer"
                  title="Update profile picture"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Edit Pic</span>
                </button>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a0a] flex items-center justify-center z-10">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400"></span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {profileData.name}
                </h1>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/5">
                  Verified Student
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-0.5">
                @{profileData.username}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                {collegeId ? (
                  <Link
                    to={`/college/${collegeId}`}
                    className="font-medium text-zinc-300 hover:text-white hover:underline flex items-center gap-1 transition-colors group/col"
                    title={`View ${collegeName} details`}
                  >
                    <span>{collegeName}</span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover/col:text-white transition-colors" />
                  </Link>
                ) : (
                  <span className="font-medium text-zinc-300">{collegeName}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action button (Edit if owner, Contact if viewing another student) */}
          <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-3">
            {isOwner ? (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <StartConversationButton
                recipientId={profileData._id}
                className="w-full px-5 py-2.5 sm:w-auto"
              >
                Message student
              </StartConversationButton>
            )}
          </div>
        </div>

        {/* Key Student Details Grid */}
        <div className={`grid grid-cols-2 ${isOwner ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-x-6 mt-5`}>
          <div className="py-4 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">Branch</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {profileData.branch || 'Not Specified'}
            </p>
          </div>

          <div className="py-4 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">Academic Year</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {profileData.year ? `${profileData.year} Year` : 'Not Specified'}
            </p>
          </div>

          {isOwner && <div className="py-4 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">Campus Email</span>
            </div>
             <p className="text-sm font-mono text-zinc-300 truncate" title={profileData.email}>
              {profileData.email}
            </p>
          </div>}

          <div className="py-4 border-b border-white/10 sm:border-b-0">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase">Member Since</span>
            </div>
            <p className="text-sm font-medium text-zinc-300">
              {profileData.createdAt
                ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '2026'}
            </p>
          </div>
        </div>
      </section>

      {/* Campus Goods & Textbooks Listings Section */}
      <ListingsSection
        isOwner={isOwner}
        userName={profileData.name}
        listings={profileListings}
        isLoading={listingsLoading}
        error={listingsError}
      />

      {/* Edit Profile Modal */}
      {isOwner && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={profileData}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};

export default Profile;
