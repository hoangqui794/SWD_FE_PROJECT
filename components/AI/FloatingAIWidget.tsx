import React, { useState, useRef, useEffect } from 'react';
import { A2UIRenderer } from '../A2UI/Renderer';
import { A2UIPayload } from '../../types/a2ui';
import { getAgentResponse } from '../../services/aiService';

const FloatingAIWidget: React.FC = () => {
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
                        props: { content: 'Hệ thống hỗ trợ kỹ thuật AI nâng cao', style: 'caption' }
                    },
                    {
                        id: 'welcome-title',
                        type: 'text',
                        props: { content: 'Tôi có thể giúp gì cho bạn?', style: 'title' }
                    }
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
                        props: { content: `Lỗi: ${error.message || "Không thể kết nối với AI."}`, style: 'body' }
                    }
                ]
            };
            setChatHistory([...newChat, { sender: 'agent' as const, content: errorPayload }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[380px] md:w-[420px] h-[550px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 backdrop-blur-xl">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold dark:text-white">Gemini Assistant</h3>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[9px] text-emerald-500 font-bold uppercase">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/5"
                    >
                        {chatHistory.map((chat, idx) => (
                            <div key={idx} className={`flex w-full ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`group relative max-w-[85%] ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`relative rounded-2xl p-0.5 ${chat.sender === 'user'
                                        ? 'bg-gradient-to-br from-primary to-indigo-600'
                                        : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                                        }`}>
                                        <div className="rounded-[14px] p-2.5 px-3">
                                            {typeof chat.content === 'string' ? (
                                                <p className={`text-xs font-medium leading-relaxed ${chat.sender === 'user' ? 'text-white' : 'dark:text-slate-200 text-slate-800'}`}>
                                                    {chat.content}
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {chat.content.components.map((comp) => (
                                                        <A2UIRenderer key={comp.id} component={comp} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-2xl flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">AI Processing...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                        {/* Quick Suggestions */}
                        {chatHistory.length <= 2 && (
                            <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {[
                                    { icon: 'equalizer', text: "Xem thông số cảm biến" },
                                    { icon: 'health_and_safety', text: "Kiểm tra sức khỏe" },
                                    { icon: 'info', text: "Giải thích về AI" },
                                    { icon: 'warning', text: "Cảnh báo bảo mật" }
                                ].map((item) => (
                                    <button
                                        key={item.text}
                                        onClick={() => {
                                            setUserInput(item.text);
                                            // Trigger send after a small delay to allow state update
                                            setTimeout(() => {
                                                const btn = document.getElementById('widget-send-btn');
                                                btn?.click();
                                            }, 50);
                                        }}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-xs">{item.icon}</span>
                                        {item.text}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="relative flex items-center bg-slate-100 dark:bg-white/5 rounded-xl px-3 py-1">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={loading}
                                placeholder="Hỏi AI..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-2 px-1 dark:text-white disabled:opacity-50"
                            />
                            <button
                                id="widget-send-btn"
                                onClick={handleSendMessage}
                                disabled={loading}
                                className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-90 relative overflow-hidden group ${isOpen ? 'bg-zinc-800 rotate-90' : 'bg-primary'
                    }`}
            >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isOpen ? (
                    <span className="material-symbols-outlined text-white text-2xl">close</span>
                ) : (
                    <span className="material-symbols-outlined text-white text-2xl animate-pulse">smart_toy</span>
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full"></span>
                )}
            </button>
        </div>
    );
};

export default FloatingAIWidget;
