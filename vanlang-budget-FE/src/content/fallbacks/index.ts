// Dữ liệu fallback mặc định cho trang chủ
import homepageVi from './homepage-vi';
import homepageEn from './homepage-en';

// Tập hợp tất cả dữ liệu fallback
export const localFallbackData: Record<string, any> = {
    // Trang chủ
    'homepage-vi': homepageVi,
    'homepage-en': homepageEn,

    // Các trang khác sẽ được thêm sau
    'about-vi': {},
    'about-en': {},
    'features-vi': {
        title: 'Tính năng',
        subtitle: 'Các công cụ quản lý tài chính mạnh mẽ',
        description: 'VanLang Budget cung cấp đầy đủ các tính năng cần thiết để giúp bạn kiểm soát tài chính cá nhân một cách hiệu quả.',
        items: [
            {
                id: 'expense-tracking',
                title: 'Theo dõi chi tiêu',
                description: 'Ghi lại và phân loại tất cả các khoản thu chi hàng ngày, tuần, tháng với giao diện trực quan và dễ sử dụng.',
                icon: 'wallet'
            },
            {
                id: 'budgeting',
                title: 'Lập ngân sách',
                description: 'Thiết lập kế hoạch chi tiêu cho từng danh mục và nhận thông báo khi vượt quá giới hạn.',
                icon: 'calculator'
            },
            {
                id: 'reports',
                title: 'Báo cáo chi tiết',
                description: 'Xem báo cáo trực quan về tình hình tài chính của bạn theo ngày, tuần, tháng hoặc năm.',
                icon: 'chart'
            },
            {
                id: 'goals',
                title: 'Mục tiêu tiết kiệm',
                description: 'Đặt mục tiêu tiết kiệm và theo dõi tiến độ để đạt được những dự định tài chính của bạn.',
                icon: 'piggy-bank'
            }
        ],
        enabled: true
    },
    'features-en': {
        title: 'Features',
        subtitle: 'Powerful financial management tools',
        description: 'VanLang Budget provides all the necessary features to help you control your personal finances effectively.',
        items: [
            {
                id: 'expense-tracking',
                title: 'Expense Tracking',
                description: 'Record and categorize all your daily, weekly, and monthly income and expenses with an intuitive and easy-to-use interface.',
                icon: 'wallet'
            },
            {
                id: 'budgeting',
                title: 'Budgeting',
                description: 'Set up spending plans for each category and receive notifications when you exceed limits.',
                icon: 'calculator'
            },
            {
                id: 'reports',
                title: 'Detailed Reports',
                description: 'View visual reports of your financial situation by day, week, month, or year.',
                icon: 'chart'
            },
            {
                id: 'goals',
                title: 'Savings Goals',
                description: 'Set savings goals and track progress to achieve your financial plans.',
                icon: 'piggy-bank'
            }
        ],
        enabled: true
    },
    'contact-vi': {},
    'contact-en': {},
    'roadmap-vi': {},
    'roadmap-en': {},
    'pricing-vi': {},
    'pricing-en': {},
};

// Export các section riêng lẻ để sử dụng khi cần
export {
    homepageVi,
    homepageEn
};