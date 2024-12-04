// routes/reservation.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation');
const paymentController = require('../controllers/paymentController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

router.get('/return', paymentController.handleReturn);  
// Apply authentication middleware
router.use(authMiddleware);

router.post('/create-reservation', authorizeRoles('admin', 'customer'), reservationController.createReservation);
router.get('/notifications', reservationController.getNotifications);

router.get('/reserved-dates', reservationController.getReservedDates);

// Fetch reservations for the logged-in user
router.get('/user', reservationController.getUserReservations);
router.get('/all', authorizeRoles('admin'), reservationController.getAllReservations);
router.get('/user/:id', authorizeRoles('admin', 'customer'), reservationController.getReservationById);
router.get('/total-earnings', reservationController.getTotalEarnings);
router.get('/monthly-earnings/:year', reservationController.getMonthlyEarnings);
router.get('/current-month-earnings', reservationController.getEarningsForCurrentMonth);
router.get('/available-years', reservationController.getAvailableYears);

module.exports = router;
