const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
  try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, "secret"); // Replace "secret" with your actual secret key

      req.user = { _id: decoded.id }; // Ensure `id` exists in the token payload
      next();
  } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(401).json({ error: 'Invalid token' });
  }
};