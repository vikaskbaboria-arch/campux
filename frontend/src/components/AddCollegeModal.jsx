import React, { useState } from 'react';
import { X, Building2, MapPin, Globe, Check } from 'lucide-react';

const AddCollegeModal = ({ isOpen, onClose, onCollegeAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    city: '',
    state: '',
    pincode: '',
    collegeSite: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Helper to generate a valid 24-char hex MongoDB ObjectId for custom additions
  const generateObjectId = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const random = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return (timestamp + random).substring(0, 24);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.shortName.trim()) {
      setError('College name and short name are required');
      return;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      setError('City and State are required');
      return;
    }

    setLoading(true);
    try {
      const newCollege = {
        _id: generateObjectId(),
        name: formData.name.trim(),
        shortName: formData.shortName.trim().toUpperCase(),
        location: {
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        collegeSite: formData.collegeSite.trim(),
      };

      onCollegeAdded(newCollege);
      onClose();
    } catch (err) {
      setError('Failed to add college details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Add Campus / College</h3>
              <p className="text-xs text-zinc-400">Add an unlisted college to your profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
              College Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Indian Institute of Information Technology Allahabad"
              className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                Short Acronym
              </label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                placeholder="e.g. IIITA"
                className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="e.g. 211012"
                className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Prayagraj"
                className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Uttar Pradesh"
                className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
              Official Website (Optional)
            </label>
            <input
              type="text"
              name="collegeSite"
              value={formData.collegeSite}
              onChange={handleChange}
              placeholder="e.g. https://www.iiita.ac.in"
              className="w-full px-4 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select This College</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCollegeModal;
