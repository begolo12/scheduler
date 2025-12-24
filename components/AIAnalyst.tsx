import React, { useState } from 'react';
import { Sparkles, X, Bot, RefreshCw, MessageSquareQuote } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Task, User, Project } from '../types';

interface AIAnalystProps {
    tasks: Task[];
    users: User[];
    projects: Project[];
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ tasks, users, projects }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);

    const generateInsight = async () => {
        setLoading(true);
        try {
            // 1. Prepare Data Summary for AI (Reduce Token Usage)
            const summaryData = {
                total_projects: projects.length,
                total_tasks: tasks.length,
                overdue_tasks: tasks.filter(t => t.status === 'Overdue').length,
                completion_rate: Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100) + '%',
                departments: ['Busdev', 'Operasi', 'Keuangan'].map(dept => ({
                    name: dept,
                    active_tasks: tasks.filter(t => t.department === dept && t.status === 'Active').length,
                    overdue: tasks.filter(t => t.department === dept && t.status === 'Overdue').length
                })),
                personnel_performance: users.map(u => {
                    const myTasks = tasks.filter(t => t.assignees.includes(u.id));
                    const done = myTasks.filter(t => t.status === 'Done').length;
                    const revisions = myTasks.reduce((acc, t) => acc + (t.history?.filter(h => h.status === 'Revisi').length || 0), 0);
                    return {
                        name: u.name,
                        role: u.role,
                        tasks_assigned: myTasks.length,
                        tasks_done: done,
                        revisions_count: revisions,
                        efficiency_note: revisions === 0 && done > 0 ? "High Accuracy" : revisions > 3 ? "Needs Improvement" : "Normal"
                    };
                }),
                critical_issues: tasks.filter(t => t.status === 'Overdue').map(t => t.title)
            };

            // 2. Call Gemini API
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = 'gemini-2.5-flash-latest';
            
            const prompt = `
            Bertindaklah sebagai Konsultan Manajemen Senior untuk perusahaan bernama "Daniswara".
            Analisa data operasional berikut ini dan berikan laporan singkat, padat, dan strategis untuk BOD (Board of Directors).

            DATA PROJECT:
            ${JSON.stringify(summaryData, null, 2)}

            TOLONG JELASKAN DENGAN FORMAT BERIKUT (Gunakan Bahasa Indonesia Profesional):
            1. 📊 **Executive Summary**: 1 kalimat tentang kesehatan keseluruhan operasional.
            2. 🏆 **Top Performer Analysis**: Siapa karyawan paling efisien (Sedikit revisi, banyak task selesai)? Puji mereka.
            3. ⚠️ **Critical Bottlenecks**: Departemen mana yang paling macet? Apa penyebabnya (lihat data overdue)?
            4. 💡 **Strategic Recommendation**: Berikan 3 poin saran konkret untuk Direktur agar performa bulan depan lebih baik.

            Gunakan emoji yang relevan. Jangan terlalu teknis, gunakan bahasa bisnis.
            `;

            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
            });

            setAnalysis(response.text);

        } catch (error) {
            console.error("AI Error:", error);
            setAnalysis("Maaf, terjadi kesalahan saat menghubungi AI Analyst. Pastikan API KEY sudah terkonfigurasi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => { setIsOpen(true); if (!analysis) generateInsight(); }}
                className="fixed bottom-6 right-24 md:right-24 z-[100] group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-xl hover:scale-105 transition-all animate-in slide-in-from-bottom-4"
            >
                <Sparkles size={20} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest hidden group-hover:block transition-all">AI Insight</span>
            </button>

            {/* AI Modal Panel */}
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center md:justify-end p-0 md:p-6 pointer-events-none">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setIsOpen(false)}></div>

                    {/* Content Card */}
                    <div className="bg-white w-full md:w-[450px] h-[85vh] md:h-[80vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col pointer-events-auto relative overflow-hidden animate-in slide-in-from-right duration-300">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                        <Bot size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">Daniswara AI</h2>
                                        <p className="text-[10px] font-medium text-indigo-100 uppercase tracking-widest">Operational Intelligence</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles size={20} className="text-indigo-600" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 animate-pulse">Sedang menganalisa jutaan data...</p>
                                </div>
                            ) : analysis ? (
                                <div className="prose prose-sm prose-indigo max-w-none">
                                    {/* Simple Markdown Renderer Replacement since we can't add libraries */}
                                    <div className="space-y-4">
                                        {analysis.split('\n').map((line, idx) => {
                                            if (line.startsWith('###') || line.startsWith('**')) {
                                                return <p key={idx} className="font-bold text-slate-800 mt-4" dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/### (.*)/, '<span class="text-lg text-indigo-700">$1</span>')}}></p>;
                                            } else if (line.trim().startsWith('- ') || line.trim().startsWith('1. ')) {
                                                return <div key={idx} className="flex gap-2 text-slate-600 ml-2">
                                                    <span className="text-indigo-500 mt-1.5">•</span>
                                                    <span dangerouslySetInnerHTML={{__html: line.replace(/^- /, '').replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}}></span>
                                                </div>
                                            }
                                            return <p key={idx} className="text-slate-600 leading-relaxed text-sm" dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}}></p>;
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 mt-20">
                                    <MessageSquareQuote size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">Klik tombol refresh untuk memulai analisis.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                            <p className="text-[10px] text-slate-400 italic">Powered by Google Gemini 2.5 Flash</p>
                            <button 
                                onClick={generateInsight}
                                disabled={loading}
                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                {loading ? 'Analyzing...' : 'Re-Analyze'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAnalyst;
