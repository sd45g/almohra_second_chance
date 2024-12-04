const express = require('express');
const router = express.Router();
const authController = require('../controllers/user');
//const { authMiddleware } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('express-validator');
// مسارات التسجيل وتسجيل الدخول
router.post('/login', authController.login)
router.post('/register', [
    // تحقق من أن الاسم ليس فارغًا
    body('user_name').notEmpty().withMessage('Name is required'),
    // تحقق من أن البريد الإلكتروني صحيح
    body('email').isEmail().withMessage('Please enter a valid email address'),
    // تحقق من أن كلمة المرور تحتوي على 6 حروف على الأقل
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ], authController.register);

// مسار الـ Profile، يتطلب مصادقة باستخدام authMiddleware
router.get('/profile', authMiddleware, authController.profile)

// مسار تحديث معلومات المستخدم
router.post('/update-profile', authMiddleware, [
  body('name').optional().notEmpty().withMessage('Name must not be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email address')
], authController.updateProfile);

// مسار تغيير كلمة المرور
// router.post('/change-password', authMiddleware, [
//   // التحقق من صحة كلمة المرور الحالية وكلمة المرور الجديدة
//   body('password').notEmpty().withMessage('Current password is required'),
//   body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
// ], authController.changePassword);

// إضافة مستخدم جديد (يجب أن يكون الأدمن فقط)
router.get('/customer-count', authController.getCustomerCount); // إضافة المسار الجديد


module.exports = router;








