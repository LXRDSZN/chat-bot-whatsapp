// Configuración del bot
export const CONFIG = {
    // Tu número de WhatsApp (reemplaza con tu número real)
    ADMIN_NUMBER: "527352980546@s.whatsapp.net", // Tu número configurado
    
    // Token de bot de Telegram para notificaciones urgentes
    TELEGRAM_BOT_TOKEN: "7524912150:AAEcbmWKxK4PXWUfGPqS0QSs4DRFCHiZ-U4", // Tu bot token
    TELEGRAM_CHAT_ID: "2005309931", // Tu chat ID
    
    // Rutas de archivos
    USERS_FILE: "./data/usuarios.json",
    CONVERSATIONS_FILE: "./data/conversaciones.json",
    STATS_FILE: "./data/estadisticas.json",
    
    // Configuración de comandos
    COMMAND_PREFIX: "/",
    COOLDOWN_TIME: 1000, // 1 segundo entre comandos
    
    // Mensajes automáticos
    AUTO_RESPONSE: true,
    SAVE_CONVERSATIONS: true
};