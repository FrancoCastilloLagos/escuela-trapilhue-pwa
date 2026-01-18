const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET EVALUACIONES POR CURSO 
// Saco las evaluaciones unidas con la materia filtrando por curso.
router.get('/curso/:id_curso', async (req, res) => {
    try {
        const { id_curso } = req.params;
        const query = `
            SELECT 
                e.id_evaluacion, 
                e.fecha, 
                e.titulo AS titulo_evaluacion, 
                e.tipo_evaluacion, 
                a.nombre AS nombre_materia
            FROM evaluacion e
            INNER JOIN asignatura a ON e.id_asignatura = a.id_asignatura
            WHERE a.id_curso = ?
            ORDER BY e.fecha ASC`;
            
        const [rows] = await db.query(query, [id_curso]);
        res.json(rows);
    } catch (error) {
        // Log por si falla la carga de fechas en el server.
        console.error('Error al obtener fechas:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// POST EVALUACIÓN (ESTRUCTURA IDÉNTICA A NOTAS)
// Guardo la evaluación y aviso a los apoderados automáticamente.
router.post('/', async (req, res) => {
    try {
        // Recibo todo lo que viene del formulario.
        const { id_asignatura, id_docente, titulo, fecha, tipo_evaluacion } = req.body;
        
        // Guardar en la tabla evaluacion
        // Meto los datos en la tabla física de evaluaciones.
        const sql = `INSERT INTO evaluacion (fecha, titulo, tipo_evaluacion, id_docente, id_asignatura) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [fecha, titulo, tipo_evaluacion, id_docente, id_asignatura]);

        console.log("✅ Evaluación guardada con ID:", result.insertId);

        // Lógica de Notificación (Copiada del modelo funcional de Notas)
        // Busco apoderados del curso para mandarles la alerta.
        try {
            // Saco los id de usuario de los apoderados vinculados.
            const sqlInfo = `
                SELECT apo.id_usuario, a.nombre as nombre_asignatura
                FROM asignatura a
                INNER JOIN estudiante e ON a.id_curso = e.id_curso
                INNER JOIN apoderado apo ON e.id_apoderado = apo.id_apoderado
                WHERE a.id_asignatura = ?`;
            
            const [rowsApos] = await db.query(sqlInfo, [id_asignatura]);

            if (rowsApos.length > 0) {
                const nombreAsig = rowsApos[0].nombre_asignatura;
                
                // Recorro la lista para crear una notificación por cada uno.
                for (const row of rowsApos) {
                    await db.query(
                        'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida, fecha) VALUES (?, ?, ?, ?, 0, NOW())',
                        [
                            row.id_usuario, 
                            'Nueva Evaluación', 
                            `Nueva evaluación en ${nombreAsig}: ${titulo}`, 
                            'fecha'
                        ]
                    );
                }
                console.log(`✅ Notificaciones enviadas a ${rowsApos.length} apoderados`);
            }
        } catch (errNotif) {
            // Si falla la notificación, que no muera el guardado.
            console.error("⚠️ Error en proceso de notificación:", errNotif.message);
        }

        res.status(201).json({ success: true, message: 'Evaluación guardada', id: result.insertId });

    } catch (error) { 
        // Log de error crítico por si falla el INSERT.
        console.error("❌ ERROR EN INSERT EVALUACION:", error.message);
        res.status(500).json({ error: error.message }); 
    }
});

// Exporto el router para habilitar estas rutas en app.js.
module.exports = router;