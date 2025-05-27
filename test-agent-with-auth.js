const fetch = require('node-fetch');

async function testAgentWithAuth() {
    console.log('🚀 Testing VanLang Agent API with Authentication...\n');

    // First, login to get a valid token
    console.log('1. Logging in to get auth token...');
    try {
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'hoang@gmail.com', // Replace with your test user
                password: '123456' // Replace with your test password
            })
        });

        const loginData = await loginResponse.json();
        
        if (!loginData.success) {
            console.log('❌ Login failed:', loginData.message);
            return;
        }

        const token = loginData.token;
        console.log('✅ Login successful! Token obtained.');

        // Test agent ask endpoint with valid token
        console.log('\n2. Testing Agent Ask with valid token...');
        const agentResponse = await fetch('http://localhost:4000/api/agent/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: 'Xin chào, tôi muốn biết số dư hiện tại',
                language: 'vi'
            })
        });

        const agentData = await agentResponse.json();
        console.log('📡 Agent Response Status:', agentResponse.status);
        console.log('📦 Agent Response:', JSON.stringify(agentData, null, 2));

        if (agentData.success) {
            console.log('✅ Agent Ask: PASSED');
            console.log('🤖 Agent Response:', agentData.data.response);
        } else {
            console.log('❌ Agent Ask: FAILED');
            console.log('Error:', agentData.error || agentData.message);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testAgentWithAuth();
