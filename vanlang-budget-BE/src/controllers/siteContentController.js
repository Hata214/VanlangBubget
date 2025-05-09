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

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
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
        const { content } = req.body;

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
        }

        if (!content) {
            return next(new AppError('Vui lòng cung cấp nội dung', 400));
        }

        // Ghi log thao tác chỉnh sửa
        logger.info(`Admin ${req.user.email} đang cập nhật nội dung loại: ${type}`);

        const updatedContent = await SiteContent.findOneAndUpdate(
            { type },
            { content },
            { new: true, upsert: true }
        );

        // Ghi log kết quả
        logger.info(`Cập nhật nội dung ${type} thành công, ID: ${updatedContent._id}`);

        res.status(200).json({
            status: 'success',
            data: updatedContent.content
        });
    } catch (error) {
        logger.error(`Lỗi khi cập nhật nội dung loại ${req.params.type}:`, error);
        next(new AppError(`Không thể cập nhật nội dung loại ${req.params.type}`, 500));
    }
};
