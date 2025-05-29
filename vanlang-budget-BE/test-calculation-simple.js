/**
 * 🧪 Simple Test for Enhanced Calculation
 */

import CalculationCoordinator from './src/agent/calculationCoordinator.js';

console.log('🚀 Testing Enhanced Calculation...');

async function testCalculation() {
    try {
        const coordinator = new CalculationCoordinator();
        
        console.log('\n🧮 Testing General Calculation:');
        
        // Test 1: Simple math
        const test1 = await coordinator.detectAndProcess('2 + 3 = ?');
        console.log('Test 1 - "2 + 3 = ?"');
        console.log('Is Calculation:', test1.isCalculation);
        console.log('Type:', test1.type);
        console.log('Response:', test1.response?.substring(0, 100) + '...');
        
        // Test 2: Percentage
        const test2 = await coordinator.detectAndProcess('15% của 1 triệu');
        console.log('\nTest 2 - "15% của 1 triệu"');
        console.log('Is Calculation:', test2.isCalculation);
        console.log('Type:', test2.type);
        console.log('Response:', test2.response?.substring(0, 100) + '...');
        
        console.log('\n💰 Testing Financial Calculation:');
        
        // Mock financial data
        const mockData = {
            summary: {
                totalIncomes: 20000000,
                totalExpenses: 15000000
            },
            incomes: [],
            expenses: [],
            loans: [],
            investments: []
        };
        
        // Test 3: Financial question
        const test3 = await coordinator.detectAndProcess('Tôi có thể chi 4tr được không?', mockData);
        console.log('Test 3 - "Tôi có thể chi 4tr được không?"');
        console.log('Is Calculation:', test3.isCalculation);
        console.log('Type:', test3.type);
        console.log('Response:', test3.response?.substring(0, 100) + '...');
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testCalculation();
