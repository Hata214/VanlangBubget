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

    // Welcome message với multilingual support
    const getWelcomeMessage = useCallback((lang: 'vi' | 'en') => {
        const messages = {
            vi: "👋 Xin chào! Tôi là VanLangBot, trợ lý tài chính thông minh của bạn.\n\n💡 Tôi có thể giúp bạn:\n• Phân tích tình hình tài chính hiện tại\n• Đưa ra gợi ý về ngân sách và tiết kiệm\n• Tư vấn về các khoản đầu tư\n• Trả lời câu hỏi về thu chi\n\nHãy hỏi tôi bất cứ điều gì về tài chính nhé! 🚀",
            en: "👋 Hello! I'm VanLangBot, your intelligent financial assistant.\n\n💡 I can help you with:\n• Analyzing your current financial situation\n• Providing budget and saving suggestions\n• Investment advice\n• Answering income/expense questions\n\nFeel free to ask me anything about finance! 🚀"
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
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[
                                        chatState.language === 'vi' ? 'Thu nhập tháng này' : 'This month\'s income',
                                        chatState.language === 'vi' ? 'Chi tiêu của tôi' : 'My expenses',
                                        chatState.language === 'vi' ? 'Gợi ý tiết kiệm' : 'Saving tips'
                                    ].map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setInput(suggestion)}
                                            className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}