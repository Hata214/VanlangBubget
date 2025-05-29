const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// Test data
const testUserId = '6751b3b8e5b8b3c4d8f9e123'; // Test user ID
const testQuestions = [
    'khoản vay còn lại',
    'khoản vay còn alji', // Test lỗi đánh máy
    'nợ còn lại',
    'khoản vay đã thanh toán',
    'khoản vay quá hạn',
    'khoản vay của tôi'
];

async function testLoanStatusQueries() {
    console.log('🧪 Testing Loan Status Queries...\n');

    for (const question of testQuestions) {
        try {
            console.log(`📝 Testing: "${question}"`);

            const response = await axios.post(`${API_BASE}/agent/chat`, {
                userId: testUserId,
                message: question
            });

            console.log(`✅ Response: ${response.data.response.substring(0, 200)}...`);
            console.log('---');

        } catch (error) {
            console.error(`❌ Error testing "${question}":`, error.response?.data || error.message);
            console.log('---');
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function main() {
    try {
        await testLoanStatusQueries();
        console.log('🎉 Test completed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

main();
