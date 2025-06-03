import fetch from 'node-fetch';

const testFeaturesAPI = async () => {
    try {
        console.log('🔗 Testing Features API...');
        
        const apiUrl = 'http://localhost:4000/api/site-content/features';
        console.log('📡 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', response.headers.raw());
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('\n📥 API Response:');
        console.log('📊 Status:', data.status);
        console.log('📊 Message:', data.message);
        
        if (data.data) {
            console.log('\n📊 Features Data:');
            console.log('📊 Data keys:', Object.keys(data.data));
            
            // Check Vietnamese content
            if (data.data.vi) {
                console.log('\n🇻🇳 Vietnamese Content:');
                console.log('📊 Title:', data.data.vi.title);
                console.log('📊 Subtitle:', data.data.vi.subtitle);
                console.log('📊 Description:', data.data.vi.description);
                console.log('📊 Features count:', data.data.vi.features?.length || 0);
                
                if (data.data.vi.features && data.data.vi.features.length > 0) {
                    console.log('\n📋 Features List:');
                    data.data.vi.features.forEach((feature, index) => {
                        console.log(`   ${index + 1}. ${feature.icon} ${feature.title}`);
                        console.log(`      ${feature.description}`);
                    });
                }
            }
            
            // Check English content
            if (data.data.en) {
                console.log('\n🇺🇸 English Content:');
                console.log('📊 Title:', data.data.en.title);
                console.log('📊 Subtitle:', data.data.en.subtitle);
                console.log('📊 Description:', data.data.en.description);
                console.log('📊 Features count:', data.data.en.features?.length || 0);
            }
        } else {
            console.log('❌ No data found in response');
        }
        
    } catch (error) {
        console.error('❌ Error testing Features API:', error);
    }
};

testFeaturesAPI();
