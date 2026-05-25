require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const smmRoutes = require('./routes/smm');
const smsRoutes = require('./routes/sms');
const paymentRoutes = require('./routes/payment');
const walletRoutes = require('./routes/wallet');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const bankRoutes = require('./routes/bankDeposit');
const accszoneRoutes = require('./routes/accszone');
const settingsRoutes = require('./routes/settings');
const supportRoutes = require('./routes/support');
const { startImapPoller } = require('./lib/imap');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    // Allow localhost, local network IPs (for phone testing), and the configured FRONTEND_URL
    origin: (origin, cb) => {
      const allowed = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:4173',
      ];
      // Allow requests with no origin (mobile apps, curl, same-origin) and local IPs
      if (!origin || allowed.includes(origin) || /^http:\/\/192\.168\.\d+\.\d+/.test(origin) || /^http:\/\/10\.\d+\.\d+\.\d+/.test(origin)) {
        cb(null, true);
      } else {
        cb(null, true); // In dev, allow all — tighten in production
      }
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/smm', smmRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/accszone', accszoneRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/support', supportRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', service: 'PanelNG API', timestamp: new Date().toISOString() })
);

// Serve React frontend in production
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
} else {
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\nPanelNG API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health\n`);
  startImapPoller();
});
