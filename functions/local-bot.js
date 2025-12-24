// --- LOCAL BOT SERVER (GRATIS & TANPA LOGIN WEB) ---
// Jalankan file ini di terminal dengan perintah: 
// cd functions && npm install && node local-bot.js

const TelegramBot = require('node-telegram-bot-api');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, arrayUnion, getDoc } = require('firebase/firestore');

// 1. KONFIGURASI FIREBASE (Sama seperti di firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyC3cvF-8_xfwCogL-H7bFTnY6pF3kPSk-M",
  authDomain: "aplikasi-schedule.firebaseapp.com",
  projectId: "aplikasi-schedule",
  storageBucket: "aplikasi-schedule.firebasestorage.app",
  messagingSenderId: "668191930638",
  appId: "1:668191930638:web:b5032679c657d938a3ff5f",
  measurementId: "G-68KBZDDT8L"
};

// Inisialisasi App & Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. KONFIGURASI BOT TELEGRAM
const TOKEN = "7487202251:AAFV12Rqez9tkYFZ6kGYyvfm6Vfk70Cl_iY";
const bot = new TelegramBot(TOKEN, { polling: true }); // Polling = TRUE (Jalan lokal tanpa Webhook)

console.log("------------------------------------------------");
console.log("🤖 BOT SCHEDULER BERJALAN DI LOCAL SERVER");
console.log("✅ Status: ONLINE");
console.log("📡 Mode: POLLING (Gratis/No Blaze Plan)");
console.log("------------------------------------------------");
console.log("Menunggu instruksi dari Telegram...");

// 3. HANDLE CALLBACK QUERY (TOMBOL KLIK)
bot.on('callback_query', async (callbackQuery) => {
    const actionData = callbackQuery.data; // "approve_t123"
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const fromName = callbackQuery.from.first_name || "User";

    // Format Data: action_taskID (contoh: approve_t123)
    const [action, taskId] = actionData.split('_');

    console.log(`[BOT] Menerima aksi: ${action} untuk Task ID: ${taskId} dari ${fromName}`);

    if (!taskId) return;

    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "⚠️ Task tidak ditemukan (mungkin dihapus)." });
            return;
        }

        let updateData = {};
        let statusText = "";
        const timestamp = new Date();

        if (action === 'approve') {
            updateData = {
                progress: 'Finish',
                status: 'Done',
                history: arrayUnion({
                    status: 'Finish',
                    date: timestamp,
                    updatedBy: `Telegram (${fromName}) [LocalBot]`
                })
            };
            statusText = `✅ APPROVED / SELESAI\nOleh: ${fromName}`;
        } 
        else if (action === 'revise') {
            updateData = {
                progress: 'Revisi',
                history: arrayUnion({
                    status: 'Revisi',
                    date: timestamp,
                    updatedBy: `Telegram (${fromName}) [LocalBot]`
                })
            };
            statusText = `⚠️ DIMINTA REVISI\nOleh: ${fromName}`;
        }

        // Update Firebase
        await updateDoc(taskRef, updateData);

        // Feedback ke Telegram
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Sukses! Data diupdate." });

        // Edit Pesan (Hapus tombol & tampilkan status)
        const originalText = msg.caption || msg.text || "Task Info";
        const newText = `${originalText}\n\n================\n${statusText}\n🕒 ${timestamp.toLocaleString('id-ID')}`;

        if (msg.caption) {
            await bot.editMessageCaption(newText, {
                chat_id: chatId,
                message_id: msg.message_id,
                reply_markup: { inline_keyboard: [] } // Hapus tombol
            });
        } else {
            await bot.editMessageText(newText, {
                chat_id: chatId,
                message_id: msg.message_id,
                reply_markup: { inline_keyboard: [] } // Hapus tombol
            });
        }

    } catch (error) {
        console.error("[ERROR]", error);
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Error: Gagal update database." });
    }
});

// 4. HANDLE PESAN BIASA (Cek Bot Hidup)
bot.on('message', (msg) => {
    const text = msg.text ? msg.text.toLowerCase() : '';
    if (text === '/start' || text === 'halo' || text === 'ping') {
        bot.sendMessage(msg.chat.id, `👋 Halo ${msg.from.first_name}!\n\n🤖 **Local Bot Server Online**\nSaya siap menerima tombol Approve/Revisi dari Web App.\n\n_Pastikan terminal komputer admin tetap terbuka agar saya bisa bekerja._`);
    }
});

// Handle Polling Errors agar tidak crash
bot.on('polling_error', (error) => {
    // Abaikan error koneksi sesaat
    if(error.code !== 'EFATAL') console.log(`[Polling Info] ${error.code || error.message}`);
});