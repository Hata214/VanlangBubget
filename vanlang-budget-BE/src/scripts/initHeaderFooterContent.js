import SiteContent from '../models/siteContentModel.js';
import logger from '../utils/logger.js';

// Default header content
const defaultHeaderContent = {
    vi: {
        logo: 'VanLang Budget',
        nav1: 'Về chúng tôi',
        nav2: 'Tính năng',
        nav3: 'Bảng giá',
        nav4: 'Liên hệ',
        loginButton: 'Đăng nhập',
        signupButton: 'Đăng ký',
        userMenuProfile: 'Hồ sơ',
        userMenuSettings: 'Cài đặt',
        userMenuLogout: 'Đăng xuất'
    },
    en: {
        logo: 'VanLang Budget',
        nav1: 'About Us',
        nav2: 'Features',
        nav3: 'Pricing',
        nav4: 'Contact',
        loginButton: 'Login',
        signupButton: 'Sign Up',
        userMenuProfile: 'Profile',
        userMenuSettings: 'Settings',
        userMenuLogout: 'Logout'
    }
};

// Default footer content
const defaultFooterContent = {
    vi: {
        companyName: 'VanLang Budget',
        description: 'Ứng dụng quản lý tài chính cá nhân thông minh, giúp bạn theo dõi chi tiêu và đạt được mục tiêu tài chính.',
        product1: 'Quản lý chi tiêu',
        product2: 'Lập ngân sách',
        product3: 'Báo cáo tài chính',
        product4: 'Mục tiêu tiết kiệm',
        company1: 'Về chúng tôi',
        company2: 'Liên hệ',
        company3: 'Tuyển dụng',
        company4: 'Tin tức',
        support1: 'Trung tâm hỗ trợ',
        support2: 'Hướng dẫn sử dụng',
        support3: 'FAQ',
        support4: 'Báo lỗi',
        legal1: 'Điều khoản sử dụng',
        legal2: 'Chính sách bảo mật',
        legal3: 'Chính sách cookie',
        copyright: '© 2024 VanLang Budget. Tất cả quyền được bảo lưu.',
        socialFacebook: 'Facebook',
        socialTwitter: 'Twitter',
        socialLinkedin: 'LinkedIn',
        socialInstagram: 'Instagram'
    },
    en: {
        companyName: 'VanLang Budget',
        description: 'Smart personal finance management app that helps you track expenses and achieve your financial goals.',
        product1: 'Expense Tracking',
        product2: 'Budget Planning',
        product3: 'Financial Reports',
        product4: 'Savings Goals',
        company1: 'About Us',
        company2: 'Contact',
        company3: 'Careers',
        company4: 'News',
        support1: 'Help Center',
        support2: 'User Guide',
        support3: 'FAQ',
        support4: 'Report Bug',
        legal1: 'Terms of Service',
        legal2: 'Privacy Policy',
        legal3: 'Cookie Policy',
        copyright: '© 2024 VanLang Budget. All rights reserved.',
        socialFacebook: 'Facebook',
        socialTwitter: 'Twitter',
        socialLinkedin: 'LinkedIn',
        socialInstagram: 'Instagram'
    }
};

/**
 * Khởi tạo nội dung header mặc định
 */
export const initializeHeaderContent = async () => {
    try {
        console.log('🔝 Bắt đầu khởi tạo nội dung header...');

        // Kiểm tra xem đã có header content chưa
        const existingHeader = await SiteContent.findOne({ type: 'header' });

        if (existingHeader) {
            console.log('✅ Header content đã tồn tại, cập nhật với nội dung mới...');

            // Cập nhật nội dung hiện có
            const updatedHeader = await SiteContent.findOneAndUpdate(
                { type: 'header' },
                {
                    content: defaultHeaderContent,
                    status: 'published',
                    version: existingHeader.version + 1,
                    updatedAt: new Date()
                },
                { new: true, upsert: true }
            );

            console.log('✅ Đã cập nhật header content thành công!');
            return updatedHeader;
        } else {
            console.log('📝 Tạo header content mới...');

            // Tạo mới
            const newHeader = await SiteContent.create({
                type: 'header',
                content: defaultHeaderContent,
                status: 'published',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ Đã tạo header content mới thành công!');
            return newHeader;
        }
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo header content:', error);
        logger.error('Lỗi khi khởi tạo header content:', error);
        throw error;
    }
};

/**
 * Khởi tạo nội dung footer mặc định
 */
export const initializeFooterContent = async () => {
    try {
        console.log('🔻 Bắt đầu khởi tạo nội dung footer...');

        // Kiểm tra xem đã có footer content chưa
        const existingFooter = await SiteContent.findOne({ type: 'footer' });

        if (existingFooter) {
            console.log('✅ Footer content đã tồn tại, cập nhật với nội dung mới...');

            // Cập nhật nội dung hiện có
            const updatedFooter = await SiteContent.findOneAndUpdate(
                { type: 'footer' },
                {
                    content: defaultFooterContent,
                    status: 'published',
                    version: existingFooter.version + 1,
                    updatedAt: new Date()
                },
                { new: true, upsert: true }
            );

            console.log('✅ Đã cập nhật footer content thành công!');
            return updatedFooter;
        } else {
            console.log('📝 Tạo footer content mới...');

            // Tạo mới
            const newFooter = await SiteContent.create({
                type: 'footer',
                content: defaultFooterContent,
                status: 'published',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ Đã tạo footer content mới thành công!');
            return newFooter;
        }
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo footer content:', error);
        logger.error('Lỗi khi khởi tạo footer content:', error);
        throw error;
    }
};

/**
 * Khởi tạo cả header và footer content
 */
export const initializeHeaderFooterContent = async () => {
    try {
        console.log('🚀 Bắt đầu khởi tạo header và footer content...');

        const headerResult = await initializeHeaderContent();
        const footerResult = await initializeFooterContent();

        console.log('🎉 Đã khởi tạo thành công header và footer content!');

        return {
            header: headerResult,
            footer: footerResult
        };
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo header và footer content:', error);
        throw error;
    }
};

// Export default content để sử dụng ở nơi khác
export { defaultHeaderContent, defaultFooterContent };
