require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const notasRoutes = require('./routes/notasRoutes'); 
const evaluacionesRoutes = require('./routes/evaluacionesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const anotacionesRoutes = require('./routes/anotacionesRoutes'); 
const notificacionesRoutes = require('./routes/notificacionesRoutes');

const app = express();

// Configuración de CORS para permitir a Netlify
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- SECCIÓN DE RUTAS DE AUTENTICACIÓN ---
// Estas rutas deben coincidir con tu AuthService de Angular
// Si Angular llama a /login, aquí DEBE ser /login
app.post('/login', authController.login);
app.post('/register', authController.register);

// También las dejamos con /api/auth por si acaso
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);


// --- RESTO DE MÓDULOS ---
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/notas', notasRoutes); 
app.use('/api/anotaciones', anotacionesRoutes); 
app.use('/api/evaluaciones', evaluacionesRoutes); 
app.use('/api/usuarios', usuariosRoutes);

app.get('/', (req, res) => {
    res.send('API Escuela Trapilhue funcionando en producción 🚀');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});