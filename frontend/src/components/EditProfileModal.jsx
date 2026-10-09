import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Building2, 
  Search, 
  Plus, 
  ChevronDown, 
  Loader2, 
  Plus as PlusIcon, 
  Trash2, 
  Link as LinkIcon 
} from 'lucide-react';
import AddCollegeModal from './AddCollegeModal';
import { searchColleges, getCollegeById } from '../services/collegeService';
import { useAuth } from '../context/AuthContext';
import { getFriendlyErrorMessage } from '../utils/userFeedback';
import { useToast } from '../context/ToastContext';

const BRANCHES = [
  { value: 'CSE', label: 'Computer Science (CSE)' },
  { value: 'IT', label: 'Information Technology (IT)' },
  { value: 'ECE', label: 'Electronics & Communication (ECE)' },
  { value: 'EEE', label: 'Electrical & Electronics (EEE)' },
  { value: 'MECH', label: 'Mechanical Engineering (MECH)' },
  { value: 'CIVIL', label: 'Civil Engineering (CIVIL)' },
  { value: 'CHEMICAL', label: 'Chemical Engineering (CHEMICAL)' },
  { value: 'BIOTECH', label: 'Biotechnology (BIOTECH)' },
  { value: 'AEROSPACE', label: 'Aerospace Engineering (AEROSPACE)' },
  { value: 'METALLURGY', label: 'Metallurgical Engineering (METALLURGY)' },
];

