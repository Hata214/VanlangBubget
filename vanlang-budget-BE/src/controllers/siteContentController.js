import SiteContent from '../models/siteContentModel.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';

/**
 * @desc    Lấy nội dung footer
 * @route   GET /api/site-content/footer
 * @access  Public
 */
export const getFooterContent = async (req, res, next) => {
    try {
        const footerContent = await SiteContent.findOne({ type: 'footer' });

        res.status(200).json({
            status: 'success',
            data: footerContent ? footerContent.content : null
        });
    } catch (error) {
        logger.error('Lỗi khi lấy nội dung footer:', error);
        next(new AppError('Không thể lấy nội dung footer', 500));
    }
};

/**
 * @desc    Cập nhật nội dung footer
 * @route   PUT /api/site-content/footer
 * @access  Private (Admin/Superadmin)
 */
export const updateFooterContent = async (req, res, next) => {
    try {
        const { content } = req.body;

        if (!content) {
            return next(new AppError('Vui lòng cung cấp nội dung footer', 400));
        }

        const updatedFooter = await SiteContent.findOneAndUpdate(
            { type: 'footer' },
            { content },
            { new: true, upsert: true }
        );

        res.status(200).json({
            status: 'success',
            data: updatedFooter.content
        });
    } catch (error) {
        logger.error('Lỗi khi cập nhật nội dung footer:', error);
        next(new AppError('Không thể cập nhật nội dung footer', 500));
    }
};

/**
 * @desc    Lấy nội dung trang web theo loại
 * @route   GET /api/site-content/:type
 * @access  Public
 */
export const getSiteContentByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const { language } = req.query;

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
        }

        // Xử lý đặc biệt cho homepage
        if (type === 'homepage') {
            const homepageContent = await SiteContent.getHomepageContent(language);
            return res.status(200).json({
                status: 'success',
                data: homepageContent
            });
        }

        const siteContent = await SiteContent.findOne({ type });

        res.status(200).json({
            status: 'success',
            data: siteContent ? siteContent.content : null
        });
    } catch (error) {
        logger.error(`Lỗi khi lấy nội dung loại ${req.params.type}:`, error);
        next(new AppError(`Không thể lấy nội dung loại ${req.params.type}`, 500));
    }
};

/**
 * @desc    Cập nhật nội dung trang web theo loại
 * @route   PUT /api/site-content/:type
 * @access  Private (Admin/Superadmin)
 */
export const updateSiteContentByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const { content, status } = req.body;

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
        }

        if (!content) {
            return next(new AppError('Vui lòng cung cấp nội dung', 400));
        }

        // Ghi log thao tác chỉnh sửa
        logger.info(`Admin ${req.user.email} đang cập nhật nội dung loại: ${type}`);

        let updatedContent;

        // Xử lý đặc biệt cho homepage
        if (type === 'homepage') {
            // Kiểm tra nếu Admin thông thường thì đặt trạng thái pending_review
            const userRole = req.user.role;
            const contentStatus = userRole === 'superadmin' ? (status || 'published') : 'pending_review';

            updatedContent = await SiteContent.updateHomepageContent(content, req.user._id, {
                status: contentStatus
            });

            // Ghi log cần superadmin phê duyệt nếu là admin thông thường
            if (userRole !== 'superadmin') {
                logger.info(`Nội dung trang chủ cần được SuperAdmin phê duyệt, cập nhật bởi: ${req.user.email}`);
            }
        } else {
            updatedContent = await SiteContent.findOneAndUpdate(
                { type },
                {
                    content,
                    lastUpdatedBy: req.user._id
                },
                { new: true, upsert: true }
            );
        }

        // Ghi log kết quả
        logger.info(`Cập nhật nội dung ${type} thành công, ID: ${updatedContent._id}`);

        res.status(200).json({
            status: 'success',
            data: updatedContent.content,
            meta: {
                version: updatedContent.version,
                status: updatedContent.status,
                updatedAt: updatedContent.updatedAt,
                sections: updatedContent.sections
            }
        });
    } catch (error) {
        logger.error(`Lỗi khi cập nhật nội dung loại ${req.params.type}:`, error);
        next(new AppError(`Không thể cập nhật nội dung loại ${req.params.type}`, 500));
    }
};

/**
 * @desc    Lấy nội dung trang chủ theo section
 * @route   GET /api/site-content/homepage/:section
 * @access  Public
 */
