const mysql = require('mysql2');
const path = require('path');
// Carga el .env que está en /src/
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'escuela_trapilhue',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conexión DB:', err.message);
    } else {
        console.log('✅ Conexión exitosa a MySQL');
        connection.release();
    }
});

module.exports = pool.promise();