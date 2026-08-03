import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Search, LogOut, Sun, Moon, LogIn, Camera } from 'lucide-react';
import { RootState } from '../store';
import { toggleTheme } from '../store/slices/themeSlice';
import { logoutUser } from '../store/slices/authSlice';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

interface NavbarProps {
  isGuest: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isGuest }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      dispatch(logoutUser());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full glassmorphism border-b border-stone-100 dark:border-stone-900 shadow-sm py-4 px-6 flex items-center justify-between">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-couple-500 hover:opacity-90 transition-opacity">
        <Heart className="w-6 h-6 fill-current animate-pulse text-couple-500" />
        <span className="hidden sm:inline bg-gradient-to-r from-couple-500 to-pink-500 bg-clip-text text-transparent">
          Our Photobooth Memories
        </span>
        <span className="sm:hidden bg-gradient-to-r from-couple-500 to-pink-500 bg-clip-text text-transparent">
          Our Memories
        </span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-2 md:gap-6">
        {!isGuest && (
          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-couple-100 text-couple-600 dark:bg-couple-950/50 dark:text-couple-400'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`
              }
            >
              Timeline
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `p-2 rounded-full transition-colors flex items-center justify-center ${
                  isActive
                    ? 'bg-couple-100 text-couple-600 dark:bg-couple-950/50 dark:text-couple-400'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`
              }
              title="Search memories"
            >
              <Search className="w-4 h-4" />
            </NavLink>
            <NavLink
              to="/sessions/new"
              className="bg-couple-500 text-white p-2 sm:px-4 sm:py-2 rounded-full text-sm font-medium hover:bg-couple-600 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Add Memory</span>
            </NavLink>
          </div>
        )}

        {/* System toggles & Profile */}
        <div className="flex items-center gap-2 border-l border-stone-200 dark:border-stone-800 pl-2 sm:pl-4">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors text-stone-600 dark:text-stone-400"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {isGuest ? (
            <Link
              to="/login"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 transition-colors text-sm font-medium text-stone-600 dark:text-stone-400"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Hello,</span>
                  <span className="text-sm font-bold text-couple-500">{user.displayName}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 text-red-500 dark:hover:bg-red-950/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
