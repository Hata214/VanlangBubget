import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';
import defaultHomepageContent from '../data/defaultHomepageContent.js';
import 'dotenv/config';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';

/**
 * Script để khởi tạo dữ liệu mặc định cho trang chủ trong cơ sở dữ liệu
 */
const initHomepageContent = async () => {
    try {
        // Kết nối với MongoDB
        const MONGO_URI = process.env.MONGODB_URI;
        if (!MONGO_URI) {
            console.error('MONGODB_URI không được định nghĩa trong biến môi trường');
            process.exit(1);
        }

        console.log('Đang kết nối với MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Đã kết nối thành công với MongoDB');

        // Kiểm tra xem đã có dữ liệu trang chủ chưa
        const existingHomepage = await SiteContent.findOne({ type: 'homepage' });

        if (existingHomepage) {
            console.log('Dữ liệu trang chủ đã tồn tại trong cơ sở dữ liệu');
            console.log('ID:', existingHomepage._id);
            console.log('Version:', existingHomepage.version);
            console.log('Status:', existingHomepage.status);
            console.log('Sections:', existingHomepage.sections);

            // Hỏi người dùng có muốn ghi đè không
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            readline.question('Bạn có muốn ghi đè dữ liệu hiện tại không? (y/n) ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                    await updateHomepageContent();
                    readline.close();
                    process.exit(0);
                } else {
                    console.log('Hủy thao tác');
                    readline.close();
                    process.exit(0);
                }
            });
        } else {
            // Nếu chưa có dữ liệu, tạo mới
            await createHomepageContent();
            process.exit(0);
        }
    } catch (error) {
        console.error('Lỗi khi khởi tạo dữ liệu trang chủ:', error);
        process.exit(1);
    }
};

/**
 * Tạo mới dữ liệu trang chủ
 */
const createHomepageContent = async () => {
    try {
        const newHomepage = await SiteContent.create({
            type: 'homepage',
            content: defaultHomepageContent,
            sections: Object.keys(defaultHomepageContent),
            status: 'published',
            version: 1
        });

        console.log('Đã tạo dữ liệu trang chủ thành công');
        console.log('ID:', newHomepage._id);
        console.log('Version:', newHomepage.version);
        console.log('Status:', newHomepage.status);
        console.log('Sections:', newHomepage.sections);

        return newHomepage;
    } catch (error) {
        console.error('Lỗi khi tạo dữ liệu trang chủ:', error);
        throw error;
    }
};

/**
 * Cập nhật dữ liệu trang chủ
 */
const updateHomepageContent = async () => {
    try {
        const updatedHomepage = await SiteContent.findOneAndUpdate(
            { type: 'homepage' },
            {
                content: defaultHomepageContent,
                sections: Object.keys(defaultHomepageContent),
                status: 'published'
            },
            { new: true }
        );

        console.log('Đã cập nhật dữ liệu trang chủ thành công');
        console.log('ID:', updatedHomepage._id);
        console.log('Version:', updatedHomepage.version);
        console.log('Status:', updatedHomepage.status);
        console.log('Sections:', updatedHomepage.sections);

        return updatedHomepage;
    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu trang chủ:', error);
        throw error;
    }
};

// Chạy script nếu được gọi trực tiếp
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    initHomepageContent();
}

export { initHomepageContent, createHomepageContent, updateHomepageContent };
