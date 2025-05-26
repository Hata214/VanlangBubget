import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({
                success: false,
                error: 'Message is required'
            }, { status: 400 });
        }

        // Simple chatbot responses for testing
        const lowerMessage = message.toLowerCase().trim();
        let response = '';

        // Greeting responses
        if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            const currentHour = new Date().getHours();
            let greeting = '';

            if (currentHour < 12) {
                greeting = 'Chào buổi sáng!';
            } else if (currentHour < 18) {
                greeting = 'Chào buổi chiều!';
            } else {
                greeting = 'Chào buổi tối!';
            }

            response = `${greeting} 👋 Tôi là VanLangBot, trợ lý tài chính thông minh của ứng dụng VanLang Budget. Tôi có thể giúp bạn:

• 💰 Quản lý thu nhập và chi tiêu
• 📊 Phân tích tài chính cá nhân
• 🏦 Theo dõi khoản vay và nợ
• 📈 Quản lý đầu tư
• 💡 Đưa ra gợi ý tiết kiệm

Hãy hỏi tôi bất cứ điều gì về tài chính nhé! 😊`;
        }
        // Bot introduction
        else if (lowerMessage.includes('bạn là ai') || lowerMessage.includes('giới thiệu')) {
            response = `🤖 Tôi là VanLangBot - trợ lý tài chính AI thông minh!

✨ **Khả năng của tôi:**
• 📊 Phân tích dữ liệu tài chính chi tiết
• 💡 Đưa ra gợi ý thông minh về quản lý tiền
• 🧮 Tính toán lãi suất, ROI, dự đoán xu hướng
• 🏦 Hỗ trợ quản lý khoản vay và đầu tư
• 📈 So sánh và phân tích theo thời gian

🎯 **Mục tiêu:** Giúp bạn quản lý tài chính hiệu quả và đạt được mục tiêu tài chính cá nhân!

Tôi được phát triển bởi đội ngũ VanLang Budget với công nghệ AI tiên tiến. Hãy thử hỏi tôi về tình hình tài chính của bạn! 💪`;
        }
        // Time query
        else if (lowerMessage.includes('mấy giờ') || lowerMessage.includes('thời gian')) {
            const now = new Date();
            const vietnamTime = now.toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            response = `🕐 **Thời gian hiện tại tại Việt Nam:**

${vietnamTime}

⏰ Đây là thời gian tốt để:
• Kiểm tra tài chính hàng ngày
• Lập kế hoạch chi tiêu
• Theo dõi mục tiêu tiết kiệm

Bạn có muốn tôi giúp phân tích tình hình tài chính hiện tại không? 📊`;
        }
        // Capability inquiry
        else if (lowerMessage.includes('làm được gì') || lowerMessage.includes('giúp gì') || lowerMessage.includes('chức năng')) {
            response = `🚀 **VanLangBot có thể giúp bạn:**

💰 **Quản lý Thu Chi:**
• Phân tích thu nhập và chi tiêu theo danh mục
• So sánh xu hướng theo tháng/năm
• Đưa ra gợi ý tối ưu hóa ngân sách

📈 **Đầu tư & Tiết kiệm:**
• Theo dõi hiệu quả đầu tư (cổ phiếu, vàng, crypto)
• Tính toán ROI và lợi nhuận
• Gợi ý chiến lược đầu tư

🏦 **Quản lý Nợ:**
• Phân tích tổng khoản vay
• Tính toán lãi suất và kế hoạch trả nợ
• Gợi ý tối ưu hóa việc trả nợ

🧮 **Tính toán Tài chính:**
• Dự đoán chi tiêu tương lai
• Tính toán mục tiêu tiết kiệm
• Phân tích khả năng tài chính

Hãy thử hỏi: "Tổng khoản vay của tôi là bao nhiêu?" hoặc "Phân tích chi tiêu tháng này" 💡`;
        }
        // Farewell
        else if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('tạm biệt') || lowerMessage.includes('bye')) {
            response = `🙏 Cảm ơn bạn đã sử dụng VanLangBot!

✨ Tôi luôn sẵn sàng hỗ trợ bạn 24/7 trong việc quản lý tài chính cá nhân.

💡 **Lời khuyên cuối:** Hãy thường xuyên theo dõi tình hình tài chính để đạt được mục tiêu của mình!

Chúc bạn có một ngày tuyệt vời và thành công trong việc quản lý tài chính! 🌟

Hẹn gặp lại bạn sớm! 👋`;
        }
        // Financial queries - Advanced intent recognition
        else if (lowerMessage.includes('tổng khoản vay') || lowerMessage.includes('khoản vay') || lowerMessage.includes('nợ')) {
            response = `🏦 **Thông tin khoản vay của bạn:**

Để cung cấp thông tin chính xác về khoản vay, tôi cần truy cập dữ liệu từ hệ thống. Hiện tại tôi đang trong chế độ demo.

💡 **Tôi có thể giúp bạn:**
• 📊 Phân tích tổng khoản vay hiện tại
• 🧮 Tính toán lãi suất và kế hoạch trả nợ
• 📈 So sánh các khoản vay khác nhau
• 💰 Gợi ý tối ưu hóa việc trả nợ
• 📋 Lập kế hoạch tài chính để trả nợ sớm

**Hãy thử hỏi cụ thể hơn:**
• "Chi tiết từng khoản vay của tôi"
• "Lãi suất khoản vay nào cao nhất?"
• "Kế hoạch trả nợ tối ưu"`;
        }
        else if (lowerMessage.includes('thu nhập') || lowerMessage.includes('lương') || lowerMessage.includes('income')) {
            response = `💰 **Phân tích thu nhập:**

Tôi có thể giúp bạn phân tích và quản lý thu nhập hiệu quả!

📊 **Các dịch vụ phân tích thu nhập:**
• 📈 Theo dõi xu hướng thu nhập theo tháng
• 🎯 So sánh với mục tiêu đã đặt ra
• 💡 Gợi ý tối ưu hóa nguồn thu nhập
• 📋 Phân loại thu nhập theo nguồn
• � Tính toán thu nhập ròng sau thuế

**Hãy thử hỏi:**
• "Thu nhập tháng này của tôi"
• "So sánh thu nhập tháng này với tháng trước"
• "Phân tích nguồn thu nhập chính"`;
        }
        else if (lowerMessage.includes('chi tiêu') || lowerMessage.includes('chi phí') || lowerMessage.includes('expense')) {
            response = `💸 **Phân tích chi tiêu thông minh:**

Tôi sẽ giúp bạn kiểm soát và tối ưu hóa chi tiêu!

📊 **Dịch vụ phân tích chi tiêu:**
• 🏷️ Phân loại chi tiêu theo danh mục
• 📈 Theo dõi xu hướng chi tiêu
• ⚠️ Cảnh báo chi tiêu vượt ngân sách
• 💡 Gợi ý tiết kiệm thông minh
• 📋 So sánh chi tiêu theo thời gian

**Ví dụ câu hỏi:**
• "Chi tiêu tháng này như thế nào?"
• "Danh mục nào tôi chi nhiều nhất?"
• "Gợi ý giảm chi tiêu"`;
        }
        else if (lowerMessage.includes('đầu tư') || lowerMessage.includes('investment') || lowerMessage.includes('cổ phiếu')) {
            response = `📈 **Quản lý đầu tư thông minh:**

Tôi sẽ hỗ trợ bạn theo dõi và phân tích hiệu quả đầu tư!

💼 **Dịch vụ đầu tư:**
• 📊 Theo dõi danh mục đầu tư
• 🧮 Tính toán ROI và lợi nhuận
• 📈 Phân tích xu hướng thị trường
• ⚖️ Đánh giá rủi ro đầu tư
• 💡 Gợi ý chiến lược đầu tư

**Loại đầu tư được hỗ trợ:**
• 🏢 Cổ phiếu (VN30, HNX...)
• 🏠 Bất động sản
• 🏦 Tiết kiệm ngân hàng
• 💰 Vàng và kim loại quý

**Hãy hỏi:**
• "Hiệu quả đầu tư của tôi"
• "Phân tích danh mục đầu tư"`;
        }
        else if (lowerMessage.includes('tiết kiệm') || lowerMessage.includes('saving') || lowerMessage.includes('mục tiêu')) {
            response = `💎 **Kế hoạch tiết kiệm thông minh:**

Tôi sẽ giúp bạn xây dựng kế hoạch tiết kiệm hiệu quả!

🎯 **Dịch vụ tiết kiệm:**
• 📊 Phân tích khả năng tiết kiệm
• 🎯 Thiết lập mục tiêu tiết kiệm
• 📈 Theo dõi tiến độ tiết kiệm
• 💡 Gợi ý tối ưu hóa tiết kiệm
• 🧮 Tính toán thời gian đạt mục tiêu

**Ví dụ mục tiêu:**
• 🏠 Mua nhà, đất
• 🚗 Mua xe
• 🎓 Học phí con em
• 🏖️ Du lịch, nghỉ dưỡng
• 💰 Quỹ khẩn cấp

**Hãy thử:**
• "Tôi muốn tiết kiệm 100 triệu"
• "Kế hoạch tiết kiệm mua nhà"`;
        }
        // Default response - More helpful
        else {
            response = `🤖 **Xin chào! Tôi là VanLangBot - trợ lý tài chính AI của bạn!**

🎯 **Bạn có thể hỏi tôi về:**
• 💰 **Thu nhập và chi tiêu** của bạn
• 🏦 **Tình hình khoản vay và nợ**
• 📈 **Hiệu quả đầu tư**
• 💎 **Kế hoạch tiết kiệm**
• 📊 **Phân tích tài chính**

⭐ **Ví dụ câu hỏi:**
• "Tổng khoản vay của tôi là bao nhiêu?"
• "Chi tiêu tháng này như thế nào?"
• "Phân tích đầu tư của tôi"
• "Tôi có thể tiết kiệm bao nhiêu?"
• "Thu nhập tháng này ra sao?"

💡 **Mẹo:** Hãy hỏi cụ thể để tôi có thể hỗ trợ bạn tốt nhất!

Bạn muốn bắt đầu với chủ đề nào? 😊`;
        }

        return NextResponse.json({
            success: true,
            response,
            timestamp: new Date().toISOString(),
            intent: 'detected',
            confidence: 0.95
        });

    } catch (error) {
        console.error('Chatbot API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
