import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { RootState } from './store';
import { restoreUser } from './store/slices/authSlice';

// Layouts
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SessionDetailPage from './pages/SessionDetailPage';
import CreateSessionPage from './pages/CreateSessionPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import PublicGalleryPage from './pages/PublicGalleryPage';
import SharedSessionPage from './pages/SharedSessionPage';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.mode);

  useEffect(() => {
    dispatch(restoreUser() as any);
  }, [dispatch]);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public / Guest Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/public" element={<PublicLayout><PublicGalleryPage /></PublicLayout>} />
        <Route path="/share/session/:id" element={<PublicLayout><SharedSessionPage /></PublicLayout>} />

        {/* Private / Owner Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/sessions/new" element={<CreateSessionPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/sessions/:id/edit" element={<CreateSessionPage />} />
            <Route path="/sessions/:id/upload" element={<UploadPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
        </Route>

        {/* Catch-all redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
