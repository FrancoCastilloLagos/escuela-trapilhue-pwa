const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET CURSOS 
// Saco la lista de todos los cursos ordenados por ID.
router.get('/cursos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_curso, nombre_curso FROM curso ORDER BY id_curso ASC');
        res.json(rows);
    } catch (error) { 
        res.status(500).json({ error: 'Error al obtener cursos' }); 
    }
});

// GET ASIGNATURAS POR ESTUDIANTE 
// Busco qué materias tiene un alumno según el curso donde está matriculado.
router.get('/asignaturas/estudiante/:id_estudiante', async (req, res) => {
    try {
        const { id_estudiante } = req.params;
        const sql = `
            SELECT a.id_asignatura, a.nombre 
            FROM asignatura a
            INNER JOIN estudiante e ON a.id_curso = e.id_curso
            WHERE e.id_estudiante = ?
            ORDER BY a.nombre ASC`;
        const [rows] = await db.query(sql, [id_estudiante]);
        res.json(rows);
    } catch (error) { 
        res.status(500).json({ error: 'Error al obtener asignaturas' }); 
    }
});

// GET ASIGNATURAS FILTRADAS POR CURSO
// Traigo las materias de un curso específico para los selectores del docente.
router.get('/asignaturas/:id_curso', async (req, res) => {
    try {
        const { id_curso } = req.params;
        const [rows] = await db.query(
            'SELECT id_asignatura, nombre FROM asignatura WHERE id_curso = ? ORDER BY nombre ASC', 
            [id_curso]
        );
        res.json(rows);
    } catch (error) { 
        res.status(500).json({ error: 'Error al obtener asignaturas del curso' }); 
    }
});

// GET ESTUDIANTES POR CURSO
// Junto nombre y apellido para mostrar la lista de alumnos del curso.
router.get('/estudiantes/curso/:id_curso', async (req, res) => {
    try {
        const { id_curso } = req.params;
        const [rows] = await db.query(
            "SELECT id_estudiante, CONCAT(nombre, ' ', apellido) AS nombre_completo FROM estudiante WHERE id_curso = ?", 
            [id_curso]
        );
        res.json(rows);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// GET NOTAS 
// Saco las notas y proceso el texto por si vienen con formato de pipe.
router.get('/notas/:id_estudiante/:id_asignatura', async (req, res) => {
    try {
        const { id_estudiante, id_asignatura } = req.params;
        const [rows] = await db.query(
            "SELECT id_nota, valor, tipo_evaluacion, descripcion FROM nota WHERE id_estudiante = ? AND id_asignatura = ? ORDER BY id_nota ASC", 
            [id_estudiante, id_asignatura]
        );
        const notasProcesadas = rows.map(n => {
            let nombre = n.descripcion || 'Evaluación';
            let tipo = n.tipo_evaluacion || 'sumativa';
            // Limpio el nombre y tipo si guardé datos combinados.
            if (!n.descripcion && n.tipo_evaluacion && n.tipo_evaluacion.includes('|')) {
                const partes = n.tipo_evaluacion.split('|');
                nombre = partes[0].trim();
                tipo = partes[1].trim();
            }
            return { id_nota: n.id_nota, valor: n.valor, nombre: nombre, tipo: tipo };
        });
        res.json(rows.length > 0 ? notasProcesadas : []);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// POST NOTAS 
// Guardo la nota y mando una sola notificación al apoderado vinculado.
router.post('/notas', async (req, res) => {
    try {
        const { id_estudiante, id_asignatura, valor, descripcion, tipo_evaluacion } = req.body;
        
        // Guardar la nota física
        // Inserto la calificación con la fecha del día actual.
        const sqlInsertNota = `INSERT INTO nota (valor, tipo_evaluacion, descripcion, fecha, id_estudiante, id_asignatura) VALUES (?, ?, ?, CURDATE(), ?, ?)`;
        const [result] = await db.query(sqlInsertNota, [valor, tipo_evaluacion, descripcion, id_estudiante, id_asignatura]);

        // Proceso de Notificación Única al Apoderado
        // Busco al usuario apoderado para avisarle de la nueva nota.
        try {
            const sqlRelacion = `
                SELECT a.nombre as nombre_asig, u.id_usuario 
                FROM asignatura a
                INNER JOIN estudiante e ON e.id_estudiante = ?
                INNER JOIN usuario u ON e.id_apoderado = u.id_usuario 
                WHERE a.id_asignatura = ?`;
            
            const [data] = await db.query(sqlRelacion, [id_estudiante, id_asignatura]);

            if (data.length > 0) {
                const { nombre_asig, id_usuario } = data[0];
                
                // Registro la notificación en la tabla para el componente de alertas.
                await db.query(
                    'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida, fecha) VALUES (?, ?, ?, ?, 0, NOW())',
                    [id_usuario, 'Nueva Calificación', `Nueva calificación en ${nombre_asig}`, 'nota']
                );
            }
        } catch (errNotif) {
            // Error en notificación no debe detener el guardado de la nota.
            console.error("Error al procesar notificación:", errNotif.message);
        }

        res.json({ message: 'Nota guardada', id: result.insertId });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

// PUT NOTAS 
// Actualizo los valores de una nota que ya existe.
router.put('/notas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { valor, descripcion, tipo_evaluacion } = req.body;
        const sql = `UPDATE nota SET valor = ?, tipo_evaluacion = ?, descripcion = ? WHERE id_nota = ?`;
        await db.query(sql, [valor, tipo_evaluacion, descripcion, id]);
        res.json({ message: 'Nota actualizada' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE NOTAS
// Borro la nota de la base de datos permanentemente.
router.delete('/notas/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM nota WHERE id_nota = ?", [req.params.id]);
        res.json({ message: 'Nota eliminada' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;