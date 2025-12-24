import React, { useState, useMemo } from 'react';
import { ClipboardList, CheckCircle2, TrendingUp, AlertCircle, AlertTriangle, Printer, FileBarChart, X, PieChart, BarChart } from 'lucide-react';
import { Task, User } from '../types';

interface DashboardProps {
    tasks: Task[];
    users?: User[]; 
    onStatClick: (filter: 'ALL' | 'ACTIVE' | 'DONE' | 'OVERDUE') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, users = [], onStatClick }) => {
  const [showReport, setShowReport] = useState(false);

  // --- STATS CALCULATION ---
  const activeTasks = tasks.filter(t => t.status === 'Active').length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
  const totalTasks = tasks.length;

  // --- CHART DATA GENERATION ---
  
  // 1. Productivity Trend (Last 6 Months)
  const trendData = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({ 
            label: d.toLocaleDateString('id-ID', { month: 'short' }),
            month: d.getMonth(),
            year: d.getFullYear(),
            created: 0,
            completed: 0
        });
    }

    tasks.forEach(task => {
        const cDate = task.createdAt;
        // Check created
        const cMonth = months.find(m => m.month === cDate.getMonth() && m.year === cDate.getFullYear());
        if (cMonth) cMonth.created++;

        // Check completed (based on progressDate if Finish, or history)
        if (task.status === 'Done') {
            // Find finish date from history or fallback to progressDate
            const finishDate = task.history?.find(h => h.status === 'Finish')?.date || task.progressDate;
            const fDate = new Date(finishDate);
            const fMonth = months.find(m => m.month === fDate.getMonth() && m.year === fDate.getFullYear());
            if (fMonth) fMonth.completed++;
        }
    });
    return months;
  }, [tasks]);

  const maxChartValue = Math.max(...trendData.map(d => Math.max(d.created, d.completed)), 10); // Scale y-axis

  // --- DEPARTMENT STATS ---
  const getDepartmentStats = (dept: string) => {
    const deptTasks = tasks.filter(t => t.department === dept);
    const count = deptTasks.length;
    const total = tasks.length || 1; 
    const percent = Math.round((count / total) * 100);
    return { count, percent, overdue: deptTasks.filter(t => t.status === 'Overdue').length };
  };

  // --- UNDERPERFORMING USERS ---
  const underperformingUsers = users.map(user => {
      const userTasks = tasks.filter(t => t.assignees.includes(user.id));
      const total = userTasks.length;
      if (total === 0) return null; 

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

  const handlePrint = () => {
      window.print();
  };

  return (
    <>
    <div className="space-y-6 print:hidden">
      {/* HEADER ACTION */}
      <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Performance Dashboard</h3>
          </div>
          <button 
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
             <FileBarChart size={16} /> Generate BOD Report
          </button>
      </div>

      {/* STATS CARDS ROW */}
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

      {/* --- CHARTS ROW (NEW) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. PRODUCTIVITY TREND CHART */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BarChart size={20}/></div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Productivity Trend</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks Created vs Completed (6 Bulan Terakhir)</p>
                </div>
             </div>
             
             {/* CSS Bar Chart Implementation */}
             <div className="flex-1 flex items-end gap-4 min-h-[200px] pb-6 border-b border-slate-100">
                {trendData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full flex items-end justify-center gap-1 h-[180px] relative">
                            {/* Created Bar */}
                            <div 
                                style={{ height: `${(data.created / maxChartValue) * 100}%` }} 
                                className="w-3 md:w-6 bg-indigo-200 rounded-t-sm relative group-hover:bg-indigo-300 transition-all"
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">{data.created}</div>
                            </div>
                            {/* Completed Bar */}
                            <div 
                                style={{ height: `${(data.completed / maxChartValue) * 100}%` }} 
                                className="w-3 md:w-6 bg-indigo-600 rounded-t-sm relative group-hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">{data.completed}</div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{data.label}</span>
                    </div>
                ))}
             </div>
             <div className="flex justify-center gap-6 mt-4">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="w-3 h-3 bg-indigo-200 rounded-sm"></div> Created
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Completed
                 </div>
             </div>
        </div>

        {/* 2. STATUS DISTRIBUTION CHART (DONUT) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><PieChart size={20}/></div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Status Ratio</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Distribution</p>
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center">
                <div 
                    className="w-48 h-48 rounded-full flex items-center justify-center relative shadow-inner"
                    style={{
                        background: `conic-gradient(
                            #10b981 0% ${Math.round((doneTasks/totalTasks)*100)}%, 
                            #6366f1 ${Math.round((doneTasks/totalTasks)*100)}% ${Math.round((doneTasks/totalTasks)*100) + Math.round((activeTasks/totalTasks)*100)}%, 
                            #ef4444 ${Math.round((doneTasks/totalTasks)*100) + Math.round((activeTasks/totalTasks)*100)}% 100%
                        )`
                    }}
                >
                    <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-3xl font-black text-slate-800">{totalTasks}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Tasks</span>
                    </div>
                </div>
                
                <div className="w-full mt-6 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2 font-bold text-slate-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Selesai</span>
                        <span className="font-bold text-slate-800">{Math.round((doneTasks/totalTasks)*100) || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2 font-bold text-slate-600"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Active</span>
                        <span className="font-bold text-slate-800">{Math.round((activeTasks/totalTasks)*100) || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2 font-bold text-slate-600"><div className="w-2 h-2 rounded-full bg-red-500"></div> Overdue</span>
                        <span className="font-bold text-slate-800">{Math.round((overdueTasks/totalTasks)*100) || 0}%</span>
                    </div>
                </div>
             </div>
        </div>

      </div>

      {/* --- BOTTOM ROW --- */}
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

    {/* --- REPORT PRINT VIEW (MODAL FIXED) --- */}
    {showReport && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col">
            {/* TOOLBAR (Always Visible) */}
            <div className="bg-slate-800 p-4 shadow-lg flex justify-between items-center shrink-0 print:hidden z-50 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <FileBarChart size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">BOD Report Preview</h3>
                        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Ready to Print</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 transition-all shadow-lg"
                    >
                        <Printer size={16} /> Print / PDF
                    </button>
                    <button 
                        onClick={() => setShowReport(false)} 
                        className="flex items-center gap-2 bg-slate-700 text-slate-300 px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-slate-600 hover:text-white transition-all"
                    >
                        <X size={16} /> Close
                    </button>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 flex justify-center bg-slate-900/50">
                {/* A4 PAPER */}
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl relative animate-in zoom-in-95 duration-300">
                    
                    {/* --- PRINT CONTENT --- */}
                    <div className="text-slate-900 font-sans">
                        {/* Header */}
                        <div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">EXECUTIVE SUMMARY</h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Daniswara Operational Report</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                                <p className="text-xs text-slate-400 uppercase">Generated on {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Overview Stats */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="p-4 bg-slate-50 border border-slate-100">
                                <span className="block text-2xl font-black">{totalTasks}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Projects</span>
                            </div>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700">
                                <span className="block text-2xl font-black">{Math.round((doneTasks/totalTasks)*100) || 0}%</span>
                                <span className="text-[10px] uppercase font-bold text-emerald-600">Completion Rate</span>
                            </div>
                            <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700">
                                    <span className="block text-2xl font-black">{activeTasks}</span>
                                    <span className="text-[10px] uppercase font-bold text-indigo-600">Ongoing</span>
                            </div>
                            <div className="p-4 bg-red-50 border border-red-100 text-red-700">
                                    <span className="block text-2xl font-black">{overdueTasks}</span>
                                    <span className="text-[10px] uppercase font-bold text-red-600">Critical / Overdue</span>
                            </div>
                        </div>

                        {/* Charts Area for Report */}
                        <div className="mb-10 grid grid-cols-2 gap-8">
                             <div>
                                <h3 className="text-sm font-bold border-l-4 border-indigo-600 pl-3 mb-4 uppercase">Task Status Ratio</h3>
                                <div className="p-6 bg-slate-50 border border-slate-100 flex items-center gap-6">
                                    <div className="relative w-24 h-24 rounded-full border-4 border-indigo-200">
                                         <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600">{totalTasks}</div>
                                    </div>
                                    <div className="text-xs space-y-2">
                                        <div className="font-bold text-emerald-600">Done: {Math.round((doneTasks/totalTasks)*100) || 0}%</div>
                                        <div className="font-bold text-indigo-600">Active: {Math.round((activeTasks/totalTasks)*100) || 0}%</div>
                                        <div className="font-bold text-red-600">Overdue: {Math.round((overdueTasks/totalTasks)*100) || 0}%</div>
                                    </div>
                                </div>
                             </div>
                             <div>
                                <h3 className="text-sm font-bold border-l-4 border-slate-800 pl-3 mb-4 uppercase">Top Issue</h3>
                                <div className="p-6 bg-red-50 border border-red-100 h-full flex flex-col justify-center">
                                    <div className="text-3xl font-black text-red-600 mb-1">{overdueTasks}</div>
                                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest">Tasks Overdue / Macet</div>
                                </div>
                             </div>
                        </div>

                        {/* Department Health */}
                        <div className="mb-10">
                            <h3 className="text-lg font-bold border-l-4 border-slate-800 pl-3 mb-4 uppercase">Department Health Check</h3>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="p-3">Department</th>
                                        <th className="p-3 text-center">Load</th>
                                        <th className="p-3 text-center">Overdue</th>
                                        <th className="p-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {departments.map(dept => {
                                        const stats = getDepartmentStats(dept.key);
                                        const health = stats.overdue > 2 ? 'CRITICAL' : stats.overdue > 0 ? 'WARNING' : 'HEALTHY';
                                        const healthColor = health === 'HEALTHY' ? 'text-emerald-600' : health === 'CRITICAL' ? 'text-red-600' : 'text-amber-500';
                                        
                                        return (
                                            <tr key={dept.key}>
                                                <td className="p-3 font-bold">{dept.name}</td>
                                                <td className="p-3 text-center">{stats.count} Tasks</td>
                                                <td className="p-3 text-center font-bold text-red-500">{stats.overdue}</td>
                                                <td className={`p-3 text-right font-black ${healthColor}`}>{health}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Bottlenecks / Overdue Projects */}
                        <div className="mb-10">
                                <h3 className="text-lg font-bold border-l-4 border-red-500 pl-3 mb-4 uppercase text-red-600">Critical Bottlenecks (Overdue)</h3>
                                {overdueTasks === 0 ? (
                                    <div className="p-4 bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100 text-center">
                                        ✅ No critical bottlenecks. All projects are on track.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm text-left border border-slate-200">
                                        <thead className="bg-red-50 text-red-700 font-bold text-xs uppercase">
                                            <tr>
                                                <th className="p-2">Task Name</th>
                                                <th className="p-2">Assignee</th>
                                                <th className="p-2 text-right">Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.filter(t => t.status === 'Overdue').map(t => {
                                                const assigneeNames = t.assignees.map(uid => users.find(u => u.id === uid)?.name).join(', ');
                                                return (
                                                    <tr key={t.id} className="border-b border-slate-100">
                                                        <td className="p-2 font-medium">{t.title}</td>
                                                        <td className="p-2 text-slate-500">{assigneeNames}</td>
                                                        <td className="p-2 text-right font-bold text-red-500">{t.endDate.toLocaleDateString('id-ID')}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                        </div>

                        {/* Signature Area */}
                        <div className="mt-20 grid grid-cols-2 gap-20 break-inside-avoid">
                            <div className="text-center">
                                <div className="h-24 border-b border-slate-300"></div>
                                <p className="mt-2 font-bold uppercase text-xs text-slate-500">Prepared By (Manager)</p>
                            </div>
                            <div className="text-center">
                                <div className="h-24 border-b border-slate-300"></div>
                                <p className="mt-2 font-bold uppercase text-xs text-slate-500">Acknowledged By (Director)</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )}
    </>
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