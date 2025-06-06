import fetch from 'node-fetch';

async function testFrontendChatbot() {
    console.log('🧪 Testing Frontend Chatbot Integration...\n');

    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    try {
        const healthResponse = await fetch('http://localhost:3000/api/chatbot', {
            method: 'GET'
        });
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData.status);
        console.log('   Frontend version:', healthData.frontend?.version);
        console.log('   Backend status:', healthData.backend?.status);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return;
    }

    // 2. Test chatbot with authentication
    console.log('\n2. Testing chatbot with authentication...');

    // First login to get token
    console.log('   Logging in...');
    try {
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'superadmin@control.vn',
                password: 'Admin123!'
            })
        });

        const loginData = await loginResponse.json();
        if (!loginData.success && loginData.status !== 'success') {
            console.log('❌ Login failed:', loginData.message || loginData.error);
            return;
        }

        const token = loginData.token;
        console.log('✅ Login successful');

        // Test chatbot with token
        console.log('   Testing chatbot...');
        const chatResponse = await fetch('http://localhost:3000/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: 'Chi tiêu của tôi tháng này là bao nhiêu?',
                language: 'vi',
                useEnhanced: true
            })
        });

        const chatData = await chatResponse.json();

        if (chatData.success) {
            console.log('✅ Chatbot response received');
            console.log('   Response length:', chatData.response?.length || 0, 'characters');
            console.log('   Intent:', chatData.metadata?.intent || 'unknown');
            console.log('   Confidence:', chatData.metadata?.confidence || 'unknown');
            console.log('   Enhanced mode:', chatData.metadata?.enhanced);
            console.log('   Language:', chatData.metadata?.language);
            console.log('\n📝 Response preview:');
            console.log('   ', chatData.response?.substring(0, 100) + '...');
        } else {
            console.log('❌ Chatbot failed:', chatData.error);
        }

    } catch (error) {
        console.log('❌ Chatbot test failed:', error.message);
    }

    // 3. Test different questions
    console.log('\n3. Testing different question types...');

    const testQuestions = [
        'Thu nhập của tôi tháng này',
        'Phân tích tài chính của tôi',
        'Tôi có bao nhiều khoản đầu tư?'
    ];

    for (const question of testQuestions) {
        console.log(`\n   Testing: "${question}"`);
        try {
            // Get fresh token
            const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'superadmin@control.vn',
                    password: 'Admin123!'
                })
            });
            const loginData = await loginResponse.json();
            const token = loginData.token;

            const response = await fetch('http://localhost:3000/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: question,
                    language: 'vi',
                    useEnhanced: true
                })
            });

            const data = await response.json();
            if (data.success) {
                console.log('   ✅ Response received');
                console.log('   📊 Intent:', data.metadata?.intent || 'unknown');
                console.log('   📝 Preview:', data.response?.substring(0, 80) + '...');
            } else {
                console.log('   ❌ Failed:', data.error);
            }
        } catch (error) {
            console.log('   ❌ Error:', error.message);
        }
    }

    console.log('\n🎯 Frontend chatbot integration test completed!');
}

// Run the test
testFrontendChatbot().catch(console.error);
