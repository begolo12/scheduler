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
import Toaster, { ToastMessage } from './components/Toaster'; // Import Toaster
import { TaskModal, NewPersonnelModal, ProjectModal } from './components/Modals';
import { Tab, Task, User, Role, Project, AppNotification, FileAttachment } from './types'; // Updated Import
import { USERS as MOCK_USERS, TASKS as MOCK_TASKS, PROJECTS as MOCK_PROJECTS, TELEGRAM_BOT_TOKEN } from './constants';

// --- CONFIGURATION ---
// CRITICAL: Set to FALSE.
// We are using Firebase Cloud Functions (Server webhook). 
// Browser polling causes CORS errors and conflicts with the webhook.
const CLIENT_SIDE_POLLING_ENABLED = false; 

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]); // Updated Type
  const [loading, setLoading] = useState(true);

  // UI State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [taskListFilter, setTaskListFilter] = useState<'ALL' | 'ACTIVE' | 'DONE' | 'OVERDUE'>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]); // Toast State

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Telegram Polling State (Disabled but ref kept for safety)
  const lastUpdateIdRef = useRef<number>(0);
  const isPollingRef = useRef<boolean>(false);

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
    // Request Browser Notification Permission on Load
    // Note: Checking window.Notification explicitly
    if ("Notification" in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
  }, []);

  // --- 2. IDLE AUTO-LOGOUT (30 Minutes) ---
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

    // Events to track activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
        document.addEventListener(event, resetTimer);
    });

    // Start timer
    resetTimer();

    return () => {
        if (timeoutId) clearTimeout(timeoutId);
        activityEvents.forEach(event => {
            document.removeEventListener(event, resetTimer);
        });
    };
  }, [currentUser]);

  // --- 3. AUTO DELETE FILE CHECK (Run on Load) ---
  useEffect(() => {
      const checkExpiredFiles = async () => {
          const now = new Date();
          const updates: Promise<void>[] = [];
          
          tasks.forEach(task => {
              if (task.attachment && task.endDate) {
                  const deadline = new Date(task.endDate);
                  // Add 7 days to deadline
                  deadline.setDate(deadline.getDate() + 7);
                  
                  if (now > deadline) {
                      // Expired: Delete attachment
                      const docRef = doc(db, "tasks", task.id);
                      updates.push(updateDoc(docRef, { attachment: null })); // Using deleteField logic via null
                      console.log(`Auto-deleting file for task ${task.title} (Expired)`);
                  }
              }
          });
          
          if (updates.length > 0) await Promise.all(updates);
      };

      if (tasks.length > 0) checkExpiredFiles();
  }, [tasks.length]); // Run when tasks are loaded

  // --- 4. PERIODIC NOTIFICATION CHECK (Every 10 Minutes) ---
  useEffect(() => {
      if (!currentUser) return;

      const checkPendingTasks = () => {
          // Rule: Admin does NOT get popups, only Top Bar list.
          if (currentUser.role === 'Admin') return; 

          const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          tasks.forEach(task => {
              // Rule 1: Draft + File Uploaded -> Notify Superior (Manager/Spv) of that Dept
              if (task.progress === 'Draft' && task.attachment) {
                  if (currentUser.role === 'Manager' || currentUser.role === 'Spv') {
                      // Check if this task belongs to their department
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
              // Rule 2: Revisi -> Notify Staff (Assignee)
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

      // Run immediately on first load (if data exists)
      if (tasks.length > 0) checkPendingTasks();

      // Set interval 10 minutes
      const intervalId = setInterval(checkPendingTasks, 10 * 60 * 1000);

      return () => clearInterval(intervalId);
  }, [currentUser, tasks]);


  // --- 5. DATA FETCHING & AUTO SYNC ---
  useEffect(() => {
    // Listen to Users
    const unsubUsers = onSnapshot(collection(db, "users"), async (snapshot) => {
        if (snapshot.empty) {
            console.log("Database Empty: Auto-seeding Users...");
            // Use setDoc to preserve IDs from Constants so relationships work
            for (const u of MOCK_USERS) { 
                const { id, ...data } = u; 
                await setDoc(doc(db, "users", u.id), u); 
            }
        } else {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
            setUsers(fetchedUsers);
        }
    }, (error) => {
        console.error("Firebase error (Users):", error);
    });

    // Listen to Projects
    const unsubProjects = onSnapshot(collection(db, "projects"), async (snapshot) => {
        if (snapshot.empty) {
            console.log("Database Empty: Auto-seeding Projects...");
            for (const p of MOCK_PROJECTS) { 
                await setDoc(doc(db, "projects", p.id), p); 
            }
        } else {
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
        }
    }, (error) => {
        console.error("Firebase error (Projects):", error);
    });

    // Listen to Tasks
    const unsubTasks = onSnapshot(collection(db, "tasks"), async (snapshot) => {
        if (snapshot.empty) {
             console.log("Database Empty: Auto-seeding Tasks...");
             for (const t of MOCK_TASKS) { 
                // Add default createdAt for mocks
                const tWithDate = { ...t, createdAt: new Date() };
                await setDoc(doc(db, "tasks", t.id), tWithDate); 
             }
             setLoading(false);
        } else {
            const fetchedTasks = snapshot.docs.map(doc => {
                const data = doc.data();
                
                // Ensure valid dates
                const sDate = safeDate(data.startDate);
                const eDate = safeDate(data.endDate);
                const pDate = safeDate(data.progressDate, sDate); // Fallback to start date
                const cDate = safeDate(data.createdAt, new Date(0)); // Fallback to Epoch

                // Process History Dates
                const history = (data.history || []).map((h: any) => ({
                    ...h,
                    date: safeDate(h.date)
                }));

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
        }
    }, (error) => {
        console.error("Firebase error (Tasks):", error);
        setLoading(false);
    });

    // Listen to Notifications
    const unsubNotifs = onSnapshot(collection(db, "notifications"), (snapshot) => {
        const fetchedNotifs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            timestamp: safeDate(doc.data().timestamp)
        })) as AppNotification[]; // Updated Type
        // Sort descending by time
        setNotifications(fetchedNotifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    });

    return () => {
        unsubUsers();
        unsubTasks();
        unsubProjects();
        unsubNotifs();
    };
  }, []);

  // --- Helper: Create Notification ---
  const createNotification = async (notif: Partial<AppNotification>) => {
      try {
          await addDoc(collection(db, "notifications"), {
              ...notif,
              timestamp: new Date(),
              readBy: []
          });
      } catch (e) {
          console.error("Failed to create notification", e);
      }
  };

  // --- AUTOMATED NOTIFICATION SYSTEM ---

  // 1. Browser Native Notification
  const sendBrowserNotification = (title: string, body: string) => {
      // Use window.Notification to avoid ambiguity
      if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: '/favicon.ico' });
      }
  };

  // Helper: Convert DataURI to Blob for File Upload
  const dataURItoBlob = (dataURI: string) => {
    try {
        const split = dataURI.split(',');
        if (split.length < 2) return null;
        
        // Remove whitespace/newlines from base64 string
        const byteString = atob(split[1].replace(/\s/g, ''));
        const mimeString = split[0].split(':')[1].split(';')[0];
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {type: mimeString});
    } catch (e) {
        console.error("Blob conversion failed", e);
        return null;
    }
  };

  // 2. Telegram Bot API (Serverless Automation)
  const getBotToken = () => localStorage.getItem('telegram_bot_token') || TELEGRAM_BOT_TOKEN;

  // Send Text Message
  const sendTelegramMessage = async (toUser: User | undefined, message: string, buttons?: any[]) => {
      if (!toUser || !toUser.telegramChatId) return;
      const token = getBotToken();
      if (!token) return;

      const body: any = {
          chat_id: toUser.telegramChatId,
          text: message,
          parse_mode: 'Markdown'
      };

      if (buttons) {
          body.reply_markup = { inline_keyboard: buttons };
      }

      try {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });
          console.log(`Telegram sent to ${toUser.name}`);
      } catch (error) {
          console.error("Telegram Error:", error);
      }
  };

  // Send Document/File with Fallback to Text if file fails
  const sendTelegramDocument = async (toUser: User | undefined, attachment: FileAttachment, caption: string, buttons?: any[]) => {
      if (!toUser || !toUser.telegramChatId) return;
      const token = getBotToken();
      if (!token) return;

      try {
          const blob = dataURItoBlob(attachment.url);
          if (!blob) throw new Error("Gagal konversi file atau format base64 salah.");

          // Check File Size (Limit 50MB for Bot API)
          if (blob.size > 50 * 1024 * 1024) {
               throw new Error("Ukuran file terlalu besar (>50MB).");
          }

          const formData = new FormData();
          formData.append('chat_id', toUser.telegramChatId);
          formData.append('document', blob, attachment.name);
          formData.append('caption', caption);
          
          if (buttons) {
              formData.append('reply_markup', JSON.stringify({ inline_keyboard: buttons }));
          }

          const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
              method: 'POST',
              body: formData
          });
          
          if (!res.ok) {
              // Try to parse error from Telegram
              const errData = await res.json().catch(() => ({ description: res.statusText }));
              throw new Error(`Telegram API Error: ${errData.description}`);
          }

          console.log(`Telegram document sent to ${toUser.name}`);
      } catch (error: any) {
          console.error("Telegram File Error, Falling back to Text:", error.message);
          // FALLBACK: Kirim pesan teks jika file gagal (agar tombol tetap muncul)
          sendTelegramMessage(
              toUser, 
              `${caption}\n\n⚠️ _(Gagal mengirim file fisik: ${error.message}. Silakan cek file di Aplikasi Web.)_`, 
              buttons
          );
      }
  };

  // --- CLIENT-SIDE POLLING (DISABLED) ---
  // The logic below is disabled by CLIENT_SIDE_POLLING_ENABLED = false.
  // It is kept here only for reference or rollback if server setup fails.
  useEffect(() => {
    if (!CLIENT_SIDE_POLLING_ENABLED) return;
    
    // ... (Code Disabled) ...
    // If you need to debug locally without Cloud Functions, set flag to TRUE.
    
  }, [currentUser]); 

  // --- TOAST SYSTEM ---
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, { ...toast, id }]);
      
      // Trigger Browser Notification too
      sendBrowserNotification(toast.title, toast.message);
  };
  
  const closeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- NAVIGATION FROM NOTIFICATION ---
  const handleOpenTaskFromNotification = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
          setActiveTab('tasklist');
          setEditingTask(task);
          setIsTaskModalOpen(true);
      } else {
          // Fallback if task deleted or not found
          alert("Task terkait tidak ditemukan (mungkin sudah dihapus).");
      }
      setIsNotifOpen(false); // Close dropdown if open
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

  // Manual seed backup
  const handleSeedDatabase = async () => {
      if (!confirm("Paksa upload data ulang?")) return;
      try {
          for (const u of MOCK_USERS) await setDoc(doc(db, "users", u.id), u);
          for (const p of MOCK_PROJECTS) await setDoc(doc(db, "projects", p.id), p);
          for (const t of MOCK_TASKS) await setDoc(doc(db, "tasks", t.id), t);
          alert("Database Synced!");
      } catch (error) {
          console.error("Error seeding:", error);
      }
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
            // Notify update
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
      setProjects(prev => prev.filter(p => p.id !== projectId)); // Optimistic
      try { await deleteDoc(doc(db, "projects", projectId)); } catch (e) { console.error(e); }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
      const { id, ...data } = taskData;
      const isNew = !id;
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      
      // Determine Assignees for Notif
      const assigneeIds = data.assignees || [];
      
      // Base URL for deep links
      let appUrl = window.location.href.split('?')[0].split('#')[0];
      if (appUrl.startsWith('blob:')) {
          appUrl = appUrl.replace('blob:', '');
      }

      if (isNew) {
        if (currentUser?.role === 'Staff') data.assignees = [currentUser.id]; 
        
        // Add createdAt timestamp for ordering
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
            
            // Assignee Notifications (NEW TASK)
            assigneeIds.forEach(uid => {
                const assignee = users.find(u => u.id === uid);
                
                // 1. Toast (Browser)
                if (uid === currentUser?.id) {
                     addToast({
                        title: "New Task Assigned",
                        message: `Task baru "${data.title}" ditugaskan.`,
                        type: 'info',
                        time: nowTime,
                        relatedTaskId: docRef.id
                    });
                }

                // 2. Telegram Notification (Assignee gets message)
                if (assignee && assignee.id !== currentUser?.id) { 
                    sendTelegramMessage(assignee, `📋 *NEW TASK ASSIGNED*\n\nTask: ${data.title}\nDept: ${data.department}\nDeadline: ${data.endDate?.toLocaleDateString()}\n\n_Segera kerjakan di aplikasi!_`);
                    
                    // If file exists on creation (rare but possible), send it too
                    if (data.attachment) {
                         sendTelegramDocument(assignee, data.attachment, `File lampiran untuk task: ${data.title}`);
                    }
                }
            });

        } catch (e) { console.error(e); }
      } else {
        // UPDATE EXISTING TASK
        if (currentUser?.role === 'Staff' && !data.assignees?.includes(currentUser.id)) {
            // Bypass logic for System Updates (caused by Approval Links)
        }

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

            // --- AUTOMATED NOTIFICATIONS LOGIC (TELEGRAM) ---

            const superiors = users.filter(u => 
                (u.role === 'Manager' || u.role === 'Spv') && 
                u.department === data.department
            );
            const assignees = users.filter(u => data.assignees?.includes(u.id));

            // 1. Task START -> Notify Manager
            if (data.progress === 'Start') {
                 superiors.forEach(sup => {
                    sendTelegramMessage(sup, `🚀 *TASK STARTED*\n\nTask: ${data.title}\nWorker: ${currentUser?.name}\nStatus: Pengerjaan dimulai.`);
                 });
            }

            // 2. Task DRAFT (Submission) -> Notify Manager & Send File with APPROVAL BUTTONS
            if (data.progress === 'Draft') {
                superiors.forEach(sup => {
                    // CHANGED: Use callback_data instead of url to prevent browser opening
                    // Format: "action_taskId"
                    const approvalButtons = [
                        [
                            { text: "✅ Approve / Finish", callback_data: `approve_${id}` },
                            { text: "⚠️ Minta Revisi", callback_data: `revise_${id}` }
                        ]
                    ];

                    const caption = `📝 *TASK SUBMITTED (DRAFT)*\n\nTask: ${data.title}\nWorker: ${currentUser?.name}\n\n_Klik tombol di bawah untuk respon cepat (Direct Action):_`;

                    // SEND FILE TO MANAGER WITH BUTTONS
                    // Robust check: Send even if no file, or if file exists
                    if (data.attachment) {
                        sendTelegramDocument(sup, data.attachment, caption, approvalButtons);
                    } else {
                        // Text fallback if no file
                        sendTelegramMessage(sup, caption, approvalButtons);
                    }
                });
            }
            
            // 3. Task REVISI -> Notify Staff (Assignee)
            if (data.progress === 'Revisi') {
                assignees.forEach(staff => {
                     sendTelegramMessage(staff, `⚠️ *REVISI DIPERLUKAN*\n\nTask: ${data.title}\nDept: ${data.department}\n\n_Cek komentar atau file dari atasan._`);
                     // If Manager uploaded a feedback file, send it to Staff
                     if (data.attachment && currentUser?.role !== 'Staff') {
                         sendTelegramDocument(staff, data.attachment, `File Revisi/Feedback: ${data.title}`);
                     }
                });
            }

            // 4. Task FINISH -> Notify Manager & Staff
            if (data.progress === 'Finish' || data.status === 'Done') {
                const finishMsg = `✅ *TASK COMPLETED*\n\nTask: ${data.title}\nStatus: Selesai.`;
                
                // Notify Manager (if staff finished it, or if manager approved it)
                superiors.forEach(sup => {
                    if (sup.id !== currentUser?.id) sendTelegramMessage(sup, finishMsg);
                });

                // Notify Staff (if Manager approved it via link)
                assignees.forEach(staff => {
                    if (staff.id !== currentUser?.id) sendTelegramMessage(staff, `🎉 *TASK APPROVED / FINISHED*\n\nTask: ${data.title}\nApproved By: ${currentUser?.name}`);
                });
            }

            // 5. General File Upload Update (Only if NOT Draft, to avoid double send)
            if (data.attachment && !['Start', 'Draft', 'Revisi', 'Finish'].includes(data.progress || '')) {
                 if (currentUser?.role === 'Staff') {
                     superiors.forEach(sup => sendTelegramDocument(sup, data.attachment!, `File Update: ${data.title}`));
                 } else {
                     assignees.forEach(staff => sendTelegramDocument(staff, data.attachment!, `File Update: ${data.title}`));
                 }
            }

        } catch (e) { console.error(e); }
      }
      setEditingTask(undefined);
  };

  const handleDeleteTask = async (taskId: string) => {
      if (!confirm("Are you sure you want to delete this task?")) return;
      setTasks(prev => prev.filter(t => t.id !== taskId)); // Optimistic
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
      setUsers(prev => prev.filter(u => u.id !== userId)); // Optimistic
      try { await deleteDoc(doc(db, "users", userId)); } catch (e) { console.error(e); }
  }

  const handleUpdateUser = async (id: string, data: Partial<User>) => {
      try {
          await updateDoc(doc(db, "users", id), data);
          if (currentUser?.id === id) {
              const updatedUser = { ...currentUser, ...data };
              setCurrentUser(updatedUser);
              localStorage.setItem('daniswara_user', JSON.stringify(updatedUser)); // Update local storage too
          }
      } catch (e) { console.error(e); }
  }

  // ... (rest of filtering logic)

  // --- Notification Filtering Logic (Top Bar) ---
  const getFilteredNotifications = () => {
      if (!currentUser) return [];

      return notifications.filter(notif => {
          // 1. Admin sees EVERYTHING in Top Bar
          if (currentUser.role === 'Admin') return true;

          // 2. Manager sees everything in their Department
          if (currentUser.role === 'Manager') {
              return notif.targetDepartment === currentUser.department;
          }

          // 3. SPV sees notifications for their department + items assigned to them
          if (currentUser.role === 'Spv') {
              if (notif.targetDepartment === currentUser.department) return true;
              if (notif.targetUserIds?.includes(currentUser.id)) return true;
          }

          // 4. Staff sees only items assigned directly to them OR general dept info
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
      // Mark displayed notifications as read by current user
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

  // --- Render Helpers ---

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
        return <Dashboard 
            tasks={displayTasks} 
            users={users} 
            onStatClick={handleDashboardStatClick}
        />; 
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
            onNewPersonnel={() => { setEditingUser(undefined); setIsNewPersonnelModalOpen(true); }}
            onEditUser={(u) => { setEditingUser(u); setIsNewPersonnelModalOpen(true); }}
            onDeleteUser={handleDeleteUser}
            currentUserRole={currentUser.role}
        />;
      case 'settings':
          return <Settings 
            currentUser={currentUser} 
            onUpdateUser={handleUpdateUser} 
            onSeedDatabase={handleSeedDatabase}
          />;
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

  // Loading State
  if (loading && users.length === 0) return <div className="flex h-screen items-center justify-center text-slate-400 bg-slate-50">Loading Application & Syncing Data...</div>;

  // Login Screen
  if (!currentUser) {
      return <Login users={users} onLogin={handleLogin} />;
  }

  // Main App
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
      
      {/* Windows Style Toaster */}
      <Toaster toasts={toasts} onClose={closeToast} onToastClick={handleOpenTaskFromNotification} />

      {/* Main Content Area */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 pl-0 pb-24 md:pb-0 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        {/* Header - Changed Z-index from 30 to 60 */}
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

           <div className="flex items-center gap-4 md:gap-6">
              
              {/* Notification Bell */}
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

                  {/* Dropdown - Added stronger shadow and ring for better visual separation */}
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

        {/* Scrollable Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
           {renderContent()}
        </main>
      </div>

      {/* Modals */}
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSave={handleSaveTask}
        initialData={editingTask}
        users={users}
        projects={projects}
        currentUser={currentUser} // Pass current user for history
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