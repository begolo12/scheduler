import React, { useEffect, useState } from 'react';
import { X, Bell, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  relatedTaskId?: string; // Added to carry ID
}

interface ToasterProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
  onToastClick: (taskId?: string) => void; // New prop
}

const Toaster: React.FC<ToasterProps> = ({ toasts, onClose, onToastClick }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="bg-white w-80 shadow-2xl rounded-lg border border-slate-100 overflow-hidden pointer-events-auto animate-in slide-in-from-right duration-300 relative group"
        >
          {/* Header Windows Style */}
          <div className="bg-slate-50 px-3 py-2 flex justify-between items-center border-b border-slate-100">
             <div className="flex items-center gap-2">
                 <div className={`p-1 rounded-full ${
                     toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                     toast.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                     'bg-indigo-100 text-indigo-600'
                 }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={10} /> : 
                     toast.type === 'warning' ? <AlertCircle size={10} /> : 
                     <Bell size={10} />}
                 </div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daniswara Notif</span>
             </div>
             <button 
                onClick={(e) => { e.stopPropagation(); onClose(toast.id); }}
                className="text-slate-400 hover:text-slate-700 transition-colors"
             >
                 <X size={14} />
             </button>
          </div>

          {/* Body */}
          <div 
            className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" 
            onClick={() => {
                if (toast.relatedTaskId) {
                    onToastClick(toast.relatedTaskId);
                }
                onClose(toast.id);
            }}
          >
              <h4 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{toast.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{toast.message}</p>
              <p className="text-[9px] text-slate-300 mt-2 text-right font-medium">{toast.time}</p>
          </div>
          
          {/* Progress bar effect (Optional visual flair) */}
          <div className={`h-1 w-full ${
               toast.type === 'success' ? 'bg-emerald-500' :
               toast.type === 'warning' ? 'bg-amber-500' :
               'bg-indigo-500'
          }`}></div>
        </div>
      ))}
    </div>
  );
};

export default Toaster;