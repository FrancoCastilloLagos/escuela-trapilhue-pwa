const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// OBTENER TODAS
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT e.id_evaluacion, e.fecha, e.titulo, e.tipo_evaluacion, e.id_asignatura, a.nombre AS materia
            FROM evaluacion e
            INNER JOIN asignatura a ON e.id_asignatura = a.id_asignatura
            ORDER BY e.fecha DESC`;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener evaluaciones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// OBTENER POR CURSO
router.get('/curso/:id_curso', async (req, res) => {
    try {
        const { id_curso } = req.params;
        const sql = `
            SELECT e.id_evaluacion, e.fecha, e.titulo, e.tipo_evaluacion, a.nombre AS materia 
            FROM evaluacion e
            INNER JOIN asignatura a ON e.id_asignatura = a.id_asignatura
            WHERE a.id_curso = ?
            ORDER BY e.fecha ASC`;
        const [rows] = await pool.query(sql, [id_curso]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener evaluaciones por curso:', error);
        res.status(500).json({ message: 'Error al obtener datos' });
    }
});

// GUARDAR EVALUACIÓN (MODIFICADO PARA FUNCIONAR CON LA NUEVA DB)
router.post('/', async (req, res) => {
    const { fecha, titulo, tipo_evaluacion, id_docente, id_asignatura } = req.body;

    // Validación exhaustiva
    if (!id_asignatura || !id_docente || !fecha || !titulo) {
        return res.status(400).json({ message: 'Faltan datos obligatorios para crear la evaluación' });
    }

    try {
        /* PASO CLAVE: 
           Como duplicaste la DB, el id_docente que manda la PWA (ej: 4) 
           podría ser el ID de Usuario. Buscamos el ID real de la tabla docente.
        */
        const [docente] = await pool.query(
            'SELECT id_docente FROM docente WHERE id_usuario = ? OR id_docente = ? LIMIT 1',
            [id_docente, id_docente]
        );

        if (docente.length === 0) {
            console.error(`❌ El docente con ID ${id_docente} no existe en la tabla docente.`);
            return res.status(400).json({ message: 'El docente especificado no es válido en el sistema.' });
        }

        const idRealDocente = docente[0].id_docente;

        // Verificamos que la asignatura exista para evitar el Error 500 de MySQL
        const [asignatura] = await pool.query('SELECT id_asignatura FROM asignatura WHERE id_asignatura = ?', [id_asignatura]);
        if (asignatura.length === 0) {
            return res.status(400).json({ message: 'La asignatura seleccionada no existe.' });
        }

        const sql = 'INSERT INTO evaluacion (fecha, titulo, tipo_evaluacion, id_docente, id_asignatura) VALUES (?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [fecha, titulo, tipo_evaluacion, idRealDocente, id_asignatura]);
        
        console.log(`✅ Evaluación creada exitosamente con ID: ${result.insertId}`);
        res.status(201).json({ id: result.insertId, message: 'Evaluación creada' });

    } catch (error) {
        // Ahora el error te dirá exactamente qué pasó en los logs de Render
        console.error('❌ Error detallado al guardar evaluación:', error.sqlMessage || error.message);
        res.status(500).json({ 
            message: 'Error al guardar en la base de datos', 
            error: error.sqlMessage || error.message 
        });
    }
});

// BORRAR EVALUACIÓN
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM evaluacion WHERE id_evaluacion = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Evaluación no encontrada' });
        }
        res.json({ success: true, message: 'Evaluación eliminada' });
    } catch (error) {
        console.error('Error al eliminar evaluación:', error);
        res.status(500).json({ message: 'Error al eliminar' });
    }
});

module.exports = router;