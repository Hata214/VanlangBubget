import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';
import logger from '../utils/logger.js';

const updateFooterSocialLinks = async () => {
    try {
        console.log('🔗 Kết nối đến MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Đã kết nối thành công đến MongoDB');
        
        const footerContent = await SiteContent.findOne({ type: 'footer' });
        
        if (footerContent) {
            console.log('🦶 Footer content hiện tại:', JSON.stringify(footerContent.content, null, 2));
            
            // Thêm social URLs vào content
            const updatedContent = {
                ...footerContent.content,
                vi: {
                    ...footerContent.content.vi,
                    // Thêm URLs cho social media
                    socialFacebookUrl: 'https://facebook.com/vanlangbudget',
                    socialTwitterUrl: 'https://twitter.com/vanlangbudget',
                    socialLinkedinUrl: 'https://linkedin.com/company/vanlangbudget',
                    socialInstagramUrl: 'https://instagram.com/vanlangbudget',
                    socialGithubUrl: 'https://github.com/vanlangbudget'
                }
            };
            
            // Cập nhật database
            await SiteContent.findOneAndUpdate(
                { type: 'footer' },
                { content: updatedContent },
                { new: true }
            );
            
            console.log('✅ Đã cập nhật footer content với social URLs');
            console.log('🔗 Social URLs đã thêm:');
            console.log('- Facebook:', updatedContent.vi.socialFacebookUrl);
            console.log('- Twitter:', updatedContent.vi.socialTwitterUrl);
            console.log('- LinkedIn:', updatedContent.vi.socialLinkedinUrl);
            console.log('- Instagram:', updatedContent.vi.socialInstagramUrl);
            console.log('- GitHub:', updatedContent.vi.socialGithubUrl);
            
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

updateFooterSocialLinks();
