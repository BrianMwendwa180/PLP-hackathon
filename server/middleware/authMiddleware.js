import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

// Middleware to check if user is admin (for admin-only routes)
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'authority' && req.user.role !== 'developer') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
