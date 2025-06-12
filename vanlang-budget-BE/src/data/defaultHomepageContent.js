/**
 * Dữ liệu mặc định cho trang chủ với hỗ trợ đa ngôn ngữ
 * Được sử dụng khi không có dữ liệu trong cơ sở dữ liệu
 */
export const defaultHomepageContent = {
    vi: {
        hero: {
            title: 'Quản lý tài chính cá nhân thông minh',
            subtitle: '',
            description: 'VanLang Budget giúp bạn theo dõi thu chi, lập kế hoạch tài chính và đạt được mục tiêu tiết kiệm một cách dễ dàng và hiệu quả.',
            imageUrl: '/images/VLB-Photoroom.png',
            buttonText: 'Đăng ký miễn phí',
            buttonLink: '/register'
        },
        features: {
            title: 'Tính năng nổi bật',
            description: 'VanLang Budget cung cấp tất cả công cụ bạn cần để quản lý tài chính hiệu quả',
            items: [
                {
                    title: 'Theo dõi thu chi',
                    description: 'Ghi lại và phân loại tất cả thu nhập, chi tiêu hàng ngày một cách dễ dàng và nhanh chóng.',
                    icon: 'wallet'
                },
                {
                    title: 'Quản lý ngân sách',
                    description: 'Thiết lập và theo dõi ngân sách cho từng danh mục chi tiêu để kiểm soát tài chính tốt hơn.',
                    icon: 'calculator'
                },
                {
                    title: 'Phân tích tài chính',
                    description: 'Xem báo cáo và biểu đồ chi tiết về tình hình tài chính của bạn theo thời gian thực.',
                    icon: 'chart'
                },
                {
                    title: 'Lập kế hoạch tương lai',
                    description: 'Đặt mục tiêu tài chính và theo dõi tiến độ đạt được các mục tiêu của bạn.',
                    icon: 'target'
                },
                {
                    title: 'Quản lý khoản vay',
                    description: 'Theo dõi các khoản vay, tính lãi suất và lịch trả nợ một cách dễ dàng.',
                    icon: 'loan'
                },
                {
                    title: 'Bảo mật dữ liệu',
                    description: 'Dữ liệu của bạn được mã hóa và bảo vệ an toàn với tiêu chuẩn bảo mật cao nhất.',
                    icon: 'security'
                }
            ]
        },

        testimonials: {
            title: 'Người dùng nói gì về chúng tôi',
            description: 'Hàng nghìn người dùng đã tin tưởng VanLang Budget để quản lý tài chính cá nhân',
            items: [
                {
                    author: 'Nguyễn Minh Anh',
                    title: 'Nhân viên văn phòng',
                    content: 'VanLang Budget đã giúp tôi kiểm soát chi tiêu tốt hơn. Giao diện đơn giản, dễ sử dụng và rất hiệu quả.',
                    rating: 5,
                    avatarUrl: '/images/avatar-placeholder.png'
                },
                {
                    author: 'Trần Văn Hùng',
                    title: 'Sinh viên đại học',
                    content: 'Ứng dụng tuyệt vời cho sinh viên như tôi. Giúp tôi quản lý tiền tiêu vặt và tiết kiệm được nhiều hơn.',
                    rating: 5,
                    avatarUrl: '/images/avatar-placeholder.png'
                },
                {
                    author: 'Lê Thị Mai',
                    title: 'Chủ doanh nghiệp nhỏ',
                    content: 'Tính năng quản lý khoản vay rất hữu ích. Tôi có thể theo dõi tất cả các khoản nợ và lập kế hoạch trả nợ hiệu quả.',
                    rating: 5,
                    avatarUrl: '/images/avatar-placeholder.png'
                }
            ]
        },
        pricing: {
            title: 'Bảng giá',
            description: 'Lựa chọn gói phù hợp với nhu cầu của bạn',
            plans: [
                {
                    name: 'Cơ bản',
                    price: 'Miễn phí',
                    description: 'Hoàn hảo cho người mới bắt đầu',
                    features: [
                        'Theo dõi chi tiêu',
                        'Lập ngân sách cơ bản',
                        'Báo cáo hàng tháng',
                        'Hỗ trợ qua email'
                    ]
                },
                {
                    name: 'Tiêu chuẩn',
                    price: '99.000đ/tháng',
                    description: 'Dành cho người dùng thường xuyên',
                    features: [
                        'Tất cả tính năng cơ bản',
                        'Báo cáo chi tiết',
                        'Quản lý khoản vay',
                        'Hỗ trợ 24/7'
                    ]
                }
            ]
        },
        cta: {
            title: 'Sẵn sàng để kiểm soát tài chính của bạn?',
            description: 'Đăng ký ngay hôm nay và bắt đầu hành trình đạt được tự do tài chính của bạn.',
            primaryButtonText: 'Bắt đầu miễn phí',
            primaryButtonLink: '/register',
            secondaryButtonText: 'Liên hệ với chúng tôi',
            secondaryButtonLink: '/contact'
        }
    },
    en: {
        hero: {
            title: 'Smart Personal Finance Management',
            subtitle: '',
            description: 'VanLang Budget helps you track income and expenses, plan finances, and achieve your savings goals easily and effectively.',
            imageUrl: '/images/VLB-Photoroom.png',
            buttonText: 'Sign Up Free',
            buttonLink: '/register'
        },
        features: {
            title: 'Outstanding Features',
            description: 'VanLang Budget provides all the tools you need to manage your finances effectively',
            items: [
                {
                    title: 'Income & Expense Tracking',
                    description: 'Record and categorize all income and daily expenses easily and quickly.',
                    icon: 'wallet'
                },
                {
                    title: 'Budget Management',
                    description: 'Set up and track budgets for each spending category to better control your finances.',
                    icon: 'calculator'
                },
                {
                    title: 'Financial Analysis',
                    description: 'View detailed reports and charts about your financial situation in real-time.',
                    icon: 'chart'
                },
                {
                    title: 'Future Planning',
                    description: 'Set financial goals and track progress towards achieving your objectives.',
                    icon: 'target'
                },
                {
                    title: 'Loan Management',
                    description: 'Track loans, calculate interest rates and repayment schedules easily.',
                    icon: 'loan'
                },
                {
                    title: 'Data Security',
                    description: 'Your data is encrypted and protected safely with the highest security standards.',
                    icon: 'security'
                }
            ]
        },
        testimonials: {
            title: 'What Our Users Say',
            description: 'Thousands of users have trusted VanLang Budget for personal financial management',
            items: [
                {
                    author: 'Nguyen Minh Anh',
                    title: 'Office Worker',
                    content: 'VanLang Budget has helped me control my spending better. Simple interface, easy to use and very effective.',
                    rating: 5,
                    avatarUrl: '/images/avatar-placeholder.png'
                },
                {
                    author: 'Tran Van Hung',
                    title: 'University Student',
                    content: 'Great app for students like me. Helps me manage pocket money and save more.',
                    rating: 5,
                    avatarUrl: '/images/avatar-placeholder.png'
                },
                {
                    author: 'Le Thi Mai',
                    title: 'Small Business Owner',
                    content: 'The loan management feature is very useful. I can track all debts and plan repayments effectively.',
                    rating: 5,
                    avatarUrl: '/images/avatar-placeholder.png'
                }
            ]
        },
        pricing: {
            title: 'Pricing',
            description: 'Choose the plan that fits your needs',
            plans: [
                {
                    name: 'Basic',
                    price: 'Free',
                    description: 'Perfect for beginners',
                    features: [
                        'Expense tracking',
                        'Basic budgeting',
                        'Monthly reports',
                        'Email support'
                    ]
                },
                {
                    name: 'Standard',
                    price: '$4.99/month',
                    description: 'For regular users',
                    features: [
                        'All basic features',
                        'Detailed reports',
                        'Loan management',
                        '24/7 support'
                    ]
                }
            ]
        },
        cta: {
            title: 'Ready to take control of your finances?',
            description: 'Sign up today and start your journey to financial freedom.',
            primaryButtonText: 'Get Started Free',
            primaryButtonLink: '/register',
            secondaryButtonText: 'Contact Us',
            secondaryButtonLink: '/contact'
        }
    }
};

export default defaultHomepageContent;
