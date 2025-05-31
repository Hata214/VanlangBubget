// Dữ liệu fallback mặc định cho trang chủ
import homepageVi from './homepage-vi';
import homepageEn from './homepage-en';

// Tập hợp tất cả dữ liệu fallback
export const localFallbackData: Record<string, any> = {
    // Trang chủ
    'homepage-vi': homepageVi,
    'homepage-en': homepageEn,

    // Các trang khác sẽ được thêm sau
    'about-vi': {
        title: 'Về Chúng Tôi',
        subtitle: 'Hành trình của VanLang Budget',
        description: 'VanLang Budget được phát triển bởi một nhóm những người đam mê tài chính cá nhân với mục tiêu giúp mọi người quản lý tài chính hiệu quả hơn.',
        mission: {
            title: 'Sứ Mệnh',
            content: 'Giúp mọi người đạt được sự tự do tài chính thông qua các công cụ quản lý tài chính thông minh và trực quan.'
        },
        vision: {
            title: 'Tầm Nhìn',
            content: 'Trở thành ứng dụng quản lý tài chính cá nhân hàng đầu tại Việt Nam, giúp hàng triệu người kiểm soát chi tiêu, tiết kiệm hiệu quả và đạt được các mục tiêu tài chính.'
        },
        values: {
            title: 'Giá Trị Cốt Lõi',
            items: [
                {
                    title: 'Đơn Giản',
                    description: 'Giao diện trực quan, dễ sử dụng cho mọi đối tượng người dùng.'
                },
                {
                    title: 'Bảo Mật',
                    description: 'Bảo vệ thông tin tài chính cá nhân với các tiêu chuẩn bảo mật cao nhất.'
                },
                {
                    title: 'Hiệu Quả',
                    description: 'Cung cấp các công cụ mạnh mẽ giúp quản lý tài chính một cách hiệu quả.'
                }
            ]
        }
    },
    'about-en': {
        title: 'About Us',
        subtitle: 'The Journey of VanLang Budget',
        description: 'VanLang Budget was developed by a team of personal finance enthusiasts with the goal of helping people manage their finances more effectively.',
        mission: {
            title: 'Our Mission',
            content: 'To help people achieve financial freedom through smart and intuitive financial management tools.'
        },
        vision: {
            title: 'Our Vision',
            content: 'To become the leading personal finance management application in Vietnam, helping millions of people control spending, save effectively, and achieve financial goals.'
        },
        values: {
            title: 'Core Values',
            items: [
                {
                    title: 'Simplicity',
                    description: 'Intuitive interface that is easy to use for all types of users.'
                },
                {
                    title: 'Security',
                    description: 'Protecting personal financial information with the highest security standards.'
                },
                {
                    title: 'Efficiency',
                    description: 'Providing powerful tools to help manage finances effectively.'
                }
            ]
        }
    },
    'features-vi': {
        title: 'Tính Năng',
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
    'contact-vi': {
        title: 'Liên Hệ',
        subtitle: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
        description: 'Có câu hỏi hoặc cần hỗ trợ? Đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ của VanLang Budget luôn sẵn sàng giúp đỡ bạn.'
    },
    'contact-en': {
        title: 'Contact Us',
        subtitle: 'We are always ready to support you',
        description: 'Have questions or need support? Don\'t hesitate to contact us. VanLang Budget support team is always ready to help you.'
    },
    'roadmap-vi': {
        title: 'Lộ Trình Phát Triển',
        subtitle: 'Tương lai của VanLang Budget',
        description: 'Khám phá những tính năng mới và cải tiến mà chúng tôi đang phát triển để mang đến trải nghiệm quản lý tài chính tốt nhất cho bạn.'
    },
    'roadmap-en': {
        title: 'Development Roadmap',
        subtitle: 'The future of VanLang Budget',
        description: 'Discover new features and improvements we are developing to bring you the best financial management experience.'
    },
    'pricing-vi': {
        title: 'Bảng Giá',
        subtitle: 'Sắp ra mắt',
        description: 'Chúng tôi đang hoàn thiện các gói dịch vụ phù hợp với nhu cầu của bạn. Hiện tại, VanLang Budget hoàn toàn miễn phí!'
    },
    'pricing-en': {
        title: 'Pricing',
        subtitle: 'Coming Soon',
        description: 'We are finalizing service packages that suit your needs. Currently, VanLang Budget is completely free!'
    },
};

// Export các section riêng lẻ để sử dụng khi cần
export {
    homepageVi,
    homepageEn
};