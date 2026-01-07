import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { CONFIG } from "./config.js";
import { saveUser, getUser, saveConversation, updateStats, closeConversation } from "./utils/database.js";
import { sendUrgentNotification, notifyNewUser, notifyBotStatus } from "./utils/notifications.js";

let botActivo = false; // Control del bot - INICIA DESACTIVADO
let lastCommandTime = {}; // Control de cooldown por usuario
let welcomeSent = {}; // Control de mensajes de bienvenida enviados
let conversationsClosed = {}; // Control de conversaciones cerradas

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./baileys_auth");
    const { version } = await fetchLatestBaileysVersion();

    console.log("🚀 Iniciando bot...");
    
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" })
    });
    
    console.log("✅ Socket creado, esperando conexión...");

    // Mostrar QR
    sock.ev.on("connection.update", (update) => {
        const { qr, connection, lastDisconnect } = update;
        if (qr) {
            console.clear();
            console.log("📲 Escanea este QR para conectar el bot:\n");
            qrcode.generate(qr, { small: true });
        }
        if (connection === "open") {
            console.log("✅ Bot conectado correctamente.");
            console.log(`🛑 Bot está DESACTIVADO. Solo el admin (197353898250346) puede usar /activar para encenderlo.`);
        }
        if (connection === "close") {
            console.log("❌ Conexión cerrada. Reintentando en 3 segundos...");
            setTimeout(() => iniciarBot(), 3000);
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Mensajes entrantes
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m?.message) return;

        const from = m.key.remoteJid;
        const isMyMsg = m.key.fromMe;
        
        const texto = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     "";
        
        // Debug para entender qué está pasando
        console.log(`📞 Mensaje recibido - From: ${from} | IsMyMsg: ${isMyMsg} | Texto: "${texto}"`);
        
        // Función para verificar si es admin - usar el número real del log
        const isAdmin = from.includes("197353898250346");
        const msg = texto.toLowerCase();
        
        // DEBUG ESPECÍFICO PARA ADMIN
        console.log(`🔍 DEBUG ADMIN: from="${from}" | contiene 197353898250346: ${from.includes("197353898250346")} | isAdmin: ${isAdmin} | msg: "${msg}"`);
        
        // VERIFICAR COMANDOS DE ADMIN PRIMERO (antes que cualquier filtro)
        if (isAdmin && (msg === "/activar" || msg === "/desactivar")) {
            console.log(`👑 COMANDO DE ADMIN RECIBIDO: ${msg} desde ${from}`);
            if (msg === "/activar") {
                botActivo = true;
                console.log("🤖 Bot ACTIVADO por admin");
                await notifyBotStatus(true); // Notificar por Telegram
                return sock.sendMessage(from, { 
                    text: "✅ **Hxck4io ACTIVADO**\n🟢 El bot ahora responderá a todos los usuarios\n📲 Notificación enviada por Telegram" 
                });
            }
            if (msg === "/desactivar") {
                botActivo = false;
                console.log("🛑 Bot DESACTIVADO por admin");
                await notifyBotStatus(false); // Notificar por Telegram
                return sock.sendMessage(from, { 
                    text: "❌ **Hxck4io DESACTIVADO**\n🔴 El bot ignorará mensajes de usuarios\n📲 Notificación enviada por Telegram" 
                });
            }
        }
        
        // ⚠️ IGNORAR todos los mensajes propios del bot
        if (isMyMsg) {
            console.log(`🤖 Ignorando mensaje automático del bot`);
            return;
        }
        
        // Debug para identificar admin
        console.log(`📱 Mensaje de: ${from} | Es Admin: ${isAdmin}`);

        // ❌ NO RESPONDER EN GRUPOS
        if (from.endsWith("@g.us")) return;
        
        // Solo mostrar mensajes de admin para debug
        if (isAdmin) {
            console.log(`👑 Admin: ${texto}`);
        }
 
        // Obtener nombre del contacto
        const senderName = m.pushName || "Usuario";
        
        // Guardar conversación (solo si no es del admin y no es mensaje del bot)
        if (!isAdmin) {
            await saveConversation(from, sock.user?.id, texto, false);
        }

        // Comando especial para verificar tu número
        if (msg === "/mi_numero") {
            console.log(`🔍 Número solicitado: ${from}`);
            return sock.sendMessage(from, { 
                text: `📱 Tu número de WhatsApp es:\n${from}\n\n${isAdmin ? '✅ Eres admin' : '❌ No eres admin'}` 
            });
        }



        // Si es mensaje del admin que NO son comandos de control, solo mostrar en consola (no responder)
        if (isAdmin && msg !== "/activar" && msg !== "/desactivar") {
            console.log(`👑 Admin: ${texto}`);
            return;
        }

        // Si el bot está desactivado → ignorar otros usuarios
        if (!botActivo) {
            console.log(`🛑 Bot desactivado, ignorando mensaje de ${from}`);
            return;
        }

        // Si la conversación fue cerrada, reabrir con cualquier mensaje
        if (conversationsClosed[from]) {
            console.log(`🔄 Reabriendo conversación para ${from}`);
            conversationsClosed[from] = false;
            welcomeSent[from] = false; // Permitir nueva bienvenida
        }
        
        // Actualizar estadísticas y usuario
        await updateStats();
        const userData = await saveUser(from, senderName);
        
        // Si es usuario nuevo, notificar
        if (userData.isFirstTime) {
            await notifyNewUser(senderName, from);
        }

        // Control de cooldown (más estricto)
        const now = Date.now();
        if (lastCommandTime[from] && (now - lastCommandTime[from]) < 3000) { // 3 segundos
            console.log(`⏱️ Cooldown activo para ${from}`);
            return; // No responder, solo ignorar
        }

        // BIENVENIDA para usuarios nuevos O conversaciones reapertas (DEBE IR ANTES DE COMANDOS)
        if (!welcomeSent[from]) {
            welcomeSent[from] = true; // Marcar que ya se envió bienvenida
            conversationsClosed[from] = false; // Abrir nueva conversación
            const welcomeMsg = mensajeBienvenida(senderName);
            await saveConversation(sock.user?.id, from, welcomeMsg, true);
            return sock.sendMessage(from, { text: welcomeMsg });
        }

        // COMANDOS
        if (msg.startsWith("/urgente ")) {
            const urgentMsg = texto.substring(9); // Quitar "/urgente "
            lastCommandTime[from] = now;
            
            // Enviar notificación por Telegram
            await sendUrgentNotification(senderName, from, urgentMsg);
            await updateStats("urgente");
            
            return sock.sendMessage(from, {
                text: `
╔══════════════════════════╗
    🚨 *MENSAJE URGENTE ENVIADO*
╚══════════════════════════╝

✅ *Estado:* Notificación enviada exitosamente
👤 *Para:* Iván Galicia (LXRDSZN)
📱 *Vía:* Telegram
⏰ *Hora:* ${new Date().toLocaleString('es-MX')}

💬 *Tu mensaje:*
"${urgentMsg}"

🔔 Iván será notificado inmediatamente
⚡ Respuesta estimada: 5-15 minutos

━━━━━━━━━━━━━━━━━━━━
⚠️ Usa este comando solo para emergencias
`
            });
        }

        if (msg === "/goodbye" || msg === "/despedida") {
            lastCommandTime[from] = now;
            conversationsClosed[from] = true; // Marcar conversación como cerrada
            await closeConversation(from, sock.user?.id);
            await updateStats("goodbye");
            
            return sock.sendMessage(from, { text: mensajeDespedida(senderName) });
        }

        if (msg === "/help" || msg === "/ayuda") {
            lastCommandTime[from] = now;
            await updateStats("help");
            return sock.sendMessage(from, { text: mensajeAyuda() });
        }

        if (msg === "/status" || msg === "/estado") {
            lastCommandTime[from] = now;
            await updateStats("status");
            const userData = await getUser(from);
            return sock.sendMessage(from, { 
                text: `
╔══════════════════════════╗
    📊 *ESTADO DE TU CUENTA*
╚══════════════════════════╝

👤 *Usuario:* ${senderName}
📱 *Número:* ${from}
📅 *Primer contacto:* ${userData?.firstContact ? new Date(userData.firstContact).toLocaleDateString('es-MX') : 'Hoy'}
💬 *Mensajes enviados:* ${userData?.messageCount || 1}
⏰ *Última actividad:* ${new Date().toLocaleString('es-MX')}

🤖 *Bot:* Hxck4io v2.1
🟢 *Estado:* Activo y funcionando
👑 *Desarrollador:* Iván Galicia (LXRDSZN)

━━━━━━━━━━━━━━━━━━━━
Usa */help* para ver todos los comandos
` 
            });
        }

        if (msg === "/contacto") {
            lastCommandTime[from] = now;
            await updateStats("contacto");
            return sock.sendMessage(from, {
                text: `
╔═══════════════════════════════╗
  🔗 *CONTACTO OFICIAL LXRDSZN* 🔗
╚═══════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *REDES SOCIALES ACTIVAS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💻 *GitHub Oficial:*
https://github.com/lxrdszn
📝 Proyectos, código fuente y contribuciones

💬 *Telegram Personal:*
https://t.me/LXRDSZN_GG
⚡ Respuesta rápida y directa

🎧 *Discord Servidor:*
https://discord.gg/ZAZvUKqF
🎮 Comunidad, gaming y desarrollo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *REDES TEMPORALMENTE INACTIVAS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📵 *Facebook* - Mantenimiento  
📵 *Instagram* - Fuera de servicio  
📵 *WhatsApp Personal* - Solo este bot  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 *PARA EMERGENCIAS:*
Usa */urgente <mensaje>* y serás contactado
directamente por Telegram en minutos.

⏰ *Horarios de respuesta:*
Lunes a Domingo: 24/7 (Mediante bot)
Respuesta personal: 8AM - 11PM (MX)
`
            });
        }

        if (msg.startsWith("/music ")) {
            const song = msg.replace("/music ", "");
            lastCommandTime[from] = now;
            await updateStats("music");
            return sock.sendMessage(from, {
                text: `
╔══════════════════════════╗
    🎵 *REPRODUCTOR YOUTUBE HD*
╚══════════════════════════╝

🎧 *Buscando:* "${song}"
📱 *Calidad:* Alta Definición (HD)
⚡ *Estado:* Redirigiendo...

━━━━━━━━━━━━━━━━━━━━
🔗 *ENLACE DIRECTO:*
━━━━━━━━━━━━━━━━━━━━

https://www.youtube.com/results?search_query=${encodeURIComponent(song)}

━━━━━━━━━━━━━━━━━━━━
💡 *Sugerencia:*
También puedes buscar: "letra de ${song}"
para encontrar la letra de la canción

🎵 Disfruta tu música
`
            });
        }

        if (msg.startsWith("/copilot ")) {
            const prompt = msg.replace("/copilot ", "");
            lastCommandTime[from] = now;
            await updateStats("copilot");
            return sock.sendMessage(from, {
                text: `
╔══════════════════════════╗
    🤖 *GITHUB COPILOT IA*
╚══════════════════════════╝

💭 *Tu consulta:*
"${prompt}"

🔄 *Procesando con IA...*

💡 *Respuesta:*
Esta funcionalidad estará disponible próximamente 
con integración real de GitHub Copilot AI.

━━━━━━━━━━━━━━━━━━━━
🚀 *Mientras tanto, puedes:*

• Usar */urgente* para contactar a Iván
• Visitar el GitHub oficial
• Unirte al Discord para ayuda técnica

🔗 GitHub: https://github.com/lxrdszn
`
            });
        }

        if (msg === "/meme" || msg === "/random") {
            lastCommandTime[from] = now;
            await updateStats("meme");
            const memes = [
                "🤖 *Dato random:* Los desarrolladores beben más café que agua",
                "💻 *Fact:* El 90% del código se escribe después de medianoche",
                "🐛 *Debug quote:* 'It's not a bug, it's a feature'",
                "⚡ *Verdad universal:* Ctrl+C, Ctrl+V = 50% del trabajo",
                "🌙 *Modo desarrollador:* 2AM es la hora más productiva",
                "🔥 *Pro tip:* Stackoverflow tiene todas las respuestas",
                "💡 *Realidad:* 'Funciona en mi máquina' - Frase legendaria",
                "🎯 *Filosofía dev:* Si compile, funciona... hasta que no"
            ];
            const randomMeme = memes[Math.floor(Math.random() * memes.length)];
            
            return sock.sendMessage(from, {
                text: `
╔══════════════════════════╗
    😄 *HUMOR DEV RANDOM*
╚══════════════════════════╝

${randomMeme}

━━━━━━━━━━━━━━━━━━━━
😂 Usa */meme* para otro chiste random
🤖 Bot: Hxck4io v2.1
`
            });
        }

        if (msg === "/tiempo" || msg.startsWith("/clima ")) {
            lastCommandTime[from] = now;
            await updateStats("tiempo");
            return sock.sendMessage(from, {
                text: `
╔══════════════════════════╗
    🌤️ *INFORMACIÓN DEL CLIMA*
╚══════════════════════════╝

📍 *Ubicación:* México
🕐 *Hora local:* ${new Date().toLocaleString('es-MX')}

⚠️ *Próximamente disponible*
Integración con API del clima en desarrollo

━━━━━━━━━━━━━━━━━━━━
💡 *Mientras tanto:*
• Usa Google: "clima México"
• Apps recomendadas: Weather, AccuWeather

🔗 Para emergencias usa */urgente <mensaje>*
`
            });
        }

        if (msg === "/hora") {
            lastCommandTime[from] = now;
            await updateStats("hora");
            const fecha = new Date().toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            return sock.sendMessage(from, {
                text: `🕐 *Fecha y hora actual:*\n${fecha} (México)`
            });
        }

        if (msg === "/info") {
            lastCommandTime[from] = now;
            await updateStats("info");
            return sock.sendMessage(from, {
                text: `
╔══════════════════════════╗
    ℹ️ *INFORMACIÓN DEL BOT*
╚══════════════════════════╝

🤖 *Nombre:* Hxck4io
🏷️ *Versión:* 2.1.0 Enhanced
👑 *Desarrollador:* Iván Galicia Garcés (LXRDSZN)
🟢 *Estado:* Activo y funcionando

━━━━━━━━━━━━━━━━━━━━
📊 *CARACTERÍSTICAS*
━━━━━━━━━━━━━━━━━━━━

✅ Respuestas automáticas inteligentes
🚨 Sistema de notificaciones urgentes
📱 Integración con Telegram
🎵 Búsqueda de música en YouTube
💬 Gestión de conversaciones
📈 Estadísticas de uso

━━━━━━━━━━━━━━━━━━━━
👤 *USUARIO ACTUAL*
━━━━━━━━━━━━━━━━━━━━

📝 *Nombre:* ${senderName}
⏰ *Sesión iniciada:* ${new Date().toLocaleString('es-MX')}

Usa */help* para ver todos los comandos disponibles
`
            });
        }

        // Si ya se envió bienvenida y el mensaje no es un comando válido, mostrar error
        if (welcomeSent[from] && (!msg.startsWith("/") || !isValidCommand(msg))) {
            lastCommandTime[from] = now;
            return sock.sendMessage(from, { text: mensajeComandoInvalido() });
        }
    });
}

