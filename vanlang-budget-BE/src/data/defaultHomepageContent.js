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
        subtitle: 'Những công cụ giúp bạn quản lý tài chính hiệu quả',
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
            }
        ]
    },
    testimonials: {
        title: 'Khách hàng nói gì về chúng tôi',
        subtitle: 'Trải nghiệm từ người dùng thực tế',
        items: [
            {
                name: 'Nguyễn Văn A',
                position: 'Nhân viên văn phòng',
                quote: 'Ứng dụng giúp tôi kiểm soát chi tiêu hiệu quả và tiết kiệm được nhiều hơn.',
                avatarUrl: '/images/homepage/avatar1.jpg'
            },
            {
                name: 'Trần Thị B',
                position: 'Giáo viên',
                quote: 'Tôi đã đạt được mục tiêu tài chính của mình nhờ sử dụng ứng dụng này.',
                avatarUrl: '/images/homepage/avatar2.jpg'
            },
            {
                name: 'Lê Văn C',
                position: 'Kỹ sư phần mềm',
                quote: 'Giao diện đơn giản, dễ sử dụng và có nhiều tính năng hữu ích.',
                avatarUrl: '/images/homepage/avatar3.jpg'
            }
        ]
    },
    pricing: {
        title: 'Bảng giá',
        subtitle: 'Lựa chọn gói phù hợp với nhu cầu của bạn',
        plans: [
            {
                name: 'Cơ bản',
                price: '0',
                features: [
                    'Theo dõi chi tiêu',
                    'Lập ngân sách cơ bản',
                    'Báo cáo hàng tháng',
                    'Hỗ trợ qua email'
                ]
            },
            {
                name: 'Tiêu chuẩn',
                price: '99.000',
                features: [
                    'Tất cả tính năng cơ bản',
                    'Báo cáo chi tiết',
                    'Quản lý khoản vay',
                    'Hỗ trợ 24/7'
                ]
            },
            {
                name: 'Cao cấp',
                price: '199.000',
                features: [
                    'Tất cả tính năng tiêu chuẩn',
                    'Tư vấn tài chính cá nhân',
                    'Đồng bộ hóa với ngân hàng',
                    'Ưu tiên hỗ trợ kỹ thuật'
                ]
            }
        ]
    }
};

export default defaultHomepageContent;
