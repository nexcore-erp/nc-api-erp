const express = require('express');
const { getConnection, sql } = require('../config/db');

const router = express.Router();

// POST /audit/log - Registrar evento de auditoría
router.post('/log', async (req, res) => {
  try {
    const { accion, modulo, detalle } = req.body;

    if (!accion) {
      return res.status(400).json({ error: 'accion es requerida' });
    }

    // req.user viene del JWT decodificado (pasado por el gateway)
    const usuario_id = req.headers['x-user-id'] || null;
    const usuario_nombre = req.headers['x-user-nombre'] || 'sistema';

    const pool = await getConnection();
    await pool
      .request()
      .input('accion', sql.VarChar, accion)
      .input('modulo', sql.VarChar, modulo || null)
      .input('detalle', sql.NVarChar, detalle || null)
      .input('usuario_id', sql.Int, usuario_id)
      .input('usuario_nombre', sql.VarChar, usuario_nombre)
      .input('ip', sql.VarChar, req.ip)
      .query(`INSERT INTO auditoria (accion, modulo, detalle, usuario_id, usuario_nombre, ip, fecha) 
              VALUES (@accion, @modulo, @detalle, @usuario_id, @usuario_nombre, @ip, GETDATE())`);

    res.status(201).json({ message: 'Evento registrado' });
  } catch (err) {
    console.error('Error en audit log:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /audit/logs - Consultar eventos (con filtros opcionales)
router.get('/logs', async (req, res) => {
  try {
    const { modulo, usuario_id, desde, hasta, limit } = req.query;
    const pool = await getConnection();

    let query = 'SELECT TOP (@limit) * FROM auditoria WHERE 1=1';
    const request = pool.request();

    request.input('limit', sql.Int, parseInt(limit) || 100);

    if (modulo) {
      query += ' AND modulo = @modulo';
      request.input('modulo', sql.VarChar, modulo);
    }

    if (usuario_id) {
      query += ' AND usuario_id = @usuario_id';
      request.input('usuario_id', sql.Int, parseInt(usuario_id));
    }

    if (desde) {
      query += ' AND fecha >= @desde';
      request.input('desde', sql.DateTime, new Date(desde));
    }

    if (hasta) {
      query += ' AND fecha <= @hasta';
      request.input('hasta', sql.DateTime, new Date(hasta));
    }

    query += ' ORDER BY fecha DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en audit logs:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
