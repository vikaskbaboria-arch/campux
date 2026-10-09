import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Loader2, 
  Tag, 
  IndianRupee, 
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { createListing } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
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

const AddListingModal = ({ isOpen, onClose, onListingCreated, onOpenProfileEdit }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Books',
    condition: 'Like New',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]); // array of { file, previewUrl, id }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const hasCollege = Boolean(
    user?.college &&
    (typeof user.college === 'object' ? user.college._id : user.college)
  );

  const collegeName =
    typeof user?.college === 'object'
      ? user.college.name || user.college.shortName
      : 'Assigned Campus';

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

    const filesToAdd = files.slice(0, availableSlots);
    const newItems = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (idToRemove) => {
    setSelectedFiles((prev) => {
      const filtered = prev.filter((item) => {
        if (item.id === idToRemove) {
          URL.revokeObjectURL(item.previewUrl);
          return false;
        }
        return true;
      });
      return filtered;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasCollege) {
      setError('Please add a college to your profile before creating a listing.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a listing title.');
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a short description for the item.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please upload at least 1 image of the item.');
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('price', String(formData.price));
      data.append('category', formData.category);
      data.append('condition', formData.condition);
      data.append('description', formData.description.trim());

      selectedFiles.forEach((item) => {
        data.append('images', item.file);
      });

      const res = await createListing(data);
      const createdItem = res?.data;

      showToast('Item listed successfully!', 'success');
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setSelectedFiles([]);
      setFormData({
        title: '',
        price: '',
        category: 'Books',
        condition: 'Like New',
        description: '',
      });
      if (onListingCreated) onListingCreated(createdItem);
      onClose();
    } catch (err) {
      console.error('Failed to create listing:', err);
      showToast(getFriendlyErrorMessage(err, 'Could not create the listing. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-[#0a0a0a] text-zinc-100 border border-white/10 shadow-2xl relative my-6 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.08] shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center text-white">
              <Tag className="w-5 h-5 text-zinc-200" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Post Item for Sale
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  Campus Verified
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Goods will be listed inside <span className="text-white font-medium">{collegeName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-[#0a0a0a]">
          
          {/* Missing College Alert */}
          {!hasCollege && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/20 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs">
                  You need to affiliate with a college on your profile before posting goods.
                </p>
              </div>
              {onOpenProfileEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfileEdit();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all shrink-0 cursor-pointer"
                >
                  Set College
                </button>
              ) : (
                <Link
                  to="/profile"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all shrink-0"
                >
                  Go to Profile
                </Link>
              )}
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="add-listing-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title & Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                  Item Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Higher Engineering Math B.S. Grewal"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                  Price (₹) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="price"
                    min="1"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="450"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category and Condition Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 transition-all shadow-inner cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                  Condition <span className="text-red-400">*</span>
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 transition-all shadow-inner cursor-pointer"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond} className="bg-zinc-900 text-white">
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                Item Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mention condition, edition, accessories included, and preferred handover place (e.g. library, hostel 3 lobby)..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all shadow-inner resize-none"
                required
              />
            </div>

            {/* Image Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium">
                  Product Photos <span className="text-red-400">*</span>
                </label>
                <span className="text-xs font-mono text-zinc-400">
                  {selectedFiles.length} / 10 images
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-5 text-center cursor-pointer bg-[#121212]/50 hover:bg-[#121212] transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFilesSelected}
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-2 text-zinc-400 group-hover:text-white transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Click to select photos or drag & drop
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  PNG, JPG, or WEBP up to 10MB each (max 10 photos)
                </p>
              </div>

              {/* Selected Photo Thumbnails */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative rounded-xl overflow-hidden aspect-square bg-[#121212] border border-white/10 group/img shadow-md"
                    >
                      <img
                        src={item.previewUrl}
                        alt={`Upload preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Cover image badge for first photo */}
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-mono text-white">
                          Cover
                        </span>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(item.id);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-black/80 hover:bg-red-600 text-white opacity-80 sm:opacity-0 group-hover/img:opacity-100 transition-all cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-white/[0.08] bg-[#0a0a0a] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-zinc-500 hidden sm:block">
            Listed directly to campus peers • Instant handover
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-listing-form"
              disabled={loading || !hasCollege}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Post Listing</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddListingModal;
