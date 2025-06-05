'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import PublicLayout from '@/components/layout/PublicLayout'; // Giả sử bạn muốn sử dụng layout chung
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, User, Bot } from 'lucide-react'; // Icons

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export default function TestChatbotPage() {
    const t = useTranslations('TestChatbotPage'); // Namespace cho translations
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString() + '-user',
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Giả lập phản hồi từ bot
        // Trong thực tế, bạn sẽ gọi API ở đây
        setTimeout(() => {
            const botResponse: Message = {
                id: Date.now().toString() + '-bot',
                text: `${t('botResponsePrefix')} "${userMessage.text}"`,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botResponse]);
        }, 1000);
    };

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8 flex flex-col h-[calc(100vh-150px)]"> {/* Điều chỉnh chiều cao nếu cần */}
                <h1 className="text-3xl font-bold mb-6 text-center">{t('title')}</h1>

                <div className="flex-grow bg-card border border-border rounded-lg shadow-md p-4 overflow-y-auto mb-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${msg.sender === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                <div className="flex items-center mb-1">
                                    {msg.sender === 'user' ?
                                        <User className="h-4 w-4 mr-2" /> :
                                        <Bot className="h-4 w-4 mr-2" />
                                    }
                                    <span className="text-xs font-semibold">
                                        {msg.sender === 'user' ? t('you') : t('botName')}
                                    </span>
                                </div>
                                <p>{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">
                                    {msg.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('inputPlaceholder')}
                        className="flex-grow"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </PublicLayout>
    );
}
