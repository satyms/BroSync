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
  },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload.is_read) state.unreadCount += 1;
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
  },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
