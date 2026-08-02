import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, MapPin, Smile, Camera } from 'lucide-react';
import SessionCard from '../components/SessionCard';
import apiClient from '../api/apiClient';
import { Session } from '../types';

const SearchPage = () => {
  const [location, setLocation] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [triggerSearch, setTriggerSearch] = useState(false);

  const { data: results, refetch, isFetching } = useQuery<Session[]>({
    queryKey: ['sessions', 'search', location, moodTag, startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (location) params.location = location;
      if (moodTag) params.moodTag = moodTag;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await apiClient.get('/sessions/search', { params });
      return res.data.data;
    },
    enabled: triggerSearch,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTriggerSearch(true);
    refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <h2 className="text-3xl font-extrabold text-stone-850 dark:text-white tracking-tight flex items-center gap-2">
          <Search className="w-8 h-8 text-couple-500" />
          <span>Search Chest</span>
        </h2>
        <p className="text-stone-400 text-sm mt-1">
          Filter our couple memories by location, tags, or a specific date range.
        </p>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleSearch} className="glassmorphism rounded-3xl p-6 border border-couple-100/50 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
            Location
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
              <MapPin className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hanoi"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 outline-none text-sm focus:border-couple-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
            Mood tag
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
              <Smile className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={moodTag}
              onChange={(e) => setMoodTag(e.target.value)}
              placeholder="e.g. Happy"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 outline-none text-sm focus:border-couple-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
            Start Date
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 outline-none text-sm focus:border-couple-400"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-couple-500 hover:bg-couple-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <Search className="w-4 h-4" />
          <span>Apply Filters</span>
        </button>
      </form>

      {/* Results grid */}
      <div className="flex flex-col gap-4 mt-4">
        {isFetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-stone-100 dark:bg-stone-900" />
            ))}
          </div>
        ) : triggerSearch && results ? (
          results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((session) => (
                <SessionCard key={session.id} session={session} isGuest={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-stone-900/40 rounded-3xl border border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center">
              <span className="text-stone-400 font-semibold">No memories match your query.</span>
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white dark:bg-stone-900/40 rounded-3xl border border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center text-stone-400">
            <Camera className="w-12 h-12 text-couple-200 mb-3" />
            <span className="font-semibold text-sm">Choose filter parameters and press apply search.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
