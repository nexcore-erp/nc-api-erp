const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const auditRoutes = require('./routes/audit.routes');

const app = express();
const PORT = process.env.PORT_AUDIT || 3002;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/audit', auditRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'audit' });
});

app.listen(PORT, () => {
  console.log(`Audit service corriendo en http://localhost:${PORT}`);
});
