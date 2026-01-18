const db = require('../config/db');

// Procesa el cambio de contraseña validando la anterior.
exports.cambiarPassword = async (req, res) => {
    const id_usuario = req.params.id;
    const { actual, nueva } = req.body;

    // informacion para seguimiento en consola del servidor.
    console.log(`--- PROCESANDO CAMBIO EN TABLA 'usuario' (Promesas) ---`);
    console.log(`ID: ${id_usuario} | Actual: ${actual} | Nueva: ${nueva}`);

    try {
        // Buscar la contraseña almacenada para el usuario específico.
        const [rows] = await db.query('SELECT password FROM usuario WHERE id_usuario = ?', [id_usuario]);

        // Validar la existencia del usuario antes de continuar.
        if (rows.length === 0) {
            console.log('⚠️ Usuario no encontrado');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const passwordDB = rows[0].password;

        // Comparar la contraseña actual con la recibida.
        if (String(actual) !== String(passwordDB)) {
            console.log(`❌ Clave incorrecta. BD: ${passwordDB}, Recibida: ${actual}`);
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

        // Ejecutar la actualización de la contraseña en la tabla.
        const [result] = await db.query('UPDATE usuario SET password = ? WHERE id_usuario = ?', [nueva, id_usuario]);

        // Confirma si el registro fue realmente modificado.
        if (result.affectedRows > 0) {
            console.log('✅ BASE DE DATOS ACTUALIZADA CON ÉXITO');
            
            const [verificacion] = await db.query('SELECT password FROM usuario WHERE id_usuario = ?', [id_usuario]);
            console.log(`Confirmado en BD. Nueva clave: ${verificacion[0].password}`);

            return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
        } else {
            console.log('⚠️ No se realizaron cambios');
            return res.status(400).json({ message: 'No se pudo actualizar el registro' });
        }

    } catch (error) {
        // Captura  de errores técnicos y responde al cliente.
        console.error('❌ Error interno:', error);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};