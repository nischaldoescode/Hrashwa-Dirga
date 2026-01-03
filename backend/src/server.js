const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

dotenv.config();

const { connectDatabase, disconnectDatabase } = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const { configureCloudinary } = require('./config/cloudinary');
const { initializeRedis, closeRedis } = require('./config/redis');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const questionRoutes = require('./routes/questions');
const levelRoutes = require('./routes/levels');
const leaderboardRoutes = require('./routes/leaderboard');
const configRoutes = require('./routes/config');
const adRoutes = require('./routes/ads');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim().replace(/\/$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/ads', adRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

const logOutboundIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    console.log('Outbound IP (for Redis allowlist):', data.ip);
  } catch (err) {
    console.error('Failed to fetch outbound IP:', err.message);
  }
};

const startServer = async () => {
  try {
    initializeRedis();
    await connectDatabase();
    
    initializeFirebase();
    
    configureCloudinary();
    logOutboundIP();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await disconnectDatabase();
  await closeRedis(); 
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await disconnectDatabase();
  await closeRedis(); 
  process.exit(0);
});

startServer();

module.exports = app;