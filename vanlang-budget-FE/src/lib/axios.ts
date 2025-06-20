// Re-export the main axios instance from api.ts to maintain compatibility
// This ensures all axios requests use the same instance with unified token handling
import apiInstance from '../services/api'

// Create a wrapper that adds notification-specific response transformation
import axios from 'axios'

const instance = axios.create(apiInstance.defaults)

// Copy all interceptors from the main instance
apiInstance.interceptors.request.handlers.forEach((handler: any) => {
    instance.interceptors.request.use(handler.fulfilled, handler.rejected)
})

apiInstance.interceptors.response.handlers.forEach((handler: any) => {
    instance.interceptors.response.use(handler.fulfilled, handler.rejected)
})

// Add notification-specific response transformation
instance.interceptors.response.use(
    (response) => {
        // Chuyển đổi trường read thành isRead cho các Notification trong response
        // Xử lý khi response.data là một mảng notification
        if (response.data && Array.isArray(response.data) && response.data.length > 0 &&
            (response.data[0].type || response.data[0].read !== undefined)) {
            response.data = response.data.map((item: any) => {
                if (item.read !== undefined && item.isRead === undefined) {
                    return { ...item, isRead: item.read };
                }
                return item;
            });
        }

        // Xử lý khi response.data.data là một mảng notification
        if (response.data && response.data.data && Array.isArray(response.data.data) &&
            response.data.data.length > 0 &&
            (response.data.data[0].type || response.data.data[0].read !== undefined)) {
            response.data.data = response.data.data.map((item: any) => {
                if (item.read !== undefined && item.isRead === undefined) {
                    return { ...item, isRead: item.read };
                }
                return item;
            });
        }

        // Xử lý khi response.data là một Notification đơn lẻ
        if (response.data && !Array.isArray(response.data) &&
            (response.data.type || response.data.read !== undefined)) {
            if (response.data.read !== undefined && response.data.isRead === undefined) {
                response.data = { ...response.data, isRead: response.data.read };
            }
        }

        return response;
    },
    (error) => {
        // Let the main instance handle all error logic
        return Promise.reject(error);
    }
)

export default instance