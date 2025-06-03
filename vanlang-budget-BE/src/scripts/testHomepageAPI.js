// Test using curl command instead

const testHomepageAPI = async () => {
    try {
        console.log('🔗 Testing Homepage API...');

        const apiUrl = 'http://localhost:4000/api/site-content/homepage';
        console.log('📡 API URL:', apiUrl);

        const response = await fetch(apiUrl);
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('\n📥 API Response:');
        console.log('📊 Status:', data.status);
        console.log('📊 Message:', data.message);

        if (data.data) {
            console.log('\n📊 Homepage Data:');
            console.log('📊 Data keys:', Object.keys(data.data));

            if (data.data.statistics) {
                console.log('\n✅ Statistics section found in API response!');
                console.log('📊 Statistics:', JSON.stringify(data.data.statistics, null, 2));
            } else {
                console.log('\n❌ Statistics section not found in API response');
            }
        } else {
            console.log('\n❌ No data in API response');
        }

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        console.error('❌ Full error:', error);
    }
};

testHomepageAPI();
