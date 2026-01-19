require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const notasRoutes = require('./routes/notasRoutes'); 
const evaluacionesRoutes = require('./routes/evaluacionesRoutes');
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
app.use('/api/evaluaciones', evaluacionesRoutes); 
app.use('/api/usuarios', usuariosRoutes);

// ✅ CORRECCIÓN: Se agrega 'req' como primer parámetro. Ahora 'res' funcionará correctamente.
app.get('/', (req, res) => {
    res.send('API Escuela Trapilhue funcionando en producción 🚀');
});

// ✅ CORRECCIÓN: Para producción en Render, es mejor usar 0.0.0.0 y el puerto de ambiente
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo exitosamente`);
});