import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Edit, Trash2, Upload, Music, ChevronLeft, Lock, Eye, Film, MessageCircle, Heart, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '../api/apiClient';
import { Session, Photo, LoveNote } from '../types';

const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Fetch session
  const { data: session, isLoading: sessionLoading } = useQuery<Session>({
    queryKey: ['sessions', id],
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${id}`);
      return res.data.data;
    },
  });

  // Fetch photos
  const { data: photos, isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ['sessions', id, 'photos'],
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${id}/photos`);
      return res.data.data;
    },
  });

  // Toggle session public status
  const togglePublicMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/sessions/${id}/toggle-public`);
      return res.data.data;
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(['sessions', id], updatedSession);
      toast.success(updatedSession.isPublic ? 'Session made Public 🌍' : 'Session made Private 🔒');
    },
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/sessions/${id}`);
    },
    onSuccess: () => {
      toast.success('Session deleted successfully');
      navigate('/');
    },
  });

  // Delete photo
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      await apiClient.delete(`/sessions/${id}/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', id, 'photos'] });
      toast.success('Photo deleted');
    },
  });

  // Set session cover photo
  const setCoverPhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const res = await apiClient.patch(`/sessions/${id}/cover/${photoId}`);
      return res.data.data;
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(['sessions', id], updatedSession);
      toast.success('Cover photo updated');
    },
  });

  // Toggle photo reaction
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ photoId, emoji }: { photoId: string; emoji: string }) => {
      const res = await apiClient.post(`/photos/${photoId}/reactions`, { emoji });
      return { photoId, reactions: res.data.data };
    },
    onSuccess: (data) => {
      // Update reactions locally in photo list
      queryClient.setQueryData(['sessions', id, 'photos'], (oldPhotos: Photo[] | undefined) => {
        if (!oldPhotos) return [];
        return oldPhotos.map((p) =>
          p.id === data.photoId ? { ...p, reactions: data.reactions } : p
        );
      });
      if (activePhoto && activePhoto.id === data.photoId) {
        setActivePhoto((prev) => (prev ? { ...prev, reactions: data.reactions } : null));
      }
    },
  });

  // Add love note
  const addNoteMutation = useMutation({
    mutationFn: async ({ photoId, content }: { photoId: string; content: string }) => {
      const res = await apiClient.post(`/photos/${photoId}/notes`, { content });
      return res.data.data;
    },
    onSuccess: (note, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', id, 'photos'] });
      setNewNote('');
      setAddingNote(false);
      // Refresh active photo data if open
      if (activePhoto && activePhoto.id === variables.photoId) {
        setActivePhoto((prev) =>
          prev ? { ...prev, loveNotes: [note, ...(prev.loveNotes || [])] } : null
        );
      }
      toast.success('Note added ❤️');
    },
  });

  // Delete love note
  const deleteNoteMutation = useMutation({
    mutationFn: async ({ photoId, noteId }: { photoId: string; noteId: string }) => {
      await apiClient.delete(`/photos/${photoId}/notes/${noteId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', id, 'photos'] });
      if (activePhoto && activePhoto.id === variables.photoId) {
        setActivePhoto((prev) =>
          prev
            ? { ...prev, loveNotes: prev.loveNotes.filter((n) => n.id !== variables.noteId) }
            : null
        );
      }
      toast.success('Note deleted');
    },
  });

  const handleDeleteSession = () => {
    if (window.confirm('Are you sure you want to delete this entire session and all photos? This cannot be undone.')) {
      deleteSessionMutation.mutate();
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !activePhoto) return;
    addNoteMutation.mutate({ photoId: activePhoto.id, content: newNote });
  };

  if (sessionLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="w-8 h-8 border-4 border-couple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-stone-500">Session not found</h3>
        <Link to="/" className="text-couple-500 hover:underline mt-2 inline-block">Back to timeline</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header controls */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to chest</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => togglePublicMutation.mutate()}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
              session.isPublic
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-900 border border-stone-800'
            }`}
          >
            {session.isPublic ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{session.isPublic ? 'Publicly Shared' : 'Keep Private'}</span>
          </button>
          <Link
            to={`/sessions/${session.id}/edit`}
            className="p-2 rounded-full bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 transition-colors shadow-sm"
            title="Edit details"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDeleteSession}
            className="p-2 rounded-full bg-red-50 text-red-500 dark:bg-red-950/20 hover:bg-red-100 transition-colors shadow-sm"
            title="Delete session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main details hero */}
      <div className="glassmorphism rounded-3xl p-6 md:p-8 border border-couple-100/50 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden">
        {/* Decorative backdrop */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 text-[#FFB6C1]/5 dark:text-couple-500/5 pointer-events-none select-none">
          <Film className="w-64 h-64 fill-current" />
        </div>

        <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-stone-850 flex-shrink-0 bg-stone-100">
          <img
            src={session.coverPhotoUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500'}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-3 relative z-10 w-full">
          {session.moodTag && (
            <span className="self-start text-[10px] font-extrabold uppercase tracking-wider text-couple-500 bg-couple-50 dark:bg-couple-950/30 px-3 py-1 rounded-full border border-couple-100/30">
              Mood: {session.moodTag}
            </span>
          )}
          <h2 className="text-3xl font-extrabold text-stone-800 dark:text-white leading-tight">
            {session.title}
          </h2>
          {session.description && (
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-2xl">
              {session.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-stone-100 dark:border-stone-800/60 pt-4 mt-2">
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold">
              <Calendar className="w-4 h-4 text-couple-500" />
              <span>{session.sessionDate}</span>
            </div>
            {session.location && (
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                <MapPin className="w-4 h-4 text-couple-500" />
                <span>{session.location}</span>
              </div>
            )}
            {session.spotifyLink && (
              <a
                href={session.spotifyLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-500 hover:text-emerald-600 text-xs font-bold transition-colors bg-emerald-50 dark:bg-emerald-950/30 py-1 px-3 rounded-full"
              >
                <Music className="w-3.5 h-3.5 fill-current" />
                <span>Spotify Playlist</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. Timelapse section if attached */}
      {session.videoUrl && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold">
            <Film className="w-5 h-5 text-couple-500" />
            <h3>Behind-the-Scenes Timelapse</h3>
          </div>
          <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-md bg-stone-900 border border-stone-200 dark:border-stone-800 relative group">
            <video
              src={session.videoUrl}
              poster={session.videoThumbnailUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 4. Photos section */}
      <div className="flex flex-col gap-4 border-t border-stone-100 dark:border-stone-800 pt-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-700 dark:text-stone-300">
            Recorded Photobooth Strips ({photos?.length || 0})
          </h3>
          <Link
            to={`/sessions/${session.id}/upload`}
            className="flex items-center gap-1.5 bg-couple-500 text-white py-2 px-4 rounded-full text-xs font-bold hover:bg-couple-600 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Files</span>
          </Link>
        </div>

        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-stone-100 dark:bg-stone-900" />
            ))}
          </div>
        ) : photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {photos.map((photo) => (
              (() => {
                const isCurrentCover = !!session.coverPhotoUrl && photo.thumbnailUrl === session.coverPhotoUrl;

                return (
              <div
                key={photo.id}
                onClick={() => setActivePhoto(photo)}
                className="bg-white dark:bg-stone-900 border-4 border-white dark:border-stone-850 shadow-md hover:shadow-lg transition-shadow cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Overlay hover effect */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-between w-full">
                    <div className="flex items-center gap-2">
                      {isCurrentCover ? (
                        <span className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-couple-500 text-white flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Cover
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverPhotoMutation.mutate(photo.id);
                          }}
                          className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-white/90 text-stone-800 hover:bg-white transition-colors"
                        >
                          Set as cover
                        </button>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this photo?')) deletePhotoMutation.mutate(photo.id);
                      }}
                      className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 w-full text-white text-xs leading-snug">
                    {photo.caption && <p className="line-clamp-2 italic font-medium">"{photo.caption}"</p>}
                    <div className="flex items-center gap-2 mt-1 border-t border-white/20 pt-1">
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3 fill-current" />
                        {photo.loveNotes?.length || 0}
                      </span>
                      <span className="flex items-center gap-0.5 text-couple-300">
                        <Heart className="w-3 h-3 fill-current" />
                        {photo.reactions?.reduce((acc, r) => acc + r.count, 0) || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-stone-900/40 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center">
            <span className="text-sm text-stone-400 font-semibold">No photos uploaded to this session yet.</span>
          </div>
        )}
      </div>

      {/* 5. Lightbox Modal */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-full hover:bg-stone-900/45 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col lg:flex-row max-w-5xl w-full bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-2xl h-[90vh] md:h-[80vh] border border-stone-100 dark:border-stone-800">
              {/* Photo side */}
              <div className="flex-1 bg-stone-950 flex items-center justify-center p-4 relative group h-[45%] lg:h-full">
                <img
                  src={activePhoto.originalUrl}
                  alt={activePhoto.caption}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />

                {/* Left/Right controls can go here */}
              </div>

              {/* Interactive sidebar */}
              <div className="w-full lg:w-96 flex flex-col h-[55%] lg:h-full border-t lg:border-t-0 lg:border-l border-stone-100 dark:border-stone-800">
                <div className="p-4 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                    Uploaded by {activePhoto.uploadedByName}
                  </span>
                  <p className="mt-1 font-bold text-stone-800 dark:text-stone-100 leading-tight">
                    {activePhoto.caption || <span className="text-stone-400 italic font-medium">No caption set</span>}
                  </p>
                  
                  {/* Reactions bar */}
                  <div className="flex gap-2 mt-4">
                    {['❤️', '🥰', '😂', '😢'].map((emoji) => {
                      const summary = activePhoto.reactions?.find((r) => r.emoji === emoji);
                      const isReacted = summary?.reactedByCurrentUser || false;
                      const count = summary?.count || 0;

                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReactionMutation.mutate({ photoId: activePhoto.id, emoji })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                            isReacted
                              ? 'bg-couple-500 text-white border-couple-500 shadow-sm'
                              : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600 dark:bg-stone-900 dark:hover:bg-stone-850 dark:border-stone-800 dark:text-stone-300'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-xs font-bold">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Love notes list */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-couple-500 mb-1">
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>Love Notes</span>
                  </div>
                  {activePhoto.loveNotes && activePhoto.loveNotes.length > 0 ? (
                    activePhoto.loveNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800/80 rounded-2xl flex flex-col gap-1 shadow-sm relative group/note"
                      >
                        <p className="text-stone-700 dark:text-stone-200 text-sm leading-relaxed">
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800/60 pt-1.5 mt-1 text-[10px] text-stone-400 font-semibold">
                          <span>{note.writtenByName} • {new Date(note.createdAt).toLocaleDateString()}</span>
                          <button
                            onClick={() => deleteNoteMutation.mutate({ photoId: activePhoto.id, noteId: note.id })}
                            className="text-red-400 hover:text-red-500 transition-colors opacity-0 group-hover/note:opacity-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-stone-400 text-xs">
                      No love notes yet. Write something sweet.
                    </div>
                  )}
                </div>

                {/* Add note form */}
                <form onSubmit={handleAddNote} className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a sweet note..."
                    className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 outline-none text-sm focus:border-couple-400"
                    maxLength={2000}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-couple-500 text-white px-4 rounded-xl text-sm font-semibold hover:bg-couple-600 transition-colors shadow-sm"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionDetailPage;
