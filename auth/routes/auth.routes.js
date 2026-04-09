const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getConnection, sql } = require('../config/db');

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y password son requeridos' });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('usuario', sql.VarChar, usuario)
      .query('SELECT id, usuario, password, nombre, rol FROM usuarios WHERE usuario = @usuario AND activo = 1');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { usuario, password, nombre, rol } = req.body;

    if (!usuario || !password || !nombre) {
      return res.status(400).json({ error: 'usuario, password y nombre son requeridos' });
    }

    const pool = await getConnection();

    // Verificar si ya existe
    const existe = await pool
      .request()
      .input('usuario', sql.VarChar, usuario)
      .query('SELECT id FROM usuarios WHERE usuario = @usuario');

    if (existe.recordset.length > 0) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool
      .request()
      .input('usuario', sql.VarChar, usuario)
      .input('password', sql.VarChar, hashedPassword)
      .input('nombre', sql.VarChar, nombre)
      .input('rol', sql.VarChar, rol || 'user')
      .query('INSERT INTO usuarios (usuario, password, nombre, rol, activo) VALUES (@usuario, @password, @nombre, @rol, 1)');

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /auth/profile (protegida)
router.get('/profile', require('../middleware/jwt.middleware').verifyToken, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT id, usuario, nombre, rol FROM usuarios WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error en profile:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