export const getHomepageSection = async (req, res, next) => {
    try {
        const { section } = req.params;
        const { language } = req.query;

        const homepage = await SiteContent.findOne({ type: 'homepage' });

        if (!homepage) {
            return res.status(200).json({
                status: 'success',
                data: null
            });
        }

        // Kiểm tra nếu có hỗ trợ ngôn ngữ được yêu cầu
        let content = homepage.content;
        if (language && language !== 'vi' && content[language] && content[language][section]) {
            return res.status(200).json({
                status: 'success',
                data: content[language][section]
            });
        }

        // Trả về nội dung section chỉ định
        res.status(200).json({
            status: 'success',
            data: content[section] || null
        });
    } catch (error) {
        logger.error(`Lỗi khi lấy section ${req.params.section} của trang chủ:`, error);
        next(new AppError(`Không thể lấy section ${req.params.section} của trang chủ`, 500));
    }
};

/**
 * @desc    Cập nhật nội dung trang chủ theo section
 * @route   PUT /api/site-content/homepage/:section
 * @access  Private (Admin/Superadmin)
 */
export const updateHomepageSection = async (req, res, next) => {
    try {
        const { section } = req.params;
        const { content, language } = req.body;

        if (!content) {
            return next(new AppError('Vui lòng cung cấp nội dung cho section', 400));
        }

        // Lấy nội dung trang chủ hiện tại
        let homepage = await SiteContent.findOne({ type: 'homepage' });
        let homepageContent = homepage ? { ...homepage.content } : {};

        // Xử lý ngôn ngữ
        if (language && language !== 'vi') {
            if (!homepageContent[language]) {
                homepageContent[language] = {};
            }
            homepageContent[language][section] = content;
        } else {
            homepageContent[section] = content;
        }

        // Kiểm tra nếu Admin thông thường thì đặt trạng thái pending_review
        const userRole = req.user.role;
        const contentStatus = userRole === 'superadmin' ? 'published' : 'pending_review';

        // Cập nhật nội dung
        const updatedContent = await SiteContent.updateHomepageContent(
            homepageContent,
            req.user._id,
            {
                status: contentStatus,
                language: language
            }
        );

        // Ghi log
        logger.info(`Admin ${req.user.email} đã cập nhật section ${section} của trang chủ`);

        if (userRole !== 'superadmin') {
            logger.info(`Section ${section} của trang chủ cần được SuperAdmin phê duyệt, cập nhật bởi: ${req.user.email}`);
        }

        res.status(200).json({
            status: 'success',
            data: content,
            meta: {
                version: updatedContent.version,
                status: updatedContent.status,
                updatedAt: updatedContent.updatedAt
            }
        });
    } catch (error) {
        logger.error(`Lỗi khi cập nhật section ${req.params.section} của trang chủ:`, error);
        next(new AppError(`Không thể cập nhật section ${req.params.section} của trang chủ`, 500));
    }
};

/**
 * @desc    Lấy lịch sử chỉnh sửa nội dung
 * @route   GET /api/site-content/:type/history
 * @access  Private (Admin/Superadmin)
 */
export const getContentHistory = async (req, res, next) => {
    try {
        const { type } = req.params;

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
        }

        const history = await SiteContent.getContentHistory(type);

        res.status(200).json({
            status: 'success',
            data: history
        });
    } catch (error) {
        logger.error(`Lỗi khi lấy lịch sử nội dung ${req.params.type}:`, error);
        next(new AppError(`Không thể lấy lịch sử nội dung ${req.params.type}`, 500));
    }
};

/**
 * @desc    Khôi phục nội dung từ phiên bản trước
 * @route   POST /api/site-content/:type/restore/:version
 * @access  Private (SuperAdmin only)
 */
export const restoreContentVersion = async (req, res, next) => {
    try {
        const { type, version } = req.params;

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
        }

        const restoredContent = await SiteContent.restoreVersion(type, parseInt(version), req.user._id);

        if (!restoredContent) {
            return next(new AppError('Không tìm thấy phiên bản cần khôi phục', 404));
        }

        // Ghi log
        logger.info(`SuperAdmin ${req.user.email} đã khôi phục nội dung ${type} về phiên bản ${version}`);

        res.status(200).json({
            status: 'success',
            data: restoredContent.content,
            meta: {
                version: restoredContent.version,
                status: restoredContent.status,
                updatedAt: restoredContent.updatedAt
            }
        });
    } catch (error) {
        logger.error(`Lỗi khi khôi phục nội dung ${req.params.type} phiên bản ${req.params.version}:`, error);
        next(new AppError(`Không thể khôi phục nội dung ${req.params.type}`, 500));
    }
};

