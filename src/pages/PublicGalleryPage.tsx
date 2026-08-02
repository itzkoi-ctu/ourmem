import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import CountdownWidget from '../components/CountdownWidget';
import SessionCard from '../components/SessionCard';
import apiClient from '../api/apiClient';
import { Session, Countdown } from '../types';

const PublicGalleryPage = () => {
  // Query 1: Guest countdown data
  const { data: countdown } = useQuery<Countdown>({
    queryKey: ['public', 'countdown'],
    queryFn: async () => {
      const res = await apiClient.get('/public/countdown');
      return res.data.data;
    },
  });

  // Query 2: Public sessions list
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['public', 'sessions'],
    queryFn: async () => {
      const res = await apiClient.get('/public/sessions?page=0&size=50');
      return res.data.data;
    },
  });

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Countdown for Guests */}
      {countdown && <CountdownWidget data={countdown} />}

      {/* 2. Timeline Grid */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800/80 pb-3">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold">
            <CalendarDays className="w-5 h-5 text-couple-500" />
            <h3>Shared Photobooth Chest</h3>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-stone-100 dark:bg-stone-900" />
            ))}
          </div>
        ) : sessionsData?.content && sessionsData.content.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sessionsData.content.map((session: Session) => (
              <SessionCard key={session.id} session={session} isGuest={true} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-stone-900/40 rounded-3xl border border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center">
            <span className="text-stone-400 font-bold">No public memories currently available.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicGalleryPage;
