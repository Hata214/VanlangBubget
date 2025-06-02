import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initializeHeaderFooterContent } from './initHeaderFooterContent.js';

// Load environment variables
dotenv.config();

const runInitialization = async () => {
    try {
        console.log('🔗 Kết nối đến MongoDB...');
        
        // Kết nối đến MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Đã kết nối thành công đến MongoDB');

        // Chạy khởi tạo header và footer content
        const result = await initializeHeaderFooterContent();
        
        console.log('🎉 Khởi tạo hoàn tất!');
        console.log('📊 Kết quả:');
        console.log('- Header ID:', result.header._id);
        console.log('- Footer ID:', result.footer._id);
        
        // Đóng kết nối
        await mongoose.connection.close();
        console.log('🔌 Đã đóng kết nối MongoDB');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi chạy script:', error);
        
        // Đóng kết nối nếu có lỗi
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        
        process.exit(1);
    }
};

// Chạy script
runInitialization();
