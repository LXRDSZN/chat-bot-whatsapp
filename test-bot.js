import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

console.log("🚀 Iniciando bot de prueba...");

async function testBot() {
    try {
        console.log("📁 Configurando autenticación...");
        const { state, saveCreds } = await useMultiFileAuthState("./baileys_auth");
        
        console.log("🔄 Obteniendo versión de Baileys...");
        const { version } = await fetchLatestBaileysVersion();
        console.log("✅ Versión obtenida:", version);

        console.log("🔌 Creando socket...");
        const sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: "fatal" })
        });

        console.log("👂 Configurando eventos...");
        
        sock.ev.on("connection.update", (update) => {
            console.log("🔄 Actualización de conexión:", update);
            const { qr, connection } = update;
            
            if (qr) {
                console.clear();
                console.log("📲 ¡QR GENERADO! Escanea este código:\n");
                qrcode.generate(qr, { small: true });
                console.log("\n✅ QR mostrado arriba. Escanéalo con WhatsApp.");
            }
            
            if (connection === "open") {
                console.log("🎉 ¡Bot conectado correctamente!");
            }
            
            if (connection === "close") {
                console.log("❌ Conexión cerrada. Reintentando...");
                setTimeout(testBot, 3000);
            }
        });

        sock.ev.on("creds.update", saveCreds);
        
        console.log("⏳ Esperando conexión...");
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testBot();