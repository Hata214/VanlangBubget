import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';
import logger from '../utils/logger.js';

async function checkHeaderContent() {
    try {
        console.log('🔗 Kết nối đến MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Đã kết nối thành công đến MongoDB');

        // Tìm header content
        const headerContent = await SiteContent.findOne({ type: 'header' });
        
        if (headerContent) {
            console.log('🔝 Header content tìm thấy:');
            console.log('ID:', headerContent._id);
            console.log('Type:', headerContent.type);
            console.log('Content:', JSON.stringify(headerContent.content, null, 2));
            
            // Kiểm tra nav1 cụ thể
            if (headerContent.content.vi && headerContent.content.vi.nav1) {
                console.log('✅ nav1 (vi):', headerContent.content.vi.nav1);
            } else {
                console.log('❌ Không tìm thấy nav1 trong content.vi');
            }
            
            if (headerContent.content.en && headerContent.content.en.nav1) {
                console.log('✅ nav1 (en):', headerContent.content.en.nav1);
            } else {
                console.log('❌ Không tìm thấy nav1 trong content.en');
            }
        } else {
            console.log('❌ Không tìm thấy header content trong database');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã đóng kết nối MongoDB');
    }
}

checkHeaderContent();
