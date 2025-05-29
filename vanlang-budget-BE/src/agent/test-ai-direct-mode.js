/**
 * 🤖 Test AI Direct Mode - Demo tính năng mới
 */

import dotenv from 'dotenv';
import VanLangAgent from './vanlangAgent.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

async function testAIDirectMode() {
    console.log('\n🤖 ===== TEST AI DIRECT MODE =====\n');

    try {
        // Khởi tạo agent
        const agent = new VanLangAgent(process.env.GEMINI_API_KEY);
        const testUserId = '507f1f77bcf86cd799439011'; // Test user ID

        console.log('📝 Test cases for AI Direct Mode:\n');

        // Test 1: Câu hỏi về thời tiết (không liên quan tài chính)
        console.log('1. Test câu hỏi về thời tiết...');
        try {
            const response1 = await agent.handleUserMessage(
                testUserId, 
                '?Thời tiết hôm nay như thế nào?'
            );
            console.log('✅ Response:', response1);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 2: Câu hỏi về nấu ăn (có thể liên kết với tài chính)
        console.log('2. Test câu hỏi về nấu ăn...');
        try {
            const response2 = await agent.handleUserMessage(
                testUserId, 
                '?Làm thế nào để nấu phở ngon?'
            );
            console.log('✅ Response:', response2);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 3: Câu hỏi về đầu tư (liên quan trực tiếp tài chính)
        console.log('3. Test câu hỏi về đầu tư...');
        try {
            const response3 = await agent.handleUserMessage(
                testUserId, 
                '?Tôi có nên đầu tư vào cổ phiếu không?'
            );
            console.log('✅ Response:', response3);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 4: Câu hỏi về công nghệ
        console.log('4. Test câu hỏi về công nghệ...');
        try {
            const response4 = await agent.handleUserMessage(
                testUserId, 
                '?Blockchain là gì?'
            );
            console.log('✅ Response:', response4);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 5: Câu hỏi về sức khỏe
        console.log('5. Test câu hỏi về sức khỏe...');
        try {
            const response5 = await agent.handleUserMessage(
                testUserId, 
                '?Làm thế nào để giữ sức khỏe tốt?'
            );
            console.log('✅ Response:', response5);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 6: Câu hỏi rỗng với AI mode
        console.log('6. Test câu hỏi rỗng với AI mode...');
        try {
            const response6 = await agent.handleUserMessage(
                testUserId, 
                '?'
            );
            console.log('✅ Response:', response6);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 7: So sánh với câu hỏi thường (không có "?")
        console.log('7. Test so sánh với câu hỏi thường...');
        try {
            const response7 = await agent.handleUserMessage(
                testUserId, 
                'Thời tiết hôm nay như thế nào?'
            );
            console.log('✅ Response (Normal Mode):', response7);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 8: Câu hỏi phức tạp về tài chính cá nhân
        console.log('8. Test câu hỏi phức tạp về tài chính...');
        try {
            const response8 = await agent.handleUserMessage(
                testUserId, 
                '?Với tình hình tài chính hiện tại của tôi, tôi có nên vay tiền để mua nhà không?'
            );
            console.log('✅ Response:', response8);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 9: Câu hỏi về học tập
        console.log('9. Test câu hỏi về học tập...');
        try {
            const response9 = await agent.handleUserMessage(
                testUserId, 
                '?Làm thế nào để học lập trình hiệu quả?'
            );
            console.log('✅ Response:', response9);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        // Test 10: Câu hỏi về du lịch
        console.log('10. Test câu hỏi về du lịch...');
        try {
            const response10 = await agent.handleUserMessage(
                testUserId, 
                '?Địa điểm du lịch nào ở Việt Nam đáng đi nhất?'
            );
            console.log('✅ Response:', response10);
            console.log('\n' + '='.repeat(80) + '\n');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        console.log('🎉 Hoàn thành test AI Direct Mode!');
        
        // Test Gemini metrics
        console.log('\n📊 Gemini Performance Metrics:');
        const metrics = agent.getGeminiMetrics();
        console.log(JSON.stringify(metrics, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    // Đóng kết nối
    process.exit(0);
}

// Chạy test
testAIDirectMode().catch(console.error);