const YEARS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    branch: '',
    year: '',
    password: '',
  });

  // Profile picture state
  const fileInputRef = useRef(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isPicRemoved, setIsPicRemoved] = useState(false);

  // Security & Settings state matching screenshot
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [twoStepVerification, setTwoStepVerification] = useState(false);
  const [supportAccess, setSupportAccess] = useState(true);

  // College selection state
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [collegesList, setCollegesList] = useState([]);
  const [isFetchingColleges, setIsFetchingColleges] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial populate from user
  useEffect(() => {
    if (user && isOpen) {
      const nameParts = (user.name || '').trim().split(' ');
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName: first,
        lastName: last,
        username: user.username || '',
        email: user.email || '',
        branch: user.branch || '',
        year: user.year ? String(user.year) : '',
        password: '',
      });

      setProfilePicFile(null);
      setProfilePicPreview(user.profilePic || '');
      setProfilePicUrl(user.profilePic || '');
      setIsPicRemoved(false);
      setShowUrlInput(false);
      setIsEditingEmail(false);
      setShowPasswordChange(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Handle user's existing college
      if (user.college) {
        if (typeof user.college === 'object' && user.college._id) {
          setSelectedCollege(user.college);
        } else {
          getCollegeById(user.college)
            .then((col) => {
              if (col) setSelectedCollege(col);
              else setSelectedCollege({ _id: user.college, name: 'Assigned College' });
            })
            .catch(() => {
              setSelectedCollege({ _id: user.college, name: 'Assigned College' });
            });
        }
      } else {
        setSelectedCollege(null);
      }

      setCollegeSearchQuery('');
      setShowCollegeDropdown(false);
    }
  }, [user, isOpen]);

  // Clean up blob URL on preview change or unmount
  useEffect(() => {
    return () => {
      if (profilePicPreview && profilePicPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicPreview);
      }
    };
  }, [profilePicPreview]);

  // Fetch colleges from backend route as user searches
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchFromRoute = async () => {
      setIsFetchingColleges(true);
      try {
        const fetched = await searchColleges(collegeSearchQuery);
        if (isMounted) {
          setCollegesList(fetched);
        }
      } catch (err) {
        console.warn('Failed to fetch colleges from backend route:', err.message);
        if (isMounted) {
          setCollegesList([]);
        }
      } finally {
        if (isMounted) {
          setIsFetchingColleges(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchFromRoute, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [collegeSearchQuery, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be under 5MB');
      return;
    }

    setError('');
    setProfilePicFile(file);
    setIsPicRemoved(false);
    const objectUrl = URL.createObjectURL(file);
    setProfilePicPreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setProfilePicFile(null);
    setProfilePicPreview('');
    setProfilePicUrl('');
    setIsPicRemoved(true);
    setShowUrlInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectCollege = (college) => {
    setSelectedCollege(college);
    setShowCollegeDropdown(false);
    setCollegeSearchQuery('');
  };

  const handleCustomCollegeAdded = (newCollege) => {
    setCollegesList((prev) => [newCollege, ...prev]);
    setSelectedCollege(newCollege);
    setShowCollegeDropdown(false);
  };

  const handleLogoutAccount = async () => {
    if (window.confirm('Are you sure you want to log out of your session?')) {
      onClose();
      await logout();
    }
  };

  const handleDeleteAccount = () => {
    alert(
      'To permanently delete your student account and all listings, please submit a request to support@campux.edu or contact campus admin.'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const textChanges = {};

    // Combine First & Last Name
    const combinedName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    if (combinedName && combinedName !== (user?.name || '')) {
      textChanges.name = combinedName;
    }

    if (formData.username.trim().toLowerCase() !== (user?.username || '').toLowerCase()) {
      textChanges.username = formData.username.trim().toLowerCase();
    }

    if (formData.email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
      textChanges.email = formData.email.trim().toLowerCase();
    }

    if (formData.branch !== (user?.branch || '')) {
      textChanges.branch = formData.branch;
    }

    if (formData.year !== (user?.year ? String(user.year) : '')) {
      textChanges.year = Number(formData.year);
    }

    // Send college _id to backend
    const currentCollegeId = typeof user?.college === 'object' ? user.college?._id : user?.college;
    if (selectedCollege?._id && selectedCollege._id !== currentCollegeId) {
      textChanges.college = selectedCollege._id;
    }

    if (showPasswordChange && formData.password.trim()) {
      if (formData.password.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }
      textChanges.password = formData.password;
    }

    let payload;

    if (profilePicFile) {
      const data = new FormData();
      data.append('profilePic', profilePicFile);
      Object.entries(textChanges).forEach(([key, val]) => {
        data.append(key, val);
      });
      payload = data;
    } else {
      payload = { ...textChanges };
      if (isPicRemoved && user?.profilePic) {
        payload.profilePic = '';
      } else if (showUrlInput && profilePicUrl.trim() !== (user?.profilePic || '')) {
        payload.profilePic = profilePicUrl.trim();
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }
    }

    try {
      setLoading(true);
      await onSave(payload);
      onClose();
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Could not update your profile. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="w-full max-w-2xl sm:max-w-3xl rounded-2xl sm:rounded-3xl bg-[#0a0a0a] text-zinc-100 border border-white/10 shadow-2xl relative my-6 max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header matching screenshot layout in Campux dark theme */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.08] shrink-0 bg-[#0a0a0a]">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              My Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable form body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-7 flex-1 bg-[#0a0a0a]">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-7">
              {/* Profile Image Section matching screenshot */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Squircle Avatar */}
                <div className="w-20 h-20 rounded-2xl sm:rounded-3xl bg-[#121212] border border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-inner overflow-hidden shrink-0">
                  {profilePicPreview ? (
                    <img
                      src={profilePicPreview}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setProfilePicPreview('')}
                    />
                  ) : (
                    formData.firstName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>

                {/* Image Buttons & Helper text */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Change Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-medium transition-all cursor-pointer"
                    >
                      Remove Image
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-xs text-zinc-400 hover:text-white underline transition-colors cursor-pointer"
                    >
                      {showUrlInput ? 'Hide URL input' : 'Or paste URL'}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="pt-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={profilePicUrl}
                          onChange={(e) => {
                            setProfilePicUrl(e.target.value);
                            setProfilePicPreview(e.target.value);
                            setProfilePicFile(null);
                            setIsPicRemoved(false);
                          }}
                          placeholder="https://example.com/avatar.jpg"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#08080a] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white/30"
                        />
                        <LinkIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 font-normal">
                    We support PNGs, JPEGs and GIFs under 2MB
                  </p>
                </div>
              </div>

              {/* Name fields row: First Name and Last Name matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* Campus Credentials Section (College, Username, Branch, Year) */}
              <div className="pt-2">
                <div className="pb-3 border-b border-white/[0.08] mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Campus Credentials
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Username & College selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors shadow-inner"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium">
                          College Affiliation
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddCollegeModal(true)}
                          className="text-xs text-white hover:text-zinc-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Add Unlisted</span>
                        </button>
                      </div>

                      {/* Selected College Button */}
                      {selectedCollege ? (
                        <div className="p-2.5 rounded-xl border border-white/10 bg-zinc-900/80 flex items-center justify-between gap-2">
                          <div className="truncate pr-1">
                            <p className="text-xs sm:text-sm font-semibold text-white truncate">
                              {selectedCollege.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {selectedCollege.location?.city
                                ? `${selectedCollege.location.city}, ${selectedCollege.location.state}`
                                : 'Assigned Campus'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCollegeDropdown(true);
                              setCollegeSearchQuery('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCollegeDropdown(true)}
                          className="w-full px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-zinc-400 hover:text-white hover:border-white/40 text-xs sm:text-sm flex items-center justify-between transition-colors bg-[#08080a] cursor-pointer"
                        >
                          <span>Select your college campus...</span>
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        </button>
                      )}

                      {/* Dropdown search */}
                      {showCollegeDropdown && (
                        <div className="mt-2 p-3 rounded-2xl bg-[#08080a] border border-white/15 shadow-xl space-y-2.5">
                          <div className="relative">
                            <input
                              type="text"
                              value={collegeSearchQuery}
                              onChange={(e) => setCollegeSearchQuery(e.target.value)}
                              placeholder="Search colleges by name or city..."
                              autoFocus
                              className="w-full pl-8 pr-7 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                            />
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            {isFetchingColleges && (
                              <Loader2 className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" />
                            )}
                          </div>

                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {collegesList.length > 0 ? (
                              collegesList.map((col) => {
                                const isSelected = selectedCollege?._id === col._id;
                                return (
                                  <div
                                    key={col._id}
                                    onClick={() => handleSelectCollege(col)}
                                    className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                                      isSelected ? 'bg-zinc-800 font-semibold text-white border border-white/10' : 'hover:bg-zinc-900 text-zinc-300'
                                    }`}
                                  >
                                    <div className="truncate pr-2">
                                      <p className="truncate">{col.name}</p>
                                      {col.location?.city && (
                                        <p className="text-[10px] text-zinc-500">
                                          {col.location.city}, {col.location.state}
                                        </p>
                                      )}
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="py-3 text-center text-xs text-zinc-500">
                                {isFetchingColleges ? 'Searching colleges...' : 'No matching colleges found.'}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setShowCollegeDropdown(false)}
                              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Branch & Academic Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                        Engineering Branch
                      </label>
                      <select
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 shadow-inner cursor-pointer"
                      >
                        <option value="" className="bg-[#121316]">Select Branch</option>
                        {BRANCHES.map((b) => (
                          <option key={b.value} value={b.value} className="bg-[#121316]">
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                        Academic Year
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 shadow-inner cursor-pointer"
                      >
                        <option value="" className="bg-[#121316]">Select Year</option>
                        {YEARS.map((y) => (
                          <option key={y.value} value={y.value} className="bg-[#121316]">
                            {y.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Security Section matching screenshot */}
              <div className="pt-2">
                <div className="pb-3 border-b border-white/[0.08] mb-5">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Account Security
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* Email with "Change email" button */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                      Email
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditingEmail}
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-sm transition-colors shadow-inner ${
                          isEditingEmail 
                            ? 'bg-[#08080a] border-white/40 text-white focus:outline-none' 
                            : 'bg-zinc-900/60 border-white/10 text-zinc-400'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingEmail(!isEditingEmail)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                      >
                        {isEditingEmail ? 'Lock email' : 'Change email'}
                      </button>
                    </div>
                  </div>

                  {/* Password with "Change password" button */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                      Password
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {showPasswordChange ? (
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter new password (min 6 chars)"
                          autoFocus
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/40 text-sm text-white focus:outline-none shadow-inner"
                        />
                      ) : (
                        <input
                          type="text"
                          value="••••••••••••"
                          disabled
                          className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-500 bg-zinc-900/60 shadow-inner tracking-widest"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(!showPasswordChange);
                          if (showPasswordChange) {
                            setFormData((p) => ({ ...p, password: '' }));
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                      >
                        {showPasswordChange ? 'Cancel' : 'Change password'}
                      </button>
                    </div>
                  </div>

                  {/* 2-Step Verifications with toggle switch matching screenshot */}
                  <div className="flex items-center justify-between py-2 gap-4">
                    <div className="pr-2">
                      <p className="text-xs sm:text-sm font-medium text-white">
                        2-Step Verifications
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Add an additional layer of security to your account during login.
                      </p>
                    </div>
                    {/* Toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={twoStepVerification}
                      onClick={() => setTwoStepVerification(!twoStepVerification)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoStepVerification ? 'bg-white' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
                          twoStepVerification ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Support Access Section matching screenshot */}
              <div className="pt-2">
                <div className="pb-3 border-b border-white/[0.08] mb-5">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Support Access
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* Support access row with toggle */}
                  <div className="flex items-center justify-between py-1 gap-4">
                    <div className="pr-2">
                      <p className="text-xs sm:text-sm font-medium text-white">
                        Support access
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        You have granted us to access to your account for support purposes until Aug 31, 2026, 9:40 PM.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={supportAccess}
                      onClick={() => setSupportAccess(!supportAccess)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${
                        supportAccess ? 'bg-white' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
                          supportAccess ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Log out of all devices matching screenshot */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-1 gap-3">
                    <div className="pr-2">
                      <p className="text-xs sm:text-sm font-medium text-white">
                        Log out of all devices
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Log out of all other active sessions on other devices besides this one.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoutAccount}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      Log out
                    </button>
                  </div>

                  {/* Delete my account matching screenshot */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-1 gap-3">
                    <div className="pr-2">
                      <p className="text-xs sm:text-sm font-medium text-red-400">
                        Delete my account
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Permanently delete the account and remove access from all workspaces.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/20 hover:border-red-500/40 text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Modal bottom action bar in stealth dark UI */}
          <div className="px-6 sm:px-8 py-4 border-t border-white/[0.08] bg-[#0a0a0a] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-profile-form"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add College Modal */}
      <AddCollegeModal
        isOpen={showAddCollegeModal}
        onClose={() => setShowAddCollegeModal(false)}
        onCollegeAdded={handleCustomCollegeAdded}
      />
    </>
  );
};

export default EditProfileModal;
