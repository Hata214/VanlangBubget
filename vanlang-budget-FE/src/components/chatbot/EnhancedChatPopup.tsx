'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { X, Bot, Send, Mic, MicOff, Volume2, VolumeX, Settings, RotateCcw } from 'lucide-react';

// Import hooks
import { useAppSelector } from '@/redux/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';

// === LEGACY CHATBOT SUPPORT ===
// Hỗ trợ cả enhanced chatbot và legacy chatbot trong cùng một component

interface Message {
    id: string;
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
    metadata?: {
        intent?: string;
        confidence?: number;
        cached?: boolean;
        responseTime?: number;
    };
}

interface ChatState {
    isOpen: boolean;
    isLoading: boolean;
    isTyping: boolean;
    language: 'vi' | 'en';
    voiceEnabled: boolean;
    soundEnabled: boolean;
    darkMode: boolean;
}

interface EnhancedChatPopupProps {
    mode?: 'enhanced' | 'legacy'; // Chọn giữa enhanced và legacy chatbot
    useEnhanced?: boolean; // Backward compatibility
}

export default function EnhancedChatPopup({
    mode = 'enhanced',
    useEnhanced = true
}: EnhancedChatPopupProps = {}) {
    // State management
    const [chatState, setChatState] = useState<ChatState>({
        isOpen: false,
        isLoading: false,
        isTyping: false,
        language: 'vi',
        voiceEnabled: false,
        soundEnabled: true,
        darkMode: false
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Auth hooks
    const reduxAuthState = useAppSelector((state) => state.auth);
    const authContextData = useAuth();
    const { data: session, status: sessionStatus } = useSession();

    // Welcome message với multilingual support và random POST examples
    const getWelcomeMessage = useCallback((lang: 'vi' | 'en') => {
        // Random POST examples for Vietnamese
        const viPostExamples = [
            'Tôi nhận lương 15 triệu',
            'Mua cà phê 50k',
            'Được thưởng 2 triệu',
            'Chi tiêu ăn uống 200k',
            'Kiếm được 500k freelance',
            'Trả tiền điện 300k',
            'Vay ngân hàng 5 triệu',
            'Tôi mua quần áo 800k',
            'Tiết kiệm được 1 triệu',
            'Tốn 150k đi taxi'
        ];

        // Random POST examples for English
        const enPostExamples = [
            'I received salary 15 million',
            'Bought coffee 50k',
            'Got bonus 2 million',
            'Food expenses 200k',
            'Earned 500k freelance',
            'Paid electricity 300k',
            'Bank loan 5 million',
            'I bought clothes 800k',
            'Saved 1 million',
            'Spent 150k taxi'
        ];

        // Get 3 random examples
        const getRandomExamples = (examples: string[], count: number) => {
            const shuffled = [...examples].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };

        const randomViExamples = getRandomExamples(viPostExamples, 3);
        const randomEnExamples = getRandomExamples(enPostExamples, 3);

        const messages = {
            vi: `👋 Xin chào! Tôi là VanLangBot v2 - trợ lý tài chính AI thế hệ mới!

🌟 Tính năng nâng cao:
💰 Thêm giao dịch bằng ngôn ngữ tự nhiên
📊 Phân tích tài chính thông minh
🔍 Truy vấn dữ liệu chi tiết
🤖 Tư vấn tài chính cá nhân hóa

💡 Thử ngay - Ví dụ thêm dữ liệu:
• "${randomViExamples[0]}"
• "${randomViExamples[1]}"
• "${randomViExamples[2]}"

📊 Hoặc hỏi:
• "Thu nhập tháng này"
• "Phân tích chi tiêu"
• "Số dư của tôi"

Hãy thử ngay! 🚀`,
            en: `👋 Hello! I'm VanLangBot v2 - your next-generation AI financial assistant!

🌟 Advanced features:
💰 Add transactions with natural language
📊 Smart financial analysis
🔍 Detailed data queries
🤖 Personalized financial advice

💡 Try now - Add data examples:
• "${randomEnExamples[0]}"
• "${randomEnExamples[1]}"
• "${randomEnExamples[2]}"

📊 Or ask:
• "This month's income"
• "Analyze expenses"
• "My balance"

Give it a try! 🚀`
        };
        return messages[lang];
    }, []);

    // Initialize welcome message when language changes
    useEffect(() => {
        if (isAuthenticated && messages.length === 0) {
            setMessages([{
                id: 'welcome-' + Date.now(),
                role: 'bot',
                content: getWelcomeMessage(chatState.language),
                timestamp: new Date()
            }]);
        }
    }, [isAuthenticated, chatState.language, messages.length, getWelcomeMessage]);

    // Auth logic (similar to original but cleaner)
    useEffect(() => {
        let finalToken: string | null = null;
        let finalIsAuthenticated = false;

        // Priority 1: Redux Auth
        if (reduxAuthState?.isAuthenticated && reduxAuthState?.token) {
            finalToken = typeof reduxAuthState.token === 'string' ?
                reduxAuthState.token : (reduxAuthState.token as any)?.accessToken;
            finalIsAuthenticated = true;
        }

        // Priority 2: AuthContext
        if (!finalIsAuthenticated && authContextData?.isAuthenticated && authContextData?.accessToken) {
            finalToken = authContextData.accessToken;
            finalIsAuthenticated = true;
        }

        // Priority 3: NextAuth Session
        if (!finalIsAuthenticated && sessionStatus === 'authenticated' && session?.user) {
            finalToken = (session as any).accessToken || (session.user as any).token;
            if (finalToken) finalIsAuthenticated = true;
        }

        // Priority 4: LocalStorage fallback
        if (!finalIsAuthenticated) {
            const adminToken = localStorage.getItem('token');
            const userRole = localStorage.getItem('user_role');
            if (adminToken && userRole) {
                finalToken = adminToken;
                finalIsAuthenticated = true;
            }
        }

        setAuthToken(finalToken);
        setIsAuthenticated(finalIsAuthenticated);
    }, [reduxAuthState, authContextData, session, sessionStatus]);

    // Auto scroll to bottom
    useEffect(() => {
        if (chatState.isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, chatState.isOpen]);

    // Voice recognition setup
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = chatState.language === 'vi' ? 'vi-VN' : 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsRecording(false);
            };

            recognitionRef.current.onerror = () => {
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, [chatState.language]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K to toggle chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleChat();
            }

            // Escape to close chat
            if (e.key === 'Escape' && chatState.isOpen) {
                toggleChat();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [chatState.isOpen]);

    // Sound effects
    const playSound = (type: 'send' | 'receive' | 'error') => {
        if (!chatState.soundEnabled || !audioRef.current) return;

        // Tạm thời tắt sound effects để tránh lỗi 404
        // TODO: Thêm file âm thanh thực tế vào public/sounds/
        // return; // BỎ COMMENT DÒNG NÀY NẾU MUỐN TẮT ÂM THANH

        const sounds = {
            send: '/sounds/send.mp3',
            receive: '/sounds/receive.mp3',
            error: '/sounds/error.mp3'
        };

        audioRef.current.src = sounds[type];
        audioRef.current.play().catch((err) => {
            console.warn('Error playing sound:', err);
        });
    };

    // Toggle functions
    const toggleChat = () => {
        setChatState(prev => ({ ...prev, isOpen: !prev.isOpen }));
        if (!chatState.isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    };

    const toggleLanguage = () => {
        setChatState(prev => ({
            ...prev,
            language: prev.language === 'vi' ? 'en' : 'vi'
        }));
    };

    const toggleVoice = () => {
        setChatState(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
    };

    const toggleSound = () => {
        setChatState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
    };

    const clearChat = () => {
        setMessages([{
            id: 'welcome-' + Date.now(),
            role: 'bot',
            content: getWelcomeMessage(chatState.language),
            timestamp: new Date()
        }]);
    };

    // Voice recording
    const startRecording = () => {
        if (recognitionRef.current && !isRecording) {
            setIsRecording(true);
            recognitionRef.current.start();
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
        }
    };

    // Enhanced send message with better error handling
    const sendMessage = async () => {
        if (!input.trim() || !authToken || chatState.isLoading) return;

        const userMessage: Message = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setChatState(prev => ({ ...prev, isLoading: true, isTyping: true }));
        playSound('send');

        // Xác định isLegacyMode dựa trên props của component
        const currentModeIsLegacy = mode === 'legacy' || !useEnhanced; // mode và useEnhanced là props của EnhancedChatPopup

        const requestBodyToNextJsApi = {
            message: userMessage.content,
            language: chatState.language, // Lấy từ state của component
            useEnhanced: !currentModeIsLegacy // Gửi cờ này, nếu mode là enhanced thì useEnhanced là true
        };

        try {
            // Đảm bảo gọi đúng endpoint của Next.js API Route
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch('/api/chatbot', { // URL này trỏ đến Next.js API route
                method: 'POST',
                headers: headers, // SỬ DỤNG HEADERS ĐÃ CÓ AUTH TOKEN
                body: JSON.stringify(requestBodyToNextJsApi)
            });

            // Log thêm ở đây để debug phía client nếu cần
            // console.log('EnhancedChatPopup: Response status from /api/chatbot:', response.status);
            const data = await response.json();
            // console.log('EnhancedChatPopup: Data from /api/chatbot:', data);

            // Simulate typing delay
            setTimeout(() => {
                setChatState(prev => ({ ...prev, isTyping: false }));

                if (!response.ok || !data.success) {
                    const errorMessage: Message = {
                        id: 'error-' + Date.now(),
                        role: 'bot',
                        content: data.error || (chatState.language === 'vi' ?
                            'Đã có lỗi xảy ra. Vui lòng thử lại.' :
                            'An error occurred. Please try again.'),
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    playSound('error');
                } else {
                    const botMessage: Message = {
                        id: 'bot-' + Date.now(),
                        role: 'bot',
                        content: data.response,
                        timestamp: new Date(),
                        metadata: data.metadata
                    };
                    setMessages(prev => [...prev, botMessage]);
                    playSound('receive');

                    // Text-to-speech for bot responses
                    if (chatState.voiceEnabled && 'speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(data.response);
                        utterance.lang = chatState.language === 'vi' ? 'vi-VN' : 'en-US';
                        utterance.rate = 0.9;
                        speechSynthesis.speak(utterance);
                    }
                }
            }, 1000 + Math.random() * 1000); // 1-2s typing simulation

        } catch (error) {
            setChatState(prev => ({ ...prev, isTyping: false }));
            const errorMessage: Message = {
                id: 'error-' + Date.now(),
                role: 'bot',
                content: chatState.language === 'vi' ?
                    'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.' :
                    'Unable to connect to server. Please check your network connection.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            playSound('error');
        } finally {
            setChatState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Typing indicator component
    const TypingIndicator = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 px-4 py-2"
        >
            <div className="bg-white dark:bg-gray-700 rounded-xl px-4 py-2 shadow-sm">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        </motion.div>
    );

    // Settings panel
    const SettingsPanel = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 w-64 z-10"
        >
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
                {chatState.language === 'vi' ? 'Cài đặt' : 'Settings'}
            </h3>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {chatState.language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleLanguage}
                        className="text-xs"
                    >
                        {chatState.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
                    </Button>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {chatState.language === 'vi' ? 'Giọng nói' : 'Voice'}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleVoice}
                        className={chatState.voiceEnabled ? 'bg-blue-50' : ''}
                    >
                        {chatState.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {chatState.language === 'vi' ? 'Âm thanh' : 'Sound'}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleSound}
                        className={chatState.soundEnabled ? 'bg-blue-50' : ''}
                    >
                        {chatState.soundEnabled ? '🔊' : '🔇'}
                    </Button>
                </div>

                <div className="pt-2 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={clearChat}
                        className="w-full justify-center"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {chatState.language === 'vi' ? 'Xóa hội thoại' : 'Clear Chat'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );

    if (!isAuthenticated) return null;

    return (
        <>
            {/* Audio element for sound effects */}
            <audio ref={audioRef} preload="none" />

            {/* Chat bubble position */}
            <div className="fixed bottom-5 right-5 z-[1000]">
                {/* Chat button */}
                {!chatState.isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            onClick={toggleChat}
                            className="rounded-full w-16 h-16 p-0 shadow-xl bg-gradient-to-br from-purple-600 via-blue-600 to-blue-500 hover:from-purple-700 hover:via-blue-700 hover:to-blue-600 text-white transition-all duration-300 relative"
                            aria-label={chatState.language === 'vi' ? 'Mở VanLangBot' : 'Open VanLangBot'}
                        >
                            <Bot className="w-8 h-8" />
                            {/* Online indicator */}
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        </Button>
                    </motion.div>
                )}

                {/* Chat popup */}
                <AnimatePresence>
                    {chatState.isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="w-[400px] h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 relative"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 text-white p-4 flex justify-between items-center relative">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-base">VanLangBot</span>
                                        <div className="text-xs opacity-80">
                                            {chatState.language === 'vi' ? 'Trợ lý tài chính AI' : 'AI Financial Assistant'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="hover:bg-white/20 text-white h-8 w-8"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={toggleChat}
                                        className="hover:bg-white/20 text-white h-8 w-8"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Settings panel */}
                                <AnimatePresence>
                                    {showSettings && <SettingsPanel />}
                                </AnimatePresence>
                            </div>

                            {/* Messages container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                                <AnimatePresence>
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                                                <div className={`px-4 py-3 rounded-2xl shadow-sm ${message.role === 'user'
                                                    ? 'bg-blue-500 text-white rounded-br-md'
                                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md'
                                                    }`}>
                                                    <div className="text-sm whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </div>

                                                    {message.metadata && (
                                                        <div className="mt-2 text-xs opacity-70 flex items-center space-x-2">
                                                            {message.metadata.cached && <span>📄</span>}
                                                            {message.metadata.responseTime &&
                                                                <span>{message.metadata.responseTime}ms</span>
                                                            }
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Typing indicator */}
                                <AnimatePresence>
                                    {chatState.isTyping && <TypingIndicator />}
                                </AnimatePresence>

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input area */}
                            <div className="p-4 border-t bg-white dark:bg-gray-900 dark:border-gray-700">
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 relative">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey && !chatState.isLoading) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder={chatState.language === 'vi' ?
                                                'Nhập câu hỏi về tài chính...' :
                                                'Ask about your finances...'
                                            }
                                            disabled={chatState.isLoading}
                                            className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                                        />
                                    </div>

                                    {/* Voice button */}
                                    {chatState.voiceEnabled && (
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            disabled={chatState.isLoading}
                                            className={`h-12 w-12 rounded-xl ${isRecording ? 'bg-red-50 text-red-500 border-red-200' : ''}`}
                                        >
                                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </Button>
                                    )}

                                    {/* Send button */}
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || chatState.isLoading}
                                        className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {chatState.isLoading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>

                                {/* Quick actions */}
                                <div className="mt-3 space-y-3">
                                    {/* Thêm dữ liệu - POST commands */}
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            {chatState.language === 'vi' ? '💰 Thêm dữ liệu:' : '💰 Add data:'}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(chatState.language === 'vi' ? [
                                                // Thu nhập - Đa dạng hơn
                                                'Tôi nhận lương 15 triệu',
                                                'Được thưởng 2 triệu',
                                                'Kiếm được 500k freelance',
                                                'Thu về 3 triệu bán hàng',
                                                'Tiết kiệm được 1 triệu',
                                                'Nhận tiền thưởng 800k',
                                                'Tôi được trả 12 triệu',
                                                'Thu nhập từ đầu tư 2.5 triệu',
                                                'Lương tháng này 18 triệu',
                                                'Kiếm thêm 600k part-time',
                                                'Bán đồ cũ được 300k',
                                                'Nhận hoa hồng 1.2 triệu',

                                                // Chi tiêu - Đa dạng hơn
                                                'Mua cà phê 50k',
                                                'Chi tiêu ăn uống 200k',
                                                'Trả tiền điện 300k',
                                                'Tôi mua quần áo 800k',
                                                'Tốn 150k đi taxi',
                                                'Thanh toán học phí 5 triệu',
                                                'Mua xăng 200k',
                                                'Chi phí ăn trưa 120k',
                                                'Trả tiền internet 400k',
                                                'Mua sách 250k',
                                                'Chi tiêu y tế 500k',
                                                'Đi xem phim 180k',
                                                'Mua đồ gia dụng 1.5 triệu',
                                                'Trả tiền thuê nhà 8 triệu',
                                                'Chi phí sửa xe 350k',
                                                'Mua thực phẩm 600k',

                                                // Khoản vay
                                                'Vay ngân hàng 5 triệu',
                                                'Mượn bạn 500k',
                                                'Vay gia đình 2 triệu',
                                                'Cho vay 1 triệu'
                                            ] : [
                                                // Income - More diverse
                                                'I received salary 15 million',
                                                'Got bonus 2 million',
                                                'Earned 500k freelance',
                                                'Made 3 million from sales',
                                                'Saved 1 million',
                                                'Received bonus 800k',
                                                'I got paid 12 million',
                                                'Investment income 2.5 million',
                                                'Monthly salary 18 million',
                                                'Earned extra 600k part-time',
                                                'Sold old stuff for 300k',
                                                'Received commission 1.2 million',

                                                // Expenses - More diverse
                                                'Bought coffee 50k',
                                                'Food expenses 200k',
                                                'Paid electricity 300k',
                                                'I bought clothes 800k',
                                                'Spent 150k on taxi',
                                                'Paid tuition 5 million',
                                                'Bought gas 200k',
                                                'Lunch cost 120k',
                                                'Paid internet 400k',
                                                'Bought books 250k',
                                                'Medical expenses 500k',
                                                'Went to movies 180k',
                                                'Bought household items 1.5 million',
                                                'Paid rent 8 million',
                                                'Car repair 350k',
                                                'Bought groceries 600k',

                                                // Loans
                                                'Borrowed from bank 5 million',
                                                'Borrowed from friend 500k',
                                                'Borrowed from family 2 million',
                                                'Lent money 1 million'
                                            ]).map((suggestion, index) => (
                                                <button
                                                    key={`post-${index}`}
                                                    onClick={() => setInput(suggestion)}
                                                    className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Truy vấn dữ liệu - GET commands */}
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            {chatState.language === 'vi' ? '📊 Xem dữ liệu:' : '📊 View data:'}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(chatState.language === 'vi' ? [
                                                'Thu nhập tháng này',
                                                'Chi tiêu của tôi',
                                                'Số dư hiện tại',
                                                'Phân tích tài chính'
                                            ] : [
                                                'This month\'s income',
                                                'My expenses',
                                                'Current balance',
                                                'Financial analysis'
                                            ]).map((suggestion, index) => (
                                                <button
                                                    key={`get-${index}`}
                                                    onClick={() => setInput(suggestion)}
                                                    className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tư vấn - Advisory commands */}
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            {chatState.language === 'vi' ? '💡 Tư vấn:' : '💡 Advisory:'}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(chatState.language === 'vi' ? [
                                                'Gợi ý tiết kiệm',
                                                'Lời khuyên đầu tư',
                                                'Phân tích chi tiêu'
                                            ] : [
                                                'Saving tips',
                                                'Investment advice',
                                                'Expense analysis'
                                            ]).map((suggestion, index) => (
                                                <button
                                                    key={`advice-${index}`}
                                                    onClick={() => setInput(suggestion)}
                                                    className="text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}