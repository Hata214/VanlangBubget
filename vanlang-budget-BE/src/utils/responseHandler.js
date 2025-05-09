// src/utils/responseHandler.js
const responseHandler = {
    success: (res, data, message = 'Success', statusCode = 200) => {
        res.status(statusCode).json({ success: true, message, data });
    },
    error: (res, message = 'Something went wrong', statusCode = 500, errorDetails = null) => {
        const response = { success: false, message };
        if (errorDetails) {
            // Chỉ thêm chi tiết lỗi nếu không phải môi trường production hoặc nếu được cho phép
            if (process.env.NODE_ENV !== 'production' || process.env.INCLUDE_ERROR_DETAILS === 'true') {
                response.error = errorDetails instanceof Error ? errorDetails.message : errorDetails;
            }
        }
        res.status(statusCode).json(response);
    },
};

// Thay vì export default, chúng ta export các hàm riêng lẻ để phù hợp với cách import
// trong investmentController.js (import { successResponse, errorResponse } ...)
export const successResponse = responseHandler.success;
export const errorResponse = responseHandler.error;

// Giữ lại export default nếu có chỗ khác đang dùng (ít khả năng)
// export default responseHandler; 