/**
 * 🧪 Test Enhanced Calculation Engine
 * Test script cho 2 loại tính toán: General và Financial
 */

import VanLangAgent from './vanlangAgent.js';
import mongoose from 'mongoose';
import 'dotenv/config';

// Test script cho Enhanced Calculation
async function testEnhancedCalculation() {
    console.log('🚀 Bắt đầu test Enhanced Calculation Engine...');

    // Kết nối MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối MongoDB thành công');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        return;
    }

    // Khởi tạo agent
    const agent = new VanLangAgent(process.env.GEMINI_API_KEY);
    const testUserId = '507f1f77bcf86cd799439011'; // Test user ID

    console.log('\n📝 Test Enhanced Calculation Engine:');

    // Test General Calculation
    console.log('\n🧮 === GENERAL CALCULATION TESTS ===');
    
    const generalCalculationTests = [
        '2 + 3 = ?',
        '15% của 1 triệu',
        '1000 * 12 tháng',
        'lãi suất 5% của 10 triệu trong 12 tháng',
        '20 phần trăm của 500k',
        '100 chia 4',
        '2 cộng 3 nhân 4',
        'tính 15% của 2 triệu'
    ];

    for (const [index, testCase] of generalCalculationTests.entries()) {
        console.log(`\n${index + 1}. Test General: "${testCase}"`);
        try {
            const response = await agent.handleUserMessage(testUserId, testCase);
            console.log('✅ Response:', response.substring(0, 200) + '...');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    // Test Financial Calculation
    console.log('\n💰 === FINANCIAL CALCULATION TESTS ===');
    
    const financialCalculationTests = [
        'Tôi có thể chi 4tr được không?',
        'Nếu tôi chi 2 triệu thì còn bao nhiêu?',
        'Tôi có đủ tiền chi 500k không?',
        'Sau khi chi 1 triệu thì thiếu bao nhiêu?',
        'Số dư của tôi',
        'Tôi có thể mua xe 50 triệu được không?',
        'Nếu tôi lấy tiền tiết kiệm để mua xe đạp giá 4tr thì tôi sẽ còn bao nhiều tiền?',
        'Tôi chi 500k thì còn bao nhiều?'
    ];

    for (const [index, testCase] of financialCalculationTests.entries()) {
        console.log(`\n${index + 1}. Test Financial: "${testCase}"`);
        try {
            const response = await agent.handleUserMessage(testUserId, testCase);
            console.log('✅ Response:', response.substring(0, 200) + '...');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    // Test Intent Detection
    console.log('\n🎯 === INTENT DETECTION TESTS ===');
    
    const intentTests = [
        { message: '2 + 3 = ?', expected: 'general_calculation' },
        { message: '15% của 1 triệu', expected: 'general_calculation' },
        { message: 'Tôi có thể chi 4tr được không?', expected: 'financial_calculation' },
        { message: 'Nếu tôi chi 2 triệu thì còn bao nhiêu?', expected: 'financial_calculation' },
        { message: 'lãi suất 5% của 10 triệu', expected: 'general_calculation' },
        { message: 'Số dư của tôi', expected: 'financial_calculation' },
        { message: 'tính 100 * 12', expected: 'general_calculation' },
        { message: 'Sau khi chi 1 triệu thì thiếu bao nhiêu?', expected: 'financial_calculation' }
    ];

    for (const [index, test] of intentTests.entries()) {
        console.log(`\n${index + 1}. Intent Test: "${test.message}"`);
        try {
            const intent = await agent.analyzeIntent(test.message);
            const isCorrect = intent === test.expected;
            console.log(`${isCorrect ? '✅' : '❌'} Intent: ${intent} (Expected: ${test.expected})`);
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    // Test Calculation Coordinator directly
    console.log('\n⚙️ === CALCULATION COORDINATOR TESTS ===');
    
    const coordinatorTests = [
        '2 + 3 = ?',
        'Tôi có thể chi 4tr được không?',
        '15% của 1 triệu',
        'Nếu tôi chi 2 triệu thì còn bao nhiêu?',
        'lãi suất 5% của 10 triệu trong 12 tháng',
        'Số dư của tôi'
    ];

    for (const [index, testCase] of coordinatorTests.entries()) {
        console.log(`\n${index + 1}. Coordinator Test: "${testCase}"`);
        try {
            const result = await agent.calculationCoordinator.detectAndProcess(testCase);
            console.log(`${result.isCalculation ? '✅' : '❌'} Is Calculation: ${result.isCalculation}`);
            if (result.isCalculation) {
                console.log(`🎯 Type: ${result.type}, Confidence: ${result.confidence.toFixed(2)}`);
                console.log(`📝 Response: ${result.response.substring(0, 150)}...`);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    // Test Edge Cases
    console.log('\n🔍 === EDGE CASE TESTS ===');
    
    const edgeCaseTests = [
        'tôi mua cà phê 50k', // Should NOT be calculation
        'mua xe 10 triệu', // Should NOT be calculation  
        '2 + 3 và tôi có thể chi 4tr không?', // Mixed case
        'tính 15% của số dư của tôi', // Mixed case
        'hello', // Not calculation
        'xin chào', // Not calculation
        '123', // Just number
        'abc + def' // Invalid math
    ];

    for (const [index, testCase] of edgeCaseTests.entries()) {
        console.log(`\n${index + 1}. Edge Case: "${testCase}"`);
        try {
            const result = await agent.calculationCoordinator.detectAndProcess(testCase);
            console.log(`${result.isCalculation ? '🔢' : '❌'} Is Calculation: ${result.isCalculation}`);
            if (result.isCalculation) {
                console.log(`🎯 Type: ${result.type}, Confidence: ${result.confidence.toFixed(2)}`);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    console.log('\n🎉 Hoàn thành test Enhanced Calculation Engine!');
    
    // Đóng kết nối MongoDB
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối MongoDB');
}

// Test specific calculation types
async function testCalculationTypes() {
    console.log('\n🔬 === DETAILED CALCULATION TYPE TESTS ===');
    
    const agent = new VanLangAgent(process.env.GEMINI_API_KEY);
    
    // Test General Calculation Engine directly
    console.log('\n🧮 Testing General Calculation Engine:');
    const generalTests = [
        { input: '2 + 3', expected: 'arithmetic' },
        { input: '15% của 1 triệu', expected: 'percentage' },
        { input: 'lãi suất 5% của 10 triệu', expected: 'interest' },
        { input: '100 * 12', expected: 'arithmetic' }
    ];
    
    for (const test of generalTests) {
        try {
            const result = await agent.calculationCoordinator.generalEngine.processCalculation(test.input);
            console.log(`✅ "${test.input}" -> ${result.substring(0, 100)}...`);
        } catch (error) {
            console.error(`❌ "${test.input}" -> Error: ${error.message}`);
        }
    }
    
    // Test Financial Calculation Engine directly
    console.log('\n💰 Testing Financial Calculation Engine:');
    const financialTests = [
        'Tôi có thể chi 4tr được không?',
        'Số dư của tôi',
        'Nếu tôi chi 2 triệu thì còn bao nhiêu?'
    ];
    
    // Mock financial data for testing
    const mockFinancialData = {
        summary: {
            totalIncomes: 20000000, // 20 triệu
            totalExpenses: 15000000, // 15 triệu
            totalInvestments: 5000000,
            totalLoans: 2000000
        },
        incomes: [
            { amount: 15000000, category: 'Lương', description: 'Lương tháng', date: new Date() },
            { amount: 5000000, category: 'Tiền tiết kiệm', description: 'Tiết kiệm', date: new Date() }
        ],
        expenses: [],
        loans: [],
        investments: []
    };
    
    for (const test of financialTests) {
        try {
            const result = await agent.calculationCoordinator.financialEngine.processFinancialCalculation(test, mockFinancialData);
            console.log(`✅ "${test}" -> ${result.substring(0, 100)}...`);
        } catch (error) {
            console.error(`❌ "${test}" -> Error: ${error.message}`);
        }
    }
}

// Chạy tests
async function runAllTests() {
    try {
        await testEnhancedCalculation();
        await testCalculationTypes();
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Export for use in other files
export { testEnhancedCalculation, testCalculationTypes };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}
