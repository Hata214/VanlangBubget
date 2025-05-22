const express = require('express');
const router = express.Router();
// Điều chỉnh đường dẫn import middleware cho phù hợp với vị trí mới
const authenticateToken = require('../../middlewares/authenticateToken');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Khởi tạo Gemini AI Client với API Key từ biến môi trường
if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not defined in environment variables.');
    // Trong môi trường production, bạn có thể muốn dừng server nếu key không có
    // process.exit(1); 
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === START: Intent Classification Logic ===
const ALLOWED_KEYWORDS_VANLANGBOT = {
    greetings: ['chào', 'xin chào', 'hello', 'hi', 'hey', 'chào bạn', 'chào bot', 'vanlangbot'],
    aboutBot: ['bạn là ai', 'bạn làm gì', 'giúp gì', 'chức năng', 'khả năng', 'thông tin về bạn'],
    generalFinance: ['tài chính', 'tiền nong', 'quản lý tiền', 'ngân sách', 'thu nhập', 'chi tiêu', 'tiết kiệm', 'nợ', 'vay', 'khoản vay', 'lãi suất', 'thẻ tín dụng', 'tài khoản', 'giao dịch'],
    investmentsApp: ['đầu tư', 'cổ phiếu', 'vàng', 'tiền điện tử', 'tiết kiệm', 'danh mục', 'lợi nhuận', 'rủi ro', 'phân tích'], // Giả định ứng dụng hỗ trợ các mục này
    // Thêm các chủ đề/từ khóa khác nếu ứng dụng VanLang Budget có
};

// Các chủ đề không liên quan trực tiếp đến quản lý tài chính cá nhân trong ứng dụng
const BLOCKED_KEYWORDS_VANLANGBOT = {
    offTopicGeneral: ['thời tiết', 'tin tức', 'thể thao', 'phim ảnh', 'du lịch', 'nấu ăn', 'sức khỏe', 'y tế', 'giáo dục', 'lịch sử', 'khoa học'],
    sensitive: ['chính trị', 'tôn giáo', 'sex', 'bạo lực', 'chửi thề', 'xúc phạm'],
};

function isVanLangBotAllowedTopic(message) {
    const lowerMessage = message.toLowerCase().trim();

    if (!lowerMessage) return false; // Tin nhắn rỗng

    // 1. Luôn cho phép lời chào
    if (ALLOWED_KEYWORDS_VANLANGBOT.greetings.some(g => lowerMessage.includes(g))) {
        console.log(`Chatbot Intent: Detected greeting - \"${lowerMessage}\"`);
        return true;
    }

    // 2. Luôn cho phép câu hỏi về bot
    if (ALLOWED_KEYWORDS_VANLANGBOT.aboutBot.some(g => lowerMessage.includes(g))) {
        console.log(`Chatbot Intent: Detected question about bot - \"${lowerMessage}\"`);
        return true;
    }

    // 3. Kiểm tra từ khóa bị chặn
    for (const category in BLOCKED_KEYWORDS_VANLANGBOT) {
        if (BLOCKED_KEYWORDS_VANLANGBOT[category].some(keyword => lowerMessage.includes(keyword))) {
            console.log(`Chatbot Intent: Detected blocked keyword in \"${lowerMessage}\" (category: ${category})`);
            return false;
        }
    }

    // 4. Kiểm tra từ khóa được cho phép (liên quan đến tài chính trong app)
    for (const category in ALLOWED_KEYWORDS_VANLANGBOT) {
        if (category === 'greetings' || category === 'aboutBot') continue; // Đã kiểm tra ở trên
        if (ALLOWED_KEYWORDS_VANLANGBOT[category].some(keyword => lowerMessage.includes(keyword))) {
            console.log(`Chatbot Intent: Detected allowed financial keyword in \"${lowerMessage}\" (category: ${category})`);
            return true;
        }
    }

    // 5. Nếu không khớp các điều trên, và câu hỏi có vẻ không rõ ràng hoặc quá ngắn, có thể từ chối hoặc yêu cầu làm rõ
    // Tạm thời, nếu không khớp các điều trên, coi là không thuộc phạm vi
    console.log(`Chatbot Intent: Message \"${lowerMessage}\" did not match allowed financial topics or greetings/aboutBot.`);
    return false;
}
// === END: Intent Classification Logic ===


// === START: Response Formatting Logic ===
function formatVanLangBotResponse(text) {
    if (!text || typeof text !== 'string') return "Xin lỗi, tôi chưa có phản hồi cho bạn lúc này.";

    let formattedText = text;
    // Các bước format cơ bản, có thể mở rộng thêm
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '$1'); // Bỏ **bold** nhưng giữ lại nội dung
    formattedText = formattedText.replace(/\*(.*?)\*/g, '$1');   // Bỏ *italic* nhưng giữ lại nội dung
    formattedText = formattedText.replace(/```[\s\S]*?```/g, ''); // Loại bỏ các khối code nếu có

    // Chuẩn hóa khoảng trắng và xuống dòng
    formattedText = formattedText.split('\\n').map(line => line.trim()).filter(line => line.length > 0).join('\\n');
    formattedText = formattedText.replace(/\\n+/g, '\\n').trim();

    return formattedText;
}
// === END: Response Formatting Logic ===


// Placeholder: Hàm này cần được bạn triển khai để lấy dữ liệu tài chính từ MongoDB
async function getUserFinancialData(userId) {
    console.log(`Chatbot: Attempting to fetch financial data for userId: ${userId}`);
    // TODO: Truy vấn CSDL (ví dụ: MongoDB) để lấy dữ liệu tài chính của người dùng.
    //       Hàm này nên trả về một object chứa dữ liệu hoặc null/undefined nếu không có.
    const mockFinancialData = {
        incomeThisMonth: Math.floor(Math.random() * 10000000) + 20000000,
        expensesThisMonth: {
            food: Math.floor(Math.random() * 2000000) + 3000000,
            transportation: Math.floor(Math.random() * 1000000) + 500000,
            shopping: Math.floor(Math.random() * 1500000) + 1000000,
            utilities: Math.floor(Math.random() * 500000) + 500000,
        },
        totalSavings: Math.floor(Math.random() * 50000000) + 50000000,
        investments: [
            { type: 'cổ phiếu', name: 'VinGroup (VIC)', value: Math.floor(Math.random() * 10000000) + 15000000 },
            { type: 'vàng', quantity: `${Math.floor(Math.random() * 5) + 1} chỉ SJC`, value: Math.floor(Math.random() * 10000000) + 25000000 },
            { type: 'tiền điện tử', name: 'Bitcoin (BTC)', value: Math.floor(Math.random() * 5000000) + 5000000 },
        ],
        activeBudgets: [
            { category: 'Ăn uống', limit: 6000000, spent: 4500000 },
            { category: 'Giải trí', limit: 2000000, spent: 1000000 },
        ]
    };
    // console.log(`Chatbot: Returning mock financial data for userId: ${userId}`, mockFinancialData);
    return mockFinancialData;
}

const systemInstructionText = `Bạn là VanLangBot, một trợ lý tài chính thông minh và thân thiện của ứng dụng VanLang Budget.
Nhiệm vụ của bạn là HỖ TRỢ người dùng quản lý tài chính cá nhân của họ một cách hiệu quả ngay trong ứng dụng.
LUÔN LUÔN giữ thái độ lịch sự, tích cực và hữu ích.
CHỈ trả lời các câu hỏi liên quan trực tiếp đến:
- Tình hình thu nhập, chi tiêu, ngân sách cá nhân dựa trên dữ liệu được cung cấp (nếu có).
- Các loại hình đầu tư được quản lý trong ứng dụng VanLang Budget (ví dụ: cổ phiếu, vàng, tiền điện tử, tiết kiệm).
- Phân tích xu hướng tài chính cá nhân của người dùng.
- Đưa ra các gợi ý thông minh về cách tiết kiệm, lập ngân sách, hoặc các mẹo quản lý tài chính cá nhân nói chung.
- Trả lời các câu hỏi về chức năng của chính bạn (VanLangBot).

QUY TẮC QUAN TRỌNG:
1.  TỪ CHỐI dứt khoát và lịch sự MỌI câu hỏi không liên quan đến các chủ đề trên. Khi từ chối, hãy nói: "Tôi xin lỗi, tôi chỉ có thể hỗ trợ các câu hỏi liên quan đến quản lý tài chính cá nhân trong ứng dụng VanLang Budget." hoặc một câu tương tự. KHÔNG cố gắng trả lời các chủ đề ngoài lề.
2.  Nếu người dùng hỏi về thông tin tài chính cá nhân của họ (ví dụ: "Thu nhập của tôi là bao nhiêu?") VÀ bạn được cung cấp dữ liệu ("Dữ liệu tài chính tham khảo của người dùng"), hãy SỬ DỤNG dữ liệu đó để trả lời một cách tự nhiên và chính xác.
3.  Nếu người dùng hỏi về thông tin tài chính cá nhân mà bạn KHÔNG có dữ liệu hoặc dữ liệu không đủ, hãy thông báo rõ ràng rằng bạn không tìm thấy thông tin đó cho họ, ví dụ: "Hiện tại tôi không tìm thấy thông tin về [hạng mục A] của bạn." hoặc "Tôi chưa có dữ liệu về [B] để cung cấp cho bạn." KHÔNG được tự bịa đặt số liệu.
4.  KHÔNG đưa ra lời khuyên đầu tư mang tính chất pháp lý, cam kết lợi nhuận, hoặc các nhận định thị trường quá chi tiết và chuyên sâu. Chỉ cung cấp thông tin, phân tích cơ bản và gợi ý dựa trên kiến thức chung và dữ liệu trong ứng dụng (nếu có).
5.  KHÔNG tiết lộ bất kỳ thông tin nào về cách bạn hoạt động, công nghệ nền tảng (Gemini AI), hoặc chi tiết kỹ thuật của ứng dụng VanLang Budget.
6.  Khi trả lời, hãy cố gắng ngắn gọn, đi thẳng vào vấn đề, và dễ hiểu. Sử dụng định dạng gạch đầu dòng nếu cần liệt kê nhiều mục.
7.  Nếu câu hỏi của người dùng quá mơ hồ hoặc không đủ thông tin, hãy lịch sự yêu cầu họ cung cấp thêm chi tiết.`;

// Sửa đường dẫn route, bỏ /api
router.post('/chatbot', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Message is required and must be a non-empty string.' });
        }
        if (!userId) {
            console.error('Chatbot API: User ID not found after authentication.', { user: req.user });
            return res.status(401).json({ success: false, error: 'User authentication failed.' });
        }

        // --- Intent Classification ---
        if (!isVanLangBotAllowedTopic(message)) {
            return res.json({
                success: true,
                response: "Tôi xin lỗi, tôi chỉ có thể hỗ trợ các câu hỏi liên quan đến quản lý tài chính cá nhân trong ứng dụng VanLang Budget."
            });
        }
        // --- End Intent Classification ---

        let financialContext = "";
        try {
            const financialData = await getUserFinancialData(userId);
            if (financialData && Object.keys(financialData).length > 0) {
                let summaryParts = [];
                if (financialData.incomeThisMonth) summaryParts.push(`- Thu nhập tháng này của người dùng là: ${financialData.incomeThisMonth.toLocaleString('vi-VN')} VND.`);
                if (financialData.expensesThisMonth && Object.keys(financialData.expensesThisMonth).length > 0) {
                    let expenseDetails = Object.entries(financialData.expensesThisMonth)
                        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.toLocaleString('vi-VN')} VND`)
                        .join(', ');
                    if (expenseDetails) summaryParts.push(`- Chi tiêu tháng này (một số hạng mục): ${expenseDetails}.`);
                }
                if (financialData.totalSavings) summaryParts.push(`- Tổng tiết kiệm hiện có: ${financialData.totalSavings.toLocaleString('vi-VN')} VND.`);
                if (financialData.investments && financialData.investments.length > 0) {
                    let investmentDetails = financialData.investments
                        .map(inv => `${inv.type} (${inv.name || inv.quantity}): khoảng ${inv.value.toLocaleString('vi-VN')} VND`)
                        .join('; ');
                    if (investmentDetails) summaryParts.push(`- Các khoản đầu tư chính: ${investmentDetails}.`);
                }
                if (financialData.activeBudgets && financialData.activeBudgets.length > 0) {
                    let budgetDetails = financialData.activeBudgets
                        .map(b => `Ngân sách ${b.category}: đã chi ${b.spent.toLocaleString('vi-VN')}/${b.limit.toLocaleString('vi-VN')} VND`)
                        .join('; ');
                    if (budgetDetails) summaryParts.push(`- Tình hình một số ngân sách: ${budgetDetails}.`);
                }

                if (summaryParts.length > 0) {
                    financialContext = `\\n\\nThông tin tài chính hiện tại của người dùng (dùng để tham khảo nếu câu hỏi có liên quan trực tiếp):\n${summaryParts.join('\\n')}`;
                } else {
                    financialContext = "\\n\\n(Không có dữ liệu tài chính chi tiết nào của người dùng được cung cấp cho phiên chat này.)";
                }
            } else {
                financialContext = "\\n\\n(Không tìm thấy dữ liệu tài chính của người dùng cho phiên chat này.)";
            }
        } catch (dbError) {
            console.error(`Chatbot API: Error fetching user financial data for userId ${userId}:`, dbError);
            financialContext = "\\n\\n(Lưu ý: Đã có lỗi khi truy xuất dữ liệu tài chính. Câu trả lời có thể không dựa trên thông tin cá nhân của bạn.)";
        }

        const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash"; // Đổi model mặc định ở đây
        const model = genAI.getGenerativeModel({
            model: modelName, // Sử dụng biến modelName
            systemInstruction: { parts: [{ text: systemInstructionText }] },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
            generationConfig: { // Có thể điều chỉnh các thông số này qua biến môi trường nếu muốn
                temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
                topK: parseInt(process.env.GEMINI_TOP_K) || undefined, // undefined để dùng giá trị mặc định của model
                topP: parseInt(process.env.GEMINI_TOP_P) || undefined,
                maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1024,
            },
        });

        const chat = model.startChat({
            history: [], // Sẽ được cập nhật ở tính năng "Lịch sử hội thoại"
        });

        // Chỉ bao gồm ngữ cảnh tài chính nếu câu hỏi có vẻ liên quan đến dữ liệu cá nhân
        // Logic này có thể cần tinh chỉnh thêm
        let userMessageForGemini = `Câu hỏi từ người dùng: "${message}"`;
        const financialKeywordsInQuery = ['của tôi', 'của bạn', 'tôi có', 'hiện tại', 'tháng này', 'tháng trước', 'tài khoản', 'thu nhập', 'chi tiêu', 'tiết kiệm', 'đầu tư', 'ngân sách'];
        if (financialKeywordsInQuery.some(kw => message.toLowerCase().includes(kw))) {
            userMessageForGemini += financialContext;
        } else {
            userMessageForGemini += "\\n\\n(Nếu câu hỏi không yêu cầu thông tin tài chính cá nhân cụ thể, không cần tham chiếu đến dữ liệu người dùng đã cung cấp ở trên.)"
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`Chatbot API: Sending to Gemini for userId ${userId}. Model: ${modelName}. Payload:`, userMessageForGemini);
        }

        const result = await chat.sendMessageStream(userMessageForGemini);

        let accumulatedText = "";
        for await (const chunk of result.stream) {
            if (chunk && typeof chunk.text === 'function') {
                accumulatedText += chunk.text();
            } else {
                console.warn("Chatbot API: Received a chunk without a text function or undefined chunk.", chunk);
            }
        }

        const fullResponse = await result.response;
        if (fullResponse.promptFeedback && fullResponse.promptFeedback.blockReason) {
            console.warn('Chatbot API: Prompt was blocked by Gemini.', {
                reason: fullResponse.promptFeedback.blockReason,
                ratings: fullResponse.promptFeedback.safetyRatings,
            });
            const blockMessage = `Yêu cầu của bạn không thể được xử lý vì lý do an toàn nội dung (${fullResponse.promptFeedback.blockReason}). Vui lòng thử lại với một câu hỏi khác.`;
            return res.json({ success: true, response: blockMessage });
        }

        if (!accumulatedText && (!fullResponse.candidates || fullResponse.candidates.length === 0 || !fullResponse.candidates[0].content)) {
            console.warn('Chatbot API: Gemini did not return any content.', { response: fullResponse });
            accumulatedText = "Xin lỗi, tôi chưa thể đưa ra câu trả lời cho câu hỏi này. Bạn có thể thử hỏi cách khác được không?";
        }

        const formattedResponse = formatVanLangBotResponse(accumulatedText);

        if (process.env.NODE_ENV === 'development') {
            console.log(`Chatbot API: Received from Gemini for userId ${userId}. Formatted response:`, formattedResponse);
        }

        res.json({ success: true, response: formattedResponse });

    } catch (error) {
        console.error('Chatbot API: Unhandled error in POST /chatbot route:', error);
        let errorMessage = 'Đã có lỗi xảy ra từ phía máy chủ khi xử lý yêu cầu chatbot của bạn.';
        if (error.message) {
            if (error.message.includes('API key not valid')) {
                errorMessage = 'Lỗi cấu hình hệ thống: API key không hợp lệ.';
            } else if (error.message.toLowerCase().includes('model') && error.message.toLowerCase().includes('not found')) {
                errorMessage = `Lỗi cấu hình: Model Gemini được yêu cầu không tồn tại hoặc không thể truy cập. (${modelName || 'Model không xác định'})`;
            } else if (error.message.toLowerCase().includes('deadline exceeded') || error.message.toLowerCase().includes('timeout')) {
                errorMessage = 'Yêu cầu xử lý mất quá nhiều thời gian và đã bị hủy. Vui lòng thử lại.';
            }
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

module.exports = router; 