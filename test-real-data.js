import fetch from 'node-fetch';

async function testRealData() {
    console.log('🔍 Testing Real Financial Data...\n');

    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'superadmin@control.vn',
                password: 'Admin123!'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Login successful');

        // 2. Test specific financial queries that should return real data
        const queries = [
            'Số dư hiện tại của tôi là bao nhiêu?',
            'Thu nhập tháng này của tôi',
            'Chi tiêu tháng này của tôi',
            'Tôi tiết kiệm được bao nhiêu?',
            'Tình hình tài chính tổng quan'
        ];

        for (const query of queries) {
            console.log(`\n📝 Testing: "${query}"`);

            const response = await fetch('http://localhost:4000/api/chatbot/enhanced', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: query,
                    language: 'vi'
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Response received');
                console.log('📊 Intent:', data.metadata?.intent || 'unknown');
                console.log('📈 Response preview:', data.response.substring(0, 150) + '...');

                // Extract numbers from response
                const numbers = data.response.match(/[\d,\.]+\s*(VND|đ|dong)/gi);
                if (numbers && numbers.length > 0) {
                    console.log('💰 Numbers found:', numbers);
                }
            } else {
                console.log('❌ Failed:', data.error);
            }
        }

        // 3. Test direct database query
        console.log('\n🗄️ Testing direct database access...');
        const dbResponse = await fetch('http://localhost:4000/api/chatbot/enhanced', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: 'DEBUG: Show me all my financial data with exact numbers',
                language: 'vi'
            })
        });

        const dbData = await dbResponse.json();
        console.log('📊 Database response:', dbData.response.substring(0, 300) + '...');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testRealData();
