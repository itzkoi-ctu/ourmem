import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Eye, Lock, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Session } from '../types';
import apiClient from '../api/apiClient';

interface SessionCardProps {
  session: Session;
  isGuest: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, isGuest }) => {
  const [isPublic, setIsPublic] = useState(session.isPublic);
  const [toggling, setToggling] = useState(false);

  const handleTogglePublic = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGuest) return;

    setToggling(true);
    try {
      const res = await apiClient.patch(`/sessions/${session.id}/toggle-public`);
      setIsPublic(res.data.data.isPublic);
      toast.success(res.data.data.isPublic ? 'Session is now Public 🌍' : 'Session is now Private 🔒');
    } catch (err) {
      toast.error('Failed to change session status');
    } finally {
      setToggling(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const linkPath = isGuest ? `/share/session/${session.id}` : `/sessions/${session.id}`;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
    >
      <Link to={linkPath} className="relative block group overflow-hidden aspect-[4/3] bg-stone-100 dark:bg-stone-850">
        <img
          src={session.coverPhotoUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500'}
          alt={session.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
        {/* Soft shadow gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        {/* Visibility badge for Owner */}
        {!isGuest && (
          <button
            onClick={handleTogglePublic}
            disabled={toggling}
            className={`absolute top-4 right-4 p-2 rounded-full shadow-sm backdrop-blur-md transition-all z-10 ${
              isPublic
                ? 'bg-emerald-500/80 text-white hover:bg-emerald-600'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-950'
            }`}
            title={isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}
          >
            {isPublic ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
        )}

        {/* Media indicators (video icon, count) */}
        <div className="absolute bottom-4 left-4 flex gap-1.5 z-10">
          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/10">
            <Image className="w-3.5 h-3.5" />
            <span>{session.photoCount}</span>
          </span>
          {session.videoUrl && (
            <span className="bg-couple-500/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full border border-couple-400/20">
              Timelapse
            </span>
          )}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1 gap-2">
        {session.moodTag && (
          <span className="self-start text-[10px] font-extrabold uppercase tracking-wider text-couple-500 bg-couple-50 dark:bg-couple-950/30 px-2 py-0.5 rounded-full">
            {session.moodTag}
          </span>
        )}
        <h4 className="font-extrabold text-stone-800 dark:text-stone-100 text-lg leading-snug hover:text-couple-500 dark:hover:text-couple-400 transition-colors">
          <Link to={linkPath}>{session.title}</Link>
        </h4>
        {session.description && (
          <p className="text-stone-400 dark:text-stone-400 text-xs line-clamp-2 leading-relaxed">
            {session.description}
          </p>
        )}
        <div className="flex flex-col gap-1.5 border-t border-stone-100 dark:border-stone-800/60 pt-4 mt-auto">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{session.sessionDate}</span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{session.location}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SessionCard;