// BIENVENIDA MEJORADA
function mensajeBienvenida(nombre = "Usuario") {
    return `
╔═══════════════════════════════╗
  🌙✨ *¡Hola ${nombre}! Bienvenido a Hxck4io* ✨🌙
╚═══════════════════════════════╝

🤖 *Asistente Inteligente de Iván Galicia Garcés (LXRDSZN)*

Iván no está disponible en este momento, pero estoy aquí 
para ayudarte con todo lo que necesites mientras regresa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *COMANDOS PRINCIPALES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 */urgente <mensaje>*  
   Notificaré a Iván inmediatamente por Telegram

📞 */contacto*  
   Todas las redes sociales oficiales

🎵 */music <canción>*  
   Búsqueda directa en YouTube HD

🤖 */copilot <pregunta>*  
   Consultas técnicas con IA (próximamente)

🕐 */hora*  
   Fecha y hora actual de México

ℹ️ */info*  
   Información completa del bot

📊 */status*  
   Estado de tu cuenta y estadísticas

❓ */help*  
   Lista completa de comandos

🚪 */goodbye*  
   Finalizar conversación correctamente

😄 */meme* o */random*  
   Chistes y datos random de developers

🌤️ */clima* o */tiempo*  
   Información del clima (próximamente)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *REDES OFICIALES ACTIVAS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐙 *GitHub:* https://github.com/lxrdszn
💬 *Telegram:* https://t.me/LXRDSZN_GG  
🎧 *Discord:* https://discord.gg/ZAZvUKqF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *AVISO IMPORTANTE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📵 *Facebook*, *Instagram* y *WhatsApp personal*  
están temporalmente fuera de servicio.

🔔 Para emergencias, usa */urgente <tu mensaje>*  
📱 Respuesta garantizada en 5-15 minutos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⌛ Gracias por contactarme  
Estoy aquí para asistirte 24/7 🖤✨
`;
}

