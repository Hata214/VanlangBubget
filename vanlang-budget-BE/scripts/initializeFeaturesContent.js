import mongoose from 'mongoose';
import SiteContent from '../src/models/siteContentModel.js';

// Kết nối MongoDB
const MONGO_URI = 'mongodb+srv://hoang:Ab1234567@dataweb.bptnx.mongodb.net/test?retryWrites=true&w=majority&appName=DataWeb';

const defaultFeaturesContent = {
    vi: {
        title: "🔥 ADMIN CONTENT FEATURES TITLE 🔥",
        subtitle: "🚀 Admin Content Subtitle 🚀",
        description: "📝 Admin Content Description - Nếu bạn thấy text này thì admin content đã hoạt động! 📝",
        features: [
            {
                icon: "📊",
                title: "Theo dõi thu chi",
                description: "Ghi lại và phân loại tất cả các khoản thu nhập, chi phí hàng ngày, hàng tuần và hàng tháng với giao diện thân thiện và dễ sử dụng."
            },
            {
                icon: "🎯",
                title: "Quản lý ngân sách",
                description: "Thiết lập và theo dõi ngân sách theo danh mục, giúp bạn kiểm soát chi tiêu và hình thành thói quen tài chính tốt."
            },
            {
                icon: "💰",
                title: "Quản lý khoản vay",
                description: "Theo dõi các khoản vay, lịch trả nợ và tính toán lãi suất một cách chính xác và chi tiết."
            },
            {
                icon: "📈",
                title: "Quản lý đầu tư",
                description: "Theo dõi danh mục đầu tư bất động sản, tiết kiệm ngân hàng với tính năng tính lãi suất tự động."
            },
            {
                icon: "🤖",
                title: "VanLang Agent AI",
                description: "Trợ lý AI thông minh hỗ trợ trả lời câu hỏi tài chính, tính toán và phân tích dữ liệu bằng tiếng Việt."
            },
            {
                icon: "📱",
                title: "Giao diện thân thiện",
                description: "Thiết kế responsive, hỗ trợ dark mode và đa ngôn ngữ (Tiếng Việt/English) cho trải nghiệm tốt nhất."
            }
        ]
    },
    en: {
        title: "Outstanding Features",
        subtitle: "Powerful financial management tools",
        description: "Tools that help you manage your finances effectively",
        features: [
            {
                icon: "📊",
                title: "Income & Expense Tracking",
                description: "Record and categorize all income and expenses daily, weekly, and monthly with a user-friendly interface."
            },
            {
                icon: "🎯",
                title: "Budget Management",
                description: "Set up and track budgets by category, helping you control spending and develop good financial habits."
            },
            {
                icon: "💰",
                title: "Loan Management",
                description: "Track loans, repayment schedules, and calculate interest rates accurately and in detail."
            },
            {
                icon: "📈",
                title: "Investment Management",
                description: "Track real estate investment portfolios, bank savings with automatic interest calculation features."
            },
            {
                icon: "🤖",
                title: "VanLang Agent AI",
                description: "Smart AI assistant that helps answer financial questions, calculations, and data analysis in Vietnamese."
            },
            {
                icon: "📱",
                title: "User-friendly Interface",
                description: "Responsive design, dark mode support, and multilingual (Vietnamese/English) for the best experience."
            }
        ]
    }
};

async function initializeFeaturesContent() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB successfully');

        // Kiểm tra xem đã có dữ liệu features chưa
        const existingFeatures = await SiteContent.findOne({ type: 'features' });

        if (existingFeatures) {
            console.log('Features content already exists, updating...');
            console.log('Current content:', JSON.stringify(existingFeatures.content, null, 2));
            console.log('New content:', JSON.stringify(defaultFeaturesContent, null, 2));
            const result = await SiteContent.findOneAndUpdate(
                { type: 'features' },
                {
                    content: defaultFeaturesContent,
                    status: 'published',
                    version: (existingFeatures.version || 0) + 1
                },
                { new: true, upsert: true }
            );
            console.log('Features content updated successfully:', result._id);
            console.log('Updated content:', JSON.stringify(result.content, null, 2));
        } else {
            console.log('Creating new features content...');
            const result = await SiteContent.create({
                type: 'features',
                content: defaultFeaturesContent,
                status: 'published',
                version: 1
            });
            console.log('Features content created successfully:', result._id);
        }

        console.log('Features content initialization completed!');
    } catch (error) {
        console.error('Error initializing features content:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Chạy script
initializeFeaturesContent();
