import VanLangAgent from './vanlangAgent.js';
import mongoose from 'mongoose';
import 'dotenv/config';

// Test script cho VanLang Agent
async function testAgent() {
    console.log('🚀 Bắt đầu test VanLang Agent...');

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

    console.log('\n📝 Test cases:');

    // Test 1: Thêm giao dịch chi tiêu
    console.log('\n1. Test thêm giao dịch chi tiêu...');
    try {
        const response1 = await agent.handleUserMessage(
            testUserId, 
            'Tôi vừa mua cà phê 50000 đồng ở quán gần nhà'
        );
        console.log('✅ Response:', response1);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 2: Thêm giao dịch thu nhập
    console.log('\n2. Test thêm giao dịch thu nhập...');
    try {
        const response2 = await agent.handleUserMessage(
            testUserId, 
            'Hôm nay tôi nhận được lương 15 triệu'
        );
        console.log('✅ Response:', response2);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 3: Phân tích tài chính
    console.log('\n3. Test phân tích tài chính...');
    try {
        const response3 = await agent.handleUserMessage(
            testUserId, 
            'Phân tích tình hình tài chính của tôi'
        );
        console.log('✅ Response:', response3);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 4: Truy vấn số dư
    console.log('\n4. Test truy vấn số dư...');
    try {
        const response4 = await agent.handleUserMessage(
            testUserId, 
            'Số dư hiện tại của tôi là bao nhiêu?'
        );
        console.log('✅ Response:', response4);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 5: Lời khuyên tài chính
    console.log('\n5. Test lời khuyên tài chính...');
    try {
        const response5 = await agent.handleUserMessage(
            testUserId, 
            'Tôi có nên đầu tư vào cổ phiếu không?'
        );
        console.log('✅ Response:', response5);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 6: Chào hỏi
    console.log('\n6. Test chào hỏi...');
    try {
        const response6 = await agent.handleUserMessage(
            testUserId, 
            'Xin chào, bạn có thể giúp gì cho tôi?'
        );
        console.log('✅ Response:', response6);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 7: Câu hỏi không liên quan
    console.log('\n7. Test câu hỏi không liên quan...');
    try {
        const response7 = await agent.handleUserMessage(
            testUserId, 
            'Thời tiết hôm nay như thế nào?'
        );
        console.log('✅ Response:', response7);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 8: Phân tích ý định
    console.log('\n8. Test phân tích ý định...');
    const testMessages = [
        'Tôi vừa mua bánh mì 25000',
        'Phân tích chi tiêu tháng này',
        'Số dư của tôi là bao nhiêu?',
        'Xin chào',
        'Tôi có nên tiết kiệm không?'
    ];

    for (const message of testMessages) {
        try {
            const intent = await agent.analyzeIntent(message);
            console.log(`"${message}" -> Intent: ${intent}`);
        } catch (error) {
            console.error(`❌ Error analyzing intent for "${message}":`, error.message);
        }
    }

    // Test 9: Trích xuất dữ liệu giao dịch
    console.log('\n9. Test trích xuất dữ liệu giao dịch...');
    const transactionMessages = [
        'Tôi vừa mua cà phê 50000',
        'Nhận lương 15 triệu hôm nay',
        'Chi 200k cho xăng xe',
        'Được thưởng 5 triệu'
    ];

    for (const message of transactionMessages) {
        try {
            const data = await agent.extractTransactionData(message);
            console.log(`"${message}" -> Data:`, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`❌ Error extracting data for "${message}":`, error.message);
        }
    }

    console.log('\n🎉 Hoàn thành test VanLang Agent!');
    
    // Đóng kết nối MongoDB
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối MongoDB');
}

// Chạy test
testAgent().catch(console.error);
