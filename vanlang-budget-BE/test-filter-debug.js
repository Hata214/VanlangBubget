import axios from 'axios';

async function testFilterQuery() {
    console.log('🔍 Testing VanLang Agent Filter Query...\n');

    const testCases = [
        'thu nhập thấp nhất',
        'chi tiêu thấp nhất',
        'chi tiêu cao nhất',
        'khoản vay cao nhất'
    ];

    for (const message of testCases) {
        console.log(`\n📝 Testing: "${message}"`);
        console.log('='.repeat(50));

        try {
            const response = await axios.post('http://localhost:4000/api/agent/chat', {
                message: message,
                userId: 'test123'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Response:', response.data);

        } catch (error) {
            console.log('❌ Error:', error.response?.data || error.message);
        }

        // Wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

testFilterQuery().catch(console.error);
