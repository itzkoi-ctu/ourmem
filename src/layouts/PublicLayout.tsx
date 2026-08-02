import React from 'react';
import Navbar from '../components/Navbar';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 dark:bg-stone-950 dark:text-stone-100 flex flex-col">
      <Navbar isGuest={true} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-6 text-center text-stone-400 text-sm border-t border-stone-100 dark:border-stone-900 bg-white/40 dark:bg-stone-950/40">
        <p className="flex items-center justify-center gap-1 font-medium">
          Guest Gallery — Read Only
        </p>
      </footer>
    </div>
  );
};

export default PublicLayout;
