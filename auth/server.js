const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT_AUTH || 3001;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

app.listen(PORT, () => {
  console.log(`Auth service corriendo en http://localhost:${PORT}`);
});
