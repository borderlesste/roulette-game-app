import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no está configurada');
  process.exit(1);
}

async function seedData() {
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✓ Conectado a la base de datos');

    // Nombres de prueba para los jugadores
    const playerNames = [
      'Bruno',
      'Sindel',
      'Georgina',
      'Vanessa',
      'Débora',
      'Raimundo',
      'Parmelo',
      'Parmelo2',
      'Lito',
      'Gasmo'
    ];

    // Crear usuarios de prueba
    console.log('\n📝 Creando usuarios de prueba...');
    for (let i = 0; i < playerNames.length; i++) {
      const name = playerNames[i];
      const openId = `test-user-${i}`;
      const email = `${name.toLowerCase()}@test.com`;

      await connection.execute(
        `INSERT INTO users (openId, name, email, loginMethod, role, balance, status, gamesPlayed, totalWinnings, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, 'test', 'user', 100, 'inactive', 0, 0, NOW(), NOW(), NOW())
         ON DUPLICATE KEY UPDATE name=?, email=?`,
        [openId, name, email, name, email]
      );
      console.log(`  ✓ Usuario "${name}" creado/actualizado`);
    }

    // Obtener los IDs de los usuarios creados
    console.log('\n🔍 Obteniendo IDs de usuarios...');
    const [users] = await connection.execute(
      `SELECT id, name FROM users WHERE openId LIKE 'test-user-%' ORDER BY id LIMIT 10`
    );
    console.log(`  ✓ ${users.length} usuarios encontrados`);

    // Crear estado del juego
    console.log('\n🎮 Inicializando estado del juego...');
    await connection.execute(
      `INSERT INTO gameState (status, pot, winnerId)
       VALUES ('READY_TO_SPIN', 150, NULL)
       ON DUPLICATE KEY UPDATE status='READY_TO_SPIN', pot=150, winnerId=NULL`
    );
    console.log('  ✓ Estado del juego inicializado');

    // Crear jugadores activos
    console.log('\n👥 Creando jugadores activos...');
    const entryAmounts = [5, 10, 15, 20, 5, 10, 15, 20, 5, 10];
    
    // Limpiar jugadores activos previos
    await connection.execute(`DELETE FROM activePlayers`);
    
    for (let i = 0; i < Math.min(users.length, 10); i++) {
      const user = users[i];
      const entryAmount = entryAmounts[i];
      
      await connection.execute(
        `INSERT INTO activePlayers (userId, entryAmount, position)
         VALUES (?, ?, ?)`,
        [user.id, entryAmount, i]
      );
      console.log(`  ✓ ${user.name} añadido como jugador activo (Entrada: R$ ${entryAmount}, Posición: ${i})`);
    }

    console.log('\n✅ Datos de prueba creados exitosamente');
    console.log('\n📊 Resumen:');
    console.log(`  - Usuarios creados: ${users.length}`);
    console.log(`  - Jugadores activos: ${Math.min(users.length, 10)}`);
    console.log(`  - Pozo total: R$ 150`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedData();
