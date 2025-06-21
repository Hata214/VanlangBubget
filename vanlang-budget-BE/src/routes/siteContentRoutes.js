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
router.get('/footer', (req, res, next) => {
    req.params.type = 'footer';
    getSiteContentByType(req, res, next);
});

// === Routes cụ thể cho Homepage (trước route chung) ===
// Lấy toàn bộ nội dung trang chủ
router.get('/homepage', (req, res, next) => {
    // console.log('Route /homepage được gọi với query:', req.query);
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

// === Routes yêu cầu xác thực và quyền Admin/SuperAdmin ===
// Middleware này sẽ được áp dụng cho các route cần bảo vệ phía dưới
// Đặt protect và restrictTo sớm hơn nếu các route initialize cần nó ngay
// router.use(protect); // Tạm thời comment để đặt protect cụ thể cho từng route initialize
// router.use(restrictTo('admin', 'superadmin')); // Tạm thời comment

// Middleware kiểm tra quyền SuperAdmin (nếu chưa có hoặc muốn dùng riêng)
const superAdminOnlyRoute = restrictTo('superadmin');

// Initialize routes cho các trang riêng biệt (CẦN BẢO VỆ)
router.post('/features/initialize', protect, superAdminOnlyRoute, initializeFeaturesContent);
router.post('/roadmap/initialize', protect, superAdminOnlyRoute, initializeRoadmapContent);
router.post('/pricing/initialize', protect, superAdminOnlyRoute, initializePricingContent);
router.post('/contact/initialize', protect, superAdminOnlyRoute, initializeContactContent);

// === Route mới: Xử_lý truy_cập trực_tiếp đến các section của homepage ===
router.get('/:sectionType', (req, res, next) => {
    const { sectionType } = req.params;
    const homepageSections = ['hero', 'testimonials', 'cta', 'stats', 'footer', 'header'];

    if (homepageSections.includes(sectionType)) {
        // console.log(`Chuyển hướng truy cập từ /${sectionType} sang /homepage/${sectionType}`);
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

// Khởi tạo dữ liệu mặc định cho trang chủ (cho phép Admin và SuperAdmin)
router.post('/homepage/initialize', initializeHomepageContent);

// Khôi phục phiên bản nội dung
router.post('/:type/restore/:version', superAdminOnly, restoreContentVersion);

// Cập nhật nội dung theo loại (bao gồm homepage)
// Route này cần được đặt sau các route PUT cụ thể hơn nếu có
// và đảm bảo nó nằm sau middleware protect và restrictTo
router.put('/:type', updateSiteContentByType);


export default router;
