import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

// ── Async thunks ──────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(API_ROUTES.LOGIN, credentials);
    const { access, refresh, user } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(API_ROUTES.REGISTER, data);
    // Backend wraps response: { success, message, data: { user, tokens: { access, refresh } } }
    const { user, tokens } = res.data.data;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    return user;
  } catch (err) {
    const errData = err.response?.data;
    // Handle standardized error format: { success: false, error: { message, details } }
    const details = errData?.error?.details || errData;
    return rejectWithValue(details || 'Registration failed');
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(API_ROUTES.PROFILE);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.patch(API_ROUTES.PROFILE_UPDATE, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const refresh = localStorage.getItem('refresh_token');
    await axiosInstance.post(API_ROUTES.LOGOUT, { refresh });
  } catch {
    // silently fail
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
});

// ── Helper: restore user from localStorage on page reload ────────────────────
const getInitialUser = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  // We'll fetch profile on App load, just mark as "might be authenticated"
  return null;
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getInitialUser(),
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch profile
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      });

    // Update profile
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.user = { ...state.user, ...action.payload };
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
