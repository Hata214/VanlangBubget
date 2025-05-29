// Test VanLang Agent directly without server
console.log('🔍 Testing VanLang Agent directly...\n');

// Test simple patterns first
const testMessage = 'thu nhập thấp nhất';
const normalizedMessage = testMessage.toLowerCase().trim();

console.log('Original message:', testMessage);
console.log('Normalized message:', normalizedMessage);

// Test basic string operations
console.log('\n📝 Basic string tests:');
console.log('- includes("thu nhập"):', normalizedMessage.includes('thu nhập'));
console.log('- includes("thấp nhất"):', normalizedMessage.includes('thấp nhất'));

// Test regex patterns
console.log('\n📝 Regex pattern tests:');
const patterns = [
    /\b(thấp nhất|thap nhat|nhỏ nhất|nho nhat|lowest|minimum|min|smallest)/i,
    /thu nhập.*thấp nhất/i,
    /thu nhap.*thap nhat/i,
    /income.*lowest/i,
    /income.*minimum/i,
    /thu nhập.*nhỏ nhất/i,
    /thu nhap.*nho nhat/i
];

patterns.forEach((pattern, index) => {
    const result = pattern.test(normalizedMessage);
    console.log(`Pattern ${index} (${pattern.toString()}): ${result}`);
});

// Test data type detection
console.log('\n📝 Data type detection:');
let dataType = null;
if (normalizedMessage.includes('chi tiêu') || normalizedMessage.includes('chi tieu') ||
    normalizedMessage.includes('expense') || normalizedMessage.includes('spending')) {
    dataType = 'expense';
} else if (normalizedMessage.includes('thu nhập') || normalizedMessage.includes('thu nhap') ||
    normalizedMessage.includes('income') || normalizedMessage.includes('salary')) {
    dataType = 'income';
} else if (normalizedMessage.includes('khoản vay') || normalizedMessage.includes('khoan vay') ||
    normalizedMessage.includes('loan') || normalizedMessage.includes('debt') ||
    normalizedMessage.includes('vay') || normalizedMessage.includes('nợ')) {
    dataType = 'loan';
}

console.log('Detected dataType:', dataType);

// Test operator detection
console.log('\n📝 Operator detection:');
let operator = null;
if (normalizedMessage.includes('cao nhất') || normalizedMessage.includes('cao nhat') ||
    normalizedMessage.includes('lớn nhất') || normalizedMessage.includes('lon nhat') ||
    normalizedMessage.includes('highest') || normalizedMessage.includes('maximum') ||
    normalizedMessage.includes('max') || normalizedMessage.includes('biggest')) {
    operator = 'max';
} else if (normalizedMessage.includes('thấp nhất') || normalizedMessage.includes('thap nhat') ||
    normalizedMessage.includes('nhỏ nhất') || normalizedMessage.includes('nho nhat') ||
    normalizedMessage.includes('lowest') || normalizedMessage.includes('minimum') ||
    normalizedMessage.includes('min') || normalizedMessage.includes('smallest')) {
    operator = 'min';
}

console.log('Detected operator:', operator);

// Test final validation
console.log('\n📝 Final validation:');
const isValid = !!(dataType && operator);
console.log('dataType:', dataType);
console.log('operator:', operator);
console.log('isValid:', isValid);

if (isValid) {
    console.log('✅ FILTER SHOULD WORK!');
} else {
    console.log('❌ FILTER VALIDATION FAILED!');
}

console.log('\n🎯 Test completed!');
