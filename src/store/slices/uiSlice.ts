import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  activeFilterTab: string;
}

const initialState: UiState = {
  sidebarOpen: false,
  activeFilterTab: 'all',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setFilterTab: (state, action: PayloadAction<string>) => {
      state.activeFilterTab = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setFilterTab } = uiSlice.actions;
export default uiSlice.reducer;
