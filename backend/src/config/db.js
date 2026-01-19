const mysql = require('mysql2');
const path = require('path');
// Carga el .env que está en /src/
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'escuela_trapilhue',
    port: process.env.DB_PORT || 3306, // Agregamos el puerto para la nube
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ✅ CLAVE: Agregamos SSL para que Railway no rechace la conexión desde Render
    ssl: {
        rejectUnauthorized: false
    }
});

// Verificamos la conexión
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conexión DB:', err.message);
        // Tip de experto: Si sale "ETIMEDOUT", revisa que DB_HOST sea el correcto en Render
    } else {
        console.log('✅ Conexión exitosa a MySQL en la nube (Railway)');
        connection.release();
    }
});

module.exports = pool.promise();