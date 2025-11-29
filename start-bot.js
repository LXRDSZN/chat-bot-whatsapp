#!/usr/bin/env node

/**
 * 🤖 Hxck4io Bot - Script de Inicio Mejorado
 * Desarrollado por Iván Galicia Garcés (LXRDSZN)
 * Versión: 2.1.0 Enhanced
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function showBanner() {
    console.clear();
    console.log(colorize(`
╔════════════════════════════════════════╗
║                                        ║
║         🤖 HXCK4IO BOT v2.1.0          ║
║            Enhanced Edition            ║
║                                        ║
║    Desarrollado por LXRDSZN (Iván)     ║
║                                        ║
╚════════════════════════════════════════╝
`, 'cyan'));

    console.log(colorize('🚀 Iniciando sistema...', 'yellow'));
    console.log('');
}

async function checkDependencies() {
    console.log(colorize('📦 Verificando dependencias...', 'blue'));
    
    try {
        const { stdout } = await execAsync('npm list --depth=0 --silent');
        console.log(colorize('✅ Todas las dependencias están instaladas', 'green'));
        return true;
    } catch (error) {
        console.log(colorize('❌ Faltan dependencias. Instalando...', 'red'));
        
        try {
            await execAsync('npm install');
            console.log(colorize('✅ Dependencias instaladas correctamente', 'green'));
            return true;
        } catch (installError) {
            console.log(colorize('❌ Error al instalar dependencias:', 'red'));
            console.log(installError.message);
            return false;
        }
    }
}

async function checkDirectories() {
    console.log(colorize('📁 Verificando directorios...', 'blue'));
    
    const directories = ['./data', './baileys_auth'];
    
    for (const dir of directories) {
        try {
            await fs.access(dir);
            console.log(colorize(`✅ Directorio ${dir} existe`, 'green'));
        } catch {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(colorize(`✅ Directorio ${dir} creado`, 'green'));
            } catch (error) {
                console.log(colorize(`❌ Error creando ${dir}:`, 'red'));
                console.log(error.message);
                return false;
            }
        }
    }
    return true;
}

async function checkConfig() {
    console.log(colorize('⚙️  Verificando configuración...', 'blue'));
    
    try {
        const configModule = await import('./config.js');
        const config = configModule.CONFIG;
        
        if (!config.TELEGRAM_BOT_TOKEN) {
            console.log(colorize('⚠️  Token de Telegram no configurado', 'yellow'));
        } else {
            console.log(colorize('✅ Token de Telegram configurado', 'green'));
        }
        
        if (!config.TELEGRAM_CHAT_ID) {
            console.log(colorize('⚠️  Chat ID de Telegram no configurado', 'yellow'));
        } else {
            console.log(colorize('✅ Chat ID de Telegram configurado', 'green'));
        }
        
        return true;
    } catch (error) {
        console.log(colorize('❌ Error en configuración:', 'red'));
        console.log(error.message);
        return false;
    }
}

function showInstructions() {
    console.log('');
    console.log(colorize('📋 INSTRUCCIONES DE USO:', 'magenta'));
    console.log('');
    console.log('👑 ' + colorize('PARA EL ADMIN (Iván):', 'yellow'));
    console.log('   1. Envía /admin_set para configurarte como admin');
    console.log('   2. Usa /activar para encender el bot');
    console.log('   3. Usa /desactivar para apagar el bot');
    console.log('   4. Recibirás notificaciones en Telegram');
    console.log('');
    console.log('👥 ' + colorize('PARA LOS USUARIOS:', 'yellow'));
    console.log('   • /urgente <mensaje> - Notificación inmediata');
    console.log('   • /help - Ver todos los comandos');
    console.log('   • /goodbye - Cerrar conversación');
    console.log('   • Cualquier mensaje reabre la conversación');
    console.log('');
    console.log('🔔 ' + colorize('FUNCIONES NUEVAS v2.1.0:', 'green'));
    console.log('   ✅ Notificaciones de activación/desactivación');
    console.log('   ✅ Sistema de conversaciones mejorado');
    console.log('   ✅ Comandos /status, /meme, /help nuevos');
    console.log('   ✅ Mensajes con diseño estético mejorado');
    console.log('');
}

async function startBot() {
    showBanner();
    
    // Verificaciones previas
    const depsOk = await checkDependencies();
    if (!depsOk) {
        console.log(colorize('❌ No se puede continuar sin las dependencias', 'red'));
        process.exit(1);
    }
    
    const dirsOk = await checkDirectories();
    if (!dirsOk) {
        console.log(colorize('❌ Error al crear directorios necesarios', 'red'));
        process.exit(1);
    }
    
    const configOk = await checkConfig();
    if (!configOk) {
        console.log(colorize('❌ Error en la configuración', 'red'));
        process.exit(1);
    }
    
    showInstructions();
    
    console.log(colorize('🤖 Iniciando Hxck4io Bot...', 'green'));
    console.log(colorize('📱 Esperando código QR...', 'blue'));
    console.log('');
    
    // Importar y ejecutar el bot principal
    try {
        await import('./index.js');
    } catch (error) {
        console.log(colorize('❌ Error al iniciar el bot:', 'red'));
        console.log(error.message);
        process.exit(1);
    }
}

// Manejo de señales para cierre elegante
process.on('SIGINT', () => {
    console.log('');
    console.log(colorize('🛑 Cerrando bot...', 'yellow'));
    console.log(colorize('👋 ¡Hasta luego!', 'cyan'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('');
    console.log(colorize('🛑 Cerrando bot...', 'yellow'));
    process.exit(0);
});

// Iniciar el bot
startBot().catch(error => {
    console.log(colorize('❌ Error crítico:', 'red'));
    console.error(error);
    process.exit(1);
});