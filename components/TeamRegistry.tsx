import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Mail, MessageCircle, BarChart3, X, Zap, Target, AlertTriangle, Award } from 'lucide-react';
import { User, Role, Task } from '../types';
import { ModalWrapper } from './Modals';

interface TeamRegistryProps {
    users: User[];
    tasks: Task[]; // Need tasks to calculate performance
    onNewPersonnel: () => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    currentUserRole: Role;
}

const TeamRegistry: React.FC<TeamRegistryProps> = ({ users, tasks, onNewPersonnel, onEditUser, onDeleteUser, currentUserRole }) => {
  const [selectedUserForStats, setSelectedUserForStats] = useState<User | null>(null);

  // Strict Access: Only Admin can see this page
  if (currentUserRole !== 'Admin') {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-sm">Hanya Administrator yang dapat mengakses halaman ini.</p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Kelola User & Performa</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Personnel Access & Performance Analytics</p>
        </div>
        <button 
            onClick={onNewPersonnel}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all uppercase"
        >
            <Plus size={18} /> Tambah User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {users.map((user) => {
            // Quick Badge Logic for Card
            const userTasks = tasks.filter(t => t.assignees.includes(user.id) && t.status === 'Done');
            const totalRevisions = userTasks.reduce((acc, t) => acc + (t.history?.filter(h => h.status === 'Revisi').length || 0), 0);
            const highPerformer = userTasks.length > 0 && totalRevisions === 0;

            return (
                <div key={user.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center hover:-translate-y-1 transition-transform duration-300 group relative">
                    
                    {/* Actions Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button 
                                onClick={() => onEditUser(user)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white rounded-full shadow-sm border border-slate-100 hover:shadow-md transition-all"
                                title="Edit User"
                            >
                                <Edit2 size={12} />
                            </button>
                            <button 
                                onClick={() => onDeleteUser(user.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm border border-slate-100 hover:shadow-md transition-all"
                                title="Delete User"
                            >
                                <Trash2 size={12} />
                            </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
                            <span className="text-3xl font-black text-indigo-600">{user.initial}</span>
                        </div>
                        {highPerformer && (
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white" title="Top Performer (Zero Revisions)">
                                <Award size={12} />
                            </div>
                        )}
                    </div>
                    
                    <h3 className="text-base font-bold text-slate-900 mb-1">{user.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{user.role} • {user.department}</p>
                    
                    <div className="flex items-center gap-2 mb-6">
                        {user.email && (
                            <div className="flex items-center gap-1 text-slate-400" title={user.email}>
                                <Mail size={12} />
                            </div>
                        )}
                        {user.phone ? (
                            <a 
                                href={`https://wa.me/${user.phone}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-1 text-emerald-500 hover:text-emerald-700 transition-colors"
                                title={`WhatsApp: ${user.phone}`}
                            >
                                <MessageCircle size={12} />
                            </a>
                        ) : null}
                    </div>

                    <button 
                        onClick={() => setSelectedUserForStats(user)}
                        className="w-full mb-4 py-2 flex items-center justify-center gap-2 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                        <BarChart3 size={14} /> Lihat Rapor
                    </button>

                    <div className="flex w-full justify-between px-4 border-t border-slate-50 pt-4">
                        <div className="text-center">
                            <span className="block text-xl font-bold text-slate-800">{user.tasksActive}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-emerald-500">{user.tasksDone}</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      {/* PERFORMANCE INSIGHT MODAL */}
      {selectedUserForStats && (
          <UserPerformanceModal 
              user={selectedUserForStats} 
              tasks={tasks} 
              onClose={() => setSelectedUserForStats(null)} 
          />
      )}
    </div>
  );
};

// --- SUB-COMPONENT: USER PERFORMANCE MODAL ---
const UserPerformanceModal: React.FC<{ user: User; tasks: Task[]; onClose: () => void }> = ({ user, tasks, onClose }) => {
    // 1. FILTER TASKS
    const userTasks = tasks.filter(t => t.assignees.includes(user.id));
    const doneTasks = userTasks.filter(t => t.status === 'Done');
    const totalDone = doneTasks.length;
    const totalAll = userTasks.length;

    // 2. CALCULATE SPEED (Kecepatan)
    // Metric: On-Time Rate (Berapa % task yang selesai tanpa Overdue)
    const overdueCount = userTasks.filter(t => t.status === 'Overdue').length;
    const onTimeCount = userTasks.length - overdueCount;
    const speedScore = totalAll > 0 ? Math.round((onTimeCount / totalAll) * 100) : 0;

    // 3. CALCULATE ACCURACY (Ketepatan)
    // Metric: Revision Rate (Berapa kali kena revisi dibagi total task selesai)
    // Semakin tinggi revisi, semakin rendah akurasi.
    const totalRevisions = userTasks.reduce((acc, t) => {
        // Hitung berapa kali 'Revisi' muncul di history
        const revisiCount = t.history?.filter(h => h.status === 'Revisi').length || 0;
        return acc + revisiCount;
    }, 0);
    
    // Formula Akurasi: 100 - (Total Revisi * 5) per task. Capped at 0.
    // Jika 1 task direvisi 1 kali, penalti skor.
    // Base Accuracy Score relative to total Done tasks.
    // Logic: If I did 10 tasks and got 2 revisions total -> High Accuracy.
    // If I did 10 tasks and got 20 revisions total -> Low Accuracy.
    let accuracyScore = 0;
    if (totalDone > 0) {
        const penaltyPerRevision = 10; // Tiap 1 revisi mengurangi nilai
        const rawScore = 100 - ((totalRevisions / totalDone) * 100); 
        // Normalize readable score logic
        // Let's simpler logic: Task Without Revision Ratio
        const tasksWithRevision = doneTasks.filter(t => t.history?.some(h => h.status === 'Revisi')).length;
        const tasksClean = totalDone - tasksWithRevision;
        accuracyScore = Math.round((tasksClean / totalDone) * 100);
    } else {
        accuracyScore = 0; // New user
    }
    
    // BADGE GENERATOR
    let badgeTitle = "New Recruit";
    let badgeColor = "bg-slate-100 text-slate-500";
    let badgeDesc = "Belum cukup data.";

    if (totalDone > 0) {
        if (speedScore >= 90 && accuracyScore >= 90) {
            badgeTitle = "THE SNIPER"; // Cepat & Tepat
            badgeColor = "bg-indigo-600 text-white";
            badgeDesc = "Sangat Cepat & Sangat Teliti. Aset Berharga.";
        } else if (speedScore >= 90 && accuracyScore < 70) {
            badgeTitle = "THE RUSHER"; // Cepat tapi Ceroboh
            badgeColor = "bg-amber-500 text-white";
            badgeDesc = "Kerja Cepat, tapi sering Revisi. Perlu lebih teliti.";
        } else if (speedScore < 70 && accuracyScore >= 90) {
            badgeTitle = "PERFECTIONIST"; // Lambat tapi Tepat
            badgeColor = "bg-emerald-500 text-white";
            badgeDesc = "Hasil sangat bagus (jarang revisi), tapi sering terlambat.";
        } else if (speedScore < 60 && accuracyScore < 60) {
            badgeTitle = "NEEDS TRAINING"; // Lambat & Salah
            badgeColor = "bg-red-500 text-white";
            badgeDesc = "Perlu evaluasi. Sering terlambat dan sering revisi.";
        } else {
            badgeTitle = "BALANCED"; // Rata-rata
            badgeColor = "bg-blue-500 text-white";
            badgeDesc = "Kinerja seimbang. Cukup baik.";
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header Profile */}
                <div className="bg-[#0f172a] p-8 text-white relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={24}/></button>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-4xl font-black text-white border-4 border-white/20">
                            {user.initial}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs mb-4">{user.department} • {user.role}</p>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${badgeColor}`}>
                                <Award size={14} /> {badgeTitle}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <p className="text-sm text-slate-500 mb-8 italic border-l-4 border-indigo-200 pl-4">
                        "{badgeDesc}"
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* SPEED METRIC */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="text-amber-500" />
                                <h3 className="font-bold text-slate-800">KECEPATAN (SPEED)</h3>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-4xl font-black text-slate-800">{speedScore}%</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">On-Time Rate</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                                    <div className="bg-amber-50 h-2 rounded-full transition-all duration-1000" style={{ width: `${speedScore}%` }}></div>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex justify-between text-xs font-medium text-slate-600">
                                        <span>Total Tasks:</span>
                                        <span className="font-bold">{totalAll}</span>
                                    </li>
                                    <li className="flex justify-between text-xs font-medium text-slate-600">
                                        <span>Overdue / Late:</span>
                                        <span className="font-bold text-red-500">{overdueCount}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* ACCURACY METRIC */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="text-emerald-500" />
                                <h3 className="font-bold text-slate-800">KETEPATAN (ACCURACY)</h3>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-4xl font-black text-slate-800">{accuracyScore}%</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Clean Rate</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${accuracyScore}%` }}></div>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex justify-between text-xs font-medium text-slate-600">
                                        <span>Tasks Completed:</span>
                                        <span className="font-bold">{totalDone}</span>
                                    </li>
                                    <li className="flex justify-between text-xs font-medium text-slate-600">
                                        <span>Total Revisions Caught:</span>
                                        <span className="font-bold text-indigo-500">{totalRevisions}x</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>

                    {/* HISTORY LOG INSIGHT */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Problematic History (Recent Revisions)</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {userTasks.filter(t => t.history?.some(h => h.status === 'Revisi')).length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Bersih. Tidak ada task yang direvisi.</p>
                            ) : (
                                userTasks
                                .filter(t => t.history?.some(h => h.status === 'Revisi'))
                                .map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-3 bg-red-50/50 rounded-lg border border-red-50">
                                        <span className="text-xs font-bold text-slate-700">{t.title}</span>
                                        <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-1 rounded">
                                            {t.history?.filter(h => h.status === 'Revisi').length}x Revisi
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamRegistry;