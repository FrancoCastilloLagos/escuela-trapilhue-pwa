const express = require('express');
const router = express.Router();
const db = require('../config/db');

// RUTA PARA MARCAR TODAS COMO LEÍDAS
// Actualizo todas las notificaciones pendientes del usuario a leídas.
router.put('/leer/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const sql = 'UPDATE notificaciones SET leida = 1 WHERE id_usuario = ? AND leida = 0';
        await db.query(sql, [id_usuario]);
        res.json({ success: true, message: "Notificaciones marcadas como leídas" });
    } catch (error) {
        console.error("❌ ERROR AL LEER NOTIFICACIONES:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// RUTA PARA CREAR NOTIFICACIONES SEGÚN EL TIPO
// Centralizo aquí todos los disparadores: evaluaciones, anotaciones y alertas.
router.post('/', async (req, res) => {
    try {
        let { id_usuario, id_estudiante, titulo, mensaje, tipo, id_asignatura } = req.body;

        // Señal para recargar componentes sin guardar en la BD.
        if (tipo === 'refresh') {
            return res.status(200).json({ success: true, message: "Refresh signal sent" });
        }

        // Busco apoderados del curso y les aviso del calendario nuevo.
        if (tipo === 'fecha' && id_asignatura) {
            const [asigInfo] = await db.query('SELECT nombre FROM asignatura WHERE id_asignatura = ?', [id_asignatura]);
            const nombreAsig = asigInfo.length > 0 ? asigInfo[0].nombre : 'Asignatura';
            
            const sqlCurso = `
                SELECT DISTINCT apo.id_usuario FROM asignatura asig
                INNER JOIN estudiante est ON asig.id_curso = est.id_curso
                INNER JOIN apoderado apo ON est.id_apoderado = apo.id_apoderado
                WHERE asig.id_asignatura = ?`;
            
            const [apoderados] = await db.query(sqlCurso, [id_asignatura]);

            for (const apo of apoderados) {
                await db.query(
                    'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida, fecha) VALUES (?, ?, ?, "fecha", 0, CURRENT_TIMESTAMP)',
                    [apo.id_usuario, 'Calendario Escolar', `Se publicó una nueva fecha de evaluación en ${nombreAsig}`]
                );
            }
            return res.status(201).json({ success: true });
        }

        // Alerto al apoderado cuando el docente registra una observación.
        if (tipo === 'anotacion' && id_estudiante) {
            const sqlApo = `
                SELECT apo.id_usuario FROM estudiante est
                INNER JOIN apoderado apo ON est.id_apoderado = apo.id_apoderado
                WHERE est.id_estudiante = ?`;
            const [rows] = await db.query(sqlApo, [id_estudiante]);
            
            if (rows.length > 0) {
                await db.query(
                    'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida, fecha) VALUES (?, "Nueva Anotación", "Se ha registrado una observación en el libro de clases.", "anotacion", 0, CURRENT_TIMESTAMP)',
                    [rows[0].id_usuario]
                );
                return res.status(201).json({ success: true });
            }
        }

        // Genero alerta roja si el promedio baja de lo esperado.
        if (tipo === 'alerta_academica' && id_estudiante) {
            const sqlInfo = `
                SELECT apo.id_usuario, est.nombre as nombre_estudiante 
                FROM estudiante est
                INNER JOIN apoderado apo ON est.id_apoderado = apo.id_apoderado
                WHERE est.id_estudiante = ?`;
            
            const [rows] = await db.query(sqlInfo, [id_estudiante]);

            if (rows.length > 0) {
                const idU = rows[0].id_usuario;
                const nombreEst = rows[0].nombre_estudiante;
                let nombreAsig = 'la asignatura';

                if (id_asignatura) {
                    const [asigRows] = await db.query('SELECT nombre FROM asignatura WHERE id_asignatura = ?', [id_asignatura]);
                    if (asigRows.length > 0) nombreAsig = asigRows[0].nombre;
                }
                
                await db.query(
                    'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida, fecha) VALUES (?, ?, ?, "alerta", 0, CURRENT_TIMESTAMP)',
                    [idU, 'Alerta Académica', `El estudiante ${nombreEst} presenta un promedio bajo en ${nombreAsig}.`]
                );
                return res.status(201).json({ success: true });
            } else {
                return res.status(404).json({ success: false, message: "No se encontró apoderado vinculado" });
            }
        }

        // Si no entra en los anteriores, guardo lo que venga.
        if (id_usuario) {
            await db.query(
                'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida, fecha) VALUES (?, ?, ?, LOWER(?), 0, CURRENT_TIMESTAMP)',
                [id_usuario, titulo, mensaje, tipo]
            );
            return res.status(201).json({ success: true });
        }

        res.status(400).json({ success: false, message: "No se pudo determinar el destinatario" });
    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN NOTIFICACIONES:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// OBTENER NOTIFICACIONES POR USUARIO
// Saco las últimas 15 notificaciones para mostrar en el panel.
router.get('/:id_usuario', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id_notificacion as id, titulo, mensaje, LOWER(tipo) as tipo, fecha, CAST(leida AS UNSIGNED) as leida 
             FROM notificaciones WHERE id_usuario = ? ORDER BY fecha DESC LIMIT 15`,
            [req.params.id_usuario]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exporto para habilitar las rutas de notificaciones en app.js.
module.exports = router;