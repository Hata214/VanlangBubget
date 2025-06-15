// Test script cho chức năng reset password
const axios = require('axios');

const API_BASE_URL = 'https://vanlangbubget.onrender.com';

async function testResetPassword() {
    console.log('🧪 Testing Reset Password Functionality');
    console.log('=====================================');

    try {
        // Test 1: Forgot Password
        console.log('\n1. Testing Forgot Password...');
        const forgotResponse = await axios.post(`${API_BASE_URL}/api/auth/forgotpassword`, {
            email: 'test@example.com' // Thay bằng email thật trong database
        });

        console.log('✅ Forgot Password Response:', forgotResponse.data);

        // Test 2: Reset Password với token giả
        console.log('\n2. Testing Reset Password with fake token...');
        try {
            const resetResponse = await axios.post(`${API_BASE_URL}/api/auth/resetpassword/faketoken123`, {
                password: 'NewPassword123!',
                passwordConfirm: 'NewPassword123!'
            });
            console.log('❌ Should have failed but got:', resetResponse.data);
        } catch (error) {
            console.log('✅ Correctly rejected fake token:', error.response?.data?.message);
        }

        // Test 3: Reset Password với missing passwordConfirm
        console.log('\n3. Testing Reset Password with missing passwordConfirm...');
        try {
            const resetResponse = await axios.post(`${API_BASE_URL}/api/auth/resetpassword/sometoken`, {
                password: 'NewPassword123!'
                // Missing passwordConfirm
            });
            console.log('❌ Should have failed but got:', resetResponse.data);
        } catch (error) {
            console.log('✅ Correctly rejected missing passwordConfirm:', error.response?.data?.message);
        }

        // Test 4: Reset Password với password mismatch
        console.log('\n4. Testing Reset Password with password mismatch...');
        try {
            const resetResponse = await axios.post(`${API_BASE_URL}/api/auth/resetpassword/sometoken`, {
                password: 'NewPassword123!',
                passwordConfirm: 'DifferentPassword123!'
            });
            console.log('❌ Should have failed but got:', resetResponse.data);
        } catch (error) {
            console.log('✅ Correctly rejected password mismatch:', error.response?.data?.message);
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Chạy test
testResetPassword(); 