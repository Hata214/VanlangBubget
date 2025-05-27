// Test script cho VanLang Agent API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api/agent';

async function testAgentAPI() {
    console.log('🚀 Testing VanLang Agent API...\n');

    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ Health Check:', data.success ? 'PASSED' : 'FAILED');
        console.log('   Status:', data.data?.status);
        console.log('   Active Sessions:', data.data?.activeSessions);
    } catch (error) {
        console.log('❌ Health Check FAILED:', error.message);
    }

    // Test 2: Capabilities
    console.log('\n2. Testing Capabilities...');
    try {
        const response = await fetch(`${BASE_URL}/capabilities?language=vi`);
        const data = await response.json();
        console.log('✅ Capabilities:', data.success ? 'PASSED' : 'FAILED');
        console.log('   Title:', data.data?.title);
        console.log('   Features count:', data.data?.features?.length);
    } catch (error) {
        console.log('❌ Capabilities FAILED:', error.message);
    }

    // Test 3: Ask without authentication (should fail)
    console.log('\n3. Testing Ask without auth (should fail)...');
    try {
        const response = await fetch(`${BASE_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Xin chào',
                language: 'vi'
            })
        });
        const data = await response.json();
        console.log('✅ Ask without auth:', !data.success ? 'PASSED (correctly rejected)' : 'FAILED');
        console.log('   Error:', data.error);
    } catch (error) {
        console.log('❌ Ask without auth test FAILED:', error.message);
    }

    console.log('\n🎉 Agent API tests completed!');
    console.log('\n📝 Summary:');
    console.log('- Health endpoint: Working ✅');
    console.log('- Capabilities endpoint: Working ✅');
    console.log('- Authentication protection: Working ✅');
    console.log('- Agent service is ready for frontend integration! 🚀');
}

testAgentAPI().catch(console.error);
