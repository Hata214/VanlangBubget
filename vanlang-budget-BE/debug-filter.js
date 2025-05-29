import VanLangAgent from './src/agent/vanlangAgent.js';

// 🔍 DEBUG PARSEFILTER CONDITIONS
async function debugParseFilterConditions() {
    console.log('\n🔍 DEBUGGING parseFilterConditions METHOD:\n');
    
    const agent = new VanLangAgent();
    
    const filterTestCases = [
        'thu nhập thấp nhất',
        'chi tiêu cao nhất', 
        'chi tiêu thấp nhất',
        'khoản vay cao nhất',
        'thu nhập trên 1 triệu',
        'chi tiêu dưới 500k'
    ];
    
    for (const testCase of filterTestCases) {
        console.log(`\n📝 Testing parseFilterConditions: "${testCase}"`);
        try {
            const result = agent.parseFilterConditions(testCase);
            console.log(`✅ Result:`, JSON.stringify(result, null, 2));
            
            if (result.isValid) {
                console.log(`   ✅ VALID - dataType: ${result.dataType}, operator: ${result.operator}, amount: ${result.amount}`);
            } else {
                console.log(`   ❌ INVALID - Missing: dataType=${result.dataType}, operator=${result.operator}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// 🔍 DEBUG DETECT ADVANCED FILTER
async function debugDetectAdvancedFilter() {
    console.log('\n🔍 DEBUGGING detectAdvancedFilter METHOD:\n');
    
    const agent = new VanLangAgent();
    
    const filterTestCases = [
        'thu nhập thấp nhất',
        'chi tiêu cao nhất', 
        'chi tiêu thấp nhất',
        'khoản vay cao nhất',
        'thu nhập trên 1 triệu',
        'chi tiêu dưới 500k'
    ];
    
    for (const testCase of filterTestCases) {
        console.log(`\n📝 Testing detectAdvancedFilter: "${testCase}"`);
        try {
            const result = agent.detectAdvancedFilter(testCase);
            console.log(`✅ Result: ${result}`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// 🔍 DEBUG ANALYZE INTENT
async function debugAnalyzeIntent() {
    console.log('\n🔍 DEBUGGING analyzeIntent METHOD:\n');
    
    const agent = new VanLangAgent();
    
    const filterTestCases = [
        'thu nhập thấp nhất',
        'chi tiêu cao nhất', 
        'chi tiêu thấp nhất',
        'khoản vay cao nhất',
        'thu nhập trên 1 triệu',
        'chi tiêu dưới 500k'
    ];
    
    for (const testCase of filterTestCases) {
        console.log(`\n📝 Testing analyzeIntent: "${testCase}"`);
        try {
            const result = agent.analyzeIntent(testCase);
            console.log(`✅ Result: ${result}`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// RUN ALL TESTS
async function runAllTests() {
    await debugParseFilterConditions();
    await debugDetectAdvancedFilter();
    await debugAnalyzeIntent();
}

runAllTests().catch(console.error);
