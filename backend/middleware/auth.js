const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'din-hemmelige-noegle-skal-vaere-lang-og-sikker';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Ingen token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Ugyldig token' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
