import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const prefix = ".";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }

        if (connection === "open") {
            console.log("🚀 CypherX PRO MAX ONLINE");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (!text) return;

        const body = text.trim();
        const command = body.startsWith(prefix)
            ? body.slice(1).split(" ")[0].toLowerCase()
            : null;

        const args = body.split(" ").slice(1).join(" ");

        console.log("📩", body);

        // ================= MENU =================
        if (command === "menu") {
            return sock.sendMessage(sender, {
                text: `
🤖 *CYPHERX PRO MAX MENU*

⚡ Basic:
.menu
.ping
.hello

🤖 AI:
.ai <text>

🎵 Media:
.yt <link>

👮 Group:
.tagall
.kick (reply user)

🧠 Smart bot is always active
                `
            });
        }

        // ================= PING =================
        if (command === "ping") {
            return sock.sendMessage(sender, { text: "🏓 Pong Pro Max!" });
        }

        // ================= HELLO =================
        if (command === "hello") {
            return sock.sendMessage(sender, { text: "👋 CypherX Pro Max online!" });
        }

        // ================= AI CHAT =================
        if (command === "ai") {
            const reply = await simpleAI(args);
            return sock.sendMessage(sender, { text: reply });
        }

        // ================= YOUTUBE (SIMULATED) =================
        if (command === "yt") {
            return sock.sendMessage(sender, {
                text: "🎵 Download feature ready (connect API or yt-dlp server needed)"
            });
        }

        // ================= TAG ALL =================
        if (command === "tagall") {
            const metadata = await sock.groupMetadata(sender);
            const mentions = metadata.participants.map(p => p.id);

            return sock.sendMessage(sender, {
                text: "📢 Group Tag Activated!",
                mentions
            });
        }

        // ================= DEFAULT SMART REPLY =================
        if (body.toLowerCase().includes("hi")) {
            return sock.sendMessage(sender, { text: "👋 Hey! Try .menu" });
        }
    });
}

// 🧠 SIMPLE AI ENGINE (NO API KEY NEEDED)
async function simpleAI(text) {
    if (!text) return "Ask me something 🤖";

    const responses = [
        "🤖 I'm CypherX AI. I hear you!",
        "⚡ Interesting question!",
        "🧠 Let me think... done!",
        "🔥 That’s cool!",
        "👀 I understand you."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

startBot();
