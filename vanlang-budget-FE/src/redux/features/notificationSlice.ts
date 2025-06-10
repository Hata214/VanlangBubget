import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationSettings } from '@/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getToken } from '@/services/api';

// Import instance đã cấu hình sẵn từ api.ts
import instance from '@/services/api';

// Helper để lấy token từ cookie và định dạng cho header
export const getAuthHeader = () => {
    // Sử dụng hàm getToken từ api.ts để đảm bảo lấy đúng token
    const token = getToken();

    if (!token) {
        console.warn('getAuthHeader: No token found');
        return {};
    }

    console.log('Using token for auth header:', token.substring(0, 10) + '...');

    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    notificationSettings: NotificationSettings | null;
    totalCount: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    notificationSettings: null,
    totalCount: 0,
    isLoading: false,
    error: null,
};

interface FetchNotificationsParams {
    page?: number;
    sort?: 'asc' | 'desc';
}

// Thunk để lấy thông báo từ API
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (params: FetchNotificationsParams = { page: 1, sort: 'desc' }, { rejectWithValue }) => {
        const { page = 1, sort = 'desc' } = params;
        try {
            // Kiểm tra token trước khi gọi API
            const token = getToken();
            if (!token) {
                console.warn('fetchNotifications: No auth token found');
                return {
                    notifications: [],
                    totalCount: 0
                };
            }

            console.log(`Fetching notifications, page: ${page} sort: ${sort}`);

            // Sử dụng instance đã được cấu hình thay vì axios trực tiếp
            const response = await instance.get(`/api/notifications?page=${page}&sort=${sort}`);

            return {
                notifications: response.data.data || [],
                totalCount: response.data.totalCount || 0
            };
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            return rejectWithValue(error.response?.data?.message || 'Không thể tải thông báo');
        }
    }
);

// Thunk để lấy số lượng thông báo chưa đọc
export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            // Kiểm tra token trước khi gọi API
            const token = getToken();
            if (!token) {
                console.warn('fetchUnreadCount: No auth token found');
                return { count: 0 };
            }

            // Sử dụng instance đã được cấu hình
            const response = await instance.get('/api/notifications/unread-count');
            console.log('Unread count response:', response.data);
            return { count: response.data.count || 0 };
        } catch (error: any) {
            console.error('Error fetching unread count:', error);
            return rejectWithValue(error.response?.data?.message || 'Không thể tải số lượng thông báo chưa đọc');
        }
    }
);

// Thunk để đánh dấu thông báo đã đọc
export const markAsReadThunk = createAsyncThunk(
    'notifications/markAsRead',
    async (id: string, { rejectWithValue }) => {
        try {
            // Kiểm tra token trước khi gọi API
            const token = getToken();
            if (!token) {
                console.warn('markAsReadThunk: No auth token found');
                return { id };
            }

            // Sử dụng instance đã được cấu hình
            await instance.patch(`/api/notifications/${id}/read`, {});
            return { id };
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            return rejectWithValue(error.response?.data?.message || 'Không thể đánh dấu đã đọc');
        }
    }
);

// Thunk để đánh dấu tất cả thông báo đã đọc
export const markAllAsReadThunk = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            // Kiểm tra token trước khi gọi API
            const token = getToken();
            if (!token) {
                console.warn('markAllAsReadThunk: No auth token found');
                return {};
            }

            // Sử dụng instance đã được cấu hình
            await instance.patch('/api/notifications/read-all', {});
            return {};
        } catch (error: any) {
            console.error('Error marking all notifications as read:', error);
            return rejectWithValue(error.response?.data?.message || 'Không thể đánh dấu tất cả đã đọc');
        }
    }
);

// Thunk để lấy cài đặt thông báo
export const fetchNotificationSettings = createAsyncThunk(
    'notifications/fetchNotificationSettings',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching notification settings');
            // Sử dụng instance đã được cấu hình
            const response = await instance.get('/api/notifications/settings');
            console.log('Notification settings response:', response.data);
            // Trả về data từ response nếu có, hoặc một object rỗng nếu không có
            return response.data.data || {};
        } catch (error: any) {
            console.error('Error fetching notification settings:', error);
            return rejectWithValue(error.response?.data?.message || 'Không thể tải cài đặt thông báo');
        }
    }
);

// Thunk để cập nhật cài đặt thông báo
export const updateNotificationSettings = createAsyncThunk(
    'notifications/updateNotificationSettings',
    async (settings: Partial<NotificationSettings>, { rejectWithValue }) => {
        try {
            console.log('Updating notification settings with:', settings);

            // Sử dụng instance đã được cấu hình
            const response = await instance.patch('/api/notifications/settings', settings);
            console.log('Update settings response:', response.data);

            // Trả về data từ response nếu có, hoặc một object rỗng nếu không có
            return response.data.data || {};
        } catch (error: any) {
            console.error('Error updating notification settings:', error);
            return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật cài đặt thông báo');
        }
    }
);

// Export các tên cũ để tương thích với code hiện tại
export const markAsRead = markAsReadThunk;
export const markAllAsRead = markAllAsReadThunk;

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        resetNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
            state.totalCount = 0;
        },
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.isRead) {
                state.unreadCount += 1;
            }
            state.totalCount += 1;
        },
    },
    extraReducers: (builder) => {
        builder
            // Xử lý fetchNotifications
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                // Nếu trang đầu tiên (hoặc không có tham số page, mặc định là 1), thay thế toàn bộ danh sách
                if (action.meta.arg?.page === 1 || !action.meta.arg?.page) {
                    state.notifications = action.payload.notifications;
                } else {
                    // Nếu trang tiếp theo, thêm vào danh sách hiện tại
                    state.notifications = [...state.notifications, ...action.payload.notifications];
                }
                state.totalCount = action.payload.totalCount;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Xử lý fetchUnreadCount
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload.count;
            })

            // Xử lý markAsRead
            .addCase(markAsReadThunk.fulfilled, (state, action) => {
                const index = state.notifications.findIndex(
                    (notification) => notification.id === action.payload.id
                );
                if (index !== -1) {
                    const wasUnread = !state.notifications[index].isRead;
                    state.notifications[index].isRead = true;
                    if (wasUnread) {
                        state.unreadCount = Math.max(0, state.unreadCount - 1);
                    }
                }
            })

            // Xử lý markAllAsRead
            .addCase(markAllAsReadThunk.fulfilled, (state) => {
                state.notifications.forEach((notification) => {
                    notification.isRead = true;
                });
                state.unreadCount = 0;
            })

            // Xử lý fetchNotificationSettings
            .addCase(fetchNotificationSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notificationSettings = action.payload;
            })
            .addCase(fetchNotificationSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Xử lý updateNotificationSettings
            .addCase(updateNotificationSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateNotificationSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notificationSettings = action.payload;
            })
            .addCase(updateNotificationSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetNotifications, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
