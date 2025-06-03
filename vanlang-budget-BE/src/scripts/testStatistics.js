import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';

const testStatistics = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Connected to MongoDB');
        
        // Get homepage content
        const homepageContent = await SiteContent.findOne({ type: 'homepage' });
        
        if (homepageContent) {
            console.log('\n📊 === HOMEPAGE STATISTICS SECTION ===');
            console.log('🏠 Homepage ID:', homepageContent._id);
            console.log('📝 Statistics content:', JSON.stringify(homepageContent.content.statistics, null, 2));
            
            if (homepageContent.content.statistics) {
                console.log('\n✅ Statistics section exists!');
                console.log('📊 Title:', homepageContent.content.statistics.title);
                console.log('📊 Subtitle:', homepageContent.content.statistics.subtitle);
                
                // Check both new and old structure
                const stats = homepageContent.content.statistics.stats || homepageContent.content.statistics.items;
                if (stats) {
                    console.log('📊 Number of stats:', stats.length);
                    stats.forEach((stat, index) => {
                        const number = stat.number || stat.value;
                        const label = stat.label;
                        const description = stat.description || 'No description';
                        console.log(`   ${index + 1}. ${number} - ${label}: ${description}`);
                    });
                } else {
                    console.log('   No stats found');
                }
            } else {
                console.log('\n❌ Statistics section not found in homepage content');
            }
        } else {
            console.log('\n❌ Homepage content not found');
        }
        
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testStatistics();
