import fetch from 'node-fetch';
import { CONFIG } from '../config.js';

// Enviar notificación urgente por Telegram
export async function sendUrgentNotification(senderName, senderNumber, message) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
        console.log("❌ Telegram no configurado para notificaciones");
        return false;
    }
    
    const urgentMessage = `
🚨 *MENSAJE URGENTE* 🚨

👤 *De:* ${senderName}
📱 *Número:* ${senderNumber}
⏰ *Hora:* ${new Date().toLocaleString('es-MX')}

💬 *Mensaje:*
"${message}"

🔗 *Responder desde WhatsApp Web*
`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: urgentMessage,
                parse_mode: 'Markdown'
            })
        });
        
        if (response.ok) {
            console.log("✅ Notificación urgente enviada por Telegram");
            return true;
        } else {
            console.log("❌ Error al enviar notificación por Telegram");
            return false;
        }
    } catch (error) {
        console.log("❌ Error de conexión con Telegram:", error.message);
        return false;
    }
}

// Notificar activación/desactivación del bot
export async function notifyBotStatus(isActive) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
        console.log("❌ Telegram no configurado para notificaciones");
        return false;
    }
    
    const statusEmoji = isActive ? '✅' : '❌';
    const statusText = isActive ? 'ACTIVADO' : 'DESACTIVADO';
    const message = `
${statusEmoji} *BOT ${statusText}*

🤖 *Hxck4io* ha sido *${statusText.toLowerCase()}*
⏰ *Hora:* ${new Date().toLocaleString('es-MX')}

${isActive ? '🟢 El bot ahora responderá a todos los usuarios' : '🔴 El bot ignorará mensajes de usuarios (excepto admin)'}
`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        if (response.ok) {
            console.log(`✅ Notificación de bot ${statusText.toLowerCase()} enviada por Telegram`);
            return true;
        } else {
            console.log("❌ Error al enviar notificación de estado por Telegram");
            return false;
        }
    } catch (error) {
        console.log("❌ Error de conexión con Telegram:", error.message);
        return false;
    }
}

// Notificar nuevo usuario
export async function notifyNewUser(userName, userNumber) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) return;
    
    const message = `
🎉 *NUEVO USUARIO*

👤 *Nombre:* ${userName}
📱 *Número:* ${userNumber}
⏰ *Hora:* ${new Date().toLocaleString('es-MX')}
`;
    
    try {
        await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log("📢 Notificación de nuevo usuario enviada");
    } catch (error) {
        console.log("❌ Error al notificar nuevo usuario:", error.message);
    }
}