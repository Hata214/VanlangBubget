import mongoose from 'mongoose';
import SiteContent from '../src/models/siteContentModel.js';
import { config } from 'dotenv';

// Load environment variables
config();

const defaultPricingContent = {
    vi: {
        title: "Bảng giá",
        subtitle: "Chọn gói dịch vụ phù hợp với nhu cầu của bạn",
        description: "Chúng tôi đang hoàn thiện các gói dịch vụ phù hợp với nhu cầu của bạn. Hiện tại, VanLang Budget hoàn toàn miễn phí!",
        plans: [
            {
                name: "Gói 1",
                price: "Miễn phí",
                description: "Mô tả gói 1",
                features: [
                    "Tính năng 1",
                    "Tính năng 2",
                    "Tính năng 3"
                ],
                buttonText: "Đăng ký ngay",
                buttonLink: "/register",
                popular: false
            },
            {
                name: "Gói 2",
                price: "Miễn phí",
                description: "Mô tả gói 2",
                features: [
                    "Tính năng 1",
                    "Tính năng 2",
                    "Tính năng 3"
                ],
                buttonText: "Đăng ký ngay",
                buttonLink: "/register",
                popular: false
            }
        ]
    },
    en: {
        title: "Pricing",
        subtitle: "Choose the plan that suits you",
        description: "We are perfecting service packages that suit your needs. Currently, VanLang Budget is completely free!",
        plans: [
            {
                name: "Plan 1",
                price: "Free",
                description: "Plan 1 description",
                features: [
                    "Feature 1",
                    "Feature 2",
                    "Feature 3"
                ],
                buttonText: "Sign up now",
                buttonLink: "/register",
                popular: false
            },
            {
                name: "Plan 2",
                price: "Free",
                description: "Plan 2 description",
                features: [
                    "Feature 1",
                    "Feature 2",
                    "Feature 3"
                ],
                buttonText: "Sign up now",
                buttonLink: "/register",
                popular: false
            }
        ]
    }
};

async function initializePricingContent() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Connected to MongoDB');

        // Check if pricing content already exists
        const existingPricing = await SiteContent.findOne({ type: 'pricing' });

        if (existingPricing) {
            console.log('⚠️ Pricing content already exists. Updating...');

            // Update existing content
            existingPricing.content = defaultPricingContent;
            existingPricing.version = (existingPricing.version || 0) + 1;
            existingPricing.updatedAt = new Date();

            await existingPricing.save();
            console.log('✅ Pricing content updated successfully');
        } else {
            console.log('📝 Creating new pricing content...');

            // Create new pricing content
            const newPricing = new SiteContent({
                type: 'pricing',
                content: defaultPricingContent,
                status: 'published',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await newPricing.save();
            console.log('✅ Pricing content created successfully');
        }

        console.log('🎉 Pricing content initialization completed!');

    } catch (error) {
        console.error('❌ Error initializing pricing content:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the script
initializePricingContent();
