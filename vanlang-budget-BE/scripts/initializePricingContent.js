import mongoose from 'mongoose';
import SiteContent from '../src/models/siteContentModel.js';
import { config } from 'dotenv';

// Load environment variables
config();

const defaultPricingContent = {
    vi: {
        title: "Bảng Giá",
        subtitle: "Các gói dịch vụ VanLang Budget",
        description: "Chọn gói dịch vụ phù hợp với nhu cầu tài chính của bạn",
        comingSoonTitle: "Sắp Ra Mắt",
        comingSoonDescription: "Chúng tôi đang nỗ lực để cung cấp cho bạn những gói dịch vụ tốt nhất. Vui lòng quay lại sau để xem thông tin chi tiết về giá."
    },
    en: {
        title: "Pricing",
        subtitle: "VanLang Budget service packages",
        description: "Choose the service package that fits your financial needs",
        comingSoonTitle: "Coming Soon",
        comingSoonDescription: "We are working to provide you with the best service packages. Please check back later for pricing details."
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
