/**
 * 🧪 Enhanced Calculation Engine Demo
 */

console.log('🚀 Enhanced Calculation Engine Demo');
console.log('=====================================');

// Simple calculation detection patterns
function detectGeneralCalculation(message) {
    const normalizedMessage = message.toLowerCase().trim();

    // Pattern 1: Math expression
    const mathExpressionPattern = /[\d\s+\-*/()%=?]+/;
    const hasMathExpression = mathExpressionPattern.test(normalizedMessage);

    // Pattern 2: Math keywords
    const mathKeywords = ['cộng', 'trừ', 'nhân', 'chia', 'phần trăm', 'percent', '%', 'của', 'lần', 'bằng'];
    const hasMathKeywords = mathKeywords.some(keyword => normalizedMessage.includes(keyword));

    // Pattern 3: Percentage
    const percentagePattern = /(\d+(?:\.\d+)?)\s*%?\s*(của|of)\s*(\d+(?:[k|nghìn|triệu|tr|m])?)/i;
    const hasPercentageCalc = percentagePattern.test(normalizedMessage);

    return {
        hasMathExpression,
        hasMathKeywords,
        hasPercentageCalc,
        isGeneral: hasMathExpression || hasMathKeywords || hasPercentageCalc
    };
}

function detectFinancialCalculation(message) {
    const normalizedMessage = message.toLowerCase().trim();

    // Financial keywords
    const balanceKeywords = ['số dư', 'so du', 'balance', 'còn lại', 'con lai'];
    const spendingKeywords = ['có thể chi', 'co the chi', 'đủ tiền', 'du tien'];
    const conditionalKeywords = ['nếu', 'neu', 'if', 'sau khi', 'thì', 'thi'];

    const hasBalanceKeywords = balanceKeywords.some(k => normalizedMessage.includes(k));
    const hasSpendingKeywords = spendingKeywords.some(k => normalizedMessage.includes(k));
    const hasConditionalKeywords = conditionalKeywords.some(k => normalizedMessage.includes(k));

    return {
        hasBalanceKeywords,
        hasSpendingKeywords,
        hasConditionalKeywords,
        isFinancial: hasBalanceKeywords || hasSpendingKeywords || hasConditionalKeywords
    };
}

// Test cases
const testCases = [
    // General calculations
    { input: '2 + 3 = ?', expectedType: 'general' },
    { input: '15% của 1 triệu', expectedType: 'general' },
    { input: '1000 * 12 tháng', expectedType: 'general' },
    { input: 'tính 100 chia 4', expectedType: 'general' },

    // Financial calculations
    { input: 'Tôi có thể chi 4tr được không?', expectedType: 'financial' },
    { input: 'Nếu tôi chi 2 triệu thì còn bao nhiêu?', expectedType: 'financial' },
    { input: 'Số dư của tôi', expectedType: 'financial' },
    { input: 'Sau khi chi 1 triệu thì thiếu bao nhiêu?', expectedType: 'financial' },

    // Non-calculations
    { input: 'tôi mua cà phê 50k', expectedType: 'none' },
    { input: 'xin chào', expectedType: 'none' },
    { input: 'mua xe 10 triệu', expectedType: 'none' }
];

console.log('\n📊 Running detection tests...\n');

let correctCount = 0;
let totalCount = testCases.length;

testCases.forEach((testCase, index) => {
    const generalResult = detectGeneralCalculation(testCase.input);
    const financialResult = detectFinancialCalculation(testCase.input);

    let detectedType = 'none';
    if (generalResult.isGeneral && !financialResult.isFinancial) {
        detectedType = 'general';
    } else if (financialResult.isFinancial && !generalResult.isGeneral) {
        detectedType = 'financial';
    } else if (generalResult.isGeneral && financialResult.isFinancial) {
        // Conflict resolution - prioritize financial if has conditional structure
        detectedType = financialResult.hasConditionalKeywords ? 'financial' : 'general';
    }

    const isCorrect = detectedType === testCase.expectedType;
    if (isCorrect) correctCount++;

    console.log(`${index + 1}. "${testCase.input}"`);
    console.log(`   Expected: ${testCase.expectedType}, Detected: ${detectedType} ${isCorrect ? '✅' : '❌'}`);
    console.log(`   General: ${generalResult.isGeneral}, Financial: ${financialResult.isFinancial}`);
    console.log('');
});

console.log(`📈 Results: ${correctCount}/${totalCount} correct (${(correctCount / totalCount * 100).toFixed(1)}%)`);

// Test simple math evaluation
console.log('\n🧮 Testing simple math evaluation...');

function safeEval(expression) {
    try {
        // Only allow numbers and basic operators
        if (!/^[\d+\-*/().\s]+$/.test(expression)) {
            throw new Error('Invalid expression');
        }
        return Function('"use strict"; return (' + expression + ')')();
    } catch (error) {
        return 'Error: ' + error.message;
    }
}

const mathTests = [
    '2 + 3',
    '10 * 12',
    '100 / 4',
    '15 - 5',
    '(2 + 3) * 4'
];

mathTests.forEach(expr => {
    const result = safeEval(expr);
    console.log(`${expr} = ${result}`);
});

console.log('\n✅ Basic test completed!');
