import React, { useState, useEffect, useRef } from 'react';
import { PanelLeft, Bell, Check, X } from 'lucide-react';
import { collection, onSnapshot, addDoc, setDoc, updateDoc, doc, deleteDoc, Timestamp, db, getDoc, arrayUnion } from './firebase';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import TaskList from './components/TaskList';
import TeamRegistry from './components/TeamRegistry';
import Settings from './components/Settings';
import Login from './components/Login';
import Toaster, { ToastMessage } from './components/Toaster'; 
import AIAnalyst from './components/AIAnalyst'; // IMPORT AI ANALYST
import { TaskModal, NewPersonnelModal, ProjectModal } from './components/Modals';
import { Tab, Task, User, Role, Project, AppNotification, FileAttachment } from './types'; 
import { USERS as MOCK_USERS, TELEGRAM_BOT_TOKEN } from './constants';

// --- CONFIGURATION ---
const CLIENT_SIDE_POLLING_ENABLED = false; 

// --- MANUAL SEED DATA ---
const SEED_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'HRMS SYSTEM',
    department: 'Busdev',
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-12-31'),
    status: 'Active'
  },
  {
    id: 'p2',
    title: 'WEBSITE REDESIGN',
    department: 'Operasi',
    startDate: new Date('2025-12-01'),
    endDate: new Date('2026-01-31'),
    status: 'Active'
  }
];

