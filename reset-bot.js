// Script para resetear el bot y limpiar datos
import fs from 'fs/promises';

console.log("🧹 Limpiando datos del bot...");

try {
    // Eliminar archivos de datos
    await fs.unlink('./data/usuarios.json').catch(() => {});
    await fs.unlink('./data/conversaciones.json').catch(() => {});
    await fs.unlink('./data/estadisticas.json').catch(() => {});
    
    console.log("✅ Datos limpiados exitosamente");
    console.log("ℹ️  El bot comenzará con datos frescos");
    
} catch (error) {
    console.log("⚠️  Error limpiando:", error.message);
}