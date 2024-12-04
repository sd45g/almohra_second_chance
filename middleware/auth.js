//const jwt = require('jsonwebtoken');
const jwtHelpers = require('../utils/jwtHelpers');
// Middleware للتحقق من JWT
const authMiddleware = (req, res, next) => {
    //const authHeader = req.headers['authorization'];
    const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
   // const token = authHeader && authHeader.split(' ')[1]; // استخراج التوكن من الهيدر
    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    try {
        //const decoded = jwt.verify(token, process.env.JWT_SECRET); // التحقق من التوكن
        const decoded = jwtHelpers.verify(token);
        req.user = decoded; // تخزين بيانات المستخدم في req.user
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};


// Middleware لتفويض الأدوار
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. You do not have the required role.' });
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    authorizeRoles
};


