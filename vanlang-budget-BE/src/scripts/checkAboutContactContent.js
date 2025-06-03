import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';

const checkAboutContactContent = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Connected to MongoDB');
        
        console.log('\n📋 === CHECKING ABOUT & CONTACT CONTENT ===\n');
        
        // Check About content
        console.log('📖 === ABOUT PAGE CONTENT ===');
        const aboutContent = await SiteContent.findOne({ type: 'about' });
        if (aboutContent) {
            console.log('✅ About content exists');
            console.log('📊 About ID:', aboutContent._id);
            console.log('📊 About structure:', JSON.stringify(aboutContent.content, null, 2));
            
            // Check multilingual support
            if (aboutContent.content.vi || aboutContent.content.en) {
                console.log('🌐 Multilingual support: YES');
                if (aboutContent.content.vi) console.log('   - Vietnamese: ✅');
                if (aboutContent.content.en) console.log('   - English: ✅');
            } else {
                console.log('🌐 Multilingual support: NO');
            }
        } else {
            console.log('❌ About content NOT FOUND');
        }
        
        // Check Contact content
        console.log('\n📞 === CONTACT PAGE CONTENT ===');
        const contactContent = await SiteContent.findOne({ type: 'contact' });
        if (contactContent) {
            console.log('✅ Contact content exists');
            console.log('📊 Contact ID:', contactContent._id);
            console.log('📊 Contact structure:', JSON.stringify(contactContent.content, null, 2));
            
            // Check multilingual support
            if (contactContent.content.vi || contactContent.content.en) {
                console.log('🌐 Multilingual support: YES');
                if (contactContent.content.vi) console.log('   - Vietnamese: ✅');
                if (contactContent.content.en) console.log('   - English: ✅');
            } else {
                console.log('🌐 Multilingual support: NO');
            }
        } else {
            console.log('❌ Contact content NOT FOUND');
        }
        
        // Summary
        console.log('\n📋 === SUMMARY ===');
        console.log(`About content: ${aboutContent ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`Contact content: ${contactContent ? '✅ EXISTS' : '❌ MISSING'}`);
        
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkAboutContactContent();
