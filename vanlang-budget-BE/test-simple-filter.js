// Simple test without imports
console.log('🔍 TESTING SIMPLE REGEX PATTERNS...\n');

const testCases = [
    'thu nhập thấp nhất',
    'chi tiêu thấp nhất',
    'chi tiêu cao nhất',
    'khoản vay cao nhất'
];

// Test patterns directly
const patterns = [
    /\b(thấp nhất|thap nhat|nhỏ nhất|nho nhat|lowest|minimum|min|smallest)/i,
    /thu nhập.*thấp nhất/i,
    /thu nhap.*thap nhat/i,
    /income.*lowest/i,
    /income.*minimum/i,
    /thu nhập.*nhỏ nhất/i,
    /thu nhap.*nho nhat/i
];

testCases.forEach(testCase => {
    console.log(`\n📝 Testing: "${testCase}"`);
    console.log('='.repeat(50));
    
    const normalizedMessage = testCase.toLowerCase().trim();
    console.log('Normalized:', normalizedMessage);
    
    patterns.forEach((pattern, index) => {
        const isMatch = pattern.test(normalizedMessage);
        console.log(`Pattern ${index} (${pattern.toString()}): ${isMatch}`);
    });
    
    // Test specific patterns for "thu nhập thấp nhất"
    if (testCase === 'thu nhập thấp nhất') {
        console.log('\n🚨 SPECIAL TEST FOR "thu nhập thấp nhất":');
        console.log('- includes("thu nhập"):', normalizedMessage.includes('thu nhập'));
        console.log('- includes("thấp nhất"):', normalizedMessage.includes('thấp nhất'));
        console.log('- includes("thu nhap"):', normalizedMessage.includes('thu nhap'));
        console.log('- includes("thap nhat"):', normalizedMessage.includes('thap nhat'));
    }
});
