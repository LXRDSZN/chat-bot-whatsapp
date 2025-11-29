import fs from 'fs/promises';
import { CONFIG } from '../config.js';

// Crear directorios si no existen
async function ensureDirectories() {
    try {
        await fs.mkdir('./data', { recursive: true });
    } catch (error) {
        // Directorio ya existe
    }
}

// Leer archivo JSON
async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Escribir archivo JSON
async function writeJSON(filePath, data) {
    await ensureDirectories();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Gestión de usuarios
export async function saveUser(phoneNumber, name, isFirstTime = false) {
    const users = await readJSON(CONFIG.USERS_FILE);
    const now = new Date().toISOString();
    
    const isNewUser = !users[phoneNumber];
    
    if (isNewUser) {
        users[phoneNumber] = {
            name: name || "Usuario",
            firstContact: now,
            lastSeen: now,
            messageCount: 1,
            isFirstTime: true
        };
    } else {
        users[phoneNumber].name = name || users[phoneNumber].name;
        users[phoneNumber].lastSeen = now;
        users[phoneNumber].messageCount++;
        users[phoneNumber].isFirstTime = false;
    }
    
    await writeJSON(CONFIG.USERS_FILE, users);
    
    // Retornar con el flag correcto
    return {
        ...users[phoneNumber],
        isFirstTime: isNewUser
    };
}

// Obtener usuario
export async function getUser(phoneNumber) {
    const users = await readJSON(CONFIG.USERS_FILE);
    return users[phoneNumber] || null;
}

// Guardar conversación
export async function saveConversation(from, to, message, isBot = false) {
    if (!CONFIG.SAVE_CONVERSATIONS) return;
    
    const conversations = await readJSON(CONFIG.CONVERSATIONS_FILE);
    const chatKey = `${from}_${to}`;
    
    if (!conversations[chatKey]) {
        conversations[chatKey] = [];
    }
    
    conversations[chatKey].push({
        timestamp: new Date().toISOString(),
        from: from,
        to: to,
        message: message,
        isBot: isBot
    });
    
    // Mantener solo los últimos 50 mensajes por chat
    if (conversations[chatKey].length > 50) {
        conversations[chatKey] = conversations[chatKey].slice(-50);
    }
    
    await writeJSON(CONFIG.CONVERSATIONS_FILE, conversations);
}

// Cerrar conversación
export async function closeConversation(phoneNumber, botId) {
    const conversations = await readJSON(CONFIG.CONVERSATIONS_FILE);
    const chatKey = `${phoneNumber}_${botId}`;
    
    if (!conversations[chatKey]) {
        conversations[chatKey] = [];
    }
    
    conversations[chatKey].push({
        timestamp: new Date().toISOString(),
        from: botId,
        to: phoneNumber,
        message: "[CONVERSACIÓN CERRADA]",
        isBot: true,
        action: "CLOSE_CONVERSATION"
    });
    
    await writeJSON(CONFIG.CONVERSATIONS_FILE, conversations);
    console.log(`🚪 Conversación cerrada para ${phoneNumber}`);
}

// Estadísticas
export async function updateStats(command = null) {
    const stats = await readJSON(CONFIG.STATS_FILE);
    const today = new Date().toISOString().split('T')[0];
    
    if (!stats[today]) {
        stats[today] = {
            totalMessages: 0,
            commandsUsed: {},
            uniqueUsers: new Set()
        };
    }
    
    stats[today].totalMessages++;
    
    if (command) {
        if (!stats[today].commandsUsed[command]) {
            stats[today].commandsUsed[command] = 0;
        }
        stats[today].commandsUsed[command]++;
    }
    
    // Convertir Set a Array para JSON
    stats[today].uniqueUsers = Array.from(stats[today].uniqueUsers);
    await writeJSON(CONFIG.STATS_FILE, stats);
}