# Instrucciones de Configuración - Juego de Ruleta

## 🚀 Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone https://github.com/borderlesste/roulette-game-app.git
cd roulette-game-app
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y actualiza los valores:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

#### Base de Datos
```
DATABASE_URL=mysql://user:password@localhost:3306/roulette_game
```

#### Asaas (Pagos y Transferencias)
1. Ve a [Asaas.com](https://asaas.com)
2. Crea una cuenta y obtén tu API Key
3. Configura el webhook en el panel de Asaas apuntando a: `https://tudominio.com/api/webhooks/asaas`
4. Añade a tu `.env`:
```
ASAAS_API_KEY=your_api_key
ASAAS_WEBHOOK_SECRET=your_webhook_secret
ASAAS_API_URL=https://api.asaas.com/v3  # Cambiar a producción cuando esté listo
```

#### Resend (Notificaciones por Email)
1. Ve a [Resend.com](https://resend.com)
2. Crea una cuenta y obtén tu API Key
3. Verifica tu dominio en Resend
4. Actualiza el `FROM_EMAIL` en `server/emailServiceMultilingual.ts` con tu dominio
5. Añade a tu `.env`:
```
RESEND_API_KEY=your_resend_api_key
```

#### Encriptación
Genera una clave de encriptación de 64 caracteres hexadecimales:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Añade a tu `.env`:
```
ENCRYPTION_KEY=your_generated_key
```

### 4. Ejecutar Migraciones de Base de Datos
```bash
pnpm run db:migrate
```

### 5. Iniciar el Servidor de Desarrollo

**Terminal 1 - Backend:**
```bash
pnpm run dev:server
```

**Terminal 2 - Frontend:**
```bash
pnpm run dev:client
```

La aplicación estará disponible en `http://localhost:5173`

## 🌍 Sistema Multi-idioma

La plataforma soporta automáticamente:
- **Español (ES)** 🇪🇸
- **Portugués de Brasil (PT-BR)** 🇧🇷

### Cambiar Idioma
El selector de idioma está en la esquina superior derecha del header. El idioma se detecta automáticamente según el navegador del usuario.

### Agregar Nuevas Traducciones

**Frontend:**
1. Edita los archivos en `client/src/i18n/locales/`
2. Usa el hook `useTranslations()` en tus componentes

**Backend:**
1. Edita `server/translationService.ts`
2. Usa `getTranslation()`, `getErrorTranslation()`, etc.

## 📧 Notificaciones por Email

El sistema envía automáticamente correos en el idioma del usuario para:
- ✅ Depósitos recibidos
- ✅ Retiros procesados
- ✅ Retiros fallidos
- ✅ Recordatorios de pago

Las plantillas están en `server/emailServiceMultilingual.ts`

## 🔐 Seguridad

### Datos Sensibles
- CPF/CNPJ se almacenan encriptados con AES-256-GCM
- Claves PIX se almacenan encriptadas
- Teléfonos se almacenan encriptados

### Webhooks
- Todos los webhooks de Asaas se validan con un token secreto
- Las transacciones son idempotentes (no se procesan duplicadas)

## 📊 Estructura del Proyecto

```
roulette-game-app/
├── client/
│   └── src/
│       ├── i18n/              # Configuración multi-idioma
│       │   ├── config.ts
│       │   └── locales/
│       │       ├── es.json
│       │       └── pt-BR.json
│       ├── components/
│       │   └── LanguageSwitcher.tsx
│       └── hooks/
│           └── useTranslations.ts
├── server/
│   ├── asaas.ts               # Cliente de Asaas
│   ├── webhooks.ts            # Manejo de webhooks
│   ├── emailServiceMultilingual.ts  # Plantillas de email
│   ├── translationService.ts  # Servicio de traducción
│   └── notificationService.ts # Servicio de notificaciones
├── drizzle/
│   └── schema.ts              # Esquema de base de datos
└── .env.example               # Variables de entorno
```

## 🧪 Pruebas

### Probar Depósitos (Sandbox)
1. Usa credenciales de prueba de Asaas
2. El sistema generará un QR PIX de prueba
3. Los webhooks se procesarán automáticamente

### Probar Idiomas
1. Abre la aplicación
2. Haz clic en el selector de idioma (esquina superior derecha)
3. Verifica que toda la interfaz cambie de idioma
4. Recarga la página - el idioma debe persistir

## 📝 Logs

Los logs se guardan en:
- **Frontend:** Consola del navegador
- **Backend:** Consola de terminal

Para debugging, busca logs con:
```
[Email]
[Webhook]
[Socket]
[Database]
```

## 🆘 Troubleshooting

### Error: "RESEND_API_KEY no configurada"
- Verifica que hayas añadido la clave en `.env`
- Reinicia el servidor

### Error: "Transacción no encontrada"
- Verifica que el webhook de Asaas esté configurado correctamente
- Comprueba que el token secreto coincida

### Idioma no cambia
- Verifica que localStorage esté habilitado
- Limpia la caché del navegador
- Comprueba que los archivos JSON estén en la ruta correcta

## 📞 Soporte

Para preguntas sobre:
- **Asaas:** https://asaas.com/support
- **Resend:** https://resend.com/docs
- **i18next:** https://www.i18next.com/

## 🎉 ¡Listo!

Tu plataforma de ruleta está completamente configurada con:
- ✅ Sistema multi-idioma (ES/PT-BR)
- ✅ Integración de pagos (Asaas)
- ✅ Notificaciones por email (Resend)
- ✅ Seguridad de grado bancario
- ✅ Notificaciones en tiempo real

¡Que disfrutes desarrollando!
