import VanLangAgent from './src/agent/vanlangAgent.js';

async function testParseFilterConditions() {
    console.log('🔍 TESTING parseFilterConditions METHOD DIRECTLY\n');
    
    const agent = new VanLangAgent();
    
    const testCases = [
        'thu nhập thấp nhất',
        'chi tiêu thấp nhất',
        'chi tiêu cao nhất',
        'khoản vay cao nhất',
        'thu nhập trên 1 triệu',
        'chi tiêu dưới 500k'
    ];
    
    for (const testCase of testCases) {
        console.log(`\n📝 Testing: "${testCase}"`);
        console.log('='.repeat(60));
        
        try {
            const result = agent.parseFilterConditions(testCase);
            
            console.log('🔍 parseFilterConditions result:');
            console.log('  - isValid:', result.isValid);
            console.log('  - dataType:', result.dataType);
            console.log('  - operator:', result.operator);
            console.log('  - amount:', result.amount);
            console.log('  - originalMessage:', result.originalMessage);
            
            if (result.isValid) {
                console.log('✅ VALID FILTER DETECTED!');
            } else {
                console.log('❌ INVALID FILTER - Missing required fields');
            }
            
        } catch (error) {
            console.log('❌ Error:', error.message);
            console.log('Stack:', error.stack);
        }
    }
}

testParseFilterConditions().catch(console.error);
