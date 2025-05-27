const VanLangAgent = require('./src/agent/vanlangAgent');

async function testSavingsIntent() {
    const agent = new VanLangAgent();
    
    console.log('🧪 Testing "tôi mới tiết kiệm được 500k"...\n');
    
    try {
        // Test analyzeIntent directly
        const intent = await agent.analyzeIntent('tôi mới tiết kiệm được 500k');
        console.log('✅ Intent result:', intent);
        
        // Test keyword analysis
        const { category } = agent.analyzeKeywordsAndTime('tôi mới tiết kiệm được 500k');
        console.log('✅ Category result:', category);
        
        // Test full message handling
        console.log('\n🔄 Testing full message handling...');
        const response = await agent.handleUserMessage('test-user-id', 'tôi mới tiết kiệm được 500k');
        console.log('✅ Full response:', response);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSavingsIntent();
