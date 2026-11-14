const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/coop', require('./src/routes/coopRoutes'));
app.use('/api/loans', require('./src/routes/loanRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Health Check & Root Endpoints
app.get('/', (req, res) => {
  res.send('Grace & Mercy Cooperative Society API is active.');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Grace & Mercy Server]: Running on port ${PORT}`);
});