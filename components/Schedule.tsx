import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, FolderPlus } from 'lucide-react';
import { Task, Role, Project, TaskProgress } from '../types';
import { HOLIDAYS } from '../constants';

interface ScheduleProps {
    projects: Project[];
    tasks: Task[];
    onNewTask: () => void;
    onNewProject: () => void;
    onEditTask: (task: Task) => void;
    userRole: Role;
}

const Schedule: React.FC<ScheduleProps> = ({ projects, tasks, onNewTask, onNewProject, onEditTask, userRole }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // Dec 2025
  const [filter, setFilter] = useState('ALL');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filters = ['ALL', 'GENERAL', 'BUSDEV', 'OPERASI', 'KEUANGAN'];
  const filteredProjects = filter === 'ALL' 
    ? projects 
    : projects.filter(p => p.department.toUpperCase() === filter);

  // --- HELPER FUNCTIONS ---

  const getHolidayInfo = (day: number, month: number, year: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const holiday = HOLIDAYS.find(h => h.date === dateStr);
      const dateObj = new Date(year, month, day);
      const isSunday = dateObj.getDay() === 0;

      if (holiday) return { isRed: true, name: holiday.name };
      if (isSunday) return { isRed: true, name: 'Hari Minggu' };
      return { isRed: false, name: '' };
  };

  // Check if date is in current view month
  const isDateInMonth = (date: Date) => {
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  // Marker Helpers
  const getMarkerColor = (status: TaskProgress) => {
      switch(status) {
          case 'Start': return 'bg-emerald-600 border-emerald-100';
          case 'Draft': return 'bg-blue-500 border-blue-100';
          case 'Revisi': return 'bg-amber-500 border-amber-100';
          case 'Finish': return 'bg-slate-800 border-slate-200';
          default: return 'bg-gray-400';
      }
  };

  const getMarkerLabel = (status: TaskProgress) => {
      switch(status) {
          case 'Start': return 'S';
          case 'Draft': return 'D';
          case 'Revisi': return 'R';
          case 'Finish': return 'F';
          default: return '';
      }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-colors ${filter === f ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white rounded"><ChevronLeft size={16} /></button>
                <span className="px-4 text-xs font-bold text-slate-600 uppercase tracking-wide min-w-[100px] text-center">
                    {currentDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </span>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white rounded"><ChevronRight size={16} /></button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onNewProject} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-slate-900 transition-all"><FolderPlus size={16} /> PROJECT</button>
                <button onClick={onNewTask} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"><Plus size={16} /> TASK</button>
            </div>
        </div>
      </div>

      {/* --- CSS GRID TIMELINE --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative h-[600px]">
        <div className="overflow-x-auto custom-scrollbar flex-1 flex flex-col h-full">
            <div className="min-w-[1400px] flex-1 flex flex-col h-full">
                
                {/* 1. TABLE HEADER */}
                <div className="flex h-16 border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
                    {/* Sticky Info Column */}
                    <div className="w-[340px] flex-shrink-0 flex items-center border-r border-slate-200 bg-white sticky left-0 z-50">
                        <div className="w-12 h-full flex items-center justify-center border-r border-slate-200 bg-slate-50">
                             <span className="text-[10px] font-black text-slate-400">NO</span>
                         </div>
                         <div className="flex-1 px-4">
                             <span className="text-xs font-black text-slate-500 uppercase tracking-widest">PROJECT / TASK</span>
                         </div>
                    </div>
                    
                    {/* Days Grid Header */}
                    <div 
                        className="flex-1 grid h-full bg-white" 
                        style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))` }}
                    >
                        {daysArray.map(day => {
                            const { isRed, name } = getHolidayInfo(day, currentDate.getMonth(), currentDate.getFullYear());
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const dayName = date.toLocaleDateString('id-ID', { weekday: 'narrow' });
                            return (
                                <div key={day} className={`flex flex-col items-center justify-center border-r border-slate-100 relative group ${isRed ? 'bg-red-50/50' : ''}`} title={name}>
                                    <span className={`text-sm font-bold ${isRed ? 'text-red-500' : 'text-slate-700'}`}>{day}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{dayName}</span>
                                    {isRed && <div className="absolute top-14 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{name}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. TABLE BODY */}
                <div className="relative flex-1 bg-white">
                    {/* Background Grid Lines (Absolute) */}
                    <div className="absolute inset-0 flex pointer-events-none z-0">
                         <div className="w-[340px] border-r border-slate-200 bg-white/50 sticky left-0 z-10"></div>
                         <div className="flex-1 grid h-full" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))` }}>
                            {daysArray.map(day => {
                                const { isRed } = getHolidayInfo(day, currentDate.getMonth(), currentDate.getFullYear());
                                return <div key={day} className={`border-r border-slate-100 h-full ${isRed ? 'bg-red-50/30' : ''}`}></div>;
                            })}
                         </div>
                    </div>

                    {/* Content Rows */}
                    <div className="relative z-10 pb-12">
                        {filteredProjects.map((project, pIndex) => {
                            const projectTasks = tasks.filter(t => t.projectId === project.id).sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
                            
                            return (
                                <React.Fragment key={project.id}>
                                    {/* Project Row */}
                                    <div className="flex h-10 border-b border-slate-200 bg-slate-100/80 sticky-left-wrapper">
                                        <div className="w-[340px] flex-shrink-0 flex items-center h-full border-r border-slate-200 bg-slate-100 sticky left-0 z-30">
                                            <div className="w-12 h-full flex items-center justify-center border-r border-slate-200 font-bold text-slate-600">{pIndex + 1}</div>
                                            <div className="flex-1 px-4 truncate font-black text-slate-700 text-xs uppercase tracking-wide">{project.title}</div>
                                        </div>
                                        <div className="flex-1"></div>
                                    </div>

                                    {/* Task Rows */}
                                    {projectTasks.map((task, tIndex) => {
                                        const isDone = task.status === 'Done';
                                        
                                        // DATE CALCULATIONS
                                        const s = new Date(task.startDate);
                                        const e = new Date(task.endDate);
                                        
                                        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

                                        // Determine if we should render this task in this view
                                        const today = new Date();
                                        today.setHours(0,0,0,0);
                                        
                                        // Check if overdue
                                        const isOverdue = !isDone && today > e;
                                        const effectiveEnd = isOverdue ? today : e;

                                        // Skip if no overlap
                                        if (effectiveEnd < monthStart || s > monthEnd) return null;

                                        // Calculate actual start from History if available
                                        const startHistory = task.history?.find(h => h.status === 'Start');
                                        let actualStart: Date | null = null;
                                        if (startHistory) actualStart = new Date(startHistory.date);
                                        else if (task.progress !== 'Not Started') actualStart = new Date(task.progressDate);

                                        // -- ORANGE ZONE LOGIC (Delay) --
                                        let orangeStartDay = 0;
                                        let orangeSpan = 0;
                                        let hasDelay = false;

                                        if (actualStart && actualStart > s) {
                                            hasDelay = true;
                                            const delayEnd = new Date(actualStart);
                                            delayEnd.setDate(delayEnd.getDate() - 1);

                                            const dStart = s < monthStart ? monthStart : s;
                                            const dEnd = delayEnd > monthEnd ? monthEnd : delayEnd;

                                            if (dEnd >= dStart && dEnd >= monthStart && dStart <= monthEnd) {
                                                orangeStartDay = dStart.getDate();
                                                orangeSpan = dEnd.getDate() - dStart.getDate() + 1;
                                            }
                                        }

                                        // -- GREEN ZONE LOGIC (Active/Plan) --
                                        const greenStartDate = hasDelay && actualStart ? actualStart : s;
                                        const gStart = greenStartDate < monthStart ? monthStart : greenStartDate;
                                        const gEnd = e > monthEnd ? monthEnd : e;

                                        let greenStartDay = 0;
                                        let greenSpan = 0;
                                        
                                        if (gEnd >= gStart && gEnd >= monthStart && gStart <= monthEnd) {
                                            greenStartDay = gStart.getDate();
                                            greenSpan = gEnd.getDate() - gStart.getDate() + 1;
                                        }

                                        // -- RED ZONE LOGIC (Overdue Extension) --
                                        let redStartDay = 0;
                                        let redSpan = 0;

                                        if (isOverdue) {
                                            const rStartObj = new Date(e);
                                            rStartObj.setDate(rStartObj.getDate() + 1); // Start after deadline

                                            const rStart = rStartObj < monthStart ? monthStart : rStartObj;
                                            const rEnd = today > monthEnd ? monthEnd : today;

                                            if (rEnd >= rStart && rEnd >= monthStart && rStart <= monthEnd) {
                                                redStartDay = rStart.getDate();
                                                redSpan = rEnd.getDate() - rStart.getDate() + 1;
                                            }
                                        }

                                        // Filter markers for current month view
                                        const markers = (task.history || []).filter(h => isDateInMonth(new Date(h.date)));

                                        return (
                                            <div key={task.id} className="flex h-10 border-b border-slate-100 hover:bg-indigo-50/10 transition-colors group relative">
                                                {/* Left Sticky Info */}
                                                <div className="w-[340px] flex-shrink-0 flex items-center h-full border-r border-slate-200 bg-white/95 sticky left-0 z-30 cursor-pointer" onClick={() => onEditTask(task)}>
                                                    <div className="w-12 h-full flex items-center justify-center border-r border-slate-200 text-[10px] font-bold text-slate-400">{pIndex + 1}.{tIndex + 1}</div>
                                                    <div className="flex-1 px-4 truncate">
                                                        <span className={`text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors pl-2 block border-l-2 border-slate-200 ${isDone ? 'line-through text-slate-400' : ''}`}>{task.title}</span>
                                                    </div>
                                                </div>

                                                {/* Grid Content */}
                                                <div 
                                                    className="flex-1 grid h-full items-center relative" 
                                                    style={{ 
                                                        gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))`,
                                                        gridTemplateRows: '1fr', // Force single row layout
                                                        alignItems: 'center' // Center content vertically
                                                    }}
                                                >
                                                    {/* ORANGE BAR (Delay) */}
                                                    {orangeSpan > 0 && (
                                                        <div 
                                                            className="h-5 bg-amber-400 rounded-l shadow-sm z-10 pointer-events-auto"
                                                            style={{ 
                                                                gridColumn: `${orangeStartDay} / span ${orangeSpan}`,
                                                                gridRow: '1 / -1', // Explicitly take full row height to force overlap
                                                                alignSelf: 'center'
                                                            }}
                                                            title="Keterlambatan Start (Delayed)"
                                                        ></div>
                                                    )}

                                                    {/* GREEN BAR (Plan/Active) */}
                                                    {greenSpan > 0 && (
                                                        <div 
                                                            className={`h-5 ${isDone ? 'bg-slate-400' : 'bg-emerald-500'} shadow-sm z-10 relative hover:opacity-90 cursor-pointer pointer-events-auto
                                                                ${orangeSpan > 0 ? 'rounded-l-none' : 'rounded-l'} 
                                                                ${redSpan > 0 ? 'rounded-r-none' : 'rounded-r'}`}
                                                            style={{ 
                                                                gridColumn: `${greenStartDay} / span ${greenSpan}`,
                                                                gridRow: '1 / -1', // Explicitly take full row height
                                                                alignSelf: 'center'
                                                            }}
                                                            onClick={() => onEditTask(task)}
                                                        ></div>
                                                    )}

                                                    {/* RED BAR (Overdue Extension) */}
                                                    {redSpan > 0 && (
                                                        <div 
                                                            className="h-5 bg-red-500 shadow-sm z-10 relative hover:opacity-90 cursor-pointer rounded-r rounded-l-none pointer-events-auto"
                                                            style={{ 
                                                                gridColumn: `${redStartDay} / span ${redSpan}`,
                                                                gridRow: '1 / -1', // Explicitly take full row height
                                                                alignSelf: 'center'
                                                            }}
                                                            title="Overdue (Berlanjut)"
                                                            onClick={() => onEditTask(task)}
                                                        ></div>
                                                    )}

                                                    {/* MARKERS (Overlay) */}
                                                    {markers.map((h, idx) => {
                                                        const col = new Date(h.date).getDate();
                                                        return (
                                                            <div 
                                                                key={idx}
                                                                className={`w-4 h-4 rounded-full ${getMarkerColor(h.status)} text-white flex items-center justify-center text-[8px] font-black z-20 absolute shadow-sm border-2 pointer-events-none`}
                                                                style={{ 
                                                                    gridColumn: `${col} / span 1`,
                                                                    gridRow: '1 / -1',
                                                                    alignSelf: 'center',
                                                                    justifySelf: 'center'
                                                                }}
                                                                title={`${h.status} pada ${new Date(h.date).toLocaleDateString()}`}
                                                            >
                                                                {getMarkerLabel(h.status)}
                                                            </div>
                                                        )
                                                    })}

                                                </div>
                                            </div>
                                        )
                                    })}
                                    
                                    {/* Add Task Placeholder */}
                                    {projectTasks.length === 0 && (
                                        <div className="flex h-10 border-b border-slate-100">
                                            <div className="w-[340px] flex-shrink-0 flex items-center h-full border-r border-slate-200 bg-white sticky left-0 z-30">
                                                <div className="w-12 h-full border-r border-slate-200"></div>
                                                <button onClick={onNewTask} className="flex-1 px-8 text-left text-[10px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-widest">+ Add Task</button>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;