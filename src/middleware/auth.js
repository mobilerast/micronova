// Simple API key middleware for admin/seed endpoints
const requireApiKey = (keyType = 'ADMIN') => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const expectedKey = keyType === 'ADMIN' 
      ? process.env.ADMIN_API_KEY 
      : process.env.SEED_API_KEY;

    if (apiKey !== expectedKey) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
  };
};

module.exports = { requireApiKey };
