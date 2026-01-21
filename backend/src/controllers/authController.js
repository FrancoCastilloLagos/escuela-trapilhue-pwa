const db = require('../config/db');
const bcrypt = require('bcrypt'); // Importamos bcrypt

// Gestión inicio de sesión y vinculación con estudiantes.
exports.login = async (req, res) => {
    const { rut, password } = req.body;

    try {
        // Consulta datos de usuario y relación con tabla estudiante.
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

        // Validación si el usuario existe en la base de datos.
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];

        // --- CAMBIO DE SEGURIDAD: Comparar Hash con Bcrypt ---
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // Retorno de datos del usuario y sesión exitosa al cliente.
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

// Registro nuevos usuarios asignando rol automáticamente segun rut.
exports.register = async (req, res) => {
    const { rut, password } = req.body;

    try {
        // --- CAMBIO DE SEGURIDAD: Hashear contraseña antes de guardar ---
        const SALT_ROUNDS = 10;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Define el rol inicial como APODERADO por defecto.
        let rolFinal = 'APODERADO';

        // Buscar si el rut figura en la tabla de docentes.
        const [docenteRows] = await db.query('SELECT * FROM docente WHERE rut = ?', [rut]);
        
        // Asigna rol de DOCENTE si existe en registros previos.
        if (docenteRows.length > 0) {
            rolFinal = 'DOCENTE';
        }

        // Inserta el nuevo usuario con la contraseña HASHEADA.
        const sqlInsert = 'INSERT INTO usuario (rut, password, tipo_usuario) VALUES (?, ?, ?)';
        await db.query(sqlInsert, [rut, hashedPassword, rolFinal]);

        // Confirma el registro exitoso al usuario.
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