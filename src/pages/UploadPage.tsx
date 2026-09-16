import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Upload, Camera, Film, Trash2, ArrowRight, ChevronLeft, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageEditor from '../components/ImageEditor';
import { Session } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import apiClient from '../api/apiClient';

function ImagePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <img src={url || undefined} alt={file.name} className="w-full h-full object-contain" />;
}

const UploadPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [images, setImages] = useState<File[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const { data: session, isPending: sessionLoading, isError: sessionError, refetch: retrySession } = useQuery<Session>({
    queryKey: ['sessions', id],
    queryFn: async () => (await apiClient.get(`/sessions/${id}`)).data.data,
  });
  const [video, setVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!video) { setVideoPreview(''); return; }
    const url = URL.createObjectURL(video);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      e.target.value = '';
      if (filesArray.some(file => !['image/jpeg', 'image/png'].includes(file.type))) {
        return toast.error('Please choose JPG or PNG images');
      }
      if (images.length + filesArray.length > 20) {
        return toast.error(`You can add ${20 - images.length} more photos (20 maximum)`);
      }
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
      e.target.value = '';
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

    if (sessionLoading || sessionError) return toast.error('Load the session before uploading.');
    if (video && session?.videoUrl && !window.confirm('Replace the current video? It will be removed only after the new video is saved successfully.')) return;
    setUploading(true);
    setProgress(0);
    const totalBytes = images.reduce((sum, file) => sum + file.size, 0) + (video?.size || 0);
    let completedBytes = 0;
    let photosSaved = false;
    const reportProgress = (loaded: number) => setProgress(Math.min(99, Math.round((completedBytes + loaded) / Math.max(totalBytes, 1) * 100)));

    try {
      // 1. Upload photos first
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append('files', img));
        await apiClient.post(`/sessions/${id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: event => reportProgress(event.loaded),
        });
        completedBytes = images.reduce((sum, file) => sum + file.size, 0);
        photosSaved = true;
        setImages([]);
      }

      // 2. Upload video timelapse
      if (video) {
        const formData = new FormData();
        formData.append('file', video);
        await apiClient.post(`/sessions/${id}/video`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: event => reportProgress(event.loaded),
        });
        setVideo(null);
      }
      setProgress(100);
      toast.success('All files uploaded successfully! 🎉');
      navigate(`/sessions/${id}`);
    } catch (err) {
      toast.error(photosSaved ? 'Photos saved. Video failed — retry to upload only the video.' : 'Upload failed. Your selected files are still available to retry.');
    } finally {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'sessions'] });
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {editingIndex !== null && images[editingIndex] && <ImageEditor source={images[editingIndex]} onClose={() => setEditingIndex(null)} onSave={file => { setImages(current => current.map((item, index) => index === editingIndex ? file : item)); }} />}
      <Link to={`/sessions/${id}`} className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-colors dark:text-stone-400">
        <ChevronLeft className="w-4 h-4" />
        <span>Cancel</span>
      </Link>

      <div className="flex flex-col">
        <h2 className="text-3xl font-extrabold text-stone-850 dark:text-white tracking-tight flex items-center gap-2">
          <Upload className="w-8 h-8 text-couple-500" />
          <span>Upload Media files</span>
        </h2>
        <p className="text-stone-500 text-sm mt-1 dark:text-stone-400">
          Add up to 20 photos (max 10MB/each) and a single MP4 behind-the-scenes video (max 100MB).
        </p>
      </div>

      <fieldset disabled={uploading} aria-busy={uploading} className="glassmorphism min-w-0 rounded-3xl p-6 md:p-8 border border-couple-100/50 shadow-md flex flex-col gap-6">
        {/* Images uploader area */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 dark:text-stone-400">
            <Camera className="w-4 h-4" />
            <span>Select Photos ({images.length}/20)</span>
          </span>
          <div
            role="button" tabIndex={uploading ? -1 : 0} aria-label="Choose photos"
            onKeyDown={e => { if (!uploading && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); imageInputRef.current?.click(); } }}
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-couple-300 dark:hover:border-couple-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-white/60 dark:bg-stone-900/60"
          >
            <Upload className="w-10 h-10 text-stone-500 mb-3 dark:text-stone-400" />
            <span className="text-sm font-bold text-stone-600 dark:text-stone-300">Click to browse photos</span>
            <span className="text-xs text-stone-500 mt-1 dark:text-stone-400">Supports PNG, JPG, JPEG (Max 10MB)</span>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
            />
          </div>

          {/* Images preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 bg-stone-50 dark:bg-stone-900/40 p-4 rounded-2xl border border-stone-200/50 dark:border-stone-800">
              {images.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900">
                  <div className="aspect-square"><ImagePreview file={img} /></div>
                  <div className="flex flex-wrap items-center justify-between gap-1 p-2">
                  <button type="button" onClick={() => setEditingIndex(i)} className="secondary-button !px-2" aria-label={`Edit ${img.name}`}><Edit className="w-4 h-4" />Edit</button>
                  <button
                    aria-label={`Remove ${img.name}`}
                    onClick={() => removeImage(i)}
                    className="p-3 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video uploader area */}
        <div className="flex flex-col gap-2 border-t border-stone-100 dark:border-stone-800/80 pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 dark:text-stone-400">
            <Film className="w-4 h-4" />
            <span>Timelapse Video (Optional)</span>
          </span>
          {sessionLoading && <p className="muted text-sm">Loading current video…</p>}
          {sessionError && <div role="alert" className="muted text-sm">Could not load the current video. <button className="underline" onClick={() => retrySession()}>Try again</button></div>}
          {session?.videoUrl && !video && <div className="space-y-2"><p className="muted text-sm">Current video</p><VideoPlayer src={session.videoUrl} poster={session.videoThumbnailUrl} /></div>}
          {videoPreview && <VideoPlayer src={videoPreview} />}
          {video && session?.videoUrl && <p className="text-sm text-amber-700 dark:text-amber-300">This selection will replace the current video when you upload. The current video stays available until the replacement succeeds.</p>}
          {video ? (
            <div className="p-4 bg-couple-50/50 dark:bg-couple-950/15 border border-couple-100 dark:border-couple-900 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <Film className="w-5 h-5 text-couple-500 animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-stone-700 dark:text-stone-300 break-all">
                    {video.name}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
              <button
                aria-label="Remove video"
                onClick={() => setVideo(null)}
                className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors dark:text-stone-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              role="button" tabIndex={uploading ? -1 : 0} aria-label="Choose MP4 video"
              onKeyDown={e => { if (!uploading && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); videoInputRef.current?.click(); } }}
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-couple-300 dark:hover:border-couple-800 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-white/60 dark:bg-stone-900/60"
            >
              <Film className="w-8 h-8 text-stone-500 mb-2 dark:text-stone-400" />
              <span className="text-sm font-bold text-stone-600 dark:text-stone-300">{session?.videoUrl ? 'Choose replacement video' : 'Choose MP4 video'}</span>
              <span className="text-xs text-stone-500 mt-1 dark:text-stone-400">Maximum size 100MB</span>
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
            <div className="flex justify-between text-xs text-stone-500 font-bold uppercase tracking-wider dark:text-stone-400">
              <span>{progress >= 99 ? 'Processing files…' : 'Uploading files…'}</span>
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
          disabled={uploading || sessionLoading || sessionError || (images.length === 0 && !video)}
          className="w-full bg-couple-500 hover:bg-couple-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50 flex justify-center items-center gap-1.5"
        >
          <span>{uploading ? 'Uploading…' : 'Start uploading'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </fieldset>
    </div>
  );
};

export default UploadPage;
