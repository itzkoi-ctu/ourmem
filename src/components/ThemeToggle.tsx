import { Moon, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { toggleTheme } from '../store/slices/themeSlice';

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const dark = useSelector((state: RootState) => state.theme.mode === 'dark');
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button type="button" onClick={() => dispatch(toggleTheme())} aria-label={label} title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors">
      {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
