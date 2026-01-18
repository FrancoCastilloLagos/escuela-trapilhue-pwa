const db = require('../config/db');

// Gestion inicio de sesión y vinculación con estudiantes.
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

        // Comparar la contraseña ingresada con la almacenada.
        if (user.password !== password) {
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
        // Captura y respuesta ante errores inesperados en el servidor.
        console.error('❌ Error en Login Backend:', error.message);
        res.status(500).json({ success: false, message: 'Error interno', detail: error.message });
    }
};

// Registro nuevos usuarios asignando rol automáticamente segun rut.
exports.register = async (req, res) => {
    const { rut, password } = req.body;

    try {
        // Define el rol inicial como APODERADO por defecto.
        let rolFinal = 'APODERADO';

        // Buscar si el rut figura en la tabla de docentes.
        const [docenteRows] = await db.query('SELECT * FROM docente WHERE rut = ?', [rut]);
        
        // Asigna rol de DOCENTE si existe en registros previos.
        if (docenteRows.length > 0) {
            rolFinal = 'DOCENTE';
        }

        // Inserta el nuevo usuario con credenciales y rol determinado.
        const sqlInsert = 'INSERT INTO usuario (rut, password, tipo_usuario) VALUES (?, ?, ?)';
        await db.query(sqlInsert, [rut, password, rolFinal]);

        // Confirma el registro exitoso al usuario.
        res.json({ 
            success: true, 
            message: `Usuario registrado exitosamente como ${rolFinal}`,
            rolAsignado: rolFinal 
        });

    } catch (error) {
        // Maneja errores de duplicidad de RUT o fallos generales.
        console.error('❌ Error en Registro Backend:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Este RUT ya se encuentra registrado.' });
        }
        res.status(500).json({ success: false, message: 'Error interno al registrar', error: error.message });
    }
};