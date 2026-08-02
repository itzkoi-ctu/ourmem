import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Calendar, MapPin, Smile, Link2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/apiClient';

const CreateSessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [location, setLocation] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch session data if editing
  const { data: session } = useQuery({
    queryKey: ['sessions', id],
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (session && isEdit) {
      setTitle(session.title);
      setSessionDate(session.sessionDate);
      setLocation(session.location || '');
      setMoodTag(session.moodTag || '');
      setSpotifyLink(session.spotifyLink || '');
      setDescription(session.description || '');
    }
  }, [session, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sessionDate) {
      return toast.error('Title and Date are required');
    }

    setLoading(true);
    const payload = {
      title,
      sessionDate,
      location: location || null,
      moodTag: moodTag || null,
      spotifyLink: spotifyLink || null,
      description: description || null,
    };

    try {
      if (isEdit) {
        await apiClient.put(`/sessions/${id}`, payload);
        toast.success('Memory updated! ✨');
        queryClient.invalidateQueries({ queryKey: ['sessions', id] });
        navigate(`/sessions/${id}`);
      } else {
        const res = await apiClient.post('/sessions', payload);
        toast.success('New memory chest created! 📸');
        navigate(`/sessions/${res.data.data.id}/upload`);
      }
    } catch (err) {
      // Handled by Axios interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <Link to={isEdit ? `/sessions/${id}` : '/'} className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span>Cancel</span>
      </Link>

      <div className="flex flex-col mb-4">
        <h2 className="text-3xl font-extrabold text-stone-850 dark:text-white tracking-tight flex items-center gap-2">
          <Camera className="w-8 h-8 text-couple-500 fill-couple-100" />
          <span>{isEdit ? 'Edit Memory Session' : 'Record New Shoot'}</span>
        </h2>
        <p className="text-stone-400 text-sm mt-1">
          Create a box to store your photobooth strips and behind-the-scenes timelapse.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glassmorphism rounded-3xl p-6 md:p-8 border border-couple-100/50 shadow-md flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Session Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Autumn in Hanoi / Our 2nd Anniversary"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 focus:border-couple-400 outline-none text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Date *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 focus:border-couple-400 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
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
                placeholder="e.g., Lotte Mall Westlake"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 focus:border-couple-400 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
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
                placeholder="e.g., Romantic, Cozy, Happy"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 focus:border-couple-400 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Spotify playlist Link
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <Link2 className="w-4 h-4" />
              </span>
              <input
                type="url"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 focus:border-couple-400 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write some details of the shoot or memory..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 focus:border-couple-400 outline-none text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-couple-500 to-pink-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:from-couple-600 hover:to-pink-600 transition-all text-sm disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Create & Proceed to Upload'
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateSessionPage;
