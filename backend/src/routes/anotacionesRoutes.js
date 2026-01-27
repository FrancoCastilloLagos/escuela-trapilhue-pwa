const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// ==========================================
// OBTENER LISTA DE ANOTACIONES
// ==========================================
router.get('/:id_estudiante', async (req, res) => {
    const { id_estudiante } = req.params;
    try {
        const query = 'SELECT * FROM anotacion WHERE id_estudiante = ? ORDER BY fecha DESC';
        const [rows] = await db.query(query, [id_estudiante]);
        res.json(rows); 
    } catch (error) {
        console.error('Error al obtener lista de anotaciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener datos' });
    }
});

// ==========================================
// CONTEO DE ANOTACIONES
// ==========================================
router.get('/conteo/:id_estudiante', async (req, res) => {
    const { id_estudiante } = req.params;
    try {
        const query = 'SELECT COUNT(*) AS total FROM anotacion WHERE id_estudiante = ?';
        const [rows] = await db.query(query, [id_estudiante]);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al contar anotaciones:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// ==========================================
// GUARDAR ANOTACIÓN (AJUSTADO PARA EVITAR ERROR 500)
// ==========================================
router.post('/', async (req, res) => {
    const { id_estudiante, id_docente, contenido, tipo, fecha } = req.body;
    
    // Validación de datos obligatorios
    if (!id_estudiante || !id_docente || !contenido || !tipo) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }
    
    try {
        /* PASO CLAVE: 
           Si la PWA manda el ID de Usuario (4), buscamos su ID de Docente real (1).
           Si ya manda el ID de Docente correcto, lo mantenemos.
        */
        const [rows] = await db.query(
            'SELECT id_docente FROM docente WHERE id_usuario = ? OR id_docente = ? LIMIT 1', 
            [id_docente, id_docente]
        );

        // Si encontramos el registro, usamos ese ID. Si no, usamos el que venía (por si acaso).
        const idDocenteFinal = (rows.length > 0) ? rows[0].id_docente : id_docente;

        console.log(`Mapeando ID Docente: Recibido ${id_docente} -> Usando ${idDocenteFinal}`);

        const query = 'INSERT INTO anotacion (id_estudiante, id_docente, contenido, tipo, fecha) VALUES (?, ?, ?, ?, ?)';
        
        // Usamos la fecha enviada o la actual del servidor
        const fechaFinal = fecha || new Date();

        const [result] = await db.query(query, [id_estudiante, idDocenteFinal, contenido, tipo, fechaFinal]);
        
        res.json({ success: true, message: 'Anotación registrada correctamente', id: result.insertId });

    } catch (error) {
        console.error('❌ Error detallado al guardar anotación:', error);
        
        // Si el error es de llave foránea (Constraint), damos una respuesta clara
        if (error.errno === 1452) {
            return res.status(400).json({ 
                success: false, 
                message: 'Error de integridad: El docente o estudiante no existen.',
                detalle: error.sqlMessage 
            });
        }

        res.status(500).json({ success: false, message: 'Error en la base de datos' });
    }
});

// ==========================================
// ACTUALIZAR ANOTACIÓN
// ==========================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { contenido, tipo } = req.body;
    try {
        const query = 'UPDATE anotacion SET contenido = ?, tipo = ? WHERE id_anotacion = ?';
        await db.query(query, [contenido, tipo, id]);
        res.json({ success: true, message: 'Anotación actualizada con éxito' });
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// BORRAR ANOTACIÓN
// ==========================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM anotacion WHERE id_anotacion = ?', [id]);
        res.json({ success: true, message: 'Anotación eliminada permanentemente' });
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;