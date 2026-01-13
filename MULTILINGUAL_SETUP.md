# Guía de Configuración Multi-idioma

## Idiomas Soportados

La plataforma de Juego de Ruleta está completamente disponible en:
- **Español (ES)** 🇪🇸
- **Portugués de Brasil (PT-BR)** 🇧🇷

## Estructura de Archivos de Traducción

```
client/src/i18n/
├── config.ts                 # Configuración de i18next
└── locales/
    ├── es.json              # Traducciones al Español
    └── pt-BR.json           # Traducciones al Portugués de Brasil

server/
├── translationService.ts     # Servicio de traducción del servidor
└── emailServiceMultilingual.ts # Plantillas de email multiidioma
```

## Cómo Funciona

### Frontend (React)

1. **Detección Automática**: El sistema detecta el idioma del navegador automáticamente.
2. **Selector de Idioma**: El usuario puede cambiar manualmente el idioma usando el componente `LanguageSwitcher`.
3. **Persistencia**: La preferencia de idioma se guarda en `localStorage`.

### Backend (Node.js)

1. **Traducción de Mensajes**: El servidor proporciona mensajes de error y éxito en el idioma preferido del usuario.
2. **Correos Multiidioma**: Las plantillas de email se generan dinámicamente en el idioma del usuario.

## Uso en Componentes React

### Con el Hook `useTranslations`

```typescript
import { useTranslations } from '@/hooks/useTranslations';

export function MyComponent() {
  const { t, currentLanguage, changeLanguage } = useTranslations();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.welcome')}</p>
      <button onClick={() => changeLanguage('pt-BR')}>
        Cambiar a Portugués
      </button>
    </div>
  );
}
```

### Con el Hook `useTranslation` de react-i18next

```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>Idioma actual: {i18n.language}</p>
    </div>
  );
}
```

## Uso en el Backend

### Obtener Traducción de Error

```typescript
import { getErrorTranslation } from './translationService';

const userLanguage = 'pt-BR'; // Obtener del usuario
const errorMessage = getErrorTranslation('insufficient_balance', userLanguage);
```

### Obtener Traducción de Email

```typescript
import { getEmailTranslation } from './translationService';

const subject = getEmailTranslation('deposit_received_subject', 'es', { amount: 100 });
```

### Enviar Email Multiidioma

```typescript
import { sendDepositEmail } from './emailServiceMultilingual';

await sendDepositEmail(
  'user@example.com',
  'Juan Pérez',
  100,
  1500,
  'es' // Idioma del usuario
);
```

## Agregar Nuevas Traducciones

### 1. Añadir a los archivos JSON

**client/src/i18n/locales/es.json**:
```json
{
  "mySection": {
    "myKey": "Mi texto en español"
  }
}
```

**client/src/i18n/locales/pt-BR.json**:
```json
{
  "mySection": {
    "myKey": "Meu texto em português"
  }
}
```

### 2. Usar en Componentes

```typescript
const { t } = useTranslation();
<p>{t('mySection.myKey')}</p>
```

### 3. Agregar Traducciones del Servidor

En **server/translationService.ts**, añade a ambos idiomas:

```typescript
const translations: Translations = {
  es: {
    'my.key': 'Mi traducción en español',
  },
  'pt-BR': {
    'my.key': 'Minha tradução em português',
  },
};
```

## Interpolación de Variables

### En Frontend

```typescript
// En el archivo JSON:
"welcome": "Bienvenido {{name}}"

// En el componente:
<p>{t('welcome', { name: 'Juan' })}</p>
// Resultado: "Bienvenido Juan"
```

### En Backend

```typescript
const message = getTranslation('welcome', 'es', { name: 'Juan' });
// Resultado: "Bienvenido Juan"
```

## Selector de Idioma

El componente `LanguageSwitcher` está disponible para que los usuarios cambien de idioma:

```typescript
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Header() {
  return (
    <header>
      <h1>Juego de Ruleta</h1>
      <LanguageSwitcher />
    </header>
  );
}
```

## Mejores Prácticas

1. **Mantén las claves consistentes**: Usa nombres descriptivos y en minúsculas con puntos.
2. **Agrupa por sección**: Organiza las traducciones por funcionalidad (dashboard, profile, etc.).
3. **Traduce todo**: Incluye mensajes de error, validación, notificaciones y correos.
4. **Prueba ambos idiomas**: Verifica que las traducciones se vean bien en ambos idiomas.
5. **Usa interpolación**: Para valores dinámicos, siempre usa variables en lugar de concatenación.

## Estructura Recomendada de Claves

```
common.* - Palabras y frases comunes
dashboard.* - Elementos del panel de control
profile.* - Configuración de perfil
deposit.* - Funcionalidad de depósitos
withdrawal.* - Funcionalidad de retiros
notifications.* - Notificaciones
game.* - Elementos del juego
errors.* - Mensajes de error
validation.* - Mensajes de validación
email.* - Contenido de correos electrónicos
```

## Troubleshooting

### Las traducciones no se cargan

- Verifica que los archivos JSON estén en la ruta correcta.
- Asegúrate de que la configuración de i18next esté importada en `App.tsx`.
- Comprueba la consola del navegador para errores.

### El idioma no persiste

- Verifica que `localStorage` esté habilitado en el navegador.
- Comprueba que la clave sea `i18nextLng`.

### Las interpolaciones no funcionan

- Verifica que uses `{{variable}}` en los archivos JSON.
- Asegúrate de pasar el objeto de variables en el segundo parámetro de `t()`.
