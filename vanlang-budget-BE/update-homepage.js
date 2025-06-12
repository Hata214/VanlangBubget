import mongoose from 'mongoose';
import { defaultHomepageContent } from './src/data/defaultHomepageContent.js';

// Kết nối MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/vanlang-budget', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Đã kết nối MongoDB');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    }
};

// Schema cho SiteContent
const siteContentSchema = new mongoose.Schema({
    type: { type: String, required: true, unique: true },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    sections: [String],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    version: { type: Number, default: 1 },
    lastUpdatedBy: { type: String, default: 'system' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

// Cập nhật nội dung trang chủ
const updateHomepage = async () => {
    try {
        console.log('🔄 Đang cập nhật nội dung trang chủ...');

        const result = await SiteContent.findOneAndUpdate(
            { type: 'homepage' },
            {
                content: defaultHomepageContent,
                sections: Object.keys(defaultHomepageContent.vi || defaultHomepageContent),
                status: 'published',
                updatedAt: new Date(),
                lastUpdatedBy: 'system-update'
            },
            {
                new: true,
                upsert: true // Tạo mới nếu không tồn tại
            }
        );

        console.log('✅ Đã cập nhật nội dung trang chủ thành công!');
        console.log('📄 ID:', result._id);
        console.log('📊 Sections:', result.sections);
        console.log('🕒 Updated at:', result.updatedAt);

        return result;
    } catch (error) {
        console.error('❌ Lỗi khi cập nhật:', error);
        throw error;
    }
};

// Chạy script
const main = async () => {
    try {
        await connectDB();
        await updateHomepage();
        console.log('🎉 Hoàn thành cập nhật!');
        process.exit(0);
    } catch (error) {
        console.error('💥 Script thất bại:', error);
        process.exit(1);
    }
};

main();
