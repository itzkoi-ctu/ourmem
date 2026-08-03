import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { RootState } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import apiClient from '../api/apiClient';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter email and password');
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { data } = response.data;
      
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

      dispatch(setCredentials({
        id: data.userId,
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl
      }));
      
      toast.success('Welcome back! ❤️');
      navigate(from, { replace: true });
    } catch (err: any) {
      // Axios interceptor handles toast for non-401, but for login we want custom message
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] dark:bg-stone-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative floating shapes */}
      <div className="absolute top-1/4 left-1/10 w-72 h-72 rounded-full bg-pink-100/60 dark:bg-pink-900/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/10 w-80 h-80 rounded-full bg-couple-100/60 dark:bg-couple-950/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full glassmorphism rounded-3xl p-8 shadow-xl border border-white/60 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-couple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-couple-500/20 mb-4 animate-heartbeat">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white bg-gradient-to-r from-couple-500 to-pink-500 bg-clip-text text-transparent">
            Our Photobooth Memories
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-2 font-medium">
            A private space for our special moments
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anh@ourmemory.app"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 focus:border-couple-400 focus:ring-1 focus:ring-couple-400 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 focus:border-couple-400 focus:ring-1 focus:ring-couple-400 outline-none transition-all text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-couple-500 to-pink-500 text-white py-3.5 rounded-2xl font-semibold shadow-md hover:from-couple-600 hover:to-pink-600 hover:shadow-lg focus:outline-none transition-all text-sm disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Enter Our World'
            )}
          </button>

          <div className="text-center mt-4">
            <span className="text-stone-400 dark:text-stone-500 text-xs">
              Not an owner? Go to the{' '}
              <a href="/public" className="text-couple-500 hover:underline font-semibold">
                Guest Gallery
              </a>
            </span>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
