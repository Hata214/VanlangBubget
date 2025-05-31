import SiteContent from '../models/siteContentModel.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';
import defaultHomepageContent from '../data/defaultHomepageContent.js';
import { createHomepageContent, updateHomepageContent } from '../scripts/initHomepageContent.js';

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

        console.log(`getSiteContentByType được gọi với type=${type}, language=${language}`);

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing', 'features'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
        }

        // Xử lý đặc biệt cho homepage
        if (type === 'homepage') {
            const homepageContent = await SiteContent.getHomepageContent(language);

            // Nếu không có dữ liệu, trả về dữ liệu mặc định
            if (!homepageContent) {
                logger.info('Không tìm thấy nội dung trang chủ, trả về dữ liệu mặc định');
                return res.status(200).json({
                    status: 'success',
                    data: {
                        content: defaultHomepageContent,
                        version: 1,
                        status: 'published',
                        sections: Object.keys(defaultHomepageContent)
                    }
                });
            }

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

        console.log(`🔄 updateSiteContentByType được gọi với type=${type}`);
        console.log(`📝 Content được gửi:`, JSON.stringify(content, null, 2));

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing', 'features'];

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
        console.log(`✅ Cập nhật thành công, trả về data:`, JSON.stringify(updatedContent.content, null, 2));

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

        console.log(`getHomepageSection được gọi với section=${section}, language=${language}`);

        // Kiểm tra tính hợp lệ của section
        const validSections = ['hero', 'features', 'testimonials', 'pricing', 'cta', 'stats', 'footer', 'header'];
        if (!section || !validSections.includes(section)) {
            console.log(`Section không hợp lệ: ${section}`);
            return next(new AppError(`Section không hợp lệ: ${section}`, 400));
        }

        const homepage = await SiteContent.findOne({ type: 'homepage' });

        // Nếu không có dữ liệu trong DB, sử dụng dữ liệu mặc định
        if (!homepage) {
            // Kiểm tra xem section có tồn tại trong dữ liệu mặc định không
            if (defaultHomepageContent[section]) {
                logger.info(`Không tìm thấy nội dung trang chủ, trả về dữ liệu mặc định cho section: ${section}`);
                return res.status(200).json({
                    status: 'success',
                    data: defaultHomepageContent[section]
                });
            } else {
                logger.info(`Section ${section} không tồn tại trong dữ liệu mặc định`);
                return res.status(200).json({
                    status: 'success',
                    data: null
                });
            }
        }

        // Kiểm tra nếu có hỗ trợ ngôn ngữ được yêu cầu
        let content = homepage.content;

        // Log nội dung hiện tại để debug
        console.log(`Nội dung trang chủ hiện tại có sections: ${Object.keys(content).join(', ')}`);

        if (language && language !== 'vi' && content[language] && content[language][section]) {
            console.log(`Trả về nội dung section ${section} cho ngôn ngữ ${language}`);
            return res.status(200).json({
                status: 'success',
                data: content[language][section]
            });
        }

        // Kiểm tra xem section có tồn tại không
        if (!content[section]) {
            console.log(`Section ${section} không tồn tại trong nội dung trang chủ, sử dụng dữ liệu mặc định`);
            // Nếu không có trong DB, sử dụng dữ liệu mặc định
            if (defaultHomepageContent[section]) {
                return res.status(200).json({
                    status: 'success',
                    data: defaultHomepageContent[section],
                    meta: {
                        source: 'fallback'
                    }
                });
            } else {
                return res.status(200).json({
                    status: 'success',
                    data: null
                });
            }
        }

        // Trả về nội dung section chỉ định
        console.log(`Trả về nội dung section ${section} từ database`);
        res.status(200).json({
            status: 'success',
            data: content[section]
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

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing'];

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

        const validTypes = ['footer', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing'];

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

/**
 * @desc    Khởi tạo dữ liệu mặc định cho trang chủ
 * @route   POST /api/site-content/homepage/initialize
 * @access  Private (SuperAdmin only)
 */
export const initializeHomepageContent = async (req, res, next) => {
    try {
        // Kiểm tra xem đã có dữ liệu trang chủ chưa
        const existingHomepage = await SiteContent.findOne({ type: 'homepage' });

        let result;
        if (existingHomepage) {
            // Nếu đã có dữ liệu, cập nhật
            logger.info(`SuperAdmin ${req.user.email} đang cập nhật dữ liệu mặc định cho trang chủ`);
            result = await updateHomepageContent();
            logger.info(`Dữ liệu trang chủ đã được cập nhật thành công bởi ${req.user.email}`);
        } else {
            // Nếu chưa có dữ liệu, tạo mới
            logger.info(`SuperAdmin ${req.user.email} đang tạo dữ liệu mặc định cho trang chủ`);
            result = await createHomepageContent();
            logger.info(`Dữ liệu trang chủ đã được tạo thành công bởi ${req.user.email}`);
        }

        res.status(200).json({
            status: 'success',
            message: existingHomepage ? 'Dữ liệu trang chủ đã được cập nhật thành công' : 'Dữ liệu trang chủ đã được tạo thành công',
            data: {
                content: result.content,
                version: result.version,
                status: result.status,
                sections: result.sections
            }
        });
    } catch (error) {
        logger.error('Lỗi khi khởi tạo dữ liệu trang chủ:', error);
        next(new AppError('Không thể khởi tạo dữ liệu trang chủ', 500));
    }
};

/**
 * @desc    Khởi tạo dữ liệu mặc định cho trang Features
 * @route   POST /api/site-content/features/initialize
 * @access  Private (Admin/Superadmin)
 */
export const initializeFeaturesContent = async (req, res, next) => {
    try {
        const defaultFeaturesContent = {
            vi: {
                title: "Tính năng nổi bật",
                subtitle: "Công cụ quản lý tài chính mạnh mẽ",
                description: "Những công cụ giúp bạn quản lý tài chính hiệu quả",
                features: [
                    {
                        icon: "📊",
                        title: "Theo dõi thu chi",
                        description: "Ghi lại và phân loại tất cả các khoản thu nhập, chi phí hàng ngày, hàng tuần và hàng tháng với giao diện thân thiện và dễ sử dụng."
                    },
                    {
                        icon: "🎯",
                        title: "Quản lý ngân sách",
                        description: "Thiết lập và theo dõi ngân sách theo danh mục, giúp bạn kiểm soát chi tiêu và hình thành thói quen tài chính tốt."
                    },
                    {
                        icon: "💰",
                        title: "Quản lý khoản vay",
                        description: "Theo dõi các khoản vay, lịch trả nợ và tính toán lãi suất một cách chính xác và chi tiết."
                    },
                    {
                        icon: "📈",
                        title: "Quản lý đầu tư",
                        description: "Theo dõi danh mục đầu tư bất động sản, tiết kiệm ngân hàng với tính năng tính lãi suất tự động."
                    },
                    {
                        icon: "🤖",
                        title: "VanLang Agent AI",
                        description: "Trợ lý AI thông minh hỗ trợ trả lời câu hỏi tài chính, tính toán và phân tích dữ liệu bằng tiếng Việt."
                    },
                    {
                        icon: "📱",
                        title: "Giao diện thân thiện",
                        description: "Thiết kế responsive, hỗ trợ dark mode và đa ngôn ngữ (Tiếng Việt/English) cho trải nghiệm tốt nhất."
                    }
                ]
            },
            en: {
                title: "Outstanding Features",
                subtitle: "Powerful financial management tools",
                description: "Tools that help you manage your finances effectively",
                features: [
                    {
                        icon: "📊",
                        title: "Income & Expense Tracking",
                        description: "Record and categorize all income and expenses daily, weekly, and monthly with a user-friendly interface."
                    },
                    {
                        icon: "🎯",
                        title: "Budget Management",
                        description: "Set up and track budgets by category, helping you control spending and develop good financial habits."
                    },
                    {
                        icon: "💰",
                        title: "Loan Management",
                        description: "Track loans, repayment schedules, and calculate interest rates accurately and in detail."
                    },
                    {
                        icon: "📈",
                        title: "Investment Management",
                        description: "Track real estate investment portfolios, bank savings with automatic interest calculation features."
                    },
                    {
                        icon: "🤖",
                        title: "VanLang Agent AI",
                        description: "Smart AI assistant that helps answer financial questions, calculations, and data analysis in Vietnamese."
                    },
                    {
                        icon: "📱",
                        title: "User-friendly Interface",
                        description: "Responsive design, dark mode support, and multilingual (Vietnamese/English) for the best experience."
                    }
                ]
            }
        };

        // Kiểm tra xem đã có dữ liệu features chưa
        const existingFeatures = await SiteContent.findOne({ type: 'features' });

        let result;
        if (existingFeatures) {
            // Nếu đã có dữ liệu, cập nhật
            logger.info(`Admin ${req.user.email} đang cập nhật dữ liệu mặc định cho trang Features`);
            result = await SiteContent.findOneAndUpdate(
                { type: 'features' },
                {
                    content: defaultFeaturesContent,
                    lastUpdatedBy: req.user._id,
                    status: 'published'
                },
                { new: true, upsert: true }
            );
            logger.info(`Dữ liệu trang Features đã được cập nhật thành công bởi ${req.user.email}`);
        } else {
            // Nếu chưa có dữ liệu, tạo mới
            logger.info(`Admin ${req.user.email} đang tạo dữ liệu mặc định cho trang Features`);
            result = await SiteContent.create({
                type: 'features',
                content: defaultFeaturesContent,
                lastUpdatedBy: req.user._id,
                status: 'published',
                version: 1
            });
            logger.info(`Dữ liệu trang Features đã được tạo thành công bởi ${req.user.email}`);
        }

        res.status(200).json({
            status: 'success',
            message: existingFeatures ? 'Dữ liệu trang Features đã được cập nhật thành công' : 'Dữ liệu trang Features đã được tạo thành công',
            data: {
                content: result.content,
                version: result.version,
                status: result.status,
                type: result.type
            }
        });
    } catch (error) {
        logger.error('Lỗi khi khởi tạo dữ liệu trang Features:', error);
        next(new AppError('Không thể khởi tạo dữ liệu trang Features', 500));
    }
};

/**
 * @desc    Khởi tạo dữ liệu mặc định cho trang Roadmap
 * @route   POST /api/site-content/roadmap/initialize
 * @access  Private (Admin/Superadmin)
 */
export const initializeRoadmapContent = async (req, res, next) => {
    try {
        const defaultRoadmapContent = {
            vi: {
                title: "Lộ trình phát triển",
                subtitle: "Kế hoạch phát triển sản phẩm",
                description: "Những tính năng và cải tiến sẽ được phát triển trong tương lai",
                roadmap: []
            },
            en: {
                title: "Development Roadmap",
                subtitle: "Product development plan",
                description: "Features and improvements to be developed in the future",
                roadmap: []
            }
        };

        const existingRoadmap = await SiteContent.findOne({ type: 'roadmap' });

        let result;
        if (existingRoadmap) {
            result = await SiteContent.findOneAndUpdate(
                { type: 'roadmap' },
                {
                    content: defaultRoadmapContent,
                    lastUpdatedBy: req.user._id,
                    status: 'published'
                },
                { new: true, upsert: true }
            );
        } else {
            result = await SiteContent.create({
                type: 'roadmap',
                content: defaultRoadmapContent,
                lastUpdatedBy: req.user._id,
                status: 'published',
                version: 1
            });
        }

        res.status(200).json({
            status: 'success',
            message: existingRoadmap ? 'Dữ liệu trang Roadmap đã được cập nhật thành công' : 'Dữ liệu trang Roadmap đã được tạo thành công',
            data: {
                content: result.content,
                version: result.version,
                status: result.status,
                type: result.type
            }
        });
    } catch (error) {
        logger.error('Lỗi khi khởi tạo dữ liệu trang Roadmap:', error);
        next(new AppError('Không thể khởi tạo dữ liệu trang Roadmap', 500));
    }
};

/**
 * @desc    Khởi tạo dữ liệu mặc định cho trang Pricing
 * @route   POST /api/site-content/pricing/initialize
 * @access  Private (Admin/Superadmin)
 */
export const initializePricingContent = async (req, res, next) => {
    try {
        const defaultPricingContent = {
            vi: {
                title: "Bảng giá",
                subtitle: "Lựa chọn gói phù hợp với bạn",
                description: "Các gói dịch vụ với mức giá hợp lý",
                plans: []
            },
            en: {
                title: "Pricing",
                subtitle: "Choose the plan that suits you",
                description: "Service packages with reasonable prices",
                plans: []
            }
        };

        const existingPricing = await SiteContent.findOne({ type: 'pricing' });

        let result;
        if (existingPricing) {
            result = await SiteContent.findOneAndUpdate(
                { type: 'pricing' },
                {
                    content: defaultPricingContent,
                    lastUpdatedBy: req.user._id,
                    status: 'published'
                },
                { new: true, upsert: true }
            );
        } else {
            result = await SiteContent.create({
                type: 'pricing',
                content: defaultPricingContent,
                lastUpdatedBy: req.user._id,
                status: 'published',
                version: 1
            });
        }

        res.status(200).json({
            status: 'success',
            message: existingPricing ? 'Dữ liệu trang Pricing đã được cập nhật thành công' : 'Dữ liệu trang Pricing đã được tạo thành công',
            data: {
                content: result.content,
                version: result.version,
                status: result.status,
                type: result.type
            }
        });
    } catch (error) {
        logger.error('Lỗi khi khởi tạo dữ liệu trang Pricing:', error);
        next(new AppError('Không thể khởi tạo dữ liệu trang Pricing', 500));
    }
};
