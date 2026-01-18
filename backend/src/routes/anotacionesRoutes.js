const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// OBTENER LISTA
// Buscar todas las anotaciones de un estudiante específico.
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

// CONTEO
// Devolver la cantidad total de anotaciones del alumno.
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

// GUARDAR
// Insertar nueva anotación incluyendo el tipo.
router.post('/', async (req, res) => {
    const { id_estudiante, id_docente, contenido, tipo, fecha } = req.body;
    
    if (!id_estudiante || !id_docente || !contenido || !tipo) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }
    
    try {
        const query = 'INSERT INTO anotacion (id_estudiante, id_docente, contenido, tipo, fecha) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [id_estudiante, id_docente, contenido, tipo, fecha]);
        res.json({ success: true, message: 'Anotación registrada', id: result.insertId });
    } catch (error) {
        console.error('Error al guardar:', error);
        res.status(500).json({ success: false, message: 'Error en base de datos' });
    }
});

// ACTUALIZAR
// Modifica el contenido y tipo de una anotación existente.
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { contenido, tipo } = req.body;
    try {
        const query = 'UPDATE anotacion SET contenido = ?, tipo = ? WHERE id_anotacion = ?';
        await db.query(query, [contenido, tipo, id]);
        res.json({ success: true, message: 'Actualizado' });
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// BORRAR
// Eliminar permanentemente una anotación de la base de datos.
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM anotacion WHERE id_anotacion = ?', [id]);
        res.json({ success: true, message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Exportar las rutas para usarlas en el archivo principal.
module.exports = router;