const express = require('express');
const os = require('os');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { initDb } = require('./database');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const settingsRoutes = require('./routes/settings');
const { isMaintenanceEnabled } = require('./services/settings-service');

const app = express();
let server;

function getLanAddresses() {
  const addresses = new Set();
  const interfaces = os.networkInterfaces();

  Object.values(interfaces).forEach((entries = []) => {
    entries.forEach((entry) => {
      if (entry.family === 'IPv4' && !entry.internal) {
        addresses.add(entry.address);
      }
    });
  });

  return Array.from(addresses);
}

app.disable('x-powered-by');
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  })
);
app.use(cors({ origin: config.frontendOrigin, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: config.maxPayloadSize }));
app.use(express.urlencoded({ extended: false }));

const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use('/api', apiLimiter);
app.use('/api', authRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', settingsRoutes);

app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use(async (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/api/maintenance')) {
    return next();
  }

  try {
    const maintenance = await isMaintenanceEnabled();
    if (maintenance) {
      if (req.accepts('html')) {
        return res.status(503).send('<h1>Maintenance Mode</h1><p>The site is temporarily offline. Please try again later.</p>');
      }
      return res.status(503).json({ success: false, message: 'Maintenance mode is enabled.' });
    }
    next();
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(__dirname, '..'), { extensions: ['html', 'htm'], index: 'index.html', immutable: true }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ success: false, message: 'Server error' });
});

function startServer() {
  initDb()
    .then(() => {
      server = app.listen(config.port, config.host, () => {
        console.log(`Server running at http://${config.host}:${config.port}`);
        const addresses = getLanAddresses();
        if (addresses.length > 0) {
          console.log(`Reachable on your network at: ${addresses.map((address) => `http://${address}:${config.port}`).join(', ')}`);
        }
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${config.port} is already in use. Please stop the other process and try again.`);
        } else {
          console.error('Server failed to start:', error);
        }
        process.exit(1);
      });
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

startServer();
