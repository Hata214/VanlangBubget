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
                values: ['footer', 'about', 'terms', 'privacy', 'homepage', 'faq', 'contact'],
                message: 'Loại nội dung phải là một trong những giá trị: footer, about, terms, privacy, homepage, faq, contact'
            },
            unique: true
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'Nội dung là bắt buộc'],
            validate: {
                validator: function (content) {
                    // Kiểm tra cấu trúc nội dung cho trang chủ
                    if (this.type === 'homepage') {
                        const requiredSections = ['hero', 'features', 'testimonials', 'pricing'];
                        const requiredKeys = {
                            hero: ['title', 'subtitle', 'imageUrl', 'buttonText', 'buttonLink'],
                            features: ['title', 'subtitle', 'items'],
                            testimonials: ['title', 'subtitle', 'items'],
                            pricing: ['title', 'subtitle', 'plans']
                        };

                        // Kiểm tra các section bắt buộc
                        for (const section of requiredSections) {
                            if (!content[section]) return false;

                            // Kiểm tra các khóa bắt buộc trong mỗi section
                            for (const key of requiredKeys[section]) {
                                if (!content[section][key]) return false;
                            }

                            // Kiểm tra cấu trúc mảng nếu có
                            if (section === 'features' && (!Array.isArray(content.features.items) || content.features.items.length === 0)) {
                                return false;
                            }

                            if (section === 'testimonials' && (!Array.isArray(content.testimonials.items) || content.testimonials.items.length === 0)) {
                                return false;
                            }

                            if (section === 'pricing' && (!Array.isArray(content.pricing.plans) || content.pricing.plans.length === 0)) {
                                return false;
                            }
                        }

                        // Kiểm tra cấu trúc của mỗi item trong features
                        if (content.features && Array.isArray(content.features.items)) {
                            for (const item of content.features.items) {
                                if (!item.title || !item.description || !item.icon) {
                                    return false;
                                }
                            }
                        }

                        // Kiểm tra cấu trúc của mỗi item trong testimonials
                        if (content.testimonials && Array.isArray(content.testimonials.items)) {
                            for (const item of content.testimonials.items) {
                                if (!item.name || !item.position || !item.quote || !item.avatarUrl) {
                                    return false;
                                }
                            }
                        }

                        // Kiểm tra cấu trúc của mỗi plan trong pricing
                        if (content.pricing && Array.isArray(content.pricing.plans)) {
                            for (const plan of content.pricing.plans) {
                                if (!plan.name || !plan.price || !Array.isArray(plan.features)) {
                                    return false;
                                }
                            }
                        }
                    }

                    return true;
                },
                message: 'Cấu trúc nội dung trang chủ không hợp lệ'
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
siteContentSchema.statics.getHomepageContent = async function (language = 'vi') {
    const homepageContent = await this.findOne({ type: 'homepage' });
    if (!homepageContent) return null;

    // Xử lý nội dung theo ngôn ngữ nếu được hỗ trợ
    if (language && language !== 'vi' && homepageContent.content[language]) {
        return homepageContent.content[language];
    }

    // Trả về cả thông tin meta (version, updatedAt, v.v.) kèm theo nội dung
    return {
        content: homepageContent.content,
        version: homepageContent.version,
        updatedAt: homepageContent.updatedAt,
        updatedBy: homepageContent.lastUpdatedBy,
        status: homepageContent.status,
        sections: homepageContent.sections
    };
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

    // Cập nhật sections
    if (content && typeof content === 'object') {
        updateData.sections = Object.keys(content);
    }

    // Cập nhật trạng thái
    if (options.status) {
        updateData.status = options.status;
    }

    // Cập nhật ngôn ngữ được hỗ trợ
    if (options.language && !existingContent?.languages?.includes(options.language)) {
        updateData.$addToSet = { languages: options.language };
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
siteContentSchema.statics.updateHomepageSection = async function (sectionName, sectionContent, userId, options = {}) {
    const existingContent = await this.findOne({ type: 'homepage' });
    if (!existingContent) {
        // Nếu chưa có nội dung trang chủ, tạo mới với section này
        const newContent = { [sectionName]: sectionContent };
        return this.updateHomepageContent(newContent, userId, options);
    }

    // Tạo bản sao nội dung hiện tại
    const updatedContent = { ...existingContent.content };

    // Cập nhật section được chỉ định
    updatedContent[sectionName] = sectionContent;

    // Gọi phương thức cập nhật đầy đủ
    return this.updateHomepageContent(updatedContent, userId, options);
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
