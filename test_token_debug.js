// Script test token generation và comparison
const bcrypt = require('bcryptjs');

async function testTokenGeneration() {
    console.log('🧪 Testing Token Generation and Comparison');
    console.log('==========================================');

    // Test 1: Tạo token giống như trong code
    console.log('\n1. Testing token generation...');
    const resetToken = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    console.log('Generated token:', resetToken);
    console.log('Token length:', resetToken.length);
    console.log('Token type:', typeof resetToken);

    // Test 2: Hash token
    console.log('\n2. Testing token hashing...');
    const hashedToken = await bcrypt.hash(resetToken, 12);
    console.log('Hashed token (first 30 chars):', hashedToken.substring(0, 30) + '...');
    console.log('Hashed token length:', hashedToken.length);

    // Test 3: Compare token
    console.log('\n3. Testing token comparison...');
    const matches1 = await bcrypt.compare(resetToken, hashedToken);
    console.log('Original token matches:', matches1);

    // Test 4: Test với token khác
    const wrongToken = 'wrongtoken123';
    const matches2 = await bcrypt.compare(wrongToken, hashedToken);
    console.log('Wrong token matches:', matches2);

    // Test 5: Test với token từ URL (có thể bị encode)
    console.log('\n4. Testing URL encoding effects...');
    const urlToken = encodeURIComponent(resetToken);
    const decodedToken = decodeURIComponent(urlToken);
    console.log('Original token:', resetToken);
    console.log('URL encoded:', urlToken);
    console.log('URL decoded:', decodedToken);
    console.log('Decoded matches original:', resetToken === decodedToken);

    const matches3 = await bcrypt.compare(decodedToken, hashedToken);
    console.log('Decoded token matches hash:', matches3);

    // Test 6: Test với token có special characters
    console.log('\n5. Testing special characters...');
    const specialToken = resetToken.replace(/[0-9]/g, '+').replace(/[a-z]/g, '/');
    console.log('Token with special chars:', specialToken);
    const hashedSpecial = await bcrypt.hash(specialToken, 12);
    const matchesSpecial = await bcrypt.compare(specialToken, hashedSpecial);
    console.log('Special token matches:', matchesSpecial);

    console.log('\n🎉 Token tests completed!');
}

// Chạy test
testTokenGeneration().catch(console.error); 