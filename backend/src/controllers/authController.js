const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    const { rut, password } = req.body;

    try {
        const sql = `
            SELECT 
                u.id_usuario, 
                u.rut, 
                u.tipo_usuario AS rol, 
                u.password,
                e.id_estudiante,
                e.id_curso,
                e.nombre AS nombre_estudiante
            FROM usuario u
            LEFT JOIN estudiante e ON u.id_usuario = e.id_apoderado
            WHERE u.rut = ?
        `;

        const [rows] = await db.query(sql, [rut]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        res.json({
            success: true,
            user: {
                id: user.id_usuario,
                rut: user.rut,
                rol: user.rol.toUpperCase(),
                id_estudiante: user.id_estudiante,
                id_curso: user.id_curso,
                nombre: user.nombre_estudiante || 'Usuario'
            }
        });

    } catch (error) {
        console.error('❌ Error en Login Backend:', error.message);
        res.status(500).json({ success: false, message: 'Error interno', detail: error.message });
    }
};

exports.register = async (req, res) => {
    const { rut, password } = req.body;

    try {
        const SALT_ROUNDS = 10;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        let rolFinal = 'APODERADO';

        const [docenteRows] = await db.query('SELECT * FROM docente WHERE rut = ?', [rut]);
        
        if (docenteRows.length > 0) {
            rolFinal = 'DOCENTE';
        }

        const sqlInsert = 'INSERT INTO usuario (rut, password, tipo_usuario) VALUES (?, ?, ?)';
        await db.query(sqlInsert, [rut, hashedPassword, rolFinal]);

        res.json({ 
            success: true, 
            message: `Usuario registrado exitosamente como ${rolFinal}`,
            rolAsignado: rolFinal 
        });

    } catch (error) {
        console.error('❌ Error en Registro Backend:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Este RUT ya se encuentra registrado.' });
        }
        res.status(500).json({ success: false, message: 'Error interno al registrar', error: error.message });
    }
};