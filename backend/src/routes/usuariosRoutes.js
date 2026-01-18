const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Define la ruta PUT para el cambio de clave
router.put('/cambiar-password/:id', usuariosController.cambiarPassword);

module.exports = router;