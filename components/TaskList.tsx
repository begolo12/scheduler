import React, { useState } from 'react';
import { Search, Filter, Plus, Pencil, Trash2, Folder, List, Download } from 'lucide-react';
import { Task, Role, Project } from '../types';

interface TaskListProps {
    tasks: Task[];
    projects: Project[];
    onNewTask: () => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    userRole: Role;
    filterStatus: 'ALL' | 'ACTIVE' | 'DONE' | 'OVERDUE';
    setFilterStatus: (status: 'ALL' | 'ACTIVE' | 'DONE' | 'OVERDUE') => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
    tasks, 
    projects,
    onNewTask, 
    onEditTask, 
    onDeleteTask,
    onEditProject,
    onDeleteProject,
    userRole,
    filterStatus,
    setFilterStatus
}) => {
  const [viewMode, setViewMode] = useState<'TASKS' | 'PROJECTS'>('TASKS');
  
  const filteredTasks = tasks.filter(task => {
      if (filterStatus === 'ALL') return true; 
      if (filterStatus === 'ACTIVE') return task.status === 'Active';
      if (filterStatus === 'DONE') return task.status === 'Done';
      if (filterStatus === 'OVERDUE') return task.status === 'Overdue';
      return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
         
         {/* Top Controls: Switcher & Search */}
         <div className="flex flex-col md:flex-row gap-3 w-full">
             <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                <button 
                    onClick={() => setViewMode('TASKS')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'TASKS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <List size={16} /> TASKS
                </button>
                <button 
                    onClick={() => setViewMode('PROJECTS')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'PROJECTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Folder size={16} /> PROJECTS
                </button>
             </div>

             <div className="flex items-center gap-2 flex-1 w-full">
                 <div className="flex items-center px-4 py-2.5 bg-slate-50 rounded-xl flex-1 gap-3 border border-slate-100">
                    <Search className="text-slate-300 shrink-0" size={20} />
                    <input 
                        type="text" 
                        placeholder={viewMode === 'TASKS' ? "Cari task..." : "Cari project..."}
                        className="w-full outline-none text-sm font-medium text-slate-600 placeholder:text-slate-300 bg-transparent min-w-0"
                    />
                 </div>
                 {viewMode === 'TASKS' && (
                    <button 
                        onClick={onNewTask}
                        className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors shrink-0"
                        title="Tambah Task Baru"
                    >
                        <Plus size={20} />
                    </button>
                 )}
             </div>
         </div>

         {/* Filters (Only for Tasks) */}
         {viewMode === 'TASKS' && (
             <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
                 <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white whitespace-nowrap shrink-0">
                     <Filter size={12} /> Filter
                 </div>
                 
                 {['SEMUA', 'AKTIF', 'SELESAI', 'OVERDUE'].map((status) => {
                     const value = status === 'SEMUA' ? 'ALL' : status === 'AKTIF' ? 'ACTIVE' : status === 'SELESAI' ? 'DONE' : 'OVERDUE';
                     const active = filterStatus === value;
                     
                     return (
                        <button 
                            key={status}
                            onClick={() => setFilterStatus(value)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap shrink-0 ${
                                active 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            {status}
                        </button>
                     );
                 })}
             </div>
         )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            {viewMode === 'TASKS' ? (
                // --- TASK TABLE ---
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Status</th>
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task</th>
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</th>
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deadline</th>
                            <th className="px-8 py-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm italic">
                                    Tidak ada task dengan filter ini.
                                </td>
                            </tr>
                        ) : (
                            filteredTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                            task.status === 'Active' ? 'bg-indigo-100 text-indigo-700' :
                                            task.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">{task.title}</span>
                                            {task.attachment && (
                                                <span className="text-[9px] text-indigo-500 font-bold flex items-center gap-1 mt-1">
                                                    <Download size={10} /> Has Attachment
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-semibold text-slate-500 uppercase">{task.department}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-medium text-slate-500">
                                            {task.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {task.attachment && (
                                                <a 
                                                    href={task.attachment.url} 
                                                    download={task.attachment.name}
                                                    className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
                                                    title="Download File"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download size={14} />
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => onEditTask(task)}
                                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                                title="Edit / View"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteTask(task.id)}
                                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            ) : (
                // --- PROJECT TABLE ---
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Status</th>
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</th>
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                            <th className="px-8 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline</th>
                            <th className="px-8 py-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm italic">
                                    Tidak ada project.
                                </td>
                            </tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600">
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-black text-slate-800 uppercase tracking-wide">{project.title}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-semibold text-slate-500 uppercase">{project.department}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-medium text-slate-500">
                                            {project.startDate.toLocaleDateString('id-ID')} - {project.endDate.toLocaleDateString('id-ID')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => onEditProject(project)}
                                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                                title="Edit Project"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteProject(project.id)}
                                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                                                title="Delete Project"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskList;