// Test script cho toàn bộ flow reset password và login
const axios = require('axios');

const API_BASE_URL = 'https://vanlangbubget.onrender.com';
const TEST_EMAIL = 'clonenope777@gmail.com';
const NEW_PASSWORD = 'NewPassword123!';

async function testFullResetFlow() {
    console.log('🧪 Testing Full Reset Password + Login Flow');
    console.log('============================================');

    try {
        // Step 1: Forgot Password
        console.log('\n1. 📧 Testing Forgot Password...');
        const forgotResponse = await axios.post(`${API_BASE_URL}/api/auth/forgotpassword`, {
            email: TEST_EMAIL
        });

        console.log('✅ Forgot Password Response:', forgotResponse.data);

        // Step 2: Simulate getting token from email (you'll need to get this from server logs)
        console.log('\n2. 🔑 You need to get the token from server logs or email');
        console.log('   Look for: "Generated reset token: XXXXXXXX"');
        console.log('   Then run: testResetWithToken("YOUR_TOKEN_HERE")');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

async function testResetWithToken(token) {
    console.log(`\n3. 🔄 Testing Reset Password with token: ${token.substring(0, 8)}...`);

    try {
        const resetResponse = await axios.post(`${API_BASE_URL}/api/auth/resetpassword/${token}`, {
            password: NEW_PASSWORD,
            passwordConfirm: NEW_PASSWORD
        });

        console.log('✅ Reset Password Response:', resetResponse.data);

        // Step 4: Test login with new password
        console.log('\n4. 🔐 Testing Login with new password...');

        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: NEW_PASSWORD
        });

        console.log('✅ Login Response:', loginResponse.data);
        console.log('🎉 Full flow completed successfully!');

    } catch (error) {
        console.error('❌ Reset/Login failed:', error.response?.data || error.message);

        if (error.response?.status === 400) {
            console.log('\n🔧 Trying with bypass enabled...');
            // If bypass is enabled, any token should work
            try {
                const bypassResponse = await axios.post(`${API_BASE_URL}/api/auth/resetpassword/anytoken123`, {
                    password: NEW_PASSWORD,
                    passwordConfirm: NEW_PASSWORD
                });
                console.log('✅ Bypass Reset Response:', bypassResponse.data);
            } catch (bypassError) {
                console.error('❌ Bypass also failed:', bypassError.response?.data || bypassError.message);
            }
        }
    }
}

// Export functions for manual testing
global.testFullResetFlow = testFullResetFlow;
global.testResetWithToken = testResetWithToken;

// Auto run forgot password
testFullResetFlow();

console.log('\n📝 Manual Commands:');
console.log('testResetWithToken("YOUR_TOKEN_FROM_LOGS")');
console.log('testFullResetFlow()'); 