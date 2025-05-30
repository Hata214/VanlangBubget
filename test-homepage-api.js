// Test script để kiểm tra API homepage content
import fetch from 'node-fetch';

const testHomepageAPI = async () => {
    try {
        console.log('🔍 Testing Homepage API...');

        // Test GET homepage content
        const response = await fetch('http://localhost:4000/api/site-content/homepage');
        const data = await response.json();

        console.log('📊 API Response Status:', response.status);
        console.log('📋 Response Data:', JSON.stringify(data, null, 2));

        if (data.status === 'success') {
            console.log('✅ API hoạt động bình thường');

            // Kiểm tra cấu trúc content
            const content = data.data?.content;
            if (content) {
                console.log('📝 Sections có sẵn:', Object.keys(content));

                // Kiểm tra từng section
                const sections = ['hero', 'features', 'statistics', 'testimonials', 'pricing', 'cta'];
                sections.forEach(section => {
                    if (content[section]) {
                        console.log(`✅ Section ${section}: OK`);
                    } else {
                        console.log(`❌ Section ${section}: Missing`);
                    }
                });
            }
        } else {
            console.log('❌ API trả về lỗi:', data);
        }

    } catch (error) {
        console.error('❌ Lỗi khi test API:', error.message);
    }
};

// Chạy test
testHomepageAPI();
