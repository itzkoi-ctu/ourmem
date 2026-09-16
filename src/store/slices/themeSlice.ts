import { createSlice } from '@reduxjs/toolkit';

interface ThemeState {
  mode: 'light' | 'dark';
}

const initialState: ThemeState = {
  mode: (() => {
    try {
      const saved = localStorage.getItem('theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* Storage may be unavailable in private browsing. */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('theme_mode', state.mode); } catch { /* Keep theme usable without storage. */ }
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
