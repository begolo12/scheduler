import React from 'react';
import { ClipboardList, CheckCircle2, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { Task, User } from '../types';

interface DashboardProps {
    tasks: Task[];
    users?: User[]; // Added users to calculate individual performance
    onStatClick: (filter: 'ALL' | 'ACTIVE' | 'DONE' | 'OVERDUE') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, users = [], onStatClick }) => {
  const activeTasks = tasks.filter(t => t.status === 'Active').length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
  const totalTasks = tasks.length;

  const getDepartmentStats = (dept: string) => {
    const deptTasks = tasks.filter(t => t.department === dept);
    const count = deptTasks.length;
    // Prevent division by zero
    const total = tasks.length || 1; 
    const percent = Math.round((count / total) * 100);
    return { count, percent };
  };

  // Calculate User Performance
  // Criteria: (Total Tasks - Overdue) / Total Tasks * 100.
  // Only consider users who actually have tasks assigned.
  const underperformingUsers = users.map(user => {
      const userTasks = tasks.filter(t => t.assignees.includes(user.id));
      const total = userTasks.length;
      if (total === 0) return null; // Ignore users with no tasks

      const overdueCount = userTasks.filter(t => t.status === 'Overdue').length;
      const performance = Math.round(((total - overdueCount) / total) * 100);

      if (performance < 90) {
          return { ...user, performance, overdueCount, total };
      }
      return null;
  }).filter(u => u !== null);

  const departments = [
    { name: 'BUSDEV UNIT', key: 'Busdev', color: 'bg-indigo-600' },
    { name: 'OPERASI UNIT', key: 'Operasi', color: 'bg-emerald-500' },
    { name: 'KEUANGAN UNIT', key: 'Keuangan', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="TOTAL TASK" 
            value={totalTasks} 
            icon={<ClipboardList className="text-slate-400" />} 
            onClick={() => onStatClick('ALL')}
        />
        <StatCard 
            title="SELESAI" 
            value={doneTasks} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
            onClick={() => onStatClick('DONE')}
        />
        <StatCard 
            title="SEDANG JALAN" 
            value={activeTasks} 
            icon={<TrendingUp className="text-indigo-500" />} 
            onClick={() => onStatClick('ACTIVE')}
        />
        <StatCard 
            title="OVERDUE" 
            value={overdueTasks} 
            icon={<AlertCircle className="text-red-500" />} 
            onClick={() => onStatClick('OVERDUE')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 space-y-6">
            {/* PERFORMANCE ALERT SECTION */}
            {underperformingUsers.length > 0 && (
                <div className="bg-red-50 rounded-3xl p-6 border border-red-100 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-red-500" size={24} />
                        <div>
                            <h3 className="text-lg font-bold text-red-700">Perhatian: Performance Alert</h3>
                            <p className="text-xs text-red-500 font-medium">Personel berikut memiliki performa di bawah 90% (Banyak Task Overdue)</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {underperformingUsers.map((u: any) => (
                            <div key={u.id} className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">{u.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{u.department} • {u.role}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-red-500">{u.performance}%</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{u.overdueCount} Overdue</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Workload Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="mb-8 border-l-4 border-indigo-600 pl-4">
                <h2 className="text-xl font-bold text-slate-800">Beban Kerja Unit</h2>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Distribusi Berdasarkan Jumlah Task</p>
            </div>

            <div className="space-y-8">
                {departments.map((dept) => {
                const stats = getDepartmentStats(dept.key);
                return (
                    <div key={dept.key}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{dept.name} ({stats.count} TASKS)</span>
                        <span className="text-xs font-bold text-indigo-600">{stats.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${stats.percent > 0 ? dept.color : 'bg-transparent'}`} 
                            style={{ width: `${stats.percent}%` }}
                        ></div>
                    </div>
                    </div>
                );
                })}
            </div>

            <div className="mt-12 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-400 italic">"Unit General tidak dihitung dalam beban kerja karena bersifat kewajiban seluruh tim"</p>
            </div>
            </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-fit">
          <div className="mb-8 border-l-4 border-indigo-600 pl-4">
             <h2 className="text-xl font-bold text-slate-800">Aktivitas Terbaru</h2>
          </div>
          
          <div className="space-y-6 relative before:absolute before:left-[3px] before:top-2 before:h-full before:w-0.5 before:bg-slate-100">
             {tasks.slice(0, 5).map((task, idx) => (
                 <div key={idx} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">
                            {task.department} <span className="mx-1">•</span> DEADLINE: {task.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                 </div>
             ))}
             {tasks.length === 0 && <p className="text-slate-400 text-sm italic">Belum ada aktivitas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between ${onClick ? 'cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]' : ''}`}
  >
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
    </div>
  </div>
);

export default Dashboard;