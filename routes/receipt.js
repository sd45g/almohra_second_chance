const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Apply authentication middleware
router.use(authMiddleware);

// Routes
// إنشاء فاتورة بناءً على الحجز
// عرض جميع الفواتير
// دالة المدير لرؤية جميع الفواتير
router.get('/admin', authorizeRoles('admin'), receiptController.getAllReceiptsForAdmin);
// عرض فاتورة بناءً على معرف الفاتورة
// دالة الزبون لرؤية الفواتير الخاصة به
router.get('/customer', authorizeRoles('customer'), receiptController.getReceiptsForCustomer);

router.get('/reserved-dates-admin', authorizeRoles('admin'), receiptController.getReservedDatesforadmin);

router.get('/:receiptId', authorizeRoles('admin', 'customer'), receiptController.getReceiptById);

router.put('/:receiptId/confirm', authorizeRoles('customer'), receiptController.confirmReservation);

router.put('/:id', authorizeRoles('admin'), receiptController.updateReceipt);


router.delete('/:id', authorizeRoles('admin'), receiptController.deleteReservation);



module.exports = router;