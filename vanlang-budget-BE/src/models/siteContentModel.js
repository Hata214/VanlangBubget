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
            required: [true, 'Nội dung là bắt buộc']
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
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

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

export default SiteContent;
