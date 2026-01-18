const db = require('../config/db');

const User = {
    // Buscar usuario por email; verificar si usa rut o email.
    findByEmail: async (email) => {
        const [rows] = await db.query(
            'SELECT * FROM usuario WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    // Obtiene datos vinculados entre las tablas usuario y docente.
    getDocenteProfile: async (userId) => {
        const [rows] = await db.query(
            'SELECT u.email, d.id_docente FROM usuario u JOIN docente d ON u.id_usuario = d.id_usuario WHERE u.id_usuario = ?',
            [userId]
        );
        return rows[0];
    }
};

// Exportar el modelo para ser usado en los controladores.
module.exports = User;