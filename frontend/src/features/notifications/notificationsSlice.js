import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(API_ROUTES.NOTIFICATIONS);
    return res.data?.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/**
 * Load any pending battle requests from the inbox REST API.
 * Normalises each item to match the WS battle_request message shape:
 *   { type, request_id, challenger (username string), difficulty, expires_at }
 */
export const fetchBattleInbox = createAsyncThunk('notifications/fetchBattleInbox', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(API_ROUTES.BATTLES_INBOX);
    const items = res.data?.data?.results || res.data?.data || [];
    // Normalise to the same shape the WS push uses
    return items
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        type: 'battle_request',
        request_id: r.id,                          // REST uses `id`
        challenger: r.challenger?.username ?? '',  // REST nests challenger obj
        difficulty: r.difficulty,
        expires_at: r.expires_at,
      }));
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.post(API_ROUTES.NOTIFICATION_READ(id));
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.post(API_ROUTES.NOTIFICATIONS_READ_ALL);
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    pendingBattleRequests: [],
    battleStarted: null, // { battle_id, challenger, opponent, difficulty } — triggers auto-navigation
  },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload.is_read) state.unreadCount += 1;
    },
    addPendingBattleRequest: (state, action) => {
      // Avoid duplicates by request_id
      const id = action.payload.request_id;
      const exists = state.pendingBattleRequests.find((r) => r.request_id === id);
      if (!exists) state.pendingBattleRequests.push(action.payload);
    },
    removePendingBattleRequest: (state, action) => {
      state.pendingBattleRequests = state.pendingBattleRequests.filter((r) => r.request_id !== action.payload);
    },
    setBattleStarted: (state, action) => {
      state.battleStarted = action.payload; // payload: { battle_id, challenger, opponent, difficulty }
    },
    clearBattleStarted: (state) => {
      state.battleStarted = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const results = action.payload?.results || [];
        state.items = results;
        state.unreadCount = action.payload?.unread_count ?? results.filter((n) => !n.is_read).length;
      });

    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const id = action.payload;
      const notif = state.items.find((n) => n.id === id);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    builder.addCase(markAllRead.fulfilled, (state) => {
      state.items.forEach((n) => { n.is_read = true; });
      state.unreadCount = 0;
    });

    // Load missed battle requests (sent while the user was offline)
    builder.addCase(fetchBattleInbox.fulfilled, (state, action) => {
      const incoming = action.payload || [];
      incoming.forEach((req) => {
        const exists = state.pendingBattleRequests.find((r) => r.request_id === req.request_id);
        if (!exists) state.pendingBattleRequests.push(req);
      });
    });
  },
});

export const { addNotification, addPendingBattleRequest, removePendingBattleRequest, setBattleStarted, clearBattleStarted } = notificationsSlice.actions;
export default notificationsSlice.reducer;
