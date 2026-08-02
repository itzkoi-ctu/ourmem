import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF8F5] dark:bg-stone-900">
        <div className="relative flex flex-col items-center">
          <div className="h-12 w-12 animate-heartbeat text-couple-500 text-4xl">❤️</div>
          <span className="mt-4 text-stone-500 font-medium animate-pulse">Loading memories...</span>
        </div>
      </div>
    );
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