// MENSAJE DE DESPEDIDA
function mensajeDespedida(nombre = "Usuario") {
    return `
╔═══════════════════════════════╗
  👋✨ *¡Hasta pronto, ${nombre}!* ✨👋
╚═══════════════════════════════╝

🤖 *Conversación finalizada exitosamente*

Ha sido un placer asistirte el día de hoy.  
Tu conversación ha sido cerrada correctamente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *RESUMEN DE LA SESIÓN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ *Finalizada:* ${new Date().toLocaleString('es-MX')}  
🤖 *Bot:* Hxck4io v2.1  
👤 *Usuario:* ${nombre}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 *¿QUIERES VOLVER A HABLAR?*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Simplemente envía cualquier mensaje y recibirás  
una nueva bienvenida para iniciar otra conversación.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *MANTENTE CONECTADO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐙 GitHub: https://github.com/lxrdszn  
💬 Telegram: https://t.me/LXRDSZN_GG  
🎧 Discord: https://discord.gg/ZAZvUKqF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *¡Gracias por usar Hxck4io!* ✨  
🖤 *Desarrollado con cariño por LXRDSZN*
`;
}

// FUNCIÓN PARA VALIDAR COMANDOS
function isValidCommand(msg) {
    const validCommands = [
        "/urgente", "/goodbye", "/despedida", "/help", "/ayuda", "/status", "/estado",
        "/contacto", "/music", "/copilot", "/meme", "/random", "/tiempo", "/clima",
        "/hora", "/info", "/activar", "/desactivar", "/admin_set", "/mi_numero"
    ];
    
    // Verificar comandos exactos
    if (validCommands.includes(msg)) return true;
    
    // Verificar comandos con parámetros
    if (msg.startsWith("/urgente ") && msg.length > 9) return true;
    if (msg.startsWith("/music ") && msg.length > 7) return true;
    if (msg.startsWith("/copilot ") && msg.length > 9) return true;
    if (msg.startsWith("/clima ") && msg.length > 7) return true;
    
    return false;
}

