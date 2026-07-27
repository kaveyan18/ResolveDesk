import { useState, useRef } from 'react';
import { api } from '../../services/api';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RaiseComplaint({ onComplaintSubmitted }) {
  const [department, setDepartment] = useState('Electrical');
  const [category, setCategory] = useState('Repair');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const fileInputRef = useRef(null);

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  // Handle Image selection
  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (images.length + validFiles.length > 5) {
      setErrorMessage('You can upload a maximum of 5 images per complaint.');
      return;
    }

    const newImages = [...images, ...validFiles];
    setImages(newImages);

    // Create preview URLs
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  // Remove preview image
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setToastMessage('');

    if (!title.trim() || !description.trim() || !location.trim()) {
      setErrorMessage('Please fill in all required fields (Title, Description, and Location).');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('department', department);
      formData.append('category', category);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('location', location.trim());
      formData.append('priority', priority);

      images.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.createComplaint(formData);

      if (res.status === 'success' && res.data.complaint) {
        const ticketId = res.data.complaint.ticketId;
        setToastMessage(`Complaint submitted — ${ticketId}`);

        // Reset Form
        setTitle('');
        setDescription('');
        setLocation('');
        setPriority('Medium');
        setImages([]);
        setImagePreviews([]);

        if (onComplaintSubmitted) {
          onComplaintSubmitted(res.data.complaint);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-status-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Raise a Complaint</h1>
          <p className="text-sm text-ink-muted mt-1">
            Fill in the details below — you&apos;ll be able to track progress right after submitting.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Form Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="IT Services">IT Services</option>
                  <option value="Facility">Facility</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                >
                  <option value="Repair">Repair</option>
                  <option value="Installation">Installation</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Complaint">Complaint</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AC not cooling in Room 214"
                className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
              />
            </div>

            {/* Description with Live Character Count */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Description
              </label>
              <textarea
                rows={4}
                required
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition resize-none"
              />
              <div className="text-right text-[11.5px] text-ink-muted">
                <span className="font-mono">{500 - description.length}</span> characters left
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Block, Floor, Room no."
                  className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                />
              </div>

              {/* Priority Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Priority
                </label>
                <div className="flex gap-2">
                  {priorities.map((p) => {
                    const isSelected = priority === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition border ${
                          isSelected
                            ? 'border-brand bg-brand-soft text-brand-dark shadow-sm'
                            : 'border-surface-border bg-white text-ink hover:border-brand'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Upload Images Dropzone */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Upload Images
              </label>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-border rounded-2xl p-6 text-center cursor-pointer hover:border-brand transition bg-surface-bg/50 group"
              >
                <div className="inline-flex p-3 rounded-full bg-surface-bg group-hover:bg-brand-soft text-gray-custom group-hover:text-brand transition mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs text-ink-muted">
                  <b className="text-brand font-semibold">Click to upload</b> or drag and drop
                </div>
                <div className="text-[11.5px] text-ink-muted mt-0.5">PNG, JPG up to 10MB</div>
              </div>

              {/* Preview Thumbnails */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 pt-3">
                  {imagePreviews.map((src, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-surface-border bg-surface-bg"
                    >
                      <img
                        src={src}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-2.5 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark transition shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submit Complaint
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Card */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            Tips for a faster fix
          </h3>
          <div className="text-xs text-ink-muted space-y-2.5 leading-relaxed">
            <p>• Be specific about the exact location.</p>
            <p>• Attach a photo — routing is 2x faster with one.</p>
            <p>• Critical priority is reserved for safety issues.</p>
            <p>• You&apos;ll get a notification the moment a technician is assigned.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
