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
    rejectHomepageContent,
    initializeHomepageContent,
    initializeFeaturesContent,
    initializeRoadmapContent,
    initializePricingContent,
    initializeContactContent
} from '../controllers/siteContentController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// === Routes công khai ===
// Lấy nội dung header
router.get('/header', (req, res, next) => {
    req.params.type = 'header';
    getSiteContentByType(req, res, next);
});
// Lấy nội dung footer
router.get('/footer', getFooterContent);

// === Routes cụ thể cho Homepage (trước route chung) ===
// Lấy toàn bộ nội dung trang chủ
router.get('/homepage', (req, res, next) => {
    console.log('Route /homepage được gọi với query:', req.query);
    // Chuyển hướng đến route /:type với type=homepage
    req.params.type = 'homepage';
    getSiteContentByType(req, res, next);
});

// Lấy nội dung trang chủ theo section
router.get('/homepage/:section', getHomepageSection);

// === Routes cho các trang riêng biệt ===
router.get('/features', (req, res, next) => {
    req.params.type = 'features';
    getSiteContentByType(req, res, next);
});
router.get('/roadmap', (req, res, next) => {
    req.params.type = 'roadmap';
    getSiteContentByType(req, res, next);
});
router.get('/pricing', (req, res, next) => {
    req.params.type = 'pricing';
    getSiteContentByType(req, res, next);
});
router.get('/contact', (req, res, next) => {
    req.params.type = 'contact';
    getSiteContentByType(req, res, next);
});

// Initialize routes cho các trang riêng biệt (public để test)
router.post('/features/initialize', initializeFeaturesContent);
router.post('/roadmap/initialize', initializeRoadmapContent);
router.post('/pricing/initialize', initializePricingContent);
router.post('/contact/initialize', initializeContactContent);

// === Route mới: Xử lý truy cập trực tiếp đến các section của homepage ===
router.get('/:sectionType', (req, res, next) => {
    const { sectionType } = req.params;
    const homepageSections = ['hero', 'testimonials', 'cta', 'stats', 'footer', 'header'];

    if (homepageSections.includes(sectionType)) {
        console.log(`Chuyển hướng truy cập từ /${sectionType} sang /homepage/${sectionType}`);
        // Chuyển hướng đến route homepage/:section
        req.params.section = sectionType;
        return getHomepageSection(req, res, next);
    }

    // Nếu không phải section của homepage, xử lý như bình thường
    next();
});

// Lấy nội dung theo loại (bao gồm homepage)
router.get('/:type', getSiteContentByType);

// === Routes yêu cầu xác thực và quyền Admin/SuperAdmin ===
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// Cập nhật nội dung footer
router.put('/footer', updateFooterContent);

// Lấy lịch sử chỉnh sửa nội dung
router.get('/:type/history', getContentHistory);

// === Routes chỉ dành cho SuperAdmin ===
// Middleware kiểm tra quyền SuperAdmin
const superAdminOnly = restrictTo('superadmin');

// Cập nhật nội dung trang chủ theo section
router.put('/homepage/:section', updateHomepageSection);

// Phê duyệt nội dung trang chủ
router.post('/homepage/approve', superAdminOnly, approveHomepageContent);

// Từ chối nội dung trang chủ
router.post('/homepage/reject', superAdminOnly, rejectHomepageContent);

// Khởi tạo dữ liệu mặc định cho trang chủ
router.post('/homepage/initialize', superAdminOnly, initializeHomepageContent);

// Khôi phục phiên bản nội dung
router.post('/:type/restore/:version', superAdminOnly, restoreContentVersion);

// Cập nhật nội dung theo loại (bao gồm homepage)
router.put('/:type', updateSiteContentByType);

// Catch-all route để debug
router.get('*', (req, res) => {
    console.log('Catch-all route matched:', req.originalUrl);
    res.status(404).send('Not Found - Catch-all');
});

export default router;
