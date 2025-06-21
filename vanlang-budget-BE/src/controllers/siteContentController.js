import SiteContent from '../models/siteContentModel.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';
import defaultHomepageContent from '../data/defaultHomepageContent.js';
import { createHomepageContent, updateHomepageContent as updateHomepageContentScript } from '../scripts/initHomepageContent.js'; // Alias để tránh xung đột tên
import axios from 'axios'; // Thêm axios

// Helper function to trigger revalidation on the frontend
const triggerFrontendRevalidation = async (contentType) => {
    const frontendUrl = process.env.FRONTEND_URL_FOR_REVALIDATE || process.env.FRONTEND_URL; // Ưu tiên biến mới nếu có
    const secretToken = process.env.REVALIDATE_SECRET_TOKEN;

    if (!frontendUrl || !secretToken) {
        logger.warn('Revalidation not triggered: FRONTEND_URL_FOR_REVALIDATE/FRONTEND_URL or REVALIDATE_SECRET_TOKEN is not set.');
        return;
    }

    let pathToRevalidate = '';
    let tagToRevalidate = `siteContent_${contentType}`; // Tag chung cho loại nội dung

    switch (contentType) {
        case 'homepage':
            pathToRevalidate = '/';
            // tagToRevalidate có thể giữ nguyên hoặc thêm tag cụ thể cho homepage nếu cần
            break;
        case 'about':
            pathToRevalidate = '/about';
            break;
        case 'features':
            pathToRevalidate = '/features';
            break;
        case 'roadmap':
            pathToRevalidate = '/roadmap';
            break;
        case 'pricing':
            pathToRevalidate = '/pricing';
            break;
        case 'contact':
            pathToRevalidate = '/contact';
            break;
        // Header và Footer thường là một phần của layout, revalidate các trang chính hoặc dùng tag
        case 'header':
        case 'footer':
            // Có thể revalidate nhiều path hoặc dùng tag nếu các trang dùng chung header/footer
            // Ví dụ revalidate trang chủ, hoặc nếu có tag cụ thể cho header/footer
            // Để đơn giản, có thể revalidate tag chung hoặc các path chính
            // Hoặc không làm gì nếu header/footer được fetch riêng và cache client-side
            tagToRevalidate = `siteLayout_${contentType}`; // Tag riêng cho layout parts
            break;
        default:
            logger.info(`Revalidation path for type '${contentType}' not specifically defined, using tag '${tagToRevalidate}'.`);
        // Không cần path cụ thể nếu chỉ dùng tag
    }

    const revalidateUrlPath = `${frontendUrl}/api/revalidate?path=${encodeURIComponent(pathToRevalidate)}&secret=${secretToken}`;
    const revalidateUrlTag = `${frontendUrl}/api/revalidate?tag=${encodeURIComponent(tagToRevalidate)}&secret=${secretToken}`;

    try {
        if (pathToRevalidate) {
            logger.info(`Attempting to revalidate path: ${pathToRevalidate} via URL: ${revalidateUrlPath}`);
            const pathResponse = await axios.get(revalidateUrlPath);
            logger.info(`Frontend path revalidation for '${pathToRevalidate}' triggered:`, pathResponse.data);
        }

        logger.info(`Attempting to revalidate tag: ${tagToRevalidate} via URL: ${revalidateUrlTag}`);
        const tagResponse = await axios.get(revalidateUrlTag);
        logger.info(`Frontend tag revalidation for '${tagToRevalidate}' triggered:`, tagResponse.data);

    } catch (error) {
        logger.error(`Error triggering frontend revalidation for ${contentType}:`, error.response ? error.response.data : error.message);
    }
};


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

        // console.log(`getSiteContentByType được gọi với type=${type}, language=${language}`);

        const validTypes = ['footer', 'header', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing', 'features'];

        if (!type || !validTypes.includes(type)) {
            return next(new AppError('Loại nội dung không hợp lệ', 400));
        }

        // Xử lý đặc biệt cho homepage
        if (type === 'homepage') {
            // Model getHomepageContent() giờ sẽ trả về toàn bộ document
            // Frontend sẽ chịu trách nhiệm chọn ngôn ngữ để hiển thị từ object content
            const homepageContent = await SiteContent.getHomepageContent();

            // Nếu không có dữ liệu, trả về dữ liệu mặc định
            if (!homepageContent) {
                logger.info('Không tìm thấy nội dung trang chủ, trả về dữ liệu mặc định');
                return res.status(200).json({
                    status: 'success',
                    data: {
                        content: defaultHomepageContent,
                        version: 1,
                        status: 'published',
                        sections: Object.keys(defaultHomepageContent.vi || defaultHomepageContent)
                    }
                });
            }

            return res.status(200).json({
                status: 'success',
                data: homepageContent
            });
        }

        const siteContent = await SiteContent.findOne({ type });

        if (!siteContent) {
            return res.status(200).json({
                status: 'success',
                data: null
            });
        }

        // Luôn trả về toàn bộ document SiteContent.
        // Frontend admin sẽ chịu trách nhiệm lấy siteContent.content[selectedLanguage].
        // Tham số 'language' trong query có thể vẫn hữu ích cho các client public muốn lấy nội dung đã được lọc sẵn.
        // Tuy nhiên, để admin chỉnh sửa, việc có toàn bộ object content là cần thiết.
        // Nếu client là admin panel, nó nên bỏ qua việc lọc theo 'language' ở đây và tự xử lý.
        // Hoặc, chúng ta có thể quyết định rằng endpoint này cho admin luôn trả về toàn bộ.
        // Hiện tại, để đơn giản, chúng ta sẽ trả về toàn bộ document.

        res.status(200).json({
            status: 'success',
            data: siteContent.toObject({ virtuals: true }) // Trả về toàn bộ document
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

        // console.log(`🔄 updateSiteContentByType được gọi với type=${type}`);
        // console.log(`📝 Content được gửi:`, JSON.stringify(content, null, 2));

        const validTypes = ['footer', 'header', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing', 'features'];

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
            // req.body.content bây giờ nên là một object chứa toàn bộ dữ liệu đa ngôn ngữ, ví dụ: { vi: {...}, en: {...} }
            // Model updateHomepageContent sẽ xử lý việc lưu trữ cấu trúc này.
            const userRole = req.user.role;
            const contentStatus = userRole === 'superadmin' ? (status || 'published') : 'pending_review';

            // Không cần truyền options.language ở đây nữa vì content đã bao gồm tất cả ngôn ngữ
            // Model sẽ tự động cập nhật mảng languages nếu có ngôn ngữ mới trong content.
            updatedContent = await SiteContent.updateHomepageContent(content, req.user._id, {
                status: contentStatus,
                // language: req.body.language // Loại bỏ, vì content đã là object đa ngôn ngữ
            });

            // Ghi log cần superadmin phê duyệt nếu là admin thông thường
            if (userRole !== 'superadmin') {
                logger.info(`Nội dung trang chủ cần được SuperAdmin phê duyệt, cập nhật bởi: ${req.user.email}`);
            }
        } else {
            // Đối với các type khác (about, features, header, footer, etc.)
            // req.body.content nên là object đa ngôn ngữ hoàn chỉnh { vi: ..., en: ... }
            // req.body.language có thể được gửi để chỉ định ngôn ngữ chính đang được sửa,
            // giúp backend biết để thêm vào mảng 'languages' nếu là ngôn ngữ mới.
            const { language } = req.body;
            const updateQuery = {
                content,
                lastUpdatedBy: req.user._id
            };

            const existingDoc = await SiteContent.findOne({ type });
            if (language && (!existingDoc || !existingDoc.languages.includes(language))) {
                updateQuery.$addToSet = { languages: language };
            }

            updatedContent = await SiteContent.findOneAndUpdate(
                { type },
                updateQuery,
                { new: true, upsert: true, runValidators: true } // Thêm runValidators
            );
        }

        // Ghi log kết quả
        logger.info(`Cập nhật nội dung ${type} thành công, ID: ${updatedContent._id}`);
        // console.log(`✅ Cập nhật thành công, trả về data:`, JSON.stringify(updatedContent.content, null, 2));

        // Trigger revalidation
        await triggerFrontendRevalidation(type);

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

        // console.log(`getHomepageSection được gọi với section=${section}, language=${language}`);

        // Kiểm tra tính hợp lệ của section
        const validSections = ['hero', 'features', 'testimonials', 'pricing', 'cta', 'stats', 'footer', 'header'];
        if (!section || !validSections.includes(section)) {
            // console.log(`Section không hợp lệ: ${section}`);
            return next(new AppError(`Section không hợp lệ: ${section}`, 400));
        }

        const homepage = await SiteContent.findOne({ type: 'homepage' });

        // Nếu không có dữ liệu trong DB, sử dụng dữ liệu mặc định
        if (!homepage) {
            // Kiểm tra xem section có tồn tại trong dữ liệu mặc định không
            const defaultLang = language && language !== 'vi' ? language : 'vi';
            const defaultContent = defaultHomepageContent[defaultLang];

            if (defaultContent && defaultContent[section]) {
                logger.info(`Không tìm thấy nội dung trang chủ, trả về dữ liệu mặc định cho section: ${section}, language: ${defaultLang}`);
                return res.status(200).json({
                    status: 'success',
                    data: defaultContent[section]
                });
            } else {
                logger.info(`Section ${section} không tồn tại trong dữ liệu mặc định cho ngôn ngữ ${defaultLang}`);
                return res.status(200).json({
                    status: 'success',
                    data: null
                });
            }
        }

        // Kiểm tra nếu có hỗ trợ ngôn ngữ được yêu cầu
        let content = homepage.content;

        // Log nội dung hiện tại để debug
        // console.log(`Nội dung trang chủ hiện tại có sections: ${Object.keys(content).join(', ')}`);

        if (language && language !== 'vi' && content[language] && content[language][section]) {
            // console.log(`Trả về nội dung section ${section} cho ngôn ngữ ${language}`);
            return res.status(200).json({
                status: 'success',
                data: content[language][section]
            });
        }

        // Kiểm tra xem section có tồn tại không
        if (!content[section]) {
            // console.log(`Section ${section} không tồn tại trong nội dung trang chủ, sử dụng dữ liệu mặc định`);
            // Nếu không có trong DB, sử dụng dữ liệu mặc định
            const defaultLang = language && language !== 'vi' ? language : 'vi';
            const defaultContent = defaultHomepageContent[defaultLang];

            if (defaultContent && defaultContent[section]) {
                return res.status(200).json({
                    status: 'success',
                    data: defaultContent[section],
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
        // console.log(`Trả về nội dung section ${section} từ database`);
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
            data: content, // Trả về nội dung của section vừa được cập nhật
            meta: {
                version: updatedContent.version,
                status: updatedContent.status,
                updatedAt: updatedContent.updatedAt,
                // sections: updatedContent.sections // Cân nhắc trả về sections nếu cần
            }
        });

        // Trigger revalidation
        // Vì updateHomepageSection cập nhật một phần của 'homepage', chúng ta revalidate 'homepage'
        await triggerFrontendRevalidation('homepage');

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

        const validTypes = ['footer', 'header', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing'];

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

        const validTypes = ['footer', 'header', 'about', 'terms', 'privacy', 'faq', 'contact', 'homepage', 'roadmap', 'pricing'];

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
 * @access  Private (Admin/SuperAdmin)
 */
export const initializeHomepageContent = async (req, res, next) => {
    try {
        // Kiểm tra xem đã có dữ liệu trang chủ chưa
        const existingHomepage = await SiteContent.findOne({ type: 'homepage' });

        let result;
        if (existingHomepage) {
            // Nếu đã có dữ liệu, cập nhật
            logger.info(`Admin ${req.user.email} (${req.user.role}) đang cập nhật dữ liệu mặc định cho trang chủ`);
            result = await updateHomepageContentScript();
            logger.info(`Dữ liệu trang chủ đã được cập nhật thành công bởi ${req.user.email}`);
        } else {
            // Nếu chưa có dữ liệu, tạo mới
            logger.info(`Admin ${req.user.email} (${req.user.role}) đang tạo dữ liệu mặc định cho trang chủ`);
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
                description: "Khám phá kế hoạch phát triển của VanLang Budget và các tính năng sắp ra mắt trong tương lai.",
                milestones: [
                    {
                        date: "Q1 2025",
                        title: "Nền Tảng Cơ Bản",
                        description: "Xây dựng các tính năng cơ bản cho việc quản lý tài chính cá nhân và theo dõi chi tiêu hàng ngày.",
                        completed: true
                    },
                    {
                        date: "Q2 2025",
                        title: "Quản lý ngân sách",
                        description: "Phát triển các tính năng quản lý ngân sách nâng cao và báo cáo chi tiết.",
                        completed: false
                    },
                    {
                        date: "Q3 2025",
                        title: "Tự động AI thông minh",
                        description: "Tích hợp AI để phân tích chi tiêu thông minh và đưa ra gợi ý tối ưu ngân sách.",
                        completed: false
                    },
                    {
                        date: "Q4 2025",
                        title: "Tích hợp ngân hàng",
                        description: "Kết nối trực tiếp với các ngân hàng để đồng bộ giao dịch tự động và quản lý toàn diện.",
                        completed: false
                    }
                ]
            },
            en: {
                title: "Development Roadmap",
                description: "Explore VanLang Budget's development plan and upcoming features to be released in the future.",
                milestones: [
                    {
                        date: "Q1 2025",
                        title: "Basic Foundation",
                        description: "Build basic features for personal financial management and daily expense tracking.",
                        completed: true
                    },
                    {
                        date: "Q2 2025",
                        title: "Budget Management",
                        description: "Develop advanced budget management features and detailed reporting.",
                        completed: false
                    },
                    {
                        date: "Q3 2025",
                        title: "Smart AI Automation",
                        description: "Integrate AI for smart spending analysis and optimal budget recommendations.",
                        completed: false
                    },
                    {
                        date: "Q4 2025",
                        title: "Banking Integration",
                        description: "Direct connection with banks for automatic transaction sync and comprehensive management.",
                        completed: false
                    }
                ]
            }
        };

        const existingRoadmap = await SiteContent.findOne({ type: 'roadmap' });

        let result;
        if (existingRoadmap) {
            result = await SiteContent.findOneAndUpdate(
                { type: 'roadmap' },
                {
                    content: defaultRoadmapContent,
                    lastUpdatedBy: req.user ? req.user._id : null,
                    status: 'published'
                },
                { new: true, upsert: true }
            );
        } else {
            result = await SiteContent.create({
                type: 'roadmap',
                content: defaultRoadmapContent,
                lastUpdatedBy: req.user ? req.user._id : null,
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
                title: "Bảng Giá",
                subtitle: "Các gói dịch vụ VanLang Budget",
                description: "Chọn gói dịch vụ phù hợp với nhu cầu tài chính của bạn",
                comingSoonTitle: "Sắp Ra Mắt",
                comingSoonDescription: "Chúng tôi đang nỗ lực để cung cấp cho bạn những gói dịch vụ tốt nhất. Vui lòng quay lại sau để xem thông tin chi tiết về giá."
            },
            en: {
                title: "Pricing",
                subtitle: "VanLang Budget service packages",
                description: "Choose the service package that fits your financial needs",
                comingSoonTitle: "Coming Soon",
                comingSoonDescription: "We are working to provide you with the best service packages. Please check back later for pricing details."
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

/**
 * @desc    Khởi tạo dữ liệu mặc định cho trang Contact
 * @route   POST /api/site-content/contact/initialize
 * @access  Private (Admin/Superadmin)
 */
export const initializeContactContent = async (req, res, next) => {
    try {
        const defaultContactContent = {
            vi: {
                title: "Liên hệ với chúng tôi",
                subtitle: "Chúng tôi luôn sẵn sàng hỗ trợ bạn",
                description: "Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.",
                contactInfo: {
                    title: "Thông tin liên hệ",
                    emailLabel: "Email",
                    email: "support@vanlangbudget.com",
                    phoneLabel: "Điện thoại",
                    phone: "(+84) 123 456 789",
                    addressLabel: "Địa chỉ",
                    address: "Hà Nội, Việt Nam",
                    workingHoursLabel: "Giờ làm việc",
                    workingHours: "Thứ Hai - Thứ Sáu: 9:00 - 17:00"
                },
                contactForm: {
                    title: "Gửi tin nhắn cho chúng tôi",
                    nameLabel: "Họ và tên",
                    namePlaceholder: "Nhập họ và tên của bạn",
                    emailLabel: "Email",
                    emailPlaceholder: "Nhập địa chỉ email của bạn",
                    subjectLabel: "Chủ đề",
                    subjectPlaceholder: "Nhập chủ đề tin nhắn",
                    messageLabel: "Tin nhắn",
                    messagePlaceholder: "Nhập tin nhắn của bạn",
                    submitButton: "Gửi tin nhắn",
                    successMessage: "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.",
                    errorMessage: "Có lỗi xảy ra. Vui lòng thử lại sau."
                },
                faq: {
                    title: "Câu hỏi thường gặp",
                    questions: [
                        {
                            question: "VanLang Budget có miễn phí không?",
                            answer: "Có, VanLang Budget hiện tại hoàn toàn miễn phí cho tất cả người dùng."
                        },
                        {
                            question: "Làm thế nào để bắt đầu sử dụng?",
                            answer: "Bạn chỉ cần đăng ký tài khoản và có thể bắt đầu quản lý tài chính ngay lập tức."
                        },
                        {
                            question: "Dữ liệu của tôi có an toàn không?",
                            answer: "Chúng tôi sử dụng các biện pháp bảo mật cao nhất để bảo vệ thông tin của bạn."
                        }
                    ]
                }
            },
            en: {
                title: "Contact Us",
                subtitle: "We're always here to help you",
                description: "If you have any questions or requests, don't hesitate to contact us. Our support team is always ready to help you.",
                contactInfo: {
                    title: "Contact Information",
                    emailLabel: "Email",
                    email: "support@vanlangbudget.com",
                    phoneLabel: "Phone",
                    phone: "(+84) 123 456 789",
                    addressLabel: "Address",
                    address: "Hanoi, Vietnam",
                    workingHoursLabel: "Working Hours",
                    workingHours: "Monday - Friday: 9:00 - 17:00"
                },
                contactForm: {
                    title: "Send us a message",
                    nameLabel: "Full Name",
                    namePlaceholder: "Enter your full name",
                    emailLabel: "Email",
                    emailPlaceholder: "Enter your email address",
                    subjectLabel: "Subject",
                    subjectPlaceholder: "Enter message subject",
                    messageLabel: "Message",
                    messagePlaceholder: "Enter your message",
                    submitButton: "Send Message",
                    successMessage: "Thank you for contacting us! We will respond as soon as possible.",
                    errorMessage: "An error occurred. Please try again later."
                },
                faq: {
                    title: "Frequently Asked Questions",
                    questions: [
                        {
                            question: "Is VanLang Budget free?",
                            answer: "Yes, VanLang Budget is currently completely free for all users."
                        },
                        {
                            question: "How do I get started?",
                            answer: "You just need to register an account and can start managing your finances immediately."
                        },
                        {
                            question: "Is my data safe?",
                            answer: "We use the highest security measures to protect your information."
                        }
                    ]
                }
            }
        };

        const existingContact = await SiteContent.findOne({ type: 'contact' });

        let result;
        if (existingContact) {
            result = await SiteContent.findOneAndUpdate(
                { type: 'contact' },
                {
                    content: defaultContactContent,
                    lastUpdatedBy: req.user._id,
                    status: 'published'
                },
                { new: true, upsert: true }
            );
        } else {
            result = await SiteContent.create({
                type: 'contact',
                content: defaultContactContent,
                lastUpdatedBy: req.user._id,
                status: 'published',
                version: 1
            });
        }

        res.status(200).json({
            status: 'success',
            message: existingContact ? 'Dữ liệu trang Contact đã được cập nhật thành công' : 'Dữ liệu trang Contact đã được tạo thành công',
            data: {
                content: result.content,
                version: result.version,
                status: result.status,
                type: result.type
            }
        });
    } catch (error) {
        logger.error('Lỗi khi khởi tạo dữ liệu trang Contact:', error);
        next(new AppError('Không thể khởi tạo dữ liệu trang Contact', 500));
    }
};
