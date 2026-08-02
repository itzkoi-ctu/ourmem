import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Upload, Camera, Film, Trash2, ArrowRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/apiClient';

const UploadPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Validate sizes
      const oversized = filesArray.some((file) => file.size > 10 * 1024 * 1024);
      if (oversized) {
        return toast.error('Each image must be less than 10MB');
      }
      setImages((prev) => [...prev, ...filesArray].slice(0, 20)); // Limit to 20
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        return toast.error('Video must be less than 100MB');
      }
      if (file.type !== 'video/mp4') {
        return toast.error('Only MP4 format video timelapse is allowed');
      }
      setVideo(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (images.length === 0 && !video) {
      return toast.error('Please select at least 1 image or video');
    }

    setUploading(true);
    setProgress(10);

    try {
      // 1. Upload photos first
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append('files', img));
        await apiClient.post(`/sessions/${id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setProgress(50);

      // 2. Upload video timelapse
      if (video) {
        const formData = new FormData();
        formData.append('file', video);
        await apiClient.post(`/sessions/${id}/video`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setProgress(100);
      toast.success('All files uploaded successfully! 🎉');
      navigate(`/sessions/${id}`);
    } catch (err) {
      toast.error('Upload failed. Check your file types and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Link to={`/sessions/${id}`} className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span>Cancel</span>
      </Link>

      <div className="flex flex-col">
        <h2 className="text-3xl font-extrabold text-stone-850 dark:text-white tracking-tight flex items-center gap-2">
          <Upload className="w-8 h-8 text-couple-500" />
          <span>Upload Media files</span>
        </h2>
        <p className="text-stone-400 text-sm mt-1">
          Add up to 20 photos (max 10MB/each) and a single MP4 behind-the-scenes video (max 100MB).
        </p>
      </div>

      <div className="glassmorphism rounded-3xl p-6 md:p-8 border border-couple-100/50 shadow-md flex flex-col gap-6">
        {/* Images uploader area */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Camera className="w-4 h-4" />
            <span>Select Photos ({images.length}/20)</span>
          </span>
          <div
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-couple-300 dark:hover:border-couple-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-white/40"
          >
            <Upload className="w-10 h-10 text-stone-400 animate-bounce mb-3" />
            <span className="text-sm font-bold text-stone-600 dark:text-stone-300">Click to browse photos</span>
            <span className="text-xs text-stone-400 mt-1">Supports PNG, JPG, JPEG (Max 10MB)</span>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {/* Images preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-3 bg-stone-50 dark:bg-stone-900/40 p-4 rounded-2xl border border-stone-200/50 dark:border-stone-800">
              {images.map((img, i) => (
                <div key={i} className="aspect-square relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 group shadow-sm bg-white">
                  <img
                    src={URL.createObjectURL(img)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video uploader area */}
        <div className="flex flex-col gap-2 border-t border-stone-100 dark:border-stone-800/80 pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Film className="w-4 h-4" />
            <span>Timelapse Video (Optional)</span>
          </span>
          {video ? (
            <div className="p-4 bg-couple-50/50 dark:bg-couple-950/15 border border-couple-100 dark:border-couple-900 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-couple-500 animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-stone-700 dark:text-stone-300 truncate max-w-sm">
                    {video.name}
                  </span>
                  <span className="text-xs text-stone-400">{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
              <button
                onClick={() => setVideo(null)}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-couple-300 dark:hover:border-couple-800 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-white/40"
            >
              <Film className="w-8 h-8 text-stone-400 mb-2" />
              <span className="text-sm font-bold text-stone-600 dark:text-stone-300">Choose MP4 video</span>
              <span className="text-xs text-stone-400 mt-1">Maximum size 100MB</span>
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoChange}
                accept="video/mp4"
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between text-xs text-stone-400 font-bold uppercase tracking-wider">
              <span>Uploading files...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700">
              <div
                className="h-full bg-gradient-to-r from-couple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-couple-500 hover:bg-couple-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50 flex justify-center items-center gap-1.5"
        >
          <span>Start Uploading</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default UploadPage;
