import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';

const checkFeaturesContent = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Connected to MongoDB');
        
        console.log('\n🎯 === CHECKING FEATURES CONTENT ===\n');
        
        // Check Features content
        console.log('🎯 === FEATURES PAGE CONTENT ===');
        const featuresContent = await SiteContent.findOne({ type: 'features' });
        if (featuresContent) {
            console.log('✅ Features content exists');
            console.log('📊 Features ID:', featuresContent._id);
            console.log('📊 Features structure:', JSON.stringify(featuresContent.content, null, 2));
            
            // Check multilingual support
            if (featuresContent.content.vi || featuresContent.content.en) {
                console.log('🌐 Multilingual support: YES');
                if (featuresContent.content.vi) {
                    console.log('   - Vietnamese: ✅');
                    console.log('   - VI Features count:', featuresContent.content.vi.features?.length || 0);
                }
                if (featuresContent.content.en) {
                    console.log('   - English: ✅');
                    console.log('   - EN Features count:', featuresContent.content.en.features?.length || 0);
                }
            } else {
                console.log('🌐 Multilingual support: NO');
                console.log('📊 Direct features array:', featuresContent.content.features?.length || 0);
            }
        } else {
            console.log('❌ Features content NOT FOUND');
        }
        
        console.log('\n📋 === SUMMARY ===');
        console.log(`Features content: ${featuresContent ? '✅ EXISTS' : '❌ MISSING'}`);
        
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkFeaturesContent();
