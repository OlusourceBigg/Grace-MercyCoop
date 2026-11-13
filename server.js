const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/coop', require('./src/routes/coopRoutes'));
app.use('/api/loans', require('./src/routes/loanRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    society: 'Grace & Mercy Cooperative Society API',
    timestamp: new Date(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Grace & Mercy Server]: Running on port ${PORT}`);
});