import React, { useState, useRef, useEffect } from 'react';
import { A2UIRenderer } from './A2UI/Renderer';
import { A2UIPayload } from '../types/a2ui';
import { getAgentResponse } from '../services/aiService';

const FloatingChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent', content: string | A2UIPayload }>>([
        {
            sender: 'agent',
            content: {
                version: "1.0",
                components: [
                    {
                        id: 'welcome-heading',
                        type: 'text',
                        props: { content: 'Hệ thống hỗ trợ kỹ thuật AI', style: 'caption' }
                    },
                    {
                        id: 'welcome-title',
                        type: 'text',
                        props: { content: 'Tôi có thể giúp gì cho bạn?', style: 'title' }
                    },
                ]
            }
        }
    ]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, loading, isOpen]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || loading) return;

        const currentInput = userInput;
        const newChat = [...chatHistory, { sender: 'user' as const, content: currentInput }];
        setChatHistory(newChat);
        setUserInput("");
        setLoading(true);

        try {
            const agentResponse = await getAgentResponse(currentInput);
            setChatHistory([...newChat, { sender: 'agent' as const, content: agentResponse }]);
        } catch (error: any) {
            console.error("AI Service Error:", error);
            const errorPayload: A2UIPayload = {
                version: "1.0",
                components: [
                    {
                        id: 'err',
                        type: 'text',
                        props: { content: `Error: ${error.message || "Failed to connect to AI Agent."}`, style: 'body' }
                    }
                ]
            };
            setChatHistory([...newChat, { sender: 'agent' as const, content: errorPayload }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[450px] h-[650px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 flex justify-between items-center text-white shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold">AI Assistant</h2>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full border border-white/20"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-zinc-900/50"
                    >
                        {chatHistory.map((chat, idx) => (
                            <div key={idx} className={`flex w-full ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${chat.sender === 'user'
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 rounded-tl-none'
                                        }`}>
                                        {typeof chat.content === 'string' ? (
                                            <p className="text-sm leading-relaxed">{chat.content}</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {chat.content.components.map((comp) => (
                                                    <A2UIRenderer key={comp.id} component={comp} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold mt-1 px-1 block">
                                        {chat.sender === 'user' ? 'You' : 'Assistant'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
                        <div className="relative flex items-center bg-slate-100 dark:bg-zinc-800 rounded-2xl p-1 shadow-inner">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={loading}
                                placeholder="Gõ tin nhắn..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-2 dark:text-white"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={loading}
                                className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-white dark:border-zinc-900 ${isOpen
                        ? 'bg-slate-200 dark:bg-zinc-800 text-slate-600'
                        : 'bg-gradient-to-br from-primary to-indigo-600 text-white animate-bounce'
                    }`}
            >
                <span className="material-symbols-outlined text-3xl font-bold">
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
                    </span>
                )}
            </button>
        </div>
    );
};

export default FloatingChat;
