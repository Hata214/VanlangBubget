// Test About and Contact API endpoints

const testAboutContactAPI = async () => {
    try {
        console.log('🔗 Testing About & Contact APIs...');
        
        // Test About API
        console.log('\n📖 === TESTING ABOUT API ===');
        console.log('📡 About API URL: http://localhost:4000/api/site-content/about');
        
        // Test Contact API
        console.log('\n📞 === TESTING CONTACT API ===');
        console.log('📡 Contact API URL: http://localhost:4000/api/site-content/contact');
        
        console.log('\n✅ Use curl commands to test:');
        console.log('curl http://localhost:4000/api/site-content/about');
        console.log('curl http://localhost:4000/api/site-content/contact');
        
    } catch (error) {
        console.error('❌ Error testing APIs:', error.message);
    }
};

testAboutContactAPI();
