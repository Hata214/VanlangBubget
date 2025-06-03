import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';

async function testComingSoonFeatures() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Connected to MongoDB\n');

        console.log('🎯 === CHECKING FEATURES COMING SOON ===\n');

        // Lấy features content
        const featuresContent = await SiteContent.findOne({ type: 'features' });

        if (!featuresContent) {
            console.log('❌ Features content not found');
            return;
        }

        console.log('✅ Features content exists');
        console.log('📊 Features ID:', featuresContent._id);

        // Kiểm tra structure
        console.log('\n📊 Features structure keys:', Object.keys(featuresContent.content));

        // Kiểm tra Vietnamese content
        if (featuresContent.content.vi) {
            console.log('\n🇻🇳 Vietnamese Content:');
            console.log('📊 Title:', featuresContent.content.vi.title);
            console.log('📊 Features count:', featuresContent.content.vi.features?.length || 0);

            if (featuresContent.content.vi.comingSoon) {
                console.log('✅ Coming Soon features found in VI');
                console.log('📊 Coming Soon count:', featuresContent.content.vi.comingSoon.length);

                console.log('\n📋 Coming Soon Features (VI):');
                featuresContent.content.vi.comingSoon.forEach((feature, index) => {
                    console.log(`   ${index + 1}. ${feature.icon} ${feature.title}`);
                    console.log(`      ${feature.description}`);
                    console.log(`      ETA: ${feature.eta}\n`);
                });
            } else {
                console.log('❌ Coming Soon features NOT found in VI');
            }
        }

        // Kiểm tra English content
        if (featuresContent.content.en) {
            console.log('\n🇺🇸 English Content:');
            console.log('📊 Title:', featuresContent.content.en.title);
            console.log('📊 Features count:', featuresContent.content.en.features?.length || 0);

            if (featuresContent.content.en.comingSoon) {
                console.log('✅ Coming Soon features found in EN');
                console.log('📊 Coming Soon count:', featuresContent.content.en.comingSoon.length);

                console.log('\n📋 Coming Soon Features (EN):');
                featuresContent.content.en.comingSoon.forEach((feature, index) => {
                    console.log(`   ${index + 1}. ${feature.icon} ${feature.title}`);
                    console.log(`      ${feature.description}`);
                    console.log(`      ETA: ${feature.eta}\n`);
                });
            } else {
                console.log('❌ Coming Soon features NOT found in EN');
            }
        }

        console.log('\n📋 === SUMMARY ===');
        console.log('Features content: ✅ EXISTS');
        console.log('VI Coming Soon:', featuresContent.content.vi?.comingSoon ? '✅ EXISTS' : '❌ MISSING');
        console.log('EN Coming Soon:', featuresContent.content.en?.comingSoon ? '✅ EXISTS' : '❌ MISSING');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        console.log('\n🔌 Disconnected from MongoDB');
        await mongoose.disconnect();
    }
}

testComingSoonFeatures();
