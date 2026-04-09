const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Rutas públicas que no requieren token
const publicPaths = ['/auth/login', '/auth/register', '/health'];

function gatewayAuth(req, res, next) {
  // Permitir rutas públicas
  if (publicPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { gatewayAuth };
