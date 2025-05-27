'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/redux/hooks';
import { getToken } from '@/services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  metadata?: {
    cached?: boolean;
    sessionId?: string;
    responseTime?: number;
  };
}

interface AgentResponse {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    cached: boolean;
    sessionId: string;
    messageCount: number;
    responseTime: number;
    language: string;
    timestamp: string;
  };
}

const AgentChatPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user: authUser, accessToken } = useAuth();
  const reduxAuth = useAppSelector((state) => state.auth);

  // Use multiple auth sources - try cookie first like other APIs
  const cookieToken = getToken(); // This uses the same function as other APIs
  const user = authUser || reduxAuth.user;
  const token = cookieToken || accessToken || reduxAuth.token;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: '🚀 Chào bạn! Tôi là VanLang Agent v2 - trợ lý tài chính AI thế hệ mới!\n\n✨ Tính năng nâng cao:\n💰 Thêm giao dịch bằng ngôn ngữ tự nhiên\n📊 Phân tích tài chính thông minh\n🔍 Truy vấn dữ liệu chi tiết\n💡 Tư vấn tài chính cá nhân hóa\n🎯 Lập kế hoạch đầu tư\n\n💰 **Thêm Thu nhập:**\n• "Tôi nhận lương 15 triệu"\n• "Được thưởng 2 triệu"\n• "Kiếm được 500k freelance"\n• "Thu về 3 triệu bán hàng"\n\n💸 **Thêm Chi tiêu:**\n• "Mua cà phê 50k"\n• "Chi tiêu ăn uống 200k"\n• "Trả tiền điện 300k"\n• "Mua quần áo 800k"\n\n📊 **Xem dữ liệu:**\n• "Thu nhập tháng này"\n• "Chi tiêu của tôi"\n• "Số dư hiện tại"\n• "Phân tích tài chính"',
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    console.log('🚀 sendMessage called');
    console.log('📝 inputMessage:', inputMessage);
    console.log('⏳ isLoading:', isLoading);

    if (!inputMessage.trim() || isLoading) {
      console.log('❌ Message validation failed');
      return;
    }

    console.log('👤 user:', user);
    console.log('🔑 token:', token);
    console.log('🍪 cookieToken:', cookieToken);

    if (!token) {
      console.log('❌ Authentication failed - no token found');
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng đăng nhập để sử dụng Agent',
        variant: 'destructive'
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🤖 Sending message to agent:', userMessage.text);
      console.log('🔑 Using token:', token);

      const response = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.text,
          language: 'vi'
        })
      });

      console.log('📡 Agent response status:', response.status);
      console.log('📡 Agent response headers:', response.headers);

      const data: any = await response.json();
      console.log('📦 Agent response data:', data);

      if (data.success && data.data && data.data.response) {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.response,
          sender: 'agent',
          timestamp: new Date(),
          metadata: data.data.metadata
        };

        setMessages(prev => [...prev, agentMessage]);
        setSessionInfo(data.data.metadata);
      } else {
        throw new Error(data.error || data.message || 'Không thể nhận phản hồi từ Agent');
      }
    } catch (error) {
      console.error('Agent error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
        sender: 'agent',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Lỗi Agent',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionInfo(null);
    toast({
      title: 'Đã xóa cuộc trò chuyện',
      description: 'Lịch sử chat đã được xóa'
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show agent for all users (remove auth restriction for now)
  console.log('🤖 Agent Debug:', { user, token, cookieToken, authUser, reduxAuth });

  return (
    <>
      {/* Debug indicator - Always visible */}
      <div className="fixed bottom-20 right-6 z-[9999] bg-green-500 text-white p-2 rounded text-xs">
        🤖 VanLang Agent: ✅ Active
      </div>

      {/* Chat Bubble Button - Always show for testing */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            size="icon"
          >
            <Bot className="h-7 w-7 text-white" />
          </Button>
          <div className="absolute -top-2 -right-2">
            <div className="h-5 w-5 bg-emerald-400 rounded-full animate-pulse flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
          </div>
          {/* Agent v2 Badge */}
          <div className="absolute -bottom-1 -left-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
            v2
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
          }`}>
          <Card className="h-full flex flex-col shadow-2xl border-0 bg-white dark:bg-gray-900">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <div className="flex flex-col">
                  <CardTitle className="text-sm font-medium">VanLang Agent</CardTitle>
                  <div className="text-xs opacity-90">AI Trợ lý tài chính v2</div>
                </div>
                {sessionInfo && (
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                    {sessionInfo.messageCount} tin nhắn
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <>
                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.sender === 'agent' && (
                            <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          {message.sender === 'user' && (
                            <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs opacity-70">
                                {formatTimestamp(message.timestamp)}
                              </div>
                              {message.metadata?.cached && (
                                <Badge variant="outline" className="text-xs">
                                  Cached
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Agent đang suy nghĩ...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn cho VanLang Agent v2..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      size="icon"
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {messages.length > 1 && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Xóa cuộc trò chuyện
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default AgentChatPopup;
