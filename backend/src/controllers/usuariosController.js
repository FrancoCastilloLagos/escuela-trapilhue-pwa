const db = require('../config/db');
const bcrypt = require('bcrypt'); 


exports.cambiarPassword = async (req, res) => {
    const id_usuario = req.params.id;
    const { actual, nueva } = req.body;

    console.log(`--- PROCESANDO CAMBIO EN TABLA 'usuario' (Seguridad Bcrypt) ---`);
    console.log(`ID: ${id_usuario}`);

    try {
     
        const [rows] = await db.query('SELECT password FROM usuario WHERE id_usuario = ?', [id_usuario]);

        if (rows.length === 0) {
            console.log('⚠️ Usuario no encontrado');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const passwordHashDB = rows[0].password;

    
        const coincide = await bcrypt.compare(String(actual), passwordHashDB);

        if (!coincide) {
            console.log(`❌ Intento fallido: La clave actual proporcionada no coincide con el hash almacenado.`);
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

       
        const saltRounds = 10;
        const nuevaHashed = await bcrypt.hash(String(nueva), saltRounds);

     
        const [result] = await db.query('UPDATE usuario SET password = ? WHERE id_usuario = ?', [nuevaHashed, id_usuario]);

        if (result.affectedRows > 0) {
            console.log('✅ BASE DE DATOS ACTUALIZADA: La nueva clave se guardó como HASH.');
            return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
        } else {
            console.log('⚠️ No se realizaron cambios en el registro.');
            return res.status(400).json({ message: 'No se pudo actualizar el registro' });
        }

    } catch (error) {
        console.error('❌ Error fatal en el proceso de cambio de clave:', error);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};