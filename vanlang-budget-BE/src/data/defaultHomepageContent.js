/**
 * Dữ liệu mặc định cho trang chủ
 * Được sử dụng khi không có dữ liệu trong cơ sở dữ liệu
 */
export const defaultHomepageContent = {
    hero: {
        title: 'Quản lý tài chính cá nhân hiệu quả',
        subtitle: 'Giải pháp toàn diện giúp bạn kiểm soát chi tiêu, tiết kiệm và đạt được mục tiêu tài chính',
        imageUrl: '/images/homepage/hero.jpg',
        buttonText: 'Bắt đầu ngay',
        buttonLink: '/register'
    },
    features: {
        title: 'Tính năng nổi bật',
        description: 'Những công cụ giúp bạn quản lý tài chính hiệu quả',
        items: [
            {
                title: 'Theo dõi chi tiêu',
                description: 'Ghi lại và phân loại mọi khoản chi tiêu của bạn',
                icon: 'wallet'
            },
            {
                title: 'Lập ngân sách',
                description: 'Thiết lập kế hoạch chi tiêu cho từng danh mục',
                icon: 'calculator'
            },
            {
                title: 'Báo cáo chi tiết',
                description: 'Xem báo cáo trực quan về tình hình tài chính',
                icon: 'chart'
            },
            {
                title: 'Quản lý khoản vay',
                description: 'Theo dõi các khoản vay và lịch trả nợ',
                icon: 'loan'
            },
            {
                title: 'Quản lý đầu tư',
                description: 'Theo dõi danh mục đầu tư và lợi nhuận',
                icon: 'investment'
            },
            {
                title: 'Bảo mật dữ liệu',
                description: 'Dữ liệu được mã hóa và bảo vệ tuyệt đối',
                icon: 'security'
            }
        ]
    },
    statistics: {
        title: 'Thống kê ấn tượng',
        description: 'Những con số chứng minh hiệu quả của VanLang Budget',
        items: [
            {
                value: '10,000+',
                label: 'Người dùng hàng tháng'
            },
            {
                value: '500,000+',
                label: 'Giao dịch được quản lý'
            },
            {
                value: '25%',
                label: 'Tăng tiết kiệm trung bình'
            }
        ]
    },
    testimonials: {
        title: 'Khách hàng nói gì về chúng tôi',
        description: 'Trải nghiệm từ người dùng thực tế',
        items: [
            {
                author: 'Nguyễn Văn A',
                title: 'Nhân viên văn phòng',
                content: 'Ứng dụng giúp tôi kiểm soát chi tiêu hiệu quả và tiết kiệm được nhiều hơn.',
                rating: 5,
                avatarUrl: '/images/homepage/avatar1.jpg'
            },
            {
                author: 'Trần Thị B',
                title: 'Giáo viên',
                content: 'Tôi đã đạt được mục tiêu tài chính của mình nhờ sử dụng ứng dụng này.',
                rating: 5,
                avatarUrl: '/images/homepage/avatar2.jpg'
            },
            {
                author: 'Lê Văn C',
                title: 'Kỹ sư phần mềm',
                content: 'Giao diện đơn giản, dễ sử dụng và có nhiều tính năng hữu ích.',
                rating: 5,
                avatarUrl: '/images/homepage/avatar3.jpg'
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
        title: 'Sẵn sàng kiểm soát tài chính của bạn?',
        description: 'Tham gia cùng hàng nghìn người dùng đã cải thiện tình hình tài chính với VanLang Budget',
        primaryButtonText: 'Bắt đầu miễn phí',
        primaryButtonLink: '/register',
        secondaryButtonText: 'Liên hệ tư vấn',
        secondaryButtonLink: '/contact'
    }
};

export default defaultHomepageContent;
