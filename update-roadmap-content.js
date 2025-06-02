// Script để cập nhật roadmap content
const roadmapContent = {
    vi: {
        title: "Lộ trình phát triển",
        description: "Khám phá kế hoạch phát triển của VanLang Budget và các tính năng sắp ra mắt trong tương lai.",
        milestones: [
            {
                date: "Q1 2025",
                title: "Nền Tảng Cơ Bản",
                description: "Xây dựng các tính năng cơ bản cho việc quản lý tài chính cá nhân và theo dõi chi tiêu hàng ngày.",
                completed: true
            },
            {
                date: "Q2 2025",
                title: "Quản lý ngân sách",
                description: "Phát triển các tính năng quản lý ngân sách nâng cao và báo cáo chi tiết.",
                completed: false
            },
            {
                date: "Q3 2025",
                title: "Tự động AI thông minh",
                description: "Tích hợp AI để phân tích chi tiêu thông minh và đưa ra gợi ý tối ưu ngân sách.",
                completed: false
            },
            {
                date: "Q4 2025",
                title: "Tích hợp ngân hàng",
                description: "Kết nối trực tiếp với các ngân hàng để đồng bộ giao dịch tự động và quản lý toàn diện.",
                completed: false
            }
        ]
    },
    en: {
        title: "Development Roadmap",
        description: "Explore VanLang Budget's development plan and upcoming features to be released in the future.",
        milestones: [
            {
                date: "Q1 2025",
                title: "Basic Foundation",
                description: "Build basic features for personal financial management and daily expense tracking.",
                completed: true
            },
            {
                date: "Q2 2025",
                title: "Budget Management",
                description: "Develop advanced budget management features and detailed reporting.",
                completed: false
            },
            {
                date: "Q3 2025",
                title: "Smart AI Automation",
                description: "Integrate AI for smart spending analysis and optimal budget recommendations.",
                completed: false
            },
            {
                date: "Q4 2025",
                title: "Banking Integration",
                description: "Direct connection with banks for automatic transaction sync and comprehensive management.",
                completed: false
            }
        ]
    }
};

console.log('Roadmap content to update:');
console.log(JSON.stringify(roadmapContent, null, 2));
