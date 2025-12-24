import React from 'react';
import { Plus, Trash2, Edit2, Mail, MessageCircle } from 'lucide-react';
import { User, Role } from '../types';

interface TeamRegistryProps {
    users: User[];
    onNewPersonnel: () => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    currentUserRole: Role;
}

const TeamRegistry: React.FC<TeamRegistryProps> = ({ users, onNewPersonnel, onEditUser, onDeleteUser, currentUserRole }) => {
  
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
            <h2 className="text-2xl font-bold text-slate-900">Kelola User</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Personnel Access Management</p>
        </div>
        <button 
            onClick={onNewPersonnel}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all uppercase"
        >
            <Plus size={18} /> Tambah User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {users.map((user) => (
            <div key={user.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center hover:-translate-y-1 transition-transform duration-300 group relative">
                
                {/* Actions Overlay - Always visible for Admin */}
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

                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                    <span className="text-3xl font-black text-indigo-600">{user.initial}</span>
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
                            <span className="text-[10px] font-bold">Chat</span>
                        </a>
                    ) : (
                        <span className="text-[9px] text-slate-300 italic">No Phone</span>
                    )}
                </div>

                <div className="flex w-full justify-between px-4">
                    <div className="text-center">
                        <span className="block text-xl font-bold text-slate-800">{user.tasksActive}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tasks</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-xl font-bold text-emerald-500">{user.tasksDone}</span>
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default TeamRegistry;