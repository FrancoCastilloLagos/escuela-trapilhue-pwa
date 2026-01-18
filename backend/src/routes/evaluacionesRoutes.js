const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// OBTENER TODAS
// Listar cronológicamente todas las evaluaciones con sus asignaturas.
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
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// OBTENER POR CURSO
// Filtrar evaluaciones pertenecientes a un curso específico.
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
        res.status(500).json({ message: 'Error al obtener datos' });
    }
});

// GUARDAR EVALUACIÓN
// Crear un nuevo registro de evaluación en la base de datos.
router.post('/', async (req, res) => {
    const { fecha, titulo, tipo_evaluacion, id_docente, id_asignatura } = req.body;
    if (!id_asignatura) return res.status(400).json({ message: 'Falta id_asignatura' });
    try {
        const sql = 'INSERT INTO evaluacion (fecha, titulo, tipo_evaluacion, id_docente, id_asignatura) VALUES (?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [fecha, titulo, tipo_evaluacion, id_docente, id_asignatura]);
        res.status(201).json({ id: result.insertId, message: 'Evaluación creada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar' });
    }
});

// BORRAR EVALUACIÓN
// Eliminar una evaluación mediante su id.
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM evaluacion WHERE id_evaluacion = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar' });
    }
});

// Exportar el módulo de rutas para el servidor principal.
module.exports = router;