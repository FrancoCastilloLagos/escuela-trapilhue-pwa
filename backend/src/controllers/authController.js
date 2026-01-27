const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    const { rut, password } = req.body;
    try {
        const sql = `
            SELECT u.*, e.id_estudiante, e.id_curso, e.nombre AS nombre_estudiante
            FROM usuario u
            LEFT JOIN estudiante e ON u.id_usuario = e.id_apoderado
            WHERE u.rut = ?`;

        const [rows] = await db.query(sql, [rut]);
        if (rows.length === 0) return res.status(401).json({ success: false, message: 'Usuario no encontrado' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });

        return res.json({
            success: true,
            user: {
                id: user.id_usuario,
                rut: user.rut,
                rol: (user.tipo_usuario || 'APODERADO').toUpperCase(),
                id_estudiante: user.id_estudiante,
                id_curso: user.id_curso,
                nombre: user.nombre_estudiante || 'Usuario'
            }
        });
    } catch (error) {
        console.error('❌ Error en Login:', error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

exports.register = async (req, res) => {
    const { rut, password } = req.body;

    try {
        
        const hashedPassword = await bcrypt.hash(password, 10);

        
        let rolFinal = 'APODERADO';
        const [docenteRows] = await db.query('SELECT id_docente FROM docente WHERE rut = ?', [rut]);
        if (docenteRows.length > 0) rolFinal = 'DOCENTE';

        
        const [result] = await db.query(
            'INSERT INTO usuario (rut, password, tipo_usuario) VALUES (?, ?, ?)',
            [rut, hashedPassword, rolFinal]
        );
        
        const nuevoId = result.insertId;

        
        try {
            if (rolFinal === 'APODERADO') {
                await db.query('UPDATE estudiante SET id_apoderado = ? WHERE rut_apoderado = ?', [nuevoId, rut]);
            } else {
                await db.query('UPDATE docente SET id_usuario = ? WHERE rut = ?', [nuevoId, rut]);
            }
        } catch (linkError) {
            console.error('⚠️ Error de vinculación (no crítico):', linkError.message);
            
        }


        return res.status(200).json({ 
            success: true, 
            message: `Usuario registrado como ${rolFinal}`,
            rolAsignado: rolFinal 
        });

    } catch (error) {
        console.error('❌ Error fatal en Registro:', error.message);
        
       
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Este RUT ya está registrado.' });
        }

       
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
};