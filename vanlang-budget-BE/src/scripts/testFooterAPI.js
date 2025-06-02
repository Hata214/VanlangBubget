import fetch from 'node-fetch';

const testFooterAPI = async () => {
    try {
        console.log('🧪 Testing Footer API...');
        
        const response = await fetch('http://localhost:4000/api/site-content/footer');
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 Response data:', JSON.stringify(data, null, 2));
        
        // Test structure
        if (data.status === 'success' && data.data) {
            console.log('✅ API response structure is correct');
            
            if (data.data.vi) {
                console.log('✅ Vietnamese content found');
                console.log('🔍 Description:', data.data.vi.description);
            } else {
                console.log('❌ No Vietnamese content found');
            }
        } else {
            console.log('❌ Unexpected API response structure');
        }
        
    } catch (error) {
        console.error('❌ Error testing Footer API:', error.message);
    }
};

testFooterAPI();
