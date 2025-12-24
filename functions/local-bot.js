// --- LOCAL BOT SERVER (GRATIS & TANPA LOGIN WEB) ---
// Jalankan: cd functions && npm install && node local-bot.js

const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron'); // Library Scheduler
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, arrayUnion, getDoc, collection, getDocs, query, where } = require('firebase/firestore');

// 1. KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyC3cvF-8_xfwCogL-H7bFTnY6pF3kPSk-M",
  authDomain: "aplikasi-schedule.firebaseapp.com",
  projectId: "aplikasi-schedule",
  storageBucket: "aplikasi-schedule.firebasestorage.app",
  messagingSenderId: "668191930638",
  appId: "1:668191930638:web:b5032679c657d938a3ff5f",
  measurementId: "G-68KBZDDT8L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. KONFIGURASI BOT
const TOKEN = "7487202251:AAFV12Rqez9tkYFZ6kGYyvfm6Vfk70Cl_iY";
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("------------------------------------------------");
console.log("🤖 BOT SCHEDULER: ADVANCED MODE");
console.log("✅ Fitur: Auto Reminder & Instant Notification");
console.log("📡 Status: ONLINE (Menunggu perintah...)");
console.log("------------------------------------------------");

// --- HELPER FUNCTIONS ---

// Cari Chat ID User berdasarkan ID Database
async function getUserChatId(userId) {
    if (!userId) return null;
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data().telegramChatId;
        }
    } catch (e) {
        console.error("Error fetch user:", e);
    }
    return null;
}

// Cari Chat ID Manager/SPV di Departemen tertentu
async function getDepartmentLeadersChatIds(department) {
    let ids = [];
    try {
        const q = query(
            collection(db, "users"), 
            where("department", "==", department),
            where("role", "in", ["Manager", "Spv"])
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.telegramChatId) ids.push(data.telegramChatId);
        });
    } catch (e) {
        console.error("Error fetch leaders:", e);
    }
    return ids; // Return array of chat IDs
}

// Kirim Pesan Aman (Cek ID dulu)
async function sendSafeMessage(chatId, text) {
    if (chatId) {
        try {
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (e) {
            console.error(`Gagal kirim ke ${chatId}:`, e.message);
        }
    }
}

// --- 3. LOGIKA TOMBOL (APPROVE / REVISE) ---
bot.on('callback_query', async (callbackQuery) => {
    const actionData = callbackQuery.data; 
    const msg = callbackQuery.message;
    const fromName = callbackQuery.from.first_name || "Atasan";
    
    const [action, taskId] = actionData.split('_');

    if (!taskId) return;

    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "⚠️ Task tidak ditemukan." });
            return;
        }

        const taskData = taskSnap.data();
        let updateData = {};
        let statusText = "";
        const timestamp = new Date();

        // A. Jika di-APPROVE
        if (action === 'approve') {
            updateData = {
                progress: 'Finish',
                status: 'Done',
                history: arrayUnion({ status: 'Finish', date: timestamp, updatedBy: `Telegram (${fromName})` })
            };
            statusText = `✅ APPROVED / SELESAI\nOleh: ${fromName}`;

            // NOTIFIKASI BALIK KE STAFF (Assignee)
            if (taskData.assignees && taskData.assignees.length > 0) {
                for (const uid of taskData.assignees) {
                    const chatId = await getUserChatId(uid);
                    sendSafeMessage(chatId, `🎉 *TASK APPROVED*\n\nTask: ${taskData.title}\nOleh: ${fromName}\nStatus: Selesai.\n\n_Kerja bagus!_`);
                }
            }
        } 
        // B. Jika di-REVISI
        else if (action === 'revise') {
            updateData = {
                progress: 'Revisi',
                history: arrayUnion({ status: 'Revisi', date: timestamp, updatedBy: `Telegram (${fromName})` })
            };
            statusText = `⚠️ DIMINTA REVISI\nOleh: ${fromName}`;

            // NOTIFIKASI BALIK KE STAFF (Assignee)
            if (taskData.assignees && taskData.assignees.length > 0) {
                for (const uid of taskData.assignees) {
                    const chatId = await getUserChatId(uid);
                    sendSafeMessage(chatId, `🛠 *REVISI DIPERLUKAN*\n\nTask: ${taskData.title}\nOleh: ${fromName}\n\n_Mohon cek detail atau upload ulang file perbaikan._`);
                }
            }
        }

        // Update Database
        await updateDoc(taskRef, updateData);
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Sukses! Notifikasi dikirim ke staff." });

        // Edit Pesan Asli (Hilangkan Tombol)
        const originalText = msg.caption || msg.text || "Task Info";
        const newText = `${originalText}\n\n================\n${statusText}\n🕒 ${timestamp.toLocaleString('id-ID')}`;

        if (msg.caption) {
            await bot.editMessageCaption(newText, {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
                reply_markup: { inline_keyboard: [] }
            });
        } else {
            await bot.editMessageText(newText, {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
                reply_markup: { inline_keyboard: [] }
            });
        }

    } catch (error) {
        console.error("[ERROR Callback]", error);
    }
});


// --- 4. PENJADWALAN OTOMATIS (CRON JOBS) ---

// Fungsi Utama Pengecekan Task
async function checkTasksAndNotify(isHourlyUrgentCheck = false) {
    console.log(`[${new Date().toLocaleTimeString()}] Menjalankan Pengecekan Task... Mode: ${isHourlyUrgentCheck ? 'URGENT HOURLY' : 'DAILY ROUTINE'}`);

    try {
        // Ambil semua task yang BELUM selesai
        const q = query(collection(db, "tasks"), where("status", "!=", "Done"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        snapshot.forEach(async (docSnap) => {
            const task = docSnap.data();
            
            // Skip jika progress sudah Finish tapi status blm update (safety check)
            if (task.progress === 'Finish') return;

            // Hitung Sisa Waktu
            const now = new Date();
            const endDate = task.endDate.toDate ? task.endDate.toDate() : new Date(task.endDate);
            const diffMs = endDate - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffHours / 24;

            let message = "";
            let isUrgent = false;

            // LOGIKA FILTER WAKTU
            if (diffHours < 0) {
                // KASUS: OVERDUE (Sudah Lewat Deadline) -> Selalu kirim tiap jam
                isUrgent = true;
                const overdueDays = Math.abs(Math.ceil(diffDays));
                message = `🚨 *TASK OVERDUE (TERLAMBAT)*\n\nTask: ${task.title}\nDept: ${task.department}\nDeadline: ${endDate.toLocaleDateString('id-ID')}\nTelat: ${overdueDays} Hari\n\n_Segera selesaikan!_`;
            } 
            else if (diffHours <= 24) {
                // KASUS: DEADLINE < 24 JAM -> Kirim tiap jam
                isUrgent = true;
                const hoursLeft = Math.floor(diffHours);
                message = `⏳ *DEADLINE DALAM ${hoursLeft} JAM*\n\nTask: ${task.title}\nDept: ${task.department}\n\n_Waktu hampir habis._`;
            } 
            else if (!isHourlyUrgentCheck) {
                // KASUS: WAKTU MASIH PANJANG (> 1 Hari) -> Hanya kirim saat Daily Check (Jam 8 & 17)
                const daysLeft = Math.ceil(diffDays);
                message = `📅 *REMINDER TASK*\n\nTask: ${task.title}\nDept: ${task.department}\nSisa Waktu: ${daysLeft} Hari`;
            }

            // EKSEKUSI PENGIRIMAN
            // Jika Mode Hourly: Hanya kirim yang Urgent
            // Jika Mode Daily: Kirim yang TIDAK Urgent (karena yang Urgent sudah dicover Hourly)
            
            let shouldSend = false;
            if (isHourlyUrgentCheck && isUrgent) shouldSend = true;
            if (!isHourlyUrgentCheck && !isUrgent) shouldSend = true;

            if (shouldSend && message) {
                // 1. Kirim ke Staff (Assignees)
                if (task.assignees) {
                    for (const uid of task.assignees) {
                        const chatId = await getUserChatId(uid);
                        sendSafeMessage(chatId, message);
                    }
                }

                // 2. Kirim ke Manager/Spv Departemen Terkait
                const leaderIds = await getDepartmentLeadersChatIds(task.department);
                for (const chatId of leaderIds) {
                    sendSafeMessage(chatId, `[MONITORING] ${message}`);
                }
            }
        });

    } catch (e) {
        console.error("Error Cron Job:", e);
    }
}

// --- JADWAL CRON ---

// 1. SETIAP JAM (Menit ke-0) -> Cek Task Urgent (<= 24 Jam atau Overdue)
// Contoh: 09:00, 10:00, 11:00...
cron.schedule('0 * * * *', () => {
    checkTasksAndNotify(true); // true = Mode Urgent
});

// 2. JAM 08:00 PAGI -> Cek Task Santai (> 1 Hari)
cron.schedule('0 8 * * *', () => {
    checkTasksAndNotify(false); // false = Mode Daily
});

// 3. JAM 17:00 SORE -> Cek Task Santai (> 1 Hari)
cron.schedule('0 17 * * *', () => {
    checkTasksAndNotify(false); // false = Mode Daily
});

// Handle Pesan Biasa
bot.on('message', (msg) => {
    const text = msg.text ? msg.text.toLowerCase() : '';
    if (text === '/start' || text === 'halo' || text === 'ping') {
        bot.sendMessage(msg.chat.id, `👋 Halo ${msg.from.first_name}!\n\n🤖 **Bot Scheduler Aktif**\nID Anda: \`${msg.chat.id}\`\n\n_Bot akan mengirim notifikasi otomatis untuk reminder task._`);
    }
});

bot.on('polling_error', (error) => {
    if(error.code !== 'EFATAL') console.log(`[Polling Info] ${error.code || error.message}`);
});