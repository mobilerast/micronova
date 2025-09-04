const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const childrenRoutes = require('./routes/children');
const assessmentRoutes = require('./routes/assessments');
const planRoutes = require('./routes/plans');
const sessionRoutes = require('./routes/sessions');
const seedRoutes = require('./routes/seed');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    app: process.env.APP_NAME || 'Micronova',
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use('/api/children', childrenRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/seed', seedRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Micronova backend running on port ${PORT}`);
  console.log(`📚 Kid-friendly language learning API ready!`);
});
