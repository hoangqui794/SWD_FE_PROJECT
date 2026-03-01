import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { A2UIRenderer } from '../components/A2UI/Renderer';
import { A2UIPayload } from '../types/a2ui';
import { getAgentResponse } from '../services/aiService';

const AiAssistantPage: React.FC = () => {
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
                        props: { content: 'Tôi có thể giúp gì cho bạn hôm nay?', style: 'title' }
                    },
                    {
                        id: 'welcome-body',
                        type: 'text',
                        props: { content: 'Tôi là trợ lý ảo được cung cấp bởi Gemini 1.5. Hãy yêu cầu tôi xem thông số, giải thích hệ thống hoặc phân tích dữ liệu cảm biến. Tôi sẽ phản hồi bằng các giao diện trực quan.' }
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
    }, [chatHistory, loading]);

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
        <Layout title="AI Assistant" breadcrumb="Agentic UI / Real AI Agent">
            <div className="relative flex flex-col h-[calc(100vh-120px)] w-full mx-auto overflow-hidden">

                {/* Visual Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold dark:text-white">Gemini Agent</h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online & Ready</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 font-medium tracking-tight">Standard</span>
                            <span className="text-[11px] font-bold dark:text-slate-300 tracking-tighter uppercase">A2UI Protocol v1.0</span>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div
                    ref={scrollRef}
                    className="relative z-10 flex-1 overflow-y-auto p-4 md:px-12 md:py-8 space-y-10 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10"
                >
                    <div className="max-w-6xl mx-auto w-full space-y-12">
                        {chatHistory.map((chat, idx) => (
                            <div key={idx} className={`flex w-full ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`group relative max-w-[95%] ${typeof chat.content === 'string' ? 'md:max-w-lg' : 'md:max-w-3xl'} ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>

                                    {/* Label */}
                                    <span className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 block px-2 ${chat.sender === 'user' ? 'text-right text-primary' : 'text-slate-500'}`}>
                                        {chat.sender === 'user' ? 'YOU' : 'AI ASSISTANT'}
                                    </span>

                                    {/* Bubble */}
                                    <div className={`relative rounded-2xl p-0.5 shadow-lg transition-all ${chat.sender === 'user'
                                        ? 'bg-gradient-to-br from-primary to-indigo-600'
                                        : 'bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-2xl'
                                        }`}>
                                        <div className={`rounded-[12px] p-3 md:p-4 ${chat.sender === 'user' ? '' : ''
                                            }`}>
                                            {typeof chat.content === 'string' ? (
                                                <p className={`text-xs md:text-sm font-medium leading-relaxed ${chat.sender === 'user' ? 'text-white' : 'dark:text-slate-200 text-slate-800'}`}>
                                                    {chat.content}
                                                </p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {chat.content.components.map((comp) => (
                                                        <A2UIRenderer key={comp.id} component={comp} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons on hover */}
                                        <div className={`absolute top-2 ${chat.sender === 'user' ? 'left-[-40px]' : 'right-[-40px]'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                                            <button className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors shadow-sm">
                                                <span className="material-symbols-outlined text-xs">content_copy</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">AI IS THINKING...</span>
                                    <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s]"></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-tighter">Processing A2UI...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Input Area */}
                <div className="relative z-10 px-4 md:px-8 py-6 bg-white/50 dark:bg-black/40 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10">

                    {/* Quick Suggestions */}
                    {chatHistory.length <= 2 && (
                        <div className="flex flex-wrap gap-2 mb-6 max-h-24 overflow-y-auto no-scrollbar">
                            {[
                                { icon: 'equalizer', text: "Xem thông số cảm biến" },
                                { icon: 'health_and_safety', text: "Kiểm tra sức khỏe hệ thống" },
                                { icon: 'info', text: "Giải thích về A2UI" },
                                { icon: 'dashboard', text: "Xây dựng bảng điều khiển" },
                                { icon: 'warning', text: "Tổng quan bảo mật" }
                            ].map((item) => (
                                <button
                                    key={item.text}
                                    onClick={() => {
                                        setUserInput(item.text);
                                        setTimeout(() => document.getElementById('chat-send-btn')?.click(), 100);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                                    {item.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Input */}
                    <div className="relative group max-w-4xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition-all duration-500"></div>
                        <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-[20px] shadow-2xl transition-transform group-focus-within:scale-[1.01]">
                            <div className="pl-4 pr-2 text-slate-400">
                                <span className="material-symbols-outlined">bolt</span>
                            </div>
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={loading}
                                placeholder={loading ? "Đang tạo phản hồi..." : "Yêu cầu AI làm gì đó... (ví dụ: 'Xem bảng thông số')"}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm px-2 py-3 dark:text-white disabled:opacity-50 placeholder:text-slate-400 font-medium"
                            />
                            <div className="flex items-center gap-2 px-2">
                                <button className="hidden md:flex w-10 h-10 items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">mic</span>
                                </button>
                                <button
                                    id="chat-send-btn"
                                    onClick={handleSendMessage}
                                    disabled={loading}
                                    className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary to-indigo-600 text-white rounded-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 group/btn"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">send</span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 px-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Trạng thái:</span>
                                <span className="text-[9px] text-primary font-black uppercase tracking-widest">Hoạt động</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium tracking-tight opacity-70">
                                Bảo mật bởi Gemini Ultra & Giao thức A2UI
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes pulse-gentle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.05); }
                }
            `}</style>
        </Layout >
    );
};

export default AiAssistantPage;
