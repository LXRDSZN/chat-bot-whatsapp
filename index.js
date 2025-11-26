import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

let botActivo = false; // Control del bot

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./baileys_auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" })
    });

    // Mostrar QR
    sock.ev.on("connection.update", (update) => {
        const { qr, connection } = update;
        if (qr) {
            console.clear();
            console.log("📲 Escanea este QR para conectar el bot:\n");
            qrcode.generate(qr, { small: true });
        }
        if (connection === "open") console.log("✅ Bot conectado correctamente.");
        if (connection === "close") iniciarBot();
    });

    sock.ev.on("creds.update", saveCreds);

    // Mensajes entrantes
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m?.message) return;

        const from = m.key.remoteJid;
        const isMyMsg = m.key.fromMe;

        if (isMyMsg) return;

        // ❌ NO RESPONDER EN GRUPOS
        if (from.endsWith("@g.us")) return;

        const texto =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            "";

        const msg = texto.toLowerCase();

        // ACTIVAR
        if (msg === "!activar") {
            botActivo = true;
            return sock.sendMessage(from, { text: "🤖 *Bot ACTIVADO.*" });
        }

        // DESACTIVAR
        if (msg === "!desactivar") {
            botActivo = false;
            return sock.sendMessage(from, { text: "🛑 *Bot DESACTIVADO.*" });
        }

        // Si el bot está desactivado → ignorar
        if (!botActivo) return;

        // COMANDOS
        if (msg === "!urgente") {
            return sock.sendMessage(from, {
                text: "🚨 *Mensaje urgente recibido.*\nNotificaré a Iván inmediatamente."
            });
        }

        if (msg === "!contacto") {
            return sock.sendMessage(from, {
                text: `
╔══════════════════════════╗
 🔗 *CONTACTO OFICIAL*
╚══════════════════════════╝

💻 *GitHub:*  
https://github.com/lxrdszn

💬 *Telegram:*  
https://t.me/LXRDSZN_GG

🎧 *Discord (Servidor):*  
https://discord.gg/ZAZvUKqF

⚠️ *Aviso importante:*  
Las redes *Facebook*, *Instagram* y *WhatsApp personales*  
📵 _están temporalmente fuera de servicio._
`
            });
        }

        if (msg.startsWith("!music ")) {
            const song = msg.replace("!music ", "");
            return sock.sendMessage(from, {
                text: `🎵 *Reproduciendo en YouTube (HD)*:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(song)}`
            });
        }

        if (msg.startsWith("!ia ")) {
            const prompt = msg.replace("!ia ", "");
            return sock.sendMessage(from, {
                text: `🤖✨ *Imagen solicitada*\n(IA aún no conectada)\n\nPrompt: *${prompt}*`
            });
        }

        if (msg === "!info") {
            return sock.sendMessage(from, {
                text: `ℹ️ *Información del bot*\nBot: Hxck4io\nDev: Iván Galicia Garcés (LXRDSZN)\nVersión: 1.0\nModo: Activo`
            });
        }

        // RESPUESTA AUTOMÁTICA
        return sock.sendMessage(from, { text: mensajeBienvenida() });
    });
}

// BIENVENIDA MEJORADA
function mensajeBienvenida() {
    return `
╔════════════════════════════╗
    🌙✨ *Bienvenido a Hxck4io*  
╚════════════════════════════╝

🤖 *Asistente automatizado de Iván Galicia Garcés (LXRDSZN)*  
Iván no se encuentra disponible en este momento,  
pero puedo ayudarte mientras vuelve.

━━━━━━━━━━━━━━━━━━━━
⚡ *COMANDOS DISPONIBLES*
━━━━━━━━━━━━━━━━━━━━

1️⃣ *!urgente*  
Notificaré inmediatamente a Iván.

2️⃣ *!contacto*  
Te mostraré las redes oficiales activas.

3️⃣ *!music <nombre>* 🎵  
Buscaré música en YouTube en alta calidad.

4️⃣ *!ia <descripción>* 🎨  
Genera una imagen mediante IA (próximamente).

5️⃣ *!info*  
Información del bot.

━━━━━━━━━━━━━━━━━━━━
📡 *REDES OFICIALES*
━━━━━━━━━━━━━━━━━━━━
🐙 GitHub: https://github.com/lxrdszn  
💬 Telegram: https://t.me/LXRDSZN_GG  
🎧 Discord: https://discord.gg/ZAZvUKqF  

⚠️ *Aviso:*  
Facebook, Instagram y WhatsApp personales  
📵 _están temporalmente fuera de servicio._

━━━━━━━━━━━━━━━━━━━━
⌛ Gracias por tu mensaje  
Responderé por Iván hasta que vuelva 🖤
`;
}

iniciarBot();