/**
 * @desc    Phê duyệt nội dung trang chủ
 * @route   POST /api/site-content/homepage/approve
 * @access  Private (SuperAdmin only)
 */
export const approveHomepageContent = async (req, res, next) => {
    try {
        const homepage = await SiteContent.findOne({ type: 'homepage' });

        if (!homepage) {
            return next(new AppError('Không tìm thấy nội dung trang chủ', 404));
        }

        if (homepage.status !== 'pending_review') {
            return next(new AppError('Nội dung trang chủ không cần phê duyệt', 400));
        }

        // Cập nhật trạng thái thành published
        const updatedContent = await SiteContent.findOneAndUpdate(
            { type: 'homepage' },
            { status: 'published' },
            { new: true }
        );

        // Ghi log
        logger.info(`SuperAdmin ${req.user.email} đã phê duyệt nội dung trang chủ phiên bản ${homepage.version}`);

        res.status(200).json({
            status: 'success',
            data: updatedContent.content,
            meta: {
                version: updatedContent.version,
                status: updatedContent.status,
                updatedAt: updatedContent.updatedAt
            }
        });
    } catch (error) {
        logger.error('Lỗi khi phê duyệt nội dung trang chủ:', error);
        next(new AppError('Không thể phê duyệt nội dung trang chủ', 500));
    }
};

/**
 * @desc    Từ chối nội dung trang chủ
 * @route   POST /api/site-content/homepage/reject
 * @access  Private (SuperAdmin only)
 */
export const rejectHomepageContent = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const homepage = await SiteContent.findOne({ type: 'homepage' });

        if (!homepage) {
            return next(new AppError('Không tìm thấy nội dung trang chủ', 404));
        }

        if (homepage.status !== 'pending_review') {
            return next(new AppError('Nội dung trang chủ không cần phê duyệt', 400));
        }

        // Khôi phục phiên bản trước đó (nếu có)
        let previousContent = null;
        let previousVersion = null;

        if (homepage.history && homepage.history.length > 0) {
            const lastPublishedVersion = homepage.history.find(h => h.status === 'published');
            if (lastPublishedVersion) {
                previousContent = lastPublishedVersion.content;
                previousVersion = lastPublishedVersion.version;
            }
        }

        // Nếu có phiên bản đã xuất bản trước đó, khôi phục lại
        if (previousContent) {
            await SiteContent.findOneAndUpdate(
                { type: 'homepage' },
                {
                    content: previousContent,
                    status: 'published',
                    $push: {
                        history: {
                            content: homepage.content,
                            updatedBy: homepage.lastUpdatedBy,
                            updatedAt: homepage.updatedAt,
                            version: homepage.version,
                            status: 'rejected',
                            reason: reason || 'Bị từ chối bởi SuperAdmin'
                        }
                    }
                },
                { new: false }
            );

            // Ghi log
            logger.info(`SuperAdmin ${req.user.email} đã từ chối nội dung trang chủ phiên bản ${homepage.version} và khôi phục phiên bản ${previousVersion}`);
        } else {
            // Nếu không có phiên bản trước, chỉ đánh dấu từ chối
            await SiteContent.findOneAndUpdate(
                { type: 'homepage' },
                {
                    status: 'draft',
                    $push: {
                        history: {
                            content: homepage.content,
                            updatedBy: homepage.lastUpdatedBy,
                            updatedAt: homepage.updatedAt,
                            version: homepage.version,
                            status: 'rejected',
                            reason: reason || 'Bị từ chối bởi SuperAdmin'
                        }
                    }
                },
                { new: false }
            );

            // Ghi log
            logger.info(`SuperAdmin ${req.user.email} đã từ chối nội dung trang chủ phiên bản ${homepage.version}`);
        }

        const updatedContent = await SiteContent.findOne({ type: 'homepage' });

        res.status(200).json({
            status: 'success',
            data: updatedContent.content,
            meta: {
                version: updatedContent.version,
                status: updatedContent.status,
                updatedAt: updatedContent.updatedAt,
                message: 'Nội dung đã bị từ chối'
            }
        });
    } catch (error) {
        logger.error('Lỗi khi từ chối nội dung trang chủ:', error);
        next(new AppError('Không thể từ chối nội dung trang chủ', 500));
    }
};
