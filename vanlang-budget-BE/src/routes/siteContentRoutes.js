import express from 'express';
import {
    getFooterContent,
    updateFooterContent,
    getSiteContentByType,
    updateSiteContentByType,
    getHomepageSection,
    updateHomepageSection,
    getContentHistory,
    restoreContentVersion,
    approveHomepageContent,
    rejectHomepageContent
} from '../controllers/siteContentController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// === Routes công khai ===
// Lấy nội dung footer
router.get('/footer', getFooterContent);

// Lấy nội dung theo loại
router.get('/:type', getSiteContentByType);

// Lấy nội dung trang chủ theo section
router.get('/homepage/:section', getHomepageSection);

// === Routes yêu cầu xác thực và quyền Admin/SuperAdmin ===
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// Cập nhật nội dung footer
router.put('/footer', updateFooterContent);

// Lấy lịch sử chỉnh sửa nội dung
router.get('/:type/history', getContentHistory);

// Cập nhật nội dung trang chủ theo section
router.put('/homepage/:section', updateHomepageSection);

// Cập nhật nội dung theo loại
router.put('/:type', updateSiteContentByType);

// === Routes chỉ dành cho SuperAdmin ===
// Middleware kiểm tra quyền SuperAdmin
const superAdminOnly = restrictTo('superadmin');

// Phê duyệt nội dung trang chủ
router.post('/homepage/approve', superAdminOnly, approveHomepageContent);

// Từ chối nội dung trang chủ
router.post('/homepage/reject', superAdminOnly, rejectHomepageContent);

// Khôi phục phiên bản nội dung
router.post('/:type/restore/:version', superAdminOnly, restoreContentVersion);

export default router;
