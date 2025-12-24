import React, { useState } from 'react';
import { FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
    users: User[];
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!user) {
            setError('Username tidak ditemukan.');
            return;
        }

        // Check password - Default is '123' or user specific
        const validPassword = user.password || '123';
        
        if (password !== validPassword) {
            setError('Password salah.');
            return;
        }

        onLogin(user);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-[#0f172a] p-8 text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                        <FileText size={24} />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-wide">DANISWARA</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Scheduler System</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                                placeholder="Masukkan username..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                                placeholder="Masukkan password..."
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
                                <AlertCircle size={16} />
                                <span className="text-xs font-bold">{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                        >
                            Login Access <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Default Password: <span className="text-slate-600">123</span>
                        </p>
                    </div>
                </div>
            </div>
            
            <p className="mt-8 text-slate-400 text-xs font-medium">
                &copy; 2025 Daniswara Internal System
            </p>
        </div>
    );
};

export default Login;
