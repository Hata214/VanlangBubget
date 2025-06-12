import mongoose from 'mongoose';

/**
 * Schema cho nội dung trang web có thể quản lý
 * Bao gồm footer và các nội dung khác có thể mở rộng sau này
 */
const siteContentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: [true, 'Loại nội dung là bắt buộc'],
            enum: {
                values: ['footer', 'header', 'about', 'terms', 'privacy', 'homepage', 'faq', 'contact', 'roadmap', 'pricing', 'features'],
                message: 'Loại nội dung phải là một trong những giá trị: footer, header, about, terms, privacy, homepage, faq, contact, roadmap, pricing, features'
            },
            unique: true
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'Nội dung là bắt buộc'],
            validate: {
                validator: function (contentValue) { // contentValue là object đa ngôn ngữ {vi: ..., en: ...}
                    if (this.type === 'homepage') {
                        if (typeof contentValue !== 'object' || contentValue === null) {
                            return false;
                        }
                        // Xác định nội dung tham chiếu (ví dụ: tiếng Việt hoặc ngôn ngữ đầu tiên có dữ liệu)
                        const refLang = contentValue.vi ? 'vi' : Object.keys(contentValue).find(lang => typeof contentValue[lang] === 'object' && contentValue[lang] !== null);
                        const refContent = refLang ? contentValue[refLang] : null;

                        if (!refContent || typeof refContent !== 'object') {
                            // Không có ngôn ngữ tham chiếu hoặc nội dung tham chiếu không phải object
                            return false;
                        }

                        const validSections = ['hero', 'features', 'testimonials', 'pricing', 'cta', 'stats', 'footer', 'header'];
                        const hasAtLeastOneSection = validSections.some(section => {
                            return refContent[section] && typeof refContent[section] === 'object';
                        });

                        if (!hasAtLeastOneSection) {
                            return false;
                        }

                        // Lưu các section vào trường sections dựa trên nội dung tham chiếu
                        this.sections = Object.keys(refContent).filter(key =>
                            validSections.includes(key) && refContent[key] && typeof refContent[key] === 'object'
                        );
                    }
                    return true;
                },
                message: 'Cấu trúc nội dung trang chủ không hợp lệ. Phải có ít nhất một section hợp lệ trong ngôn ngữ tham chiếu.'
            }
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sections: {
            type: [String],
            default: [],
            validate: {
                validator: function (sections) {
                    // Nếu là homepage, sections không được rỗng
                    return this.type !== 'homepage' || sections.length > 0;
                },
                message: 'Nội dung trang chủ phải có ít nhất một section'
            }
        },
        status: {
            type: String,
            enum: {
                values: ['draft', 'published', 'pending_review'],
                message: 'Trạng thái phải là: draft, published, hoặc pending_review'
            },
            default: 'published'
        },
        version: {
            type: Number,
            default: 1
        },
        languages: {
            type: [String],
            default: ['vi']
        },
        history: [
            {
                content: mongoose.Schema.Types.Mixed,
                updatedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                updatedAt: {
                    type: Date,
                    default: Date.now
                },
                version: Number,
                status: String
            }
        ]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Đảm bảo chỉ có một bản ghi cho mỗi loại nội dung
siteContentSchema.index({ type: 1 }, { unique: true });

/**
 * Phương thức tĩnh để lấy nội dung footer
 */
siteContentSchema.statics.getFooterContent = async function () {
    const footerContent = await this.findOne({ type: 'footer' });
    return footerContent ? footerContent.content : null;
};

/**
 * Phương thức tĩnh để cập nhật nội dung footer
 */
siteContentSchema.statics.updateFooterContent = async function (content, userId) {
    return this.findOneAndUpdate(
        { type: 'footer' },
        {
            content,
            lastUpdatedBy: userId
        },
        {
            new: true,
            upsert: true,
            runValidators: true
        }
    );
};

/**
 * Phương thức tĩnh để lấy nội dung trang chủ
 */
siteContentSchema.statics.getHomepageContent = async function () {
    try {
        const homepageDoc = await this.findOne({ type: 'homepage' });
        if (!homepageDoc) {
            return null;
        }
        // Trả về toàn bộ document. Frontend sẽ chịu trách nhiệm hiển thị ngôn ngữ phù hợp.
        // Sử dụng toObject() để đảm bảo virtuals (nếu có) được bao gồm và là plain JS object.
        return homepageDoc.toObject({ virtuals: true });
    } catch (error) {
        // Thay thế bằng logger phù hợp cho production
        console.error('Lỗi trong SiteContent.getHomepageContent:', error);
        return null;
    }
};

/**
 * Phương thức tĩnh để cập nhật nội dung trang chủ
 */
siteContentSchema.statics.updateHomepageContent = async function (content, userId, options = {}) {
    const existingContent = await this.findOne({ type: 'homepage' });

    // Lưu phiên bản cũ vào lịch sử
    const updateData = {
        content,
        lastUpdatedBy: userId,
        $push: {}
    };

    if (existingContent) {
        updateData.version = existingContent.version + 1;
        updateData.$push.history = {
            content: existingContent.content,
            updatedBy: existingContent.lastUpdatedBy,
            updatedAt: existingContent.updatedAt,
            version: existingContent.version,
            status: existingContent.status
        };
    } else {
        updateData.version = 1;
    }

    // Cập nhật sections - Sẽ được xử lý bởi validator, không cần gán ở đây nữa
    // if (content && typeof content === 'object' && existingContent?.type === 'homepage') {
    //     // Logic xác định sections từ content đa ngôn ngữ đã được chuyển vào validator
    // }

    // Cập nhật trạng thái
    if (options.status) {
        updateData.status = options.status;
    }

    // Cập nhật ngôn ngữ được hỗ trợ
    // options.language được dùng bởi updateSiteContentByType khi cập nhật toàn bộ content cho một ngôn ngữ
    // options.addNewLanguage được dùng bởi updateHomepageSection khi một section của ngôn ngữ mới được thêm vào
    const languageToAdd = options.addNewLanguage || options.language;
    if (languageToAdd && (!existingContent || !existingContent.languages.includes(languageToAdd))) {
        if (!updateData.$addToSet) {
            updateData.$addToSet = {};
        }
        updateData.$addToSet.languages = languageToAdd;
    }

    return this.findOneAndUpdate(
        { type: 'homepage' },
        updateData,
        {
            new: true,
            upsert: true,
            runValidators: true
        }
    );
};

/**
 * Phương thức tĩnh để cập nhật một section cụ thể của trang chủ
 */
siteContentSchema.statics.updateHomepageSection = async function (sectionName, sectionData, userId, options = {}) {
    const { language = 'vi' } = options; // Mặc định là 'vi' nếu không có ngôn ngữ nào được cung cấp

    const homepageDoc = await this.findOne({ type: 'homepage' });

    let currentFullContent = homepageDoc && homepageDoc.content ? { ...homepageDoc.content } : {};

    // Đảm bảo cấu trúc ngôn ngữ tồn tại trong currentFullContent
    if (!currentFullContent[language] || typeof currentFullContent[language] !== 'object') {
        currentFullContent[language] = {};
    }

    // Cập nhật section cho ngôn ngữ cụ thể
    currentFullContent[language][sectionName] = sectionData;

    // Chuẩn bị options cho updateHomepageContent
    const updateOptions = { ...options };
    // Nếu ngôn ngữ này chưa có trong danh sách languages của document, đánh dấu để thêm mới
    if (homepageDoc && !homepageDoc.languages.includes(language)) {
        updateOptions.addNewLanguage = language;
    }
    // Xóa language khỏi options vì updateHomepageContent sẽ nhận toàn bộ currentFullContent
    // và options.language trong updateHomepageContent dùng để thêm ngôn ngữ mới vào mảng languages
    delete updateOptions.language;


    // Gọi phương thức cập nhật đầy đủ với toàn bộ object content đã được sửa đổi
    return this.updateHomepageContent(currentFullContent, userId, updateOptions);
};

/**
 * Phương thức tĩnh để lấy một section cụ thể của trang chủ
 */
siteContentSchema.statics.getHomepageSection = async function (sectionName, language = 'vi') {
    const homepageContent = await this.findOne({ type: 'homepage' });
    if (!homepageContent || !homepageContent.content) return null;

    // Xử lý nội dung theo ngôn ngữ nếu được hỗ trợ
    if (language && language !== 'vi' && homepageContent.content[language]) {
        return homepageContent.content[language][sectionName] || null;
    }

    return homepageContent.content[sectionName] || null;
};

/**
 * Phương thức tĩnh để lấy lịch sử thay đổi nội dung
 */
siteContentSchema.statics.getContentHistory = async function (type) {
    const content = await this.findOne({ type })
        .populate('lastUpdatedBy', 'firstName lastName email')
        .populate('history.updatedBy', 'firstName lastName email');

    if (!content) return [];

    const history = [...content.history];

    // Thêm phiên bản hiện tại vào lịch sử
    history.unshift({
        content: content.content,
        updatedBy: content.lastUpdatedBy,
        updatedAt: content.updatedAt,
        version: content.version,
        status: content.status
    });

    return history;
};

/**
 * Phương thức tĩnh để khôi phục nội dung từ phiên bản trước
 */
siteContentSchema.statics.restoreVersion = async function (type, version, userId) {
    const content = await this.findOne({ type });
    if (!content) return null;

    let versionContent = null;

    // Tìm phiên bản cần khôi phục
    for (const record of content.history) {
        if (record.version === version) {
            versionContent = record.content;
            break;
        }
    }

    if (!versionContent) return null;

    // Cập nhật nội dung với phiên bản được khôi phục
    if (type === 'homepage') {
        return this.updateHomepageContent(versionContent, userId);
    } else {
        return this.findOneAndUpdate(
            { type },
            {
                content: versionContent,
                lastUpdatedBy: userId,
                version: content.version + 1,
                $push: {
                    history: {
                        content: content.content,
                        updatedBy: content.lastUpdatedBy,
                        updatedAt: content.updatedAt,
                        version: content.version,
                        status: content.status
                    }
                }
            },
            { new: true }
        );
    }
};

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

export default SiteContent;
