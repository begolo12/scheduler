import React, { useEffect, useState } from 'react';
import { X, FolderPlus, UploadCloud, FileText, Trash2, Download, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DEPARTMENTS, TELEGRAM_BOT_TOKEN } from '../constants';
import { Task, User, Department, Role, Project, TaskProgress, FileAttachment } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}

export const ModalWrapper: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children, actionLabel, onAction }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-8 border-b border-slate-50 flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase">{title}</h2>
            {subtitle && <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {children}
        </div>

        <div className="p-8 pt-0 flex justify-end gap-4 sticky bottom-0 bg-white pb-8 z-10">
          <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">
            Cancel
          </button>
          <button onClick={onAction} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PROJECT MODAL ---
interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Partial<Project>) => void;
    initialData?: Project;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState<Department>('General');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setDepartment(initialData.department);
                setStartDate(initialData.startDate.toISOString().split('T')[0]);
                setEndDate(initialData.endDate.toISOString().split('T')[0]);
            } else {
                setTitle('');
                setDepartment('General');
                setStartDate('');
                setEndDate('');
            }
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        if (!title || !startDate || !endDate) {
            alert("Mohon lengkapi data project");
            return;
        }
        onSave({
            id: initialData?.id,
            title,
            department,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'Active'
        });
        onClose();
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Project" : "New Main Project"} subtitle="Create Project Container" actionLabel={initialData ? "Update Project" : "Create Project"} onAction={handleSave}>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Contoh: HRMS System, Website Revamp..."
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
                />
            </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department Owner</label>
                <select 
                    value={department}
                    onChange={e => setDepartment(e.target.value as Department)}
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none"
                >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none" />
                </div>
            </div>
        </ModalWrapper>
    );
};

// --- TASK MODAL ---
interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<Task>) => void;
    initialData?: Task;
    users: User[];
    projects: Project[];
    currentUser?: User | null; 
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialData, users, projects, currentUser }) => {
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState<Department>('General');
  const [status, setStatus] = useState<'Active' | 'Done'>('Active');
  const [progress, setProgress] = useState<TaskProgress>('Not Started');
  const [assignee, setAssignee] = useState<string>('');
  
  // File Upload State
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<string>('');

  useEffect(() => {
    if (initialData) {
        setProjectId(initialData.projectId || '');
        setTitle(initialData.title);
        setStartDate(initialData.startDate.toISOString().split('T')[0]);
        setEndDate(initialData.endDate.toISOString().split('T')[0]);
        setDepartment(initialData.department);
        setStatus(initialData.status === 'Overdue' ? 'Active' : initialData.status as any);
        setAssignee(initialData.assignees[0] || '');
        setProgress(initialData.progress || 'Not Started');
        if (initialData.attachment) {
            setFileName(initialData.attachment.name);
            setFileData(initialData.attachment.url);
        } else {
            setFileName('');
            setFileData('');
        }
    } else {
        setProjectId(projects.length > 0 ? projects[0].id : '');
        setTitle('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
        setDepartment('General');
        setStatus('Active');
        setProgress('Not Started'); // Default to Not Started
        setAssignee('');
        setFileName('');
        setFileData('');
    }
  }, [initialData, isOpen, projects]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFileName(file.name);
              setFileData(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = () => {
      if (!projectId) {
          alert("Pilih Main Project terlebih dahulu.");
          return;
      }

      // Check if progress changed to update progressDate and History
      let progressDate = initialData?.progressDate || new Date();
      let history = initialData?.history || [];

      // Logic: If progress is different from before, add to history
      if (initialData && progress !== initialData.progress) {
          progressDate = new Date(); // Update to current time
          if (progress !== 'Not Started') {
              history = [...history, { status: progress, date: new Date(), updatedBy: currentUser?.id || 'system' }];
          }
      } else if (!initialData && progress !== 'Not Started') {
          // New task starting with status
          progressDate = new Date();
          history = [{ status: progress, date: new Date(), updatedBy: currentUser?.id || 'system' }];
      }

      // Prepare Attachment Logic
      let attachment: FileAttachment | null = initialData?.attachment || null;

      if (fileData) {
          attachment = {
              name: fileName,
              url: fileData,
              uploadedAt: new Date()
          };
      } else if (!fileName) {
          attachment = null;
      }

      onSave({
          id: initialData?.id,
          projectId,
          title,
          department,
          status,
          progress,
          progressDate,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          assignees: assignee ? [assignee] : [],
          attachment,
          history
      });
      onClose();
  };

  const handleProgressChange = (newProgress: TaskProgress) => {
      setProgress(newProgress);
      // Auto-sync status based on progress
      if (newProgress === 'Finish') {
          setStatus('Done');
      } else {
          setStatus('Active');
      }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Task" : "New Task"} subtitle="Operational Parameter" actionLabel="Simpan Data" onAction={handleSave}>
       
       {/* Project Selector */}
       <div className="space-y-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Project</label>
         <div className="relative">
             <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)}
                disabled={!!initialData} // Disable changing project on edit for simplicity
                className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none"
             >
                 <option value="" disabled>-- Pilih Project --</option>
                 {projects.map(p => (
                     <option key={p.id} value={p.id}>{p.title}</option>
                 ))}
             </select>
             {!initialData && projects.length === 0 && <p className="text-[10px] text-red-500 mt-1">* Belum ada project. Buat project dulu di Schedule.</p>}
         </div>
       </div>

       {/* Task Name */}
       <div className="space-y-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Name</label>
         <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Sub-task / Pekerjaan..."
            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
         />
       </div>

       {/* Dates */}
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Start</label>
            <div className="relative">
                <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deadline</label>
            <div className="relative">
                <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                />
            </div>
          </div>
       </div>

       {/* Division, Progress & Status */}
       <div className="space-y-2">
         <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Division Unit</label>
                <select 
                    value={department}
                    onChange={e => setDepartment(e.target.value as Department)}
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none"
                >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Task Progress</label>
                <select 
                    value={progress}
                    onChange={e => handleProgressChange(e.target.value as TaskProgress)}
                    // enabled for edit to change status, enabled for new to set initial status
                    className={`w-full border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none bg-slate-50`}
                >
                    <option value="Not Started">Belum Start</option>
                    <option value="Start">Start (S)</option>
                    <option value="Draft">Draft/Cek (D)</option>
                    <option value="Revisi">Revisi (R)</option>
                    <option value="Finish">Selesai (F)</option>
                </select>
            </div>
         </div>
       </div>

       {/* FILE UPLOAD & VIEW */}
       <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                <UploadCloud size={12} /> Bukti Pengerjaan
            </label>
            <div className="border-2 border-dashed border-indigo-100 rounded-xl p-4 bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                {fileName ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-700">
                            <FileText size={16} />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold truncate max-w-[200px]">{fileName}</span>
                                <a href={fileData} download={fileName} className="text-[9px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-0.5">
                                    <Download size={8} /> Download
                                </a>
                            </div>
                        </div>
                        {progress === 'Draft' && (
                            <button onClick={() => { setFileName(''); setFileData(''); }} className="text-red-400 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ) : (
                    progress === 'Draft' ? (
                        <div className="relative flex flex-col items-center justify-center text-center">
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-indigo-400 font-medium">Klik untuk upload file</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 text-center italic">Tidak ada file terlampir</p>
                    )
                )}
            </div>
            {fileName && <p className="text-[9px] text-slate-400 italic text-right">*File akan otomatis terhapus H+7 dari Deadline</p>}
       </div>

       {/* Personnel */}
       <div className="space-y-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignee</label>
         <select 
            value={assignee} 
            onChange={e => setAssignee(e.target.value)}
            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none"
         >
             <option value="">-- Pilih Personel --</option>
             {users.map(u => (
                 <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
             ))}
         </select>
       </div>
    </ModalWrapper>
  );
};

export const NewPersonnelModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (u: any) => void; initialData?: User }> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('Staff');
  const [department, setDepartment] = useState<Department>('General');
  const [email, setEmail] = useState(''); 
  const [phone, setPhone] = useState(''); // WhatsApp
  const [telegramChatId, setTelegramChatId] = useState(''); // Telegram
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
      if (isOpen) {
          if (initialData) {
              setName(initialData.name);
              setUsername(initialData.username);
              setRole(initialData.role);
              setDepartment(initialData.department);
              setEmail(initialData.email || '');
              setPhone(initialData.phone || '');
              setTelegramChatId(initialData.telegramChatId || '');
          } else {
              setName('');
              setUsername('');
              setRole('Staff');
              setDepartment('General');
              setEmail('');
              setPhone('');
              setTelegramChatId('');
          }
      }
      setFetchError('');
  }, [isOpen, initialData]);

  const handleSave = () => {
      onSave({ name, username, role, department, email, phone, telegramChatId });
      onClose();
  };

  // --- AUTO CHECK TELEGRAM ID ---
  const handleCheckTelegramId = async () => {
    setIsCheckingId(true);
    setFetchError('');
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
        const data = await response.json();
        
        if (data.ok && data.result.length > 0) {
            // Get the LAST message received by the bot
            const lastUpdate = data.result[data.result.length - 1];
            
            if (lastUpdate.message && lastUpdate.message.chat) {
                const chatId = lastUpdate.message.chat.id;
                const senderName = lastUpdate.message.from.first_name;
                
                setTelegramChatId(chatId.toString());
                setFetchError(`Berhasil! ID dari user: ${senderName}`);
            } else {
                setFetchError("Format pesan tidak dikenali.");
            }
        } else {
            setFetchError("Bot belum menerima pesan baru. Silakan chat 'Halo' ke bot lalu coba lagi.");
        }
    } catch (e) {
        setFetchError("Gagal menghubungi server Telegram.");
        console.error(e);
    } finally {
        setIsCheckingId(false);
    }
  };

  return (
    <ModalWrapper 
        isOpen={isOpen} 
        onClose={onClose} 
        title={initialData ? "Edit Personel" : "Tambah Personel"} 
        actionLabel={initialData ? "Simpan Perubahan" : "Daftarkan Personel"} 
        onAction={handleSave}
    >
       <div className="space-y-4">
         <input 
            type="text" 
            placeholder="Nama Lengkap"
            value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
         />
         <div className="grid grid-cols-2 gap-4">
             <input 
                type="text" 
                placeholder="Username"
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
             />
             <input 
                type="email" 
                placeholder="Email Address"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
             />
         </div>
         
         <div className="grid grid-cols-2 gap-4">
             <input 
                type="tel" 
                placeholder="WhatsApp (628...)"
                value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
             />
             <div className="space-y-1">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Telegram ID"
                        value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)}
                        className="w-full bg-sky-50 border border-sky-100 focus:bg-white focus:border-sky-300 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-sky-300"
                    />
                    <button 
                        onClick={handleCheckTelegramId}
                        disabled={isCheckingId}
                        className="px-3 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200 transition-colors flex items-center justify-center shadow-sm"
                        title="Cari ID Otomatis (Chat bot dulu!)"
                    >
                        {isCheckingId ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                </div>
             </div>
         </div>
         
         {/* Instruction / Status Message for Telegram */}
         <div className="text-[10px] italic">
            {fetchError ? (
                <span className={fetchError.includes('Berhasil') ? "text-emerald-500 font-bold" : "text-red-400"}>
                    {fetchError}
                </span>
            ) : (
                <span className="text-slate-400">
                   *Untuk Auto-Detect: Chat bot di Telegram, lalu klik tombol ceklis.
                </span>
            )}
         </div>

         {!initialData && (
             <div className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 text-center">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Password Awal: 123</span>
             </div>
         )}
         
         <div className="grid grid-cols-2 gap-4">
            <div className="relative">
                <select 
                    value={role} onChange={e => setRole(e.target.value as Role)}
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none appearance-none"
                >
                    <option value="Staff">Staff</option>
                    <option value="Spv">Supervisor (SPV)</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                </select>
            </div>

            <div className="relative">
                <select 
                    value={department} onChange={e => setDepartment(e.target.value as Department)}
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none appearance-none"
                >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
         </div>

       </div>
    </ModalWrapper>
  );
};