const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { gatewayAuth } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT_GATEWAY || 3000;

app.use(cors());

// Middleware de autenticación global
app.use(gatewayAuth);

// Health check del gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Proxy a Auth service
app.use(
  '/auth',
  createProxyMiddleware({
    target: `http://localhost:${process.env.PORT_AUTH || 3001}`,
    changeOrigin: true,
  })
);

// Proxy a Audit service
app.use(
  '/audit',
  createProxyMiddleware({
    target: `http://localhost:${process.env.PORT_AUDIT || 3002}`,
    changeOrigin: true,
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway corriendo en http://localhost:${PORT}`);
  console.log(`  -> /auth   => http://localhost:${process.env.PORT_AUTH || 3001}`);
  console.log(`  -> /audit  => http://localhost:${process.env.PORT_AUDIT || 3002}`);
});
