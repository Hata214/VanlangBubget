/**
 * Test script để kiểm tra API Features
 */

const testFeaturesAPI = async () => {
    console.log('🔍 Testing Features API...');
    
    try {
        // Test 1: Homepage API
        console.log('\n=== Test 1: Homepage API ===');
        const homepageResponse = await fetch('http://localhost:3000/api/site-content/homepage');
        const homepageData = await homepageResponse.json();
        
        console.log('Homepage API Status:', homepageResponse.status);
        console.log('Homepage API Response:', JSON.stringify(homepageData, null, 2));
        
        if (homepageData.data && homepageData.data.content && homepageData.data.content.features) {
            console.log('✅ Features section found in homepage');
            console.log('Features content:', JSON.stringify(homepageData.data.content.features, null, 2));
        } else {
            console.log('❌ Features section NOT found in homepage');
        }
        
        // Test 2: Direct Features API
        console.log('\n=== Test 2: Direct Features API ===');
        const featuresResponse = await fetch('http://localhost:3000/api/site-content/features');
        const featuresData = await featuresResponse.json();
        
        console.log('Features API Status:', featuresResponse.status);
        console.log('Features API Response:', JSON.stringify(featuresData, null, 2));
        
    } catch (error) {
        console.error('❌ Error testing APIs:', error.message);
    }
};

// Run test
testFeaturesAPI();
