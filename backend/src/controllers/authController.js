const db = require('../config/db');
const bcrypt = require('bcrypt');

// Gestión inicio de sesión y vinculación con estudiantes.
exports.login = async (req, res) => {
    const { rut, password } = req.body;

    try {
        // Usamos TRIM para evitar errores por espacios en blanco y aseguramos el JOIN
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
            WHERE TRIM(u.rut) = TRIM(?)
        `;

        const [rows] = await db.query(sql, [rut]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];

        // LOG DE DEPURACIÓN PARA TI (Míralo en la consola de Railway/Node)
        console.log(`🔍 Login Procesado: RUT ${rut} | Estudiante: ${user.id_estudiante} | Curso: ${user.id_curso}`);

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

// Registro nuevos usuarios vinculando automáticamente con estudiante o docente.
exports.register = async (req, res) => {
    const { rut, password } = req.body;

    try {
        const SALT_ROUNDS = 10;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        let rolFinal = 'APODERADO';

        // 1. Verificar si es docente
        const [docenteRows] = await db.query('SELECT * FROM docente WHERE rut = ?', [rut]);
        if (docenteRows.length > 0) {
            rolFinal = 'DOCENTE';
        }

        // 2. Insertar el nuevo usuario
        const sqlInsert = 'INSERT INTO usuario (rut, password, tipo_usuario) VALUES (?, ?, ?)';
        const [result] = await db.query(sqlInsert, [rut, hashedPassword, rolFinal]);
        const newUserId = result.insertId;

        // 3. VINCULACIÓN AUTOMÁTICA (Esto es lo que te faltaba)
        if (rolFinal === 'APODERADO') {
            // Buscamos si existe un estudiante que tenga este RUT como su apoderado
            // Nota: Asumo que en la tabla 'estudiante' tienes una columna 'rut_apoderado'
            await db.query(
                'UPDATE estudiante SET id_apoderado = ? WHERE rut_apoderado = ? OR rut = ?', 
                [newUserId, rut, rut]
            );
            console.log(`🔗 Usuario ${newUserId} vinculado como apoderado.`);
        } else if (rolFinal === 'DOCENTE') {
            await db.query(
                'UPDATE docente SET id_usuario = ? WHERE rut = ?', 
                [newUserId, rut]
            );
            console.log(`🔗 Usuario ${newUserId} vinculado como docente.`);
        }

        res.json({ 
            success: true, 
            message: `Usuario registrado y vinculado exitosamente como ${rolFinal}`,
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