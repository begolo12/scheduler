const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Pastikan node-fetch ada. Jika error 'require', pastikan jalankan 'npm install node-fetch' di folder functions
const fetch = require("node-fetch"); 

admin.initializeApp();
const db = admin.firestore();

// TOKEN BOT ANDA
const BOT_TOKEN = "7487202251:AAFV12Rqez9tkYFZ6kGYyvfm6Vfk70Cl_iY"; 

// --- HELPER: KIRIM REQUEST KE TELEGRAM ---
async function telegramRequest(endpoint, payload) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (e) {
        console.error(`Gagal request ke ${endpoint}:`, e);
        return null;
    }
}

// --- FUNGSI UTAMA: WEBHOOK ---
// Fungsi ini berjalan di Server Google, standby 24 jam.
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    
    // 1. Cek Metode Request
    if (req.method !== 'POST') {
        return res.status(403).send('Forbidden');
    }

    const update = req.body;
    console.log("Update dari Telegram:", JSON.stringify(update));

    try {
        // --- A. JIKA USER KLIK TOMBOL (CALLBACK QUERY) ---
        if (update.callback_query) {
            const cb = update.callback_query;
            const dataStr = cb.data; // Format: "action_taskId" (contoh: "approve_t123")
            const parts = dataStr.split('_');
            const action = parts[0]; 
            const taskId = parts[1];
            const fromName = cb.from.first_name || "User";

            console.log(`Action: ${action}, Task ID: ${taskId} oleh ${fromName}`);

            if (!taskId) {
                await telegramRequest('answerCallbackQuery', { callback_query_id: cb.id, text: "Error: ID Task tidak valid." });
                return res.send("OK");
            }

            const taskRef = db.collection('tasks').doc(taskId);
            
            // Cek apakah Task ada di Database
            const docSnap = await taskRef.get();
            if (!docSnap.exists) {
                await telegramRequest('answerCallbackQuery', { callback_query_id: cb.id, text: "⚠️ Task sudah dihapus dari database." });
                // Hapus pesan agar tidak bingung
                await telegramRequest('deleteMessage', { chat_id: cb.message.chat.id, message_id: cb.message.message_id });
                return res.send("OK");
            }

            // --- PROSES UPDATE DATABASE ---
            let statusMessage = "";
            let updateData = {};
            const timestamp = new Date(); // Waktu Server

            if (action === 'approve') {
                updateData = {
                    progress: 'Finish',
                    status: 'Done',
                    // Tambahkan history baru
                    history: admin.firestore.FieldValue.arrayUnion({
                        status: 'Finish',
                        date: timestamp,
                        updatedBy: `Telegram (${fromName})` 
                    })
                };
                statusMessage = `✅ APPROVED / SELESAI\nOleh: ${fromName}\nWaktu: ${timestamp.toLocaleString('id-ID')}`;
            
            } else if (action === 'revise') {
                updateData = {
                    progress: 'Revisi',
                    // Tambahkan history baru
                    history: admin.firestore.FieldValue.arrayUnion({
                        status: 'Revisi',
                        date: timestamp,
                        updatedBy: `Telegram (${fromName})`
                    })
                };
                statusMessage = `⚠️ DIMINTA REVISI\nOleh: ${fromName}\nWaktu: ${timestamp.toLocaleString('id-ID')}`;
            }

            // Eksekusi Update ke Firestore
            await taskRef.update(updateData);

            // --- UPDATE TAMPILAN TELEGRAM ---
            
            // 1. Hilangkan loading di tombol
            await telegramRequest('answerCallbackQuery', { 
                callback_query_id: cb.id, 
                text: "Sukses! Data telah diupdate." 
            });

            // 2. Edit pesan asli (Hapus tombol & Tambah Status)
            const isCaption = !!cb.message.caption;
            const endpoint = isCaption ? 'editMessageCaption' : 'editMessageText';
            const originalText = isCaption ? cb.message.caption : cb.message.text;

            const editBody = {
                chat_id: cb.message.chat.id,
                message_id: cb.message.message_id,
                reply_markup: { inline_keyboard: [] } // Kosongkan array untuk menghapus tombol
            };

            const finalText = `${originalText}\n\n================\n${statusMessage}`;

            if (isCaption) editBody.caption = finalText;
            else editBody.text = finalText;

            await telegramRequest(endpoint, editBody);
        }

        // --- B. JIKA USER CHAT BIASA (Tes Koneksi) ---
        else if (update.message && update.message.text) {
            const text = update.message.text.toLowerCase();
            const chatId = update.message.chat.id;

            if (text === '/start' || text === 'halo' || text === 'ping') {
                await telegramRequest('sendMessage', {
                    chat_id: chatId,
                    text: "🤖 **Bot Scheduler Online**\n\nSistem berjalan di Cloud Server (24 Jam).\nAdmin tidak perlu login untuk bot ini bekerja.",
                    parse_mode: 'Markdown'
                });
            }
        }

    } catch (err) {
        console.error("Server Error:", err);
    }

    // Wajib return 200 OK ke Telegram agar tidak dianggap gagal
    res.status(200).send('OK');
});