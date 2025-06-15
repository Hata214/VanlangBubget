// Script để kích hoạt user account
const axios = require('axios');

const API_BASE_URL = 'https://vanlangbubget.onrender.com';
const USER_EMAIL = 'clonenope777@gmail.com';

async function activateUserAccount() {
    console.log('🔓 Activating User Account');
    console.log('==========================');

    try {
        // Method 1: Try to activate via admin API (if available)
        console.log('\n1. Trying admin activation...');

        // This would require admin authentication, so it might not work
        // But we can try if there's a public endpoint

        // Method 2: Use the reset password flow to activate
        console.log('\n2. Using reset password flow to activate account...');

        // Step 1: Request forgot password
        const forgotResponse = await axios.post(`${API_BASE_URL}/api/auth/forgotpassword`, {
            email: USER_EMAIL
        });

        console.log('✅ Forgot password request sent:', forgotResponse.data);
        console.log('\n📧 Check server logs for the reset token');
        console.log('🔑 Token will look like: "Generated reset token: XXXXXXXX"');
        console.log('\n📝 Then use this token to reset password, which will activate the account');

        return true;

    } catch (error) {
        console.error('❌ Activation failed:', error.response?.data || error.message);
        return false;
    }
}

async function resetPasswordAndActivate(token, newPassword = 'NewPassword123!') {
    console.log(`\n🔄 Resetting password and activating account with token: ${token.substring(0, 8)}...`);

    try {
        const resetResponse = await axios.post(`${API_BASE_URL}/api/auth/resetpassword/${token}`, {
            password: newPassword,
            passwordConfirm: newPassword
        });

        console.log('✅ Password reset successful:', resetResponse.data);
        console.log('🎉 Account should now be activated!');

        // Test login
        console.log('\n🔐 Testing login with new password...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: USER_EMAIL,
            password: newPassword
        });

        console.log('✅ Login successful:', loginResponse.data);
        return true;

    } catch (error) {
        console.error('❌ Reset/Login failed:', error.response?.data || error.message);
        return false;
    }
}

// Export functions
global.activateUserAccount = activateUserAccount;
global.resetPasswordAndActivate = resetPasswordAndActivate;

// Auto run
activateUserAccount();

console.log('\n📝 Available Commands:');
console.log('activateUserAccount() - Request forgot password');
console.log('resetPasswordAndActivate("TOKEN_FROM_LOGS", "NewPassword123!") - Complete activation'); 