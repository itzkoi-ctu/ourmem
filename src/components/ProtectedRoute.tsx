import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { restoreUser } from '../store/slices/authSlice';

const ProtectedRoute = () => {
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF8F5] dark:bg-stone-900">
        <div className="relative flex flex-col items-center">
          <div className="h-12 w-12 animate-heartbeat text-couple-500 text-4xl">❤️</div>
          <span className="mt-4 text-stone-500 font-medium animate-pulse dark:text-stone-400">Loading memories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50 dark:bg-stone-950 dark:text-white">
      <p role="alert">{error}</p>
      <button className="rounded-xl bg-couple-600 px-5 py-3 text-white" onClick={() => dispatch(restoreUser())}>Try again</button>
    </div>;
  }

  // If not authenticated, redirect to public gallery by default. Owner must go to /login.
  // Note: Guest route permitAll is handled separately under /public or /share
  if (!isAuthenticated) {
    // If the path was root, redirect to public guest page. If they tried to access specific page, send to login.
    if (location.pathname === '/') {
      return <Navigate to="/public" replace />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
