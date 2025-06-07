/**
 * Dữ liệu mặc định cho trang chủ
 * Được sử dụng khi không có dữ liệu trong cơ sở dữ liệu
 */
export const defaultHomepageContent = {
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
};

export default defaultHomepageContent;