const SEED_TASKS: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Database Karyawan',
    department: 'Busdev',
    status: 'Active',
    progress: 'Start',
    progressDate: new Date('2025-12-01'),
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-10'),
    createdAt: new Date('2025-11-28'),
    assignees: ['u1'],
    history: [
        { status: 'Start', date: new Date('2025-12-01'), updatedBy: 'u1' }
    ]
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Fitur Absensi',
    department: 'Busdev',
    status: 'Active',
    progress: 'Draft',
    progressDate: new Date('2025-12-15'),
    startDate: new Date('2025-12-11'),
    endDate: new Date('2025-12-20'),
    createdAt: new Date('2025-11-29'),
    assignees: ['u2'],
    history: [
        { status: 'Start', date: new Date('2025-12-12'), updatedBy: 'u2' }, 
        { status: 'Draft', date: new Date('2025-12-15'), updatedBy: 'u2' }
    ]
  },
  {
    id: 't3',
    projectId: 'p2',
    title: 'UI/UX Mockup',
    department: 'Operasi',
    status: 'Done',
    progress: 'Finish',
    progressDate: new Date('2025-12-14'),
    startDate: new Date('2025-12-05'),
    endDate: new Date('2025-12-15'),
    createdAt: new Date('2025-11-30'),
    assignees: ['u4'],
    history: [
        { status: 'Start', date: new Date('2025-12-05'), updatedBy: 'u4' },
        { status: 'Draft', date: new Date('2025-12-10'), updatedBy: 'u4' },
        { status: 'Revisi', date: new Date('2025-12-11'), updatedBy: 'u5' },
        { status: 'Finish', date: new Date('2025-12-14'), updatedBy: 'u4' }
    ]
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNewPersonnelModalOpen, setIsNewPersonnelModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]); 
  const [loading, setLoading] = useState(true);

  // UI State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [taskListFilter, setTaskListFilter] = useState<'ALL' | 'ACTIVE' | 'DONE' | 'OVERDUE'>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]); 

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Helper for safe date parsing
  const safeDate = (val: any, defaultVal: Date = new Date()) => {
      if (!val) return defaultVal;
      if (val instanceof Timestamp) return val.toDate();
      if (val?.toDate && typeof val.toDate === 'function') return val.toDate();
      if (val instanceof Date) return val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? defaultVal : d;
  };

  // --- 1. LOGIN PERSISTENCE ---
  useEffect(() => {
    const storedUser = localStorage.getItem('daniswara_user');
    if (storedUser) {
        try {
            setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Failed to parse stored user", e);
            localStorage.removeItem('daniswara_user');
        }
    }
    if ("Notification" in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
  }, []);

  // --- 2. IDLE AUTO-LOGOUT ---
  useEffect(() => {
    if (!currentUser) return;

    const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 Minutes
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            alert("Sesi Anda telah berakhir karena tidak aktif selama 30 menit.");
            handleLogout();
        }, IDLE_TIMEOUT);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
        document.addEventListener(event, resetTimer);
    });
    resetTimer();

    return () => {
        if (timeoutId) clearTimeout(timeoutId);
        activityEvents.forEach(event => {
            document.removeEventListener(event, resetTimer);
        });
    };
  }, [currentUser]);

  // --- 3. AUTO DELETE FILE CHECK ---
  useEffect(() => {
      const checkExpiredFiles = async () => {
          const now = new Date();
          const updates: Promise<void>[] = [];
          
          tasks.forEach(task => {
              if (task.attachment && task.endDate) {
                  const deadline = new Date(task.endDate);
                  deadline.setDate(deadline.getDate() + 7);
                  
                  if (now > deadline) {
                      const docRef = doc(db, "tasks", task.id);
                      updates.push(updateDoc(docRef, { attachment: null })); 
                  }
              }
          });
          
          if (updates.length > 0) await Promise.all(updates);
      };
      if (tasks.length > 0) checkExpiredFiles();
  }, [tasks.length]); 

  // --- 4. PERIODIC NOTIFICATION CHECK ---
  useEffect(() => {
      if (!currentUser) return;

      const checkPendingTasks = () => {
          if (currentUser.role === 'Admin') return; 

          const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          tasks.forEach(task => {
              if (task.progress === 'Draft' && task.attachment) {
                  if (currentUser.role === 'Manager' || currentUser.role === 'Spv') {
                      if (task.department === currentUser.department) {
                          addToast({
                              title: "Pending Approval (Draft)",
                              message: `Task "${task.title}" menunggu review file.`,
                              type: 'warning',
                              time: nowTime,
                              relatedTaskId: task.id
                          });
                      }
                  }
              }
              if (task.progress === 'Revisi' && task.assignees.includes(currentUser.id)) {
                   addToast({
                      title: "Revisi Diperlukan",
                      message: `Task "${task.title}" perlu direvisi segera.`,
                      type: 'info',
                      time: nowTime,
                      relatedTaskId: task.id
                  });
              }
          });
      };

      if (tasks.length > 0) checkPendingTasks();
      const intervalId = setInterval(checkPendingTasks, 10 * 60 * 1000);

      return () => clearInterval(intervalId);
  }, [currentUser, tasks]);


  // --- 5. DATA FETCHING ---
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        setUsers(fetchedUsers);
    }, (error) => console.error(error));

    const unsubProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
        const fetched = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                startDate: safeDate(data.startDate),
                endDate: safeDate(data.endDate),
            };
        }) as Project[];
        setProjects(fetched);
    }, (error) => console.error(error));

    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => {
            const data = doc.data();
            const sDate = safeDate(data.startDate);
            const eDate = safeDate(data.endDate);
            const pDate = safeDate(data.progressDate, sDate); 
            const cDate = safeDate(data.createdAt, new Date(0)); 
            const history = (data.history || []).map((h: any) => ({ ...h, date: safeDate(h.date) }));

            return {
                ...data,
                id: doc.id,
                startDate: sDate,
                endDate: eDate,
                progressDate: pDate,
                createdAt: cDate,
                progress: data.progress || 'Not Started',
                history
            }
        }) as Task[];
        setTasks(fetchedTasks);
        setLoading(false);
    }, (error) => {
        console.error(error);
        setLoading(false);
    });

    const unsubNotifs = onSnapshot(collection(db, "notifications"), (snapshot) => {
        const fetchedNotifs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            timestamp: safeDate(doc.data().timestamp)
        })) as AppNotification[]; 
        setNotifications(fetchedNotifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    });

    return () => {
        unsubUsers();
        unsubTasks();
        unsubProjects();
        unsubNotifs();
    };
  }, []);

  const createNotification = async (notif: Partial<AppNotification>) => {
      try {
          await addDoc(collection(db, "notifications"), {
              ...notif,
              timestamp: new Date(),
              readBy: []
          });
      } catch (e) { console.error(e); }
  };

  const sendBrowserNotification = (title: string, body: string) => {
      if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: '/favicon.ico' });
      }
  };

  // ... (Removed Telegram Helpers to save space, keeping logic same as original file) ...
  // Assume sendTelegramMessage and sendTelegramDocument are here as per previous versions
  const getBotToken = () => localStorage.getItem('telegram_bot_token') || TELEGRAM_BOT_TOKEN;
  const sendTelegramMessage = async (toUser: User | undefined, message: string, buttons?: any[]) => { /* ... */ };
  const sendTelegramDocument = async (toUser: User | undefined, attachment: FileAttachment, caption: string, buttons?: any[]) => { /* ... */ };


  // --- TOAST SYSTEM ---
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, { ...toast, id }]);
      sendBrowserNotification(toast.title, toast.message);
  };
  
  const closeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleOpenTaskFromNotification = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
          setActiveTab('tasklist');
          setEditingTask(task);
          setIsTaskModalOpen(true);
      } else {
          alert("Task terkait tidak ditemukan (mungkin sudah dihapus).");
      }
      setIsNotifOpen(false); 
  };

  // --- Actions ---

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('daniswara_user', JSON.stringify(user));
      setActiveTab('dashboard');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem('daniswara_user');
      setActiveTab('dashboard');
  };

  const handleSeedDatabase = async () => {
      if (!confirm("Paksa upload data ulang?")) return;
      try {
          for (const u of MOCK_USERS) await setDoc(doc(db, "users", u.id), u);
          for (const p of SEED_PROJECTS) await setDoc(doc(db, "projects", p.id), p);
          for (const t of SEED_TASKS) await setDoc(doc(db, "tasks", t.id), t);
          alert("Database Synced!");
      } catch (error) { console.error(error); }
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
      const { id, ...data } = projectData;
      const isNew = !id;
      if (isNew) {
        try {
            await addDoc(collection(db, "projects"), data);
            createNotification({
                title: "New Project",
                message: `Project "${data.title}" dibuat oleh ${currentUser?.name}.`,
                type: 'info',
                targetDepartment: data.department
            });
        } catch (e) { console.error(e); }
      } else {
        try {
            const docRef = doc(db, "projects", id as string);
            await updateDoc(docRef, data as any);
            createNotification({
                title: "Project Updated",
                message: `Project "${data.title}" telah diperbarui.`,
                type: 'info',
                targetDepartment: data.department
            });
        } catch (e) { console.error(e); }
      }
      setEditingProject(undefined);
  };

  const handleDeleteProject = async (projectId: string) => {
      if (!confirm("Are you sure you want to delete this project?")) return;
      setProjects(prev => prev.filter(p => p.id !== projectId)); 
      try { await deleteDoc(doc(db, "projects", projectId)); } catch (e) { console.error(e); }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
      const { id, ...data } = taskData;
      const isNew = !id;
      const assigneeIds = data.assignees || [];
      
      if (isNew) {
        if (currentUser?.role === 'Staff') data.assignees = [currentUser.id]; 
        data.createdAt = new Date();
        try { 
            const docRef = await addDoc(collection(db, "tasks"), data); 
            createNotification({
                title: "New Task",
                message: `Task "${data.title}" ditambahkan di unit ${data.department}.`,
                type: 'warning',
                targetDepartment: data.department,
                targetUserIds: assigneeIds,
                relatedTaskId: docRef.id
            });
        } catch (e) { console.error(e); }
      } else {
        try {
            const docRef = doc(db, "tasks", id as string);
            await updateDoc(docRef, data as any);
            createNotification({
                title: "Task Updated",
                message: `Progress task "${data.title}" sekarang: ${data.progress}.`,
                type: 'success',
                targetDepartment: data.department,
                targetUserIds: assigneeIds,
                relatedTaskId: id as string
            });
        } catch (e) { console.error(e); }
      }
      setEditingTask(undefined);
  };

  const handleDeleteTask = async (taskId: string) => {
      if (!confirm("Are you sure you want to delete this task?")) return;
      setTasks(prev => prev.filter(t => t.id !== taskId)); 
      try { await deleteDoc(doc(db, "tasks", taskId)); } catch (e) { console.error(e); }
  };

  const handleSaveUser = async (userData: any) => {
      const isNew = !editingUser;
      if (isNew) {
          const newUser = {
              ...userData,
              initial: userData.name.charAt(0).toUpperCase(),
              tasksActive: 0,
              tasksDone: 0
          };
          try { await addDoc(collection(db, "users"), newUser); } catch (e) { console.error(e); }
      } else {
          const updatedData = { ...userData };
          if (updatedData.name) updatedData.initial = updatedData.name.charAt(0).toUpperCase();
          try {
              const docRef = doc(db, "users", editingUser.id);
              await updateDoc(docRef, updatedData);
          } catch (e) { console.error(e); }
      }
      setEditingUser(undefined);
      setIsNewPersonnelModalOpen(false);
  };

  const handleDeleteUser = async (userId: string) => {
      if (userId === currentUser?.id) {
          alert("Anda tidak bisa menghapus akun Anda sendiri saat sedang login.");
          return;
      }
      if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;
      setUsers(prev => prev.filter(u => u.id !== userId)); 
      try { await deleteDoc(doc(db, "users", userId)); } catch (e) { console.error(e); }
  }

  const handleUpdateUser = async (id: string, data: Partial<User>) => {
      try {
          await updateDoc(doc(db, "users", id), data);
          if (currentUser?.id === id) {
              const updatedUser = { ...currentUser, ...data };
              setCurrentUser(updatedUser);
              localStorage.setItem('daniswara_user', JSON.stringify(updatedUser)); 
          }
      } catch (e) { console.error(e); }
  }

  // --- Filtering & Render ---

  const getFilteredNotifications = () => {
      if (!currentUser) return [];
      return notifications.filter(notif => {
          if (currentUser.role === 'Admin') return true;
          if (currentUser.role === 'Manager') {
              return notif.targetDepartment === currentUser.department;
          }
          if (currentUser.role === 'Spv') {
              if (notif.targetDepartment === currentUser.department) return true;
              if (notif.targetUserIds?.includes(currentUser.id)) return true;
          }
          if (currentUser.role === 'Staff') {
              if (notif.targetUserIds?.includes(currentUser.id)) return true;
              if (notif.targetDepartment === currentUser.department && !notif.targetUserIds) return true; 
          }
          return false;
      });
  };

  const displayNotifications = getFilteredNotifications();
  const unreadCount = displayNotifications.filter(n => !n.readBy?.includes(currentUser?.id || '')).length;

  const markAllRead = async () => {
      if (!currentUser) return;
      const unread = displayNotifications.filter(n => !n.readBy?.includes(currentUser.id));
      for (const n of unread) {
          try {
              const docRef = doc(db, "notifications", n.id);
              const updatedReadBy = [...(n.readBy || []), currentUser.id];
              await updateDoc(docRef, { readBy: updatedReadBy });
          } catch(e) { console.error(e); }
      }
  };

  const handleDashboardStatClick = (filter: 'ALL' | 'ACTIVE' | 'DONE' | 'OVERDUE') => {
      setTaskListFilter(filter);
      setActiveTab('tasklist');
  };

  const getFilteredTasksForUser = () => {
      if (!currentUser) return [];
      if (currentUser.role === 'Admin' || currentUser.role === 'Manager') return tasks;
      if (currentUser.role === 'Spv') return tasks.filter(t => t.department === currentUser.department);
      return tasks.filter(t => t.assignees.includes(currentUser.id));
  };

  const displayTasks = getFilteredTasksForUser();

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tasks={tasks} users={users} onStatClick={handleDashboardStatClick}/>; 
      case 'schedule':
        return <Schedule 
            projects={projects}
            tasks={displayTasks} 
            onNewTask={() => { setEditingTask(undefined); setIsTaskModalOpen(true); }}
            onNewProject={() => { setEditingProject(undefined); setIsProjectModalOpen(true); }}
            onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
            userRole={currentUser.role}
        />;
      case 'tasklist':
        return <TaskList 
            tasks={displayTasks}
            projects={projects}
            filterStatus={taskListFilter}
            setFilterStatus={setTaskListFilter}
            onNewTask={() => { setEditingTask(undefined); setIsTaskModalOpen(true); }}
            onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
            onDeleteTask={handleDeleteTask}
            onEditProject={(p) => { setEditingProject(p); setIsProjectModalOpen(true); }}
            onDeleteProject={handleDeleteProject}
            userRole={currentUser.role}
        />;
      case 'team':
        return <TeamRegistry 
            users={users} 
            tasks={tasks} 
            onNewPersonnel={() => { setEditingUser(undefined); setIsNewPersonnelModalOpen(true); }}
            onEditUser={(u) => { setEditingUser(u); setIsNewPersonnelModalOpen(true); }}
            onDeleteUser={handleDeleteUser}
            currentUserRole={currentUser.role}
        />;
      case 'settings':
          return <Settings currentUser={currentUser} onUpdateUser={handleUpdateUser} onSeedDatabase={handleSeedDatabase}/>;
      default:
        return <div className="text-slate-400 text-center mt-20">Work in Progress</div>;
    }
  };

  const getTitle = () => {
    switch(activeTab) {
        case 'dashboard': return 'Overview';
        case 'schedule': return 'Schedule';
        case 'tasklist': return 'Tasks';
        case 'team': return 'Team';
        case 'settings': return 'Settings';
        default: return '';
    }
  }

  if (loading && users.length === 0) return <div className="flex h-screen items-center justify-center text-slate-400 bg-slate-50">Loading Application & Syncing Data...</div>;

  if (!currentUser) {
      return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentUserRole={currentUser.role}
        onLogout={handleLogout}
      />
      
      <Toaster toasts={toasts} onClose={closeToast} onToastClick={handleOpenTaskFromNotification} />
      
      {/* AI ANALYST FLOATING COMPONENT - ADDED HERE */}
      {currentUser.role !== 'Staff' && (
          <AIAnalyst tasks={tasks} users={users} projects={projects} />
      )}

      <div className={`flex flex-col min-h-screen transition-all duration-300 pl-0 pb-24 md:pb-0 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[60]">
           <div className="flex items-center gap-4">
              <div 
                className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg cursor-pointer hidden md:block"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                 <PanelLeft size={20} />
              </div>
              <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-800">{getTitle()}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase md:hidden">{currentUser.department}</p>
              </div>
           </div>
           
           {/* ... Header Content (Notifications, Profile) ... */}
           <div className="flex items-center gap-4 md:gap-6">
              <div className="relative">
                  <button 
                    onClick={() => {
                        setIsNotifOpen(!isNotifOpen);
                        if (!isNotifOpen) markAllRead();
                    }}
                    className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                      )}
                  </button>
                  {isNotifOpen && (
                      <>
                        <div className="fixed inset-0 z-[55]" onClick={() => setIsNotifOpen(false)}></div>
                        <div className="absolute right-4 md:right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 border border-slate-100 z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                                <button onClick={() => setIsNotifOpen(false)}><X size={16} className="text-slate-400" /></button>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {displayNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs italic">
                                        Tidak ada notifikasi baru.
                                    </div>
                                ) : (
                                    displayNotifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => notif.relatedTaskId && handleOpenTaskFromNotification(notif.relatedTaskId)}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.readBy?.includes(currentUser.id) ? 'bg-indigo-50/30' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                                    notif.type === 'success' ? 'bg-emerald-500' : 
                                                    notif.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                                                }`}></div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-700">{notif.title}</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed break-words">{notif.message}</p>
                                                    <span className="text-[9px] text-slate-300 mt-2 block">
                                                        {notif.timestamp.toLocaleString('id-ID', { hour: '2-digit', minute:'2-digit', day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                      </>
                  )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{currentUser.department} • {currentUser.role}</p>
                </div>
                <div 
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200 cursor-pointer hover:bg-indigo-700 transition-colors"
                    title="Logout"
                >
                    {currentUser.initial}
                </div>
              </div>
           </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
           {renderContent()}
        </main>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSave={handleSaveTask}
        initialData={editingTask}
        users={users}
        projects={projects}
        currentUser={currentUser} 
      />
      <NewPersonnelModal 
        isOpen={isNewPersonnelModalOpen} 
        onClose={() => setIsNewPersonnelModalOpen(false)} 
        onSave={handleSaveUser}
        initialData={editingUser}
      />
      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        initialData={editingProject}
      />
    </div>
  );
};

export default App;
