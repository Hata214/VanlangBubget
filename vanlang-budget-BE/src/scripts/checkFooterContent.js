import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';
import logger from '../utils/logger.js';

const checkFooterContent = async () => {
    try {
        console.log('🔗 Kết nối đến MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Đã kết nối thành công đến MongoDB');
        
        const footerContent = await SiteContent.findOne({ type: 'footer' });
        
        if (footerContent) {
            console.log('🦶 Footer content tìm thấy:');
            console.log('ID:', footerContent._id);
            console.log('Type:', footerContent.type);
            console.log('Content:', JSON.stringify(footerContent.content, null, 2));
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

checkFooterContent();
