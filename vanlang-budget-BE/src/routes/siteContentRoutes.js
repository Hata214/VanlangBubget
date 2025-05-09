import express from 'express';
import {
    getFooterContent,
    updateFooterContent,
    getSiteContentByType,
    updateSiteContentByType
} from '../controllers/siteContentController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route công khai để lấy nội dung footer
router.get('/footer', getFooterContent);

// Route công khai để lấy nội dung theo loại
router.get('/:type', getSiteContentByType);

// Routes yêu cầu xác thực và quyền admin
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// Route cập nhật nội dung footer
router.put('/footer', updateFooterContent);

// Route cập nhật nội dung theo loại
router.put('/:type', updateSiteContentByType);

export default router;
