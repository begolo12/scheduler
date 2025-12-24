import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Database, UploadCloud, Send } from 'lucide-react';

interface SettingsProps {
    currentUser: User;
    onUpdateUser: (id: string, data: Partial<User>) => void;
    onSeedDatabase?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser, onSeedDatabase }) => {
    const [username, setUsername] = useState(currentUser.username);
    const [email, setEmail] = useState(currentUser.email || '');
    const [password, setPassword] = useState(currentUser.password || '');
    const [telegramBotToken, setTelegramBotToken] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Load existing token from local storage (Simulating global setting)
        const token = localStorage.getItem('telegram_bot_token');
        if (token) setTelegramBotToken(token);
    }, []);

    const handleSave = () => {
        onUpdateUser(currentUser.id, { username, password, email });
        
        // Save Token to Local Storage (In production, save to DB 'settings' collection)
        if (currentUser.role === 'Admin') {
            localStorage.setItem('telegram_bot_token', telegramBotToken);
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                            placeholder="example@company.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Change Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    
                    {/* TELEGRAM BOT SETTING (Admin Only) */}
                    {currentUser.role === 'Admin' && (
                        <div className="pt-4 border-t border-slate-100">
                             <div className="flex items-center gap-2 mb-2">
                                <Send size={16} className="text-sky-500" />
                                <label className="text-xs font-bold text-sky-500 uppercase tracking-widest">Telegram Bot Token (Admin)</label>
                             </div>
                             <input 
                                type="text" 
                                value={telegramBotToken}
                                onChange={(e) => setTelegramBotToken(e.target.value)}
                                placeholder="Paste Bot API Token from @BotFather"
                                className="w-full bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-sky-500 transition-colors"
                            />
                            <p className="text-[10px] text-slate-400 mt-2 italic">
                                *Token ini digunakan untuk mengirim notifikasi otomatis ke Telegram staff.
                            </p>
                        </div>
                    )}

                    <div className="pt-4 flex items-center gap-4">
                        <button 
                            onClick={handleSave}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                        >
                            Save Changes
                        </button>
                        {isSaved && <span className="text-xs font-bold text-emerald-500">Changes Saved!</span>}
                    </div>
                </div>
            </div>

            {/* Admin Zone: Database Seeding */}
            {currentUser.role === 'Admin' && onSeedDatabase && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                     <div className="flex items-center gap-3 mb-6">
                        <Database className="text-slate-400" size={24} />
                        <h2 className="text-xl font-bold text-slate-800">Database Management</h2>
                     </div>
                     
                     <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                        <p className="text-xs font-medium text-amber-800 leading-relaxed">
                            <strong>Note:</strong> Jika database Firebase Anda masih kosong, Anda dapat menggunakan tombol di bawah ini untuk mengupload data contoh (Mock Data) agar aplikasi memiliki isi awal.
                        </p>
                     </div>

                     <button 
                        onClick={onSeedDatabase}
                        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-slate-900 shadow-lg transition-all"
                     >
                        <UploadCloud size={16} /> Sync / Upload Mock Data
                     </button>
                </div>
            )}
        </div>
    );
};

export default Settings;