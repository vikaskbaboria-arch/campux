import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Save, X } from 'lucide-react';
import { updateListing } from '../services/listingService';
import { getFriendlyErrorMessage } from '../utils/userFeedback';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  'Books',
  'Electronics',
  'Furniture',
  'Accessories',
  'Notes',
  'Clothing',
  'Other',
];

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished'];
const STATUSES = ['Available', 'Reserved', 'Sold'];

const EditListingModal = ({ isOpen, listing, onClose, onUpdated }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Books',
    condition: 'Used',
    status: 'Available',
  });
  const [newImages, setNewImages] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!listing || !isOpen) return;
    setFormData({
      title: listing.title || '',
      description: listing.description || '',
      price: String(listing.price ?? ''),
      category: listing.category || 'Books',
      condition: listing.condition || 'Used',
      status: listing.status || 'Available',
    });
    setNewImages([]);
    setError('');
  }, [listing, isOpen]);

  if (!isOpen || !listing) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 10);
    setNewImages(files);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Add a title and description before saving.');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Enter a price greater than zero.');
      return;
    }

    const data = new FormData();
    data.append('listingId', listing._id);
    data.append('title', formData.title.trim());
    data.append('description', formData.description.trim());
    data.append('price', String(formData.price));
    data.append('category', formData.category);
    data.append('condition', formData.condition);
    data.append('status', formData.status);
    newImages.forEach((file) => data.append('image', file));

    try {
      setSaving(true);
      const response = await updateListing(data);
      if (response?.data) onUpdated(response.data);
      onClose();
    } catch (requestError) {
      showToast(getFriendlyErrorMessage(requestError, 'Could not update this listing. Please try again.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-listing-title"
        className="my-4 max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a0a] p-5 text-zinc-100 shadow-2xl sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">Your campus listing</p>
            <h2 id="edit-listing-title" className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Edit item
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit listing"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-zinc-300">Title</span>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={120}
              className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-xs font-medium text-zinc-300">Price (₹)</span>
              <input
                name="price"
                type="number"
                min="1"
                step="1"
                value={formData.price}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-zinc-300">Category</span>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              >
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-xs font-medium text-zinc-300">Condition</span>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              >
                {CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-zinc-300">Availability</span>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              >
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-medium text-zinc-300">Description</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              maxLength={2000}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-white/30"
              required
            />
          </label>

          {listing.images?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-300">Current photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.images.map((image, index) => (
                  <img
                    key={image.publicId || image.url || index}
                    src={image.url}
                    alt={`Current listing photo ${index + 1}`}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 transition hover:border-white/30">
            <ImagePlus className="h-5 w-5 shrink-0 text-zinc-400" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-zinc-200">Replace listing photos (optional)</span>
              <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                {newImages.length
                  ? `${newImages.length} new ${newImages.length === 1 ? 'photo' : 'photos'} selected`
                  : 'Select up to 10 photos. Leave empty to keep current photos.'}
              </span>
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-white/10 px-5 py-3 text-xs font-semibold text-zinc-300 transition hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-zinc-200 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListingModal;
