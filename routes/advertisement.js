// routes/advertisement.js
const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisement');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/advertisements'); // المجلد الذي سيتم حفظ الملفات فيه
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/public', advertisementController.getPublicAdvertisements);

// Apply authentication middleware
router.use(authMiddleware);
router.get('/', authorizeRoles('admin'), advertisementController.getAllAdvertisements);
router.post('/create', authorizeRoles('admin'), upload.single('adImage'), advertisementController.createAdvertisement);
router.get('/:id', authorizeRoles('admin'), advertisementController.getAdvertisementById);
router.put('/:id', authorizeRoles('admin'), upload.single('adImage'), advertisementController.updateAdvertisement);
router.delete('/:id', authorizeRoles('admin'), advertisementController.deleteAdvertisement);
//---------------------------


module.exports = router;
