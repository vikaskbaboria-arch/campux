import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  X,
  IndianRupee,
  Tag,
  Building2,
  AlertCircle,
  Plus,
  Loader2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { createListing } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getFriendlyErrorMessage } from '../utils/userFeedback';

const CATEGORIES = [
  'Books',
  'Electronics',
  'Accessories',
  'Notes',
  'Furniture',
  'Clothing',
  'Other',
];

const CONDITIONS = [
  'Like New',
  'Used',
  'New',
  'Refurbished',
];

const CreatePost = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Books',
    condition: 'Like New',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasCollege = Boolean(
    user?.college &&
    (typeof user.college === 'object' ? user.college._id : user.college)
  );

  const collegeName =
    typeof user?.college === 'object'
      ? user.college.name || user.college.shortName
      : 'Your Assigned Campus';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError('');
    const availableSlots = 10 - selectedFiles.length;
    if (availableSlots <= 0) {
      setError('Maximum 10 images allowed per listing.');
      return;
    }

    const nextFiles = files.slice(0, availableSlots).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));

    setSelectedFiles((prev) => [...prev, ...nextFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (id) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasCollege) {
      setError('You must affiliate with a college before listing an item.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError('Price must be greater than zero.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('price', String(Number(formData.price)));
      data.append('category', formData.category);
      data.append('condition', formData.condition);
      data.append('description', formData.description.trim());

      selectedFiles.forEach((item) => {
        data.append('images', item.file);
      });

      const response = await createListing(data);
      showToast('Item posted successfully to your campus feed!', 'success');

      // Navigate to the newly created dedicated post page
      const createdId = response?._id || response?.data?._id;
      if (createdId) {
        navigate(`/post/${createdId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      setError(getFriendlyErrorMessage(err, 'Failed to publish post. Please check all fields.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#08080a] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>

          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            <Sparkles className="h-3 w-3" /> Dedicated Post Page
          </span>
        </div>

        {/* Header matching template */}
        <div className="border-b border-white/[0.08] pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Post an Item for Campus Sale
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
            List your textbooks, scientific calculators, dorm essentials, and electronics for verified students in your college.
          </p>
        </div>

        {/* Missing College Warning */}
        {!hasCollege && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-xs text-red-300 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">College affiliation required</p>
              <p className="mt-1 text-zinc-400">
                You must select your university college before posting. Visit your profile to set your college.
              </p>
              <Link
                to="/profile"
                className="inline-block mt-2 font-semibold underline text-red-200 hover:text-white"
              >
                Go to Profile Settings
              </Link>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Posting Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos Upload Section */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Item Photos</h3>
                <p className="text-xs text-zinc-400">Upload up to 10 photos of your item.</p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {selectedFiles.length} / 10
              </span>
            </div>

            {/* Upload Area / Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-amber-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-amber-500/[0.02]"
            >
              <UploadCloud className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
              <p className="text-xs font-medium text-zinc-300">
                Click to browse or upload images
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                PNG, JPG, WEBP up to 5MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesSelected}
                className="hidden"
              />
            </div>

            {/* Thumbnail preview grid */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {selectedFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group bg-zinc-900"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono px-1.5 py-0.5 rounded text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Item Information</h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Item Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Higher Engineering Mathematics - B.S. Grewal (8th Edition)"
                maxLength={100}
                required
                className="w-full rounded-xl border border-white/10 bg-[#16161b] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500/70 focus:outline-none transition-colors"
              />
            </div>

            {/* Category & Condition Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#16161b] px-3.5 py-2.5 text-xs text-white focus:border-amber-500/70 focus:outline-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#16161b] px-3.5 py-2.5 text-xs text-white focus:border-amber-500/70 focus:outline-none cursor-pointer"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond} className="bg-zinc-900 text-white">
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Price (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="350"
                  min="1"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#16161b] pl-8 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500/70 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mention condition details, semester it was used in, whether price is negotiable, and preferred campus pickup location..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl border border-white/10 bg-[#16161b] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500/70 focus:outline-none transition-colors resize-y"
              />
              <p className="text-[10px] text-zinc-500 text-right mt-1">
                {formData.description.length} / 1000 characters
              </p>
            </div>
          </div>

          {/* Campus Location Confirmation */}
          <div className="rounded-xl border border-white/[0.08] bg-[#121215] p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-zinc-300">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span>Listing will be visible to students of:</span>
            </div>
            <span className="font-semibold text-white bg-zinc-800/80 px-2.5 py-1 rounded-md border border-white/10">
              {collegeName}
            </span>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !hasCollege}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing Post...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Publish Campus Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
