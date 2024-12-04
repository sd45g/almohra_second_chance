
//-------------------------------
const express = require('express');
const router = express.Router();
const decorationController = require('../controllers/decoration');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// إعداد التخزين في Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //cb(null, 'uploads/'); // مجلد حفظ الصور
        cb(null, 'uploads/decorations'); // مجلد تخزين الصور

    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// إعداد Multer مع التخزين المحدد
const upload = multer({ storage: storage });

router.get('/active', decorationController.getActiveDecorations);
// تطبيق Middleware للتحقق من JWT
router.use(authMiddleware);
// Routes
router.post('/create', authorizeRoles('admin'), upload.array('pictures', 20), decorationController.createDecoration); // السماح بتحميل 5 صور كحد أقصى

router.get('/name', authorizeRoles('admin'), decorationController.getDecorationsname);
router.get('/all', authorizeRoles('admin'), decorationController.getAllDecorations);
router.get('/:id', decorationController.getDecorationById);
router.put('/:id', authorizeRoles('admin'), upload.array('pictures', 20), decorationController.updateDecoration);
router.put('/toggle-status/:id', authorizeRoles('admin'), decorationController.toggleDecorationStatus); // تحديث حالة التفعيل/التعطيل
router.put('/:id/delete-image', authorizeRoles('admin'), decorationController.deleteDecorationImage);
router.put('/:id/add-images', authorizeRoles('admin'), upload.array('pictures', 20), decorationController.addDecorationImages);
router.delete('/:id', authorizeRoles('admin'), decorationController.deleteDecoration);

module.exports = router;
