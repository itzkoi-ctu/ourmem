import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Music, ChevronLeft, Film, Heart, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/apiClient';
import { Session, Photo } from '../types';

const SharedSessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  // Fetch public session info
  const { data: session, isLoading: sessionLoading } = useQuery<Session>({
    queryKey: ['public', 'sessions', id],
    queryFn: async () => {
      const res = await apiClient.get(`/public/sessions/${id}`);
      return res.data.data;
    },
  });

  // Fetch public photos for this session
  const { data: photos, isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ['public', 'sessions', id, 'photos'],
    queryFn: async () => {
      const res = await apiClient.get(`/public/sessions/${id}/photos`);
      return res.data.data;
    },
    enabled: !!session,
  });

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
        <h3 className="text-lg font-bold text-stone-500">Shared session not found or is private</h3>
        <Link to="/public" className="text-couple-500 hover:underline mt-2 inline-block">Back to public chest</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header controls */}
      <div className="flex items-center justify-between">
        <Link to="/public" className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-850 dark:hover:text-stone-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to public chest</span>
        </Link>
      </div>

      {/* 2. Detail hero layout */}
      <div className="glassmorphism rounded-3xl p-6 md:p-8 border border-couple-100/50 shadow-sm flex flex-col md:flex-row gap-6 items-start relative overflow-hidden">
        <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden shadow bg-stone-100">
          <img
            src={session.coverPhotoUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500'}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-3 w-full">
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

      {/* 3. Timelapse if public */}
      {session.videoUrl && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold">
            <Film className="w-5 h-5 text-couple-500" />
            <h3>Timelapse Trailer</h3>
          </div>
          <div className="w-full aspect-video rounded-3xl overflow-hidden shadow bg-stone-900">
            <video
              src={session.videoUrl}
              poster={session.videoThumbnailUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 4. Photos chest */}
      <div className="flex flex-col gap-4 border-t border-stone-100 dark:border-stone-800 pt-6">
        <h3 className="font-bold text-stone-700 dark:text-stone-300">
          Photobooth Strips ({photos?.length || 0})
        </h3>

        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-stone-100 dark:bg-stone-900" />
            ))}
          </div>
        ) : photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setActivePhoto(photo)}
                className="bg-white dark:bg-stone-900 border-4 border-white dark:border-stone-850 shadow hover:shadow-md transition-shadow cursor-pointer rounded-2xl overflow-hidden aspect-[3/4]"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-stone-900/40 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center">
            <span className="text-sm text-stone-400 font-semibold">No photos in this session.</span>
          </div>
        )}
      </div>

      {/* 5. Read-only Lightbox */}
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
              <div className="flex-1 bg-stone-950 flex items-center justify-center p-4 h-[55%] lg:h-full">
                <img
                  src={activePhoto.originalUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Sidebar with no action controls - purely read-only */}
              <div className="w-full lg:w-96 flex flex-col h-[45%] lg:h-full border-t lg:border-t-0 lg:border-l border-stone-100 dark:border-stone-800">
                <div className="p-4 border-b border-stone-100 dark:border-stone-800">
                  <p className="font-bold text-stone-800 dark:text-white text-base leading-tight">
                    {activePhoto.caption || <span className="text-stone-400 italic">Shared memory</span>}
                  </p>
                  
                  {/* Reactions view-only */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {activePhoto.reactions && activePhoto.reactions.length > 0 ? (
                      activePhoto.reactions.map((react) => (
                        <span
                          key={react.emoji}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-50 border border-stone-200 dark:bg-stone-900 dark:border-stone-800 text-stone-600 dark:text-stone-300"
                        >
                          <span>{react.emoji}</span>
                          <span>{react.count}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-stone-400 italic">No reactions yet</span>
                    )}
                  </div>
                </div>

                {/* Love notes list - view-only */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-couple-500 mb-1">
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>Love Notes</span>
                  </div>
                  {activePhoto.loveNotes && activePhoto.loveNotes.length > 0 ? (
                    activePhoto.loveNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800/80 rounded-2xl flex flex-col gap-1 shadow-sm"
                      >
                        <p className="text-stone-700 dark:text-stone-200 text-sm leading-relaxed">
                          {note.content}
                        </p>
                        <span className="text-[10px] text-stone-400 font-semibold border-t border-stone-100 dark:border-stone-800/60 pt-1.5 mt-1">
                          {note.writtenByName} • {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-stone-400 text-xs">
                      No notes attached.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SharedSessionPage;
