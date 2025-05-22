'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { X, Bot, Send } from 'lucide-react';

// Import các hooks xác thực thực tế của bạn
import { useAppSelector } from '@/redux/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';

interface Message {
    role: 'user' | 'bot';
    content: string;
    id: string;
}

export default function ChatPopupVanLangBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Xin chào! Tôi là VanLangBot, bạn cần hỗ trợ gì về tài chính cá nhân?', id: 'initial-bot-message-' + Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Sử dụng các hook xác thực
    const reduxAuthState = useAppSelector((state) => state.auth);
    const authContextData = useAuth();
    const { data: session, status: sessionStatus } = useSession();

    // THÊM CÁC DÒNG NÀY ĐỂ DEBUG:
    useEffect(() => {
        console.log("Chatbot DEBUG: reduxAuthState", JSON.stringify(reduxAuthState, null, 2));
        console.log("Chatbot DEBUG: authContextData", JSON.stringify(authContextData, null, 2));
        console.log("Chatbot DEBUG: session", JSON.stringify(session, null, 2));
        console.log("Chatbot DEBUG: sessionStatus", sessionStatus);
    }, [reduxAuthState, authContextData, session, sessionStatus]); // Chạy khi các giá trị này thay đổi

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        let finalToken: string | null = null;
        let finalIsAuthenticated = false;

        console.log("Chatbot Auth: Starting auth check with current states:", {
            reduxIsAuth: reduxAuthState?.isAuthenticated,
            reduxTokenValue: reduxAuthState?.token, // Giả định token là string trực tiếp
            authContextIsAuth: authContextData?.isAuthenticated,
            authContextAccessToken: authContextData?.accessToken, // Giả định là accessToken
            sessionStatus: sessionStatus,
            sessionObject: session,
        });

        // Ưu tiên 1: Redux Auth (User thường)
        // Giả định: reduxAuthState.token là string chứa token
        if (reduxAuthState?.isAuthenticated && typeof reduxAuthState?.token === 'string' && reduxAuthState.token) {
            finalToken = reduxAuthState.token;
            finalIsAuthenticated = true;
            console.log("Chatbot Auth: Using Redux token.");
        }

        // Ưu tiên 2: AuthContext 
        // Giả định: authContextData.accessToken là string chứa token
        if (!finalIsAuthenticated && authContextData?.isAuthenticated && typeof authContextData?.accessToken === 'string' && authContextData.accessToken) {
            finalToken = authContextData.accessToken;
            finalIsAuthenticated = true;
            console.log("Chatbot Auth: Using AuthContext accessToken.");
        }

        // Ưu tiên 3: NextAuth Session 
        // Cần kiểm tra cấu trúc session kỹ lưỡng. Ví dụ thử lấy từ session.jwt hoặc session.user.token (phổ biến hơn)
        let sessionToken = null;
        if (session && typeof session === 'object') {
            if ((session as any).jwt) sessionToken = (session as any).jwt; // Một số cấu hình có thể có jwt ở đây
            else if ((session as any).accessToken) sessionToken = (session as any).accessToken;
            else if (session.user && typeof (session.user as any).token === 'string') sessionToken = (session.user as any).token;
            else if (session.user && typeof (session.user as any).id_token === 'string') sessionToken = (session.user as any).id_token;
        }

        if (!finalIsAuthenticated && sessionStatus === 'authenticated' && typeof sessionToken === 'string' && sessionToken) {
            finalToken = sessionToken;
            finalIsAuthenticated = true;
            console.log("Chatbot Auth: Using NextAuth session token.", { sessionTokenSource: sessionToken ? 'found' : 'not_found_in_expected_fields' });
        }

        // Ưu tiên 4: LocalStorage Admin (Admin login)
        if (!finalIsAuthenticated) {
            const adminLsToken = localStorage.getItem('token');
            const adminLsEmail = localStorage.getItem('user_email');
            const userRole = localStorage.getItem('user_role'); // Kiểm tra role nếu có
            if (adminLsToken && adminLsEmail && userRole === 'admin') { // Chỉ dùng nếu là admin
                finalToken = adminLsToken;
                finalIsAuthenticated = true;
                console.log("Chatbot Auth: Using Admin LocalStorage token.");
            }
        }

        // Ưu tiên 5. Fallback: auth_state từ localStorage (cho user thường, nếu các nguồn trên chưa có khi component mount lần đầu)
        // Chỉ dùng nếu các nguồn chính (Redux, AuthContext, Session) không xác thực được và bạn chắc chắn đây là user thường
        if (!finalIsAuthenticated && localStorage.getItem('user_role') !== 'admin') { // Đảm bảo không phải admin
            const authStateString = localStorage.getItem('auth_state');
            if (authStateString) {
                try {
                    const parsedAuthState = JSON.parse(authStateString);
                    // Giả định: parsedAuthState.token là string chứa token
                    if (parsedAuthState?.isAuthenticated && typeof parsedAuthState?.token === 'string' && parsedAuthState.token) {
                        finalToken = parsedAuthState.token;
                        finalIsAuthenticated = true;
                        console.log("Chatbot Auth: Using auth_state from LocalStorage (fallback for non-admin).");
                    }
                } catch (e) {
                    console.error("Chatbot Auth: Error parsing auth_state from localStorage", e);
                }
            }
        }

        console.log("Chatbot Auth Final - isAuthenticated:", finalIsAuthenticated, "Token Exists:", !!finalToken);
        setAuthToken(finalToken);
        setIsAuthenticated(finalIsAuthenticated);

    }, [reduxAuthState, authContextData, session, sessionStatus]);

    const togglePopup = () => setIsOpen(!isOpen);

    const sendMessage = async () => {
        if (!input.trim() || !authToken || isLoading) {
            if (!authToken) console.warn("Chatbot: Attempted to send message without auth token.");
            return;
        }
        setIsLoading(true);
        const newUserMessage: Message = { role: 'user', content: input, id: 'user-' + Date.now().toString() };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = input;
        setInput('');

        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ message: currentInput })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                console.error("Chatbot API Error:", { status: res.status, responseData: data });
                const errorContent = data.error || (res.status === 404 ? "API không tìm thấy (404). Vui lòng kiểm tra cấu hình proxy/backend." : `Lỗi máy chủ: ${res.status}`);
                const errorReply: Message = {
                    role: 'bot',
                    content: errorContent.substring(0, 150),
                    id: 'error-' + Date.now().toString()
                };
                setMessages(prev => [...prev, errorReply]);
            } else {
                const botReply: Message = {
                    role: 'bot',
                    content: data.response || 'Xin lỗi, tôi chưa thể trả lời điều này.',
                    id: 'bot-' + Date.now().toString()
                };
                setMessages(prev => [...prev, botReply]);
            }
        } catch (error) {
            console.error("Chatbot Fetch Error:", error);
            let errorMessage = 'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối mạng.';
            if (error instanceof SyntaxError) {
                errorMessage = "Lỗi xử lý phản hồi từ server (không phải JSON hợp lệ). Điều này thường xảy ra với lỗi 404.";
            }
            const errorReply: Message = {
                role: 'bot',
                content: errorMessage,
                id: 'fetch-error-' + Date.now().toString()
            };
            setMessages(prev => [...prev, errorReply]);
        }
        setIsLoading(false);
    };

    // if (!isAuthenticated) { // Giữ lại để test, nhưng với logic mới, isAuthenticated nên đúng
    //     console.log("Chatbot: Not authenticated based on current logic, not rendering.");
    //     return null;
    // }
    // console.log("Chatbot: Authenticated based on current logic. Rendering.");

    return (
        <div className="fixed bottom-5 right-5 z-[1000]">
            { /* Nút Chatbot sẽ chỉ hiển thị nếu isAuthenticated là true sau khi logic useEffect chạy */}
            {isAuthenticated && !isOpen && (
                <Button
                    onClick={togglePopup}
                    className="rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-xl bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                    aria-label="Mở VanLangBot"
                >
                    <Bot className="w-7 h-7" />
                </Button>
            )}

            {isAuthenticated && isOpen && (
                <motion.div
                    key="chatbot-popup"
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.9 }}
                    transition={{ duration: 0.25, ease: "circOut" }}
                    className="w-[370px] h-[min(600px,calc(100vh-100px))] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-300 dark:border-gray-700"
                >
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center flex-shrink-0">
                        <span className="font-semibold text-base tracking-wide">VanLangBot</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={togglePopup}
                            className="hover:bg-white/20 p-1.5 h-auto w-auto rounded-full text-white"
                            aria-label="Đóng VanLangBot"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-slate-900">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={`text-sm py-2 px-3.5 rounded-xl max-w-[85%] shadow-sm whitespace-pre-wrap break-words ${msg.role === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-lg'
                                        : 'bg-white dark:bg-gray-700 dark:text-gray-100 text-gray-800 rounded-bl-lg'
                                        }`}
                                >
                                    {msg.content}
                                </motion.div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t bg-white dark:border-gray-700 dark:bg-gray-800 flex items-center gap-2.5 flex-shrink-0">
                        <input
                            type="text"
                            disabled={isLoading || !isAuthenticated}
                            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70"
                            placeholder={!isAuthenticated ? "Vui lòng đăng nhập..." : isLoading ? "VanLangBot đang trả lời..." : "Nhập câu hỏi..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !isLoading && isAuthenticated) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                        <Button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading || !isAuthenticated}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-4 py-2.5 rounded-lg disabled:opacity-60 transition-all flex items-center justify-center w-[75px] h-[42px]"
                        >
                            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Send size={18} />}
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}