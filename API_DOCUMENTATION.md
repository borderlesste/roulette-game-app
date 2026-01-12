# Documentación de API - Juego de Ruleta

## Descripción General

Este documento describe todos los procedimientos tRPC disponibles en el servidor del Juego de Ruleta. La aplicación utiliza tRPC para la comunicación entre cliente y servidor, con Socket.IO para actualizaciones en tiempo real.

---

## Procedimientos de Juego (`game.*`)

### `game.getState`
**Tipo:** Query (Pública)

Obtiene el estado actual completo del juego.

**Respuesta:**
```typescript
{
  gameState: {
    id: number;
    status: 'WAITING_FOR_PLAYERS' | 'READY_TO_SPIN' | 'SPINNING' | 'FINISHED';
    pot: number;           // Pozo total en Reales
    winnerId: number | null;
  };
  activePlayers: Array<{
    id: number;
    userId: number;
    entryAmount: number;   // Cantidad que pagó (5, 10, 15, 20)
    position: number;      // Posición en la ruleta (0-9)
    userName: string;
  }>;
  queueLength: number;
  maxActivePlayers: number;
}
```

---

### `game.getBalance`
**Tipo:** Query (Protegida)

Obtiene el saldo actual del usuario autenticado.

**Respuesta:**
```typescript
number  // Saldo en Reales
```

---

### `game.deposit`
**Tipo:** Mutation (Protegida)

Realiza un depósito en la cuenta del usuario.

**Parámetros:**
```typescript
{
  amount: number  // Cantidad a depositar (1-10000)
}
```

**Respuesta:**
```typescript
{
  newBalance: number  // Nuevo saldo después del depósito
}
```

**Errores:**
- `Database not available`: Error de conexión a BD
- `User not found`: Usuario no encontrado

---

### `game.joinQueue`
**Tipo:** Mutation (Protegida)

Permite al usuario unirse a la cola de espera para entrar a la ruleta.

**Parámetros:**
```typescript
{
  entryAmount: '5' | '10' | '15' | '20'  // Monto de entrada
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  newBalance: number;
  message: string;
}
```

**Errores:**
- `Invalid entry amount`: Monto no válido
- `User not found`: Usuario no encontrado
- `Insufficient balance`: Saldo insuficiente
- `Already in queue or playing`: Usuario ya está en cola o jugando

---

### `game.getQueue`
**Tipo:** Query (Pública)

Obtiene los primeros 10 jugadores en la cola de espera.

**Respuesta:**
```typescript
Array<{
  userId: number;
  entryAmount: number;
  timestamp: number;
  userName: string;
}>
```

---

### `game.getTransactionHistory`
**Tipo:** Query (Protegida)

Obtiene el historial de transacciones del usuario autenticado.

**Parámetros:**
```typescript
{
  limit?: number  // Número máximo de transacciones (default: 50)
}
```

**Respuesta:**
```typescript
Array<{
  id: number;
  userId: number;
  type: 'deposit' | 'entry_fee' | 'prize_won' | 'withdrawal';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}>
```

---

### `game.getGameRoundHistory`
**Tipo:** Query (Pública)

Obtiene el historial de rondas completadas.

**Parámetros:**
```typescript
{
  limit?: number  // Número máximo de rondas (default: 20)
}
```

**Respuesta:**
```typescript
Array<{
  id: number;
  winnerId: number;
  winnerEntryAmount: number;
  prizeAmount: number;
  potAtTime: number;
  completedAt: Date;
  userName: string;
}>
```

---

### `game.getStats`
**Tipo:** Query (Protegida)

Obtiene las estadísticas del usuario autenticado.

**Respuesta:**
```typescript
{
  balance: number;
  gamesPlayed: number;
  totalWinnings: number;
  status: 'inactive' | 'waiting' | 'playing';
}
```

---

## Procedimientos de Control del Juego (`gameControl.*`)

### `gameControl.spin`
**Tipo:** Mutation (Protegida)

Inicia un giro de la ruleta. Requiere al menos 2 jugadores activos.

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  playersCount: number;
}
```

**Errores:**
- `Se necesitan al menos 2 jugadores para girar`: Insuficientes jugadores

---

### `gameControl.finishSpin`
**Tipo:** Mutation (Protegida)

Procesa el resultado del giro y calcula el premio.

**Respuesta:**
```typescript
{
  success: boolean;
  winner: {
    id: number;
    name: string;
    prize: number;
  };
  newPlayer: {
    id: number;
    name: string;
    entryAmount: number;
  } | null;
  newPot: number;
}
```

---

### `gameControl.getActivePlayers`
**Tipo:** Query (Pública)

Obtiene los jugadores activos con detalles.

**Respuesta:**
```typescript
Array<{
  id: number;
  userId: number;
  entryAmount: number;
  position: number;
  userName: string;
  userEmail: string;
}>
```

---

### `gameControl.getNextQueuePreview`
**Tipo:** Query (Pública)

Obtiene una vista previa del siguiente jugador en la cola.

**Respuesta:**
```typescript
{
  userId: number;
  entryAmount: number;
  timestamp: number;
  userName: string;
} | null
```

---

### `gameControl.getFullGameState`
**Tipo:** Query (Pública)

Obtiene el estado completo del juego con todos los detalles.

**Respuesta:**
```typescript
{
  gameState: GameState;
  activePlayers: Array<ActivePlayer>;
  nextInQueue: QueuePlayer | null;
  activePlayersCount: number;
}
```

---

### `gameControl.tryAddFromQueue`
**Tipo:** Mutation (Pública)

Intenta añadir un jugador de la cola a los activos si hay espacio disponible.

**Respuesta:**
```typescript
{
  success: boolean;
  newPlayer: {
    userId: number;
    name: string;
    entryAmount: number;
  } | null;
}
```

---

## Eventos Socket.IO

### Eventos del Cliente

#### `request-game-state`
Solicita el estado actual del juego.

#### `spin-started`
Notifica que la ruleta comienza a girar.

#### `spin-finished`
Notifica que la ruleta terminó de girar.

#### `player-joined-queue`
Notifica que un jugador se unió a la cola.

#### `request-queue-update`
Solicita una actualización de la cola.

---

### Eventos del Servidor

#### `game-state-update`
Emitido cuando el estado del juego cambia.

**Datos:**
```typescript
{
  gameState: GameState;
  activePlayers: Array<ActivePlayer>;
  nextInQueue: QueuePlayer | null;
  queueLength: number;
}
```

#### `spin-animation-start`
Emitido cuando la ruleta comienza a girar.

**Datos:**
```typescript
{
  timestamp: number;
}
```

#### `spin-result`
Emitido cuando el giro termina con el resultado.

**Datos:**
```typescript
{
  winner: {
    id: number;
    name: string;
    prize: number;
  };
  newPlayer: {
    id: number;
    name: string;
    entryAmount: number;
  } | null;
  newPot: number;
  timestamp: number;
}
```

#### `queue-updated`
Emitido cuando la cola de espera se actualiza.

**Datos:**
```typescript
{
  queueLength: number;
  nextInQueue: QueuePlayer | null;
  timestamp: number;
}
```

---

## Sistema de Premios

El cálculo de premios se basa en dos factores:

1. **Entrada del Jugador:** 5, 10, 15 o 20 Reales
2. **Pozo Total:** Suma de todas las entradas

**Fórmula:**
```
Premio = min(entryAmount × 3, pot × 0.3)
```

**Ejemplos:**
- Entrada: R$ 5, Pozo: R$ 50 → Premio: R$ 15 (min(15, 15))
- Entrada: R$ 5, Pozo: R$ 1000 → Premio: R$ 15 (min(15, 300))
- Entrada: R$ 20, Pozo: R$ 100 → Premio: R$ 30 (min(60, 30))

---

## Flujo del Juego

1. **Usuario se registra/inicia sesión**
2. **Usuario realiza un depósito** (game.deposit)
3. **Usuario se une a la cola** (game.joinQueue)
4. **Sistema añade al usuario a jugadores activos** cuando hay espacio
5. **Cuando hay ≥2 jugadores, se puede girar** (gameControl.spin)
6. **Se procesa el resultado** (gameControl.finishSpin)
7. **Ganador recibe el premio y es reemplazado** por el siguiente en cola
8. **Ciclo se repite**

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `UNAUTHORIZED` | Usuario no autenticado |
| `FORBIDDEN` | Usuario no tiene permiso |
| `NOT_FOUND` | Recurso no encontrado |
| `BAD_REQUEST` | Parámetros inválidos |
| `INTERNAL_SERVER_ERROR` | Error del servidor |

---

## Notas de Seguridad

- Todas las transacciones se registran en la base de datos para auditoría
- El saldo nunca puede ser negativo
- La selección del ganador es aleatoria
- Los premios se calculan de forma determinista
- Socket.IO usa CORS para evitar acceso no autorizado
