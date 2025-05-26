import { NlpManager } from 'node-nlp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Helper để lấy đường dẫn thư mục hiện tại trong ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NLPService {
    constructor() {
        this.manager = new NlpManager({
            languages: ['vi'],
            forceNER: true,
            nlu: {
                log: false // Tắt log chi tiết của NLU trong quá trình xử lý
            }
        });
        this.isModelTrained = false;
        this._initializeAndTrainModel();
    }

    async _initializeAndTrainModel() {
        try {
            const modelPath = path.join(__dirname, 'nlp-model.nlp'); // Đường dẫn lưu model
            const trainingDataPath = path.join(__dirname, 'training-data.json'); // Đường dẫn file training data

            if (fs.existsSync(modelPath)) {
                console.log('NLPService: Loading pre-trained model...');
                await this.manager.load(modelPath);
                this.isModelTrained = true;
                console.log('✅ NLPService: Pre-trained model loaded successfully.');
            } else if (fs.existsSync(trainingDataPath)) {
                console.log('NLPService: Training data found. Training new NLP model...');
                const trainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf-8'));

                trainingData.forEach(data => {
                    if (data.intent && data.utterances && Array.isArray(data.utterances)) {
                        data.utterances.forEach(utterance => {
                            this.manager.addDocument('vi', utterance, data.intent);
                        });
                    }
                    // Answers không bắt buộc phải có nếu chúng ta không dùng chức năng addAnswer của node-nlp trực tiếp cho chatbot response
                    if (data.intent && data.answers && Array.isArray(data.answers)) {
                        data.answers.forEach(answer => {
                            this.manager.addAnswer('vi', data.intent, answer);
                        });
                    }
                });

                await this.manager.train();
                console.log('NLPService: Model training completed.');
                this.manager.save(modelPath);
                console.log(`✅ NLPService: Model saved to ${modelPath}`);
                this.isModelTrained = true;
            } else {
                console.error(`NLPService Error: Training data file not found at ${trainingDataPath}. NLP Service will not function correctly.`);
            }
        } catch (error) {
            console.error('NLPService Error during model initialization/training:', error);
            // Trong trường hợp lỗi, isModelTrained sẽ vẫn là false
        }
    }

    async analyzeIntent(message) {
        if (!this.isModelTrained) {
            console.warn('NLPService: Model not trained or loaded. Returning default unknown intent.');
            return {
                intent: 'unknown',
                confidence: 0,
                language: 'vi', // Giả định
                score: 0,
                entities: [],
                processedMessage: message,
                details: { error: 'Model not available' }
            };
        }

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return {
                intent: 'unknown',
                confidence: 0,
                language: 'vi',
                score: 0,
                entities: [],
                processedMessage: message,
                details: { error: 'Invalid message' }
            };
        }

        try {
            const result = await this.manager.process('vi', message.toLowerCase().trim());

            // Chuyển đổi cấu trúc của node-nlp cho phù hợp với mong đợi của ChatbotController (nếu cần)
            // Hoặc ChatbotController sẽ cần được cập nhật để làm việc với cấu trúc của node-nlp
            return {
                intent: result.intent || 'unknown', // `result.intent` là intent có score cao nhất
                confidence: result.score || 0, // `result.score` là confidence của intent đó
                language: result.language || 'vi',
                score: result.score || 0, // Có thể dùng classification[0].score nếu muốn điểm của intent chính xác nhất
                // categories: result.classifications?.map(c => c.intent), // node-nlp trả về classifications
                // categoryScores: result.classifications?.reduce((obj, item) => { obj[item.intent] = item.score; return obj; }, {}),
                entities: result.entities || [], // NER entities
                queryType: result.intent, // Tạm thời gán queryType bằng intent, có thể tùy chỉnh sau
                timePeriod: null, // Cần logic riêng để trích xuất timePeriod nếu dùng node-nlp
                processedMessage: result.utterance, // Câu đã được xử lý bởi NLP
                classifications: result.classifications, // Để debug
                details: {}
            };
        } catch (error) {
            console.error('NLPService: Error processing message:', error);
            return {
                intent: 'unknown',
                confidence: 0,
                language: 'vi',
                score: 0,
                entities: [],
                processedMessage: message,
                details: { error: 'Error during NLP processing' }
            };
        }
    }

    // (Các hàm khác như normalizeVietnamese, detectLanguage, isBlockedContent, generateHash, analyzeSentiment, enhanceResponse, getStats có thể bị loại bỏ hoặc viết lại nếu cần)
    // Hiện tại, chúng sẽ không còn tác dụng với NlpManager.
}

export default NLPService;