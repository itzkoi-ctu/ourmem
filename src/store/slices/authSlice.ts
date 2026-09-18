import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import axios from 'axios';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  restoreRequestId?: string;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const restoreUser = createAsyncThunk('auth/restoreUser', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  } catch (error) {
    if (axios.isCancel(error) || (axios.isAxiosError(error) && error.response?.status === 401)) {
      return rejectWithValue('Session expired');
    }
    return rejectWithValue('Unable to check your session. Please try again.');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<User>) => {
      state.restoreRequestId = undefined;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    logoutUser: (state) => {
      state.restoreRequestId = undefined;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreUser.pending, (state, action) => {
        state.restoreRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreUser.fulfilled, (state, action) => {
        if (state.restoreRequestId !== action.meta.requestId) return;
        state.restoreRequestId = undefined;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(restoreUser.rejected, (state, action) => {
        if (state.restoreRequestId !== action.meta.requestId) return;
        state.restoreRequestId = undefined;
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload === 'Session expired' ? null : String(action.payload || 'Unable to check your session.');
      });
  },
});

export const { setCredentials, logoutUser } = authSlice.actions;
export default authSlice.reducer;