// MENSAJE PARA COMANDO INVÁLIDO
function mensajeComandoInvalido() {
    return `
╔═══════════════════════════════╗
  ⚠️ *COMANDO NO RECONOCIDO* ⚠️
╚═══════════════════════════════╝

❌ El mensaje que enviaste no es un comando válido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 *COMANDOS PRINCIPALES DISPONIBLES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 */urgente <mensaje>* - Notificación inmediata
📞 */contacto* - Redes sociales oficiales  
🎵 */music <canción>* - Buscar música
📊 */status* - Estado de tu cuenta
ℹ️ */info* - Información del bot
🕐 */hora* - Fecha y hora actual
😄 */meme* - Chiste random
❓ */help* - Lista completa de comandos
🚪 */goodbye* - Cerrar conversación

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *EJEMPLOS DE USO CORRECTO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ /urgente Necesito ayuda urgente
✅ /music Bad Bunny Monaco  
✅ /help
✅ /contacto

❌ Hola (texto libre no es válido)
❌ /comando_inexistente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Usa /help para ver todos los comandos*
🤖 *Bot Hxck4io v2.1.0*
`;
}

// MENSAJE DE AYUDA COMPLETO
function mensajeAyuda() {
    return `
╔═══════════════════════════════╗
  ❓ *AYUDA COMPLETA - Hxck4io* ❓
╚═══════════════════════════════╝

🤖 *Guía completa de comandos disponibles*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 *COMANDOS DE EMERGENCIA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/urgente <mensaje>*  
💡 Notifica inmediatamente a Iván por Telegram  
📝 Ejemplo: /urgente Necesito ayuda con mi proyecto  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 *COMANDOS DE INFORMACIÓN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/contacto* - Redes sociales oficiales activas  
*/info* - Información completa del bot  
*/status* - Estado de tu cuenta y estadísticas  
*/hora* - Fecha y hora actual de México  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 *ENTRETENIMIENTO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/music <canción>*  
💡 Busca música en YouTube HD  
📝 Ejemplo: /music Bad Bunny Monaco

*/meme* o */random*  
💡 Chistes y datos random para developers  

*/tiempo* o */clima*  
💡 Información del clima (próximamente)  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 *COMANDOS TÉCNICOS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/copilot <pregunta>*  
💡 Consultas con IA (próximamente)  
📝 Ejemplo: /copilot ¿Cómo crear una API en Node.js?  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 *GESTIÓN DE CONVERSACIÓN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/help* o */ayuda* - Muestra esta ayuda  
*/goodbye* o */despedida* - Cierra conversación  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *CONSEJOS IMPORTANTES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Cooldown de 3 segundos entre comandos  
• Usa /urgente solo para emergencias  
• Para reabrir conversación, envía cualquier mensaje  
• El bot funciona 24/7 automáticamente  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 *Bot desarrollado por Iván Galicia (LXRDSZN)*  
🤖 *Versión 2.1.0 Enhanced*
`;
}

iniciarBot();
