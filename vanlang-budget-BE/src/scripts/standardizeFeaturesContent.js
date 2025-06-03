import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';

const standardizeFeaturesContent = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Connected to MongoDB');

        console.log('\n🔄 === STANDARDIZING FEATURES CONTENT ===\n');

        // Standardize Features Content
        console.log('🎯 Standardizing Features Content...');
        const featuresContent = await SiteContent.findOne({ type: 'features' });

        if (featuresContent) {
            const standardizedFeatures = {
                vi: {
                    title: "Tính năng nổi bật",
                    subtitle: "Công cụ quản lý tài chính mạnh mẽ",
                    description: "VanLang Budget cung cấp đầy đủ các tính năng cần thiết để giúp bạn kiểm soát tài chính cá nhân một cách hiệu quả.",
                    features: [
                        {
                            id: "expense-tracking",
                            title: "Theo dõi chi tiêu",
                            description: "Ghi lại và phân loại tất cả các khoản thu chi hàng ngày, tuần, tháng với giao diện trực quan và dễ sử dụng.",
                            icon: "💰"
                        },
                        {
                            id: "budgeting",
                            title: "Lập ngân sách",
                            description: "Thiết lập kế hoạch chi tiêu cho từng danh mục và nhận thông báo khi vượt quá giới hạn.",
                            icon: "📊"
                        },
                        {
                            id: "reports",
                            title: "Báo cáo chi tiết",
                            description: "Xem báo cáo trực quan về tình hình tài chính của bạn theo ngày, tuần, tháng hoặc năm.",
                            icon: "📈"
                        },
                        {
                            id: "goals",
                            title: "Mục tiêu tiết kiệm",
                            description: "Đặt mục tiêu tiết kiệm và theo dõi tiến độ để đạt được những dự định tài chính của bạn.",
                            icon: "🎯"
                        },
                        {
                            id: "security",
                            title: "Bảo mật cao",
                            description: "Dữ liệu của bạn được mã hóa và bảo vệ bằng các tiêu chuẩn bảo mật cao nhất.",
                            icon: "🔒"
                        },
                        {
                            id: "sync",
                            title: "Đồng bộ đa thiết bị",
                            description: "Truy cập dữ liệu tài chính của bạn mọi lúc, mọi nơi trên điện thoại, máy tính bảng và máy tính.",
                            icon: "🔄"
                        }
                    ],
                    comingSoon: [
                        {
                            id: "ai-advisor",
                            title: "Tư vấn AI thông minh",
                            description: "Phân tích và đưa ra lời khuyên tài chính cá nhân hóa dựa trên thói quen chi tiêu của bạn.",
                            eta: "Q2 2025",
                            icon: "🤖"
                        },
                        {
                            id: "group-expense",
                            title: "Chi tiêu nhóm",
                            description: "Chia sẻ và quản lý chi tiêu với bạn bè, gia đình hoặc đồng nghiệp một cách dễ dàng.",
                            eta: "Q3 2025",
                            icon: "👥"
                        },
                        {
                            id: "bank-sync",
                            title: "Đồng bộ ngân hàng",
                            description: "Tích hợp trực tiếp với tài khoản ngân hàng để tự động cập nhật giao dịch.",
                            eta: "Q4 2025",
                            icon: "🏦"
                        }
                    ]
                },
                en: {
                    title: "Key Features",
                    subtitle: "Powerful Financial Management Tools",
                    description: "VanLang Budget provides all the necessary features to help you control your personal finances effectively.",
                    features: [
                        {
                            id: "expense-tracking",
                            title: "Expense Tracking",
                            description: "Record and categorize all your daily, weekly, monthly income and expenses with an intuitive and easy-to-use interface.",
                            icon: "💰"
                        },
                        {
                            id: "budgeting",
                            title: "Budgeting",
                            description: "Set spending plans for each category and receive notifications when you exceed limits.",
                            icon: "📊"
                        },
                        {
                            id: "reports",
                            title: "Detailed Reports",
                            description: "View visual reports on your financial situation by day, week, month or year.",
                            icon: "📈"
                        },
                        {
                            id: "goals",
                            title: "Savings Goals",
                            description: "Set savings goals and track progress to achieve your financial plans.",
                            icon: "🎯"
                        },
                        {
                            id: "security",
                            title: "High Security",
                            description: "Your data is encrypted and protected with the highest security standards.",
                            icon: "🔒"
                        },
                        {
                            id: "sync",
                            title: "Multi-device Sync",
                            description: "Access your financial data anytime, anywhere on phone, tablet and computer.",
                            icon: "🔄"
                        }
                    ],
                    comingSoon: [
                        {
                            id: "ai-advisor",
                            title: "Smart AI Advisor",
                            description: "Analyze and provide personalized financial advice based on your spending behavior.",
                            eta: "Q2 2025",
                            icon: "🤖"
                        },
                        {
                            id: "group-expense",
                            title: "Group Expenses",
                            description: "Share and manage expenses with friends, family, or colleagues easily.",
                            eta: "Q3 2025",
                            icon: "👥"
                        },
                        {
                            id: "bank-sync",
                            title: "Bank Synchronization",
                            description: "Integrate directly with bank accounts to automatically update transactions.",
                            eta: "Q4 2025",
                            icon: "🏦"
                        }
                    ]
                }
            };

            await SiteContent.findOneAndUpdate(
                { type: 'features' },
                { content: standardizedFeatures },
                { new: true }
            );
            console.log('   ✅ Features content standardized with multilingual support');
            console.log('   📊 Added 6 features for both vi and en');
        } else {
            console.log('   ❌ Features content not found');
        }

        console.log('\n✅ === STANDARDIZATION COMPLETE ===');
        console.log('📊 Features now have vi/en multilingual support');
        console.log('🔧 Content structure standardized with features array');

        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

standardizeFeaturesContent();
