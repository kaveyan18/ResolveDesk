const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { initSocket } = require('./socket');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO engine
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const User = require('./models/User');
const Department = require('./models/Department');
const Complaint = require('./models/Complaint');

const { seedDepartmentsAndStaff } = require('./utils/seedData');

// Database Connection
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || 'mongodb://localhost:27017/resolvedesk';
    await mongoose.connect(mongoUri);
    console.log('[ResolveDesk Database] Connected to MongoDB');

    // Auto-sync indexes to drop any legacy/stale database indexes (e.g. complaint_unique_id_1)
    try {
      await Promise.all([
        User.syncIndexes(),
        Department.syncIndexes(),
        Complaint.syncIndexes(),
      ]);
      console.log('[ResolveDesk Database] Database collection indexes synchronized successfully');
    } catch (indexErr) {
      console.warn('[ResolveDesk Database] Notice on index sync:', indexErr.message);
    }

    // Auto-seed department structure, heads, and staff members
    await seedDepartmentsAndStaff();
  } catch (error) {
    console.error('[ResolveDesk Database] Connection error:', error.message);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'ResolveDesk API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'ResolveDesk Server API Root' });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handling Middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

server.listen(PORT, () => {
  console.log(`[ResolveDesk Server] Running on http://localhost:${PORT}`);
});

module.exports = app;
