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
        title: 'Liên hệ với chúng tôi',
        subtitle: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
        description: 'Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.',
        contactInfo: {
            title: 'Thông tin liên hệ',
            emailLabel: 'Email',
            email: 'support@vanlangbudget.com',
            phoneLabel: 'Điện thoại',
            phone: '(+84) 123 456 789',
            addressLabel: 'Địa chỉ',
            address: 'Hà Nội, Việt Nam',
            workingHoursLabel: 'Giờ làm việc',
            workingHours: 'Thứ Hai - Thứ Sáu: 9:00 - 17:00'
        },
        contactForm: {
            title: 'Gửi tin nhắn cho chúng tôi',
            nameLabel: 'Họ và tên',
            namePlaceholder: 'Nhập họ và tên của bạn',
            emailLabel: 'Email',
            emailPlaceholder: 'Nhập địa chỉ email của bạn',
            subjectLabel: 'Chủ đề',
            subjectPlaceholder: 'Nhập chủ đề tin nhắn',
            messageLabel: 'Tin nhắn',
            messagePlaceholder: 'Nhập tin nhắn của bạn',
            submitButton: 'Gửi tin nhắn',
            successMessage: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
            errorMessage: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        },
        faq: {
            title: 'Câu hỏi thường gặp',
            questions: [
                {
                    question: 'VanLang Budget có miễn phí không?',
                    answer: 'Có, VanLang Budget hiện tại hoàn toàn miễn phí cho tất cả người dùng.'
                },
                {
                    question: 'Làm thế nào để bắt đầu sử dụng?',
                    answer: 'Bạn chỉ cần đăng ký tài khoản và có thể bắt đầu quản lý tài chính ngay lập tức.'
                },
                {
                    question: 'Dữ liệu của tôi có an toàn không?',
                    answer: 'Chúng tôi sử dụng các biện pháp bảo mật cao nhất để bảo vệ thông tin của bạn.'
                }
            ]
        }
    },
    'contact-en': {
        title: 'Contact Us',
        subtitle: 'We\'re always here to help you',
        description: 'If you have any questions or requests, don\'t hesitate to contact us. Our support team is always ready to help you.',
        contactInfo: {
            title: 'Contact Information',
            emailLabel: 'Email',
            email: 'support@vanlangbudget.com',
            phoneLabel: 'Phone',
            phone: '(+84) 123 456 789',
            addressLabel: 'Address',
            address: 'Hanoi, Vietnam',
            workingHoursLabel: 'Working Hours',
            workingHours: 'Monday - Friday: 9:00 - 17:00'
        },
        contactForm: {
            title: 'Send us a message',
            nameLabel: 'Full Name',
            namePlaceholder: 'Enter your full name',
            emailLabel: 'Email',
            emailPlaceholder: 'Enter your email address',
            subjectLabel: 'Subject',
            subjectPlaceholder: 'Enter message subject',
            messageLabel: 'Message',
            messagePlaceholder: 'Enter your message',
            submitButton: 'Send Message',
            successMessage: 'Thank you for contacting us! We will respond as soon as possible.',
            errorMessage: 'An error occurred. Please try again later.'
        },
        faq: {
            title: 'Frequently Asked Questions',
            questions: [
                {
                    question: 'Is VanLang Budget free?',
                    answer: 'Yes, VanLang Budget is currently completely free for all users.'
                },
                {
                    question: 'How do I get started?',
                    answer: 'You just need to register an account and can start managing your finances immediately.'
                },
                {
                    question: 'Is my data safe?',
                    answer: 'We use the highest security measures to protect your information.'
                }
            ]
        }
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
    'header-vi': {
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
    'header-en': {
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
    },
    'footer-vi': {
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
    'footer-en': {
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

// Export các section riêng lẻ để sử dụng khi cần
export {
    homepageVi,
    homepageEn
};