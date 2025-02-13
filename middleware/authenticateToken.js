
import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  
  const token = req.headers['authorization']?.split(' ')[1];  

  if (!token) {
    return res.status(403).json({ message: 'Token is required' });
  }

  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    
    req.user = decoded;  
    next();  
  });
};

export default authenticateToken;
