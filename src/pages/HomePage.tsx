import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, CalendarDays, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import CountdownWidget from '../components/CountdownWidget';
import SessionCard from '../components/SessionCard';
import apiClient from '../api/apiClient';
import { Session, Countdown } from '../types';

const HomePage = () => {
  // Query 1: Countdown config
  const { data: countdown, isLoading: countdownLoading } = useQuery<Countdown>({
    queryKey: ['config', 'countdown'],
    queryFn: async () => {
      const res = await apiClient.get('/config/countdown');
      return res.data.data;
    },
  });

  // Query 2: "On This Day" sessions
  const { data: onThisDay, isLoading: onThisDayLoading } = useQuery<Session[]>({
    queryKey: ['sessions', 'on-this-day'],
    queryFn: async () => {
      const res = await apiClient.get('/sessions/on-this-day');
      return res.data.data;
    },
  });

  // Query 3: All photo sessions (first page)
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: async () => {
      const res = await apiClient.get('/sessions?page=0&size=50');
      return res.data.data;
    },
  });

  const handleRandomMemory = async () => {
    try {
      const res = await apiClient.get('/sessions/random');
      if (res.data?.data?.id) {
        window.location.href = `/sessions/${res.data.data.id}`;
      }
    } catch (e) {
      // Toast handles inside apiClient
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Countdown Section */}
      {countdownLoading ? (
        <div className="h-40 w-full rounded-3xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
      ) : (
        countdown && <CountdownWidget data={countdown} />
      )}

      {/* 2. Highlight/On This Day / Random Memory row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold">
            <Gift className="w-5 h-5 text-couple-500 fill-current" />
            <h3>On This Day Memories</h3>
          </div>
          {onThisDayLoading ? (
            <div className="h-32 w-full rounded-2xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
          ) : onThisDay && onThisDay.length > 0 ? (
            <div className="flex flex-col gap-3">
              {onThisDay.map((session) => (
                <div
                  key={session.id}
                  onClick={() => window.location.href = `/sessions/${session.id}`}
                  className="p-4 bg-couple-50/50 dark:bg-couple-950/10 border border-couple-100 dark:border-couple-900 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={session.coverPhotoUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=300'}
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm"
                    />
                    <div>
                      <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm sm:text-base leading-tight">
                        {session.title}
                      </h4>
                      <span className="text-xs text-stone-400 font-semibold">{session.sessionDate}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-couple-500 px-2.5 py-1 rounded-full bg-couple-100 dark:bg-couple-950/50">
                    On This Day
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-white dark:bg-stone-900/40 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center">
              <span className="text-sm text-stone-400 font-semibold">No memories recorded on this day.</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-couple-100 to-pink-100 dark:from-stone-900/60 dark:to-couple-950/20 rounded-2xl p-6 shadow-sm border border-couple-200/40 flex flex-col justify-between items-center text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm text-couple-500 text-xl font-bold animate-pulse mb-3">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <h4 className="font-bold text-stone-800 dark:text-stone-200 text-base">Random Memory</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 font-medium">
              Travel back in time and view a random photobooth session from our box.
            </p>
          </div>
          <button
            onClick={handleRandomMemory}
            className="w-full mt-4 bg-white dark:bg-stone-800 text-couple-600 dark:text-couple-400 border border-couple-200 dark:border-stone-700 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all"
          >
            Open Random Box
          </button>
        </div>
      </div>

      {/* 3. Timeline / Sessions */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800/80 pb-3">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold">
            <CalendarDays className="w-5 h-5 text-couple-500" />
            <h3>Memory Timeline</h3>
          </div>
          {sessionsData && (
            <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">
              {sessionsData.totalElements} Sessions
            </span>
          )}
        </div>

        {sessionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
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
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sessionsData.content.map((session: Session) => (
              <SessionCard key={session.id} session={session} isGuest={false} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-stone-900/40 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center">
            <span className="text-lg text-stone-400 font-bold">Our memories chest is empty.</span>
            <span className="text-stone-400 dark:text-stone-500 text-sm mt-1">Click "Add Memory" to record your first photobooth strip.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
