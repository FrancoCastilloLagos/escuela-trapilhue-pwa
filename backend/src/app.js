require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const notasRoutes = require('./routes/notasRoutes'); 
const evaluacionesRoutes = require('./routes/evaluacionesRoutes');
// const fechasRoutes = require('./routes/fechasRoutes'); // ELIMINAR O COMENTAR
const usuariosRoutes = require('./routes/usuariosRoutes');
const anotacionesRoutes = require('./routes/anotacionesRoutes'); 
const notificacionesRoutes = require('./routes/notificacionesRoutes');

// Inicio la app de express.
const app = express();

// Aplico cors y permito que lea formato json.
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/notificaciones', notificacionesRoutes);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);

// Registro los endpoints de los módulos principales.
app.use('/api/notas', notasRoutes); 
app.use('/api/anotaciones', anotacionesRoutes); 
app.use('/api/evaluaciones', evaluacionesRoutes); // Usar esta para fechas y calendario
app.use('/api/usuarios', usuariosRoutes);

// Ruta base para confirmar que el servidor levantó bien.
app.get('/', (res) => {
    res.send('API Escuela Trapilhue funcionando 🚀');
});

// Defino el puerto y pongo el server a escuchar.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});