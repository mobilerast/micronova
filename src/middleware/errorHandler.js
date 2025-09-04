// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Prisma specific errors
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Unique constraint violation' });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  // Default error
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
};

module.exports = errorHandler;
