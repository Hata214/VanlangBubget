import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';
import logger from '../utils/logger.js';

const updateSocialLinks = async () => {
    try {
        console.log('🔗 Kết nối đến MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Đã kết nối thành công đến MongoDB');

        const footerContent = await SiteContent.findOne({ type: 'footer' });

        if (footerContent) {
            console.log('🦶 Cập nhật social links...');

            // Thay đổi URLs ở đây - CHỈNH SỬA CÁC URL THEO Ý MUỐN
            const newSocialLinks = {
                socialFacebookUrl: 'https://facebook.com/yourcompany',      // ← Thay đổi URL Facebook
                socialTwitterUrl: 'https://twitter.com/yourcompany',        // ← Thay đổi URL Twitter
                socialLinkedinUrl: 'https://linkedin.com/company/yourcompany', // ← Thay đổi URL LinkedIn
                socialInstagramUrl: 'https://instagram.com/yourcompany',    // ← Thay đổi URL Instagram
                socialGithubUrl: 'https://github.com/yourcompany'           // ← Thay đổi URL GitHub
            };

            // Cập nhật content
            const updatedContent = {
                ...footerContent.content,
                vi: {
                    ...footerContent.content.vi,
                    ...newSocialLinks
                },
                en: {
                    ...footerContent.content.en,
                    ...newSocialLinks
                }
            };

            // Lưu vào database
            await SiteContent.findOneAndUpdate(
                { type: 'footer' },
                { content: updatedContent },
                { new: true }
            );

            console.log('✅ Đã cập nhật social links:');
            Object.entries(newSocialLinks).forEach(([key, value]) => {
                console.log(`- ${key}: ${value}`);
            });

        } else {
            console.log('❌ Không tìm thấy footer content trong database');
        }

        console.log('🔌 Đã đóng kết nối MongoDB');
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

// Chạy script
updateSocialLinks();
