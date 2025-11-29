# 🤖 Bot WhatsApp Hxck4io v2.1.0 Enhanced

Bot personal automatizado para WhatsApp con funciones avanzadas de gestión de usuarios, notificaciones y sistema de conversaciones mejorado.

## 🆕 Novedades v2.1.0

- ✅ **Notificaciones automáticas**: El bot te avisa por Telegram cuando se activa/desactiva
- ✅ **Sistema de conversaciones**: Comando `/goodbye` para cerrar conversaciones elegantemente  
- ✅ **Nuevos comandos**: `/help`, `/status`, `/meme`, `/clima`
- ✅ **Diseño mejorado**: Todos los mensajes con marcos ASCII y mejor estética
- ✅ **Control de flujo**: Mejor gestión de conversaciones cerradas y reapertura automática

## 🚀 Características Principales

- **Control exclusivo de admin**: Solo tú puedes activar/desactivar el bot con notificaciones automáticas
- **Base de datos de usuarios**: Guarda nombres, conversaciones y estadísticas automáticamente  
- **Notificaciones inteligentes**: Alertas por Telegram para mensajes urgentes y cambios de estado
- **Sistema anti-spam**: Cooldown de 3 segundos entre comandos por usuario
- **Gestión de conversaciones**: Apertura y cierre elegante de chats
- **Estadísticas avanzadas**: Tracking completo de comandos y uso del bot

## ⚙️ Configuración Inicial

### 1. Configurar tu número de admin
El bot detecta automáticamente tu número, pero puedes configurarlo manualmente en `config.js`:
```javascript
ADMIN_NUMBER: "521234567890@s.whatsapp.net"
```

### 2. Configurar Telegram (Para notificaciones)
1. Crea un bot en [@BotFather](https://t.me/BotFather)
2. Obtén tu Chat ID enviando `/start` a [@userinfobot](https://t.me/userinfobot)  
3. Actualiza `config.js`:
```javascript
TELEGRAM_BOT_TOKEN: "tu_token_aqui",
TELEGRAM_CHAT_ID: "tu_chat_id_aqui"
```

## 🎯 Comandos Disponibles

### 👑 Para el Admin (Solo tú):
- `/admin_set` - Configurarte como administrador
- `/activar` - Activar el bot (con notificación automática)  
- `/desactivar` - Desactivar el bot (con notificación automática)
- `/mi_numero` - Ver tu número de WhatsApp registrado

### 👥 Para usuarios:
#### 🚨 Emergencias:
- `/urgente <mensaje>` - Notificación inmediata por Telegram

#### ℹ️ Información:  
- `/contacto` - Redes sociales oficiales (rediseñado)
- `/info` - Información completa del bot
- `/status` - Estado de cuenta y estadísticas personales
- `/help` o `/ayuda` - Lista completa de comandos  

#### 🎵 Entretenimiento:
- `/music <canción>` - Búsqueda mejorada en YouTube HD
- `/meme` o `/random` - Chistes y datos random para developers

#### 🤖 Técnico:
- `/copilot <pregunta>` - Consultas técnicas con IA (próximamente)
- `/hora` - Fecha y hora actual de México
- `/clima` o `/tiempo` - Información del clima (próximamente)

#### 🚪 Gestión:
- `/goodbye` o `/despedida` - Cerrar conversación correctamente

## 🔄 Flujo de Conversaciones

### Para usuarios normales:
1. **Primera conexión**: Reciben mensaje de bienvenida automático
2. **Durante la conversación**: Pueden usar todos los comandos disponibles  
3. **Cerrar conversación**: Comando `/goodbye` muestra mensaje de despedida
4. **Reconexión**: Cualquier nuevo mensaje reabre con nueva bienvenida

### Para el admin:
1. **Configuración inicial**: Envía `/admin_set` una vez
2. **Control total**: Usa `/activar` y `/desactivar` con notificaciones automáticas
3. **Sin respuestas automáticas**: El bot no te responde para evitar spam

## 📊 Sistema de Base de Datos

El bot guarda automáticamente:
- **Usuarios**: Nombres, fecha primer contacto, mensajes enviados, última actividad
- **Conversaciones**: Historial completo (últimos 50 mensajes por chat)  
- **Estadísticas**: Comandos más usados, actividad diaria, usuarios únicos
- **Estados**: Conversaciones cerradas, bienvenidas enviadas

## 🔧 Instalación y Uso

### Instalación rápida:
```bash
# Clonar e instalar dependencias
npm install

# Iniciar con script mejorado (recomendado)
npm start

# O iniciar directamente
npm run dev
```

### Scripts disponibles:
- `npm start` - Inicia con verificaciones y banner (recomendado)
- `npm run dev` - Inicio directo del bot
- `npm run reset` - Resetear datos del bot  
- `npm run test` - Probar conexión

## 📱 Funcionamiento Detallado

### ✅ Características de Seguridad:
- **Control exclusivo**: Solo el admin puede activar/desactivar
- **Anti-spam**: Cooldown de 3 segundos entre comandos
- **Chats privados únicamente**: Ignora automáticamente grupos  
- **Notificaciones seguras**: Integración cifrada con Telegram

### 🔔 Sistema de Notificaciones:
- **Activación/Desactivación**: Te avisa automáticamente por Telegram
- **Mensajes urgentes**: Notificación inmediata con detalles completos
- **Usuarios nuevos**: Alerta cuando alguien nuevo escribe por primera vez

### 🎨 Mejoras Estéticas v2.1.0:
- **Marcos ASCII elegantes**: Todos los mensajes con diseño profesional
- **Emojis organizados**: Uso consistente de símbolos y colores  
- **Separadores visuales**: Mejor organización de la información
- **Mensajes informativos**: Respuestas más completas y útiles

## 🛠️ Desarrollo y Personalización

### Estructura del proyecto:
```
bot-whatsapp/
├── index.js              # Bot principal  
├── config.js             # Configuración
├── start-bot.js          # Script de inicio mejorado
├── utils/
│   ├── database.js       # Gestión de datos
│   └── notifications.js  # Sistema de notificaciones
├── data/                 # Base de datos local
└── baileys_auth/         # Autenticación WhatsApp
```

### Agregar nuevos comandos:
1. Añadir lógica en `index.js` dentro del bloque de comandos
2. Actualizar estadísticas con `updateStats("nombre_comando")`  
3. Seguir el formato estético establecido con marcos ASCII

## 🚨 Resolución de Problemas

### El bot no responde:
1. Verifica que esté activado con `/activar`
2. Revisa que no estés en cooldown (3 segundos entre comandos)
3. Confirma que sea un chat privado (no grupos)

### Notificaciones de Telegram fallan:
1. Verifica el token del bot en `config.js`
2. Confirma tu Chat ID correcto  
3. Asegúrate de haber iniciado conversación con tu bot

### Primera configuración:
1. Envía `/admin_set` para configurarte como admin
2. Usa `/mi_numero` para verificar tu número registrado
3. Prueba `/activar` y `/desactivar` para confirmar funcionamiento

## 📈 Próximas Actualizaciones v2.2.0

- 🤖 **IA Real**: Integración con GitHub Copilot API
- 🌤️ **Clima en vivo**: API meteorológica en tiempo real  
- 📊 **Dashboard Web**: Panel de control con estadísticas
- 🎵 **Reproductor**: Integración directa con plataformas de música
- 📁 **Archivos**: Sistema de intercambio de documentos  
- 🔗 **Más redes**: Integración con Discord, Twitter, etc.

---

## 📞 Soporte y Contacto

🐙 **GitHub**: https://github.com/lxrdszn  
💬 **Telegram**: https://t.me/LXRDSZN_GG  
🎧 **Discord**: https://discord.gg/ZAZvUKqF

---

**🖤 Desarrollado con cariño por Iván Galicia Garcés (LXRDSZN)**  
**🤖 Hxck4io Bot v2.1.0 Enhanced Edition**