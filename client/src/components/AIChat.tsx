import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Zap } from 'lucide-react';
import { llmApi, type ChatMessage } from '../api/llm';

interface AIChatProps {
    item: any;
    isOpen: boolean;
    onClose: () => void;
}

export function AIChat({ item, isOpen, onClose }: AIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Приветственное сообщение при открытии чата
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: `Привет! Я AI-ассистент по объявлению "${item.title}".\n\nЗадавай любые вопросы: о цене, описании, характеристиках — я помогу улучшить объявление и продать товар быстрее! 🚀`
                }
            ]);
        }
    }, [isOpen, item.title, messages.length]);

    // Автоскролл к последнему сообщению
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Фокус на поле ввода при открытии
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Добавляем сообщение пользователя
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Отправляем запрос к Ollama с историей
            const response = await llmApi.chatWithUser(item, userMessage, messages);

            // Добавляем ответ ассистента
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Ошибка: Не удалось подключиться к Ollama.';
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: errorMessage
                }
            ]);
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

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-6 z-50 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <h3 className="font-semibold">AI-ассистент</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg ${
                                message.role === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg rounded-bl-none">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Задайте вопрос..."
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}