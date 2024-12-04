// controllers/reservationController.js
const Reservation = require("../models/reservation");
const Decoration = require("../models/decoration");
const Receipt = require("../models/receipt"); // استيراد نموذج الفاتورة
const { createPayment } = require("./paymentController"); // استيراد دالة الدفع
// const { format } = require('date-fns');
const { format, startOfDay } = require("date-fns");
const { startOfYear, endOfYear } = require("date-fns");

exports.createReservation = async (req, res) => {
  try {
    console.log("Received reservation data:", req.body);
    const {
      customerName,
      customerPhone,
      decoration_id,
      classification,
      numberOfChairs,
      bookingDate,
      amountPaid,
      notes,
      paymentMethod,
      total_amount,
      remainingAmount,
    } = req.body;
        // التحقق من البيانات المفقودة
        if (!customerName || !customerPhone || !decoration_id || !classification || !bookingDate) {
          return res.status(400).json({ message: "Missing required fields." });
        }

    const decoration = await Decoration.findById(decoration_id);
    console.log("Decoration found:", decoration);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }

    // التحقق إذا كان التاريخ محجوزًا مسبقًا
    const isDateReserved = await Reservation.exists({ bookingDate });
    if (isDateReserved) {
      return res
        .status(400)
        .json({ message: "The selected date is already reserved." });
    }

    // إعادة حساب حالة الحجز بناءً على المبلغ المدفوع
    let recalculatedStatus = "";
    if (amountPaid === total_amount) {
      recalculatedStatus = "مؤكد"; // Confirmed
    } else if (amountPaid >= total_amount / 10) {
      recalculatedStatus = "مؤقت"; // Temporary
    } else {
      return res
        .status(400)
        .json({
          message: "المبلغ المدفوع أقل من الحد الأدنى المطلوب للعربون.",
        });
    }

    // إنشاء الحجز وحفظه في قاعدة البيانات
    const newReservation = new Reservation({
      customerName,
      customerPhone,
      decoration_id,
      classification,
      numberOfChairs,
      bookingDate: bookingDate,
      user_id: req.user.id, // استخدام الـ JWT لاستخراج الـ user_id
      amountPaid,
      notes,
      paymentMethod, // إضافة paymentMethod هنا
    });

    // حفظ الحجز في قاعدة البيانات
    const savedReservation = await newReservation.save();

    // إنشاء الفاتورة المرتبطة بالحجز الجديد
    const receipt = new Receipt({
      reservation_id: savedReservation._id,
      recipient_name: customerName,
      numberOfChairs: numberOfChairs,
      bookingDate: bookingDate,
      total_amount: total_amount,
      amountPaid: amountPaid,
      remainingAmount: remainingAmount,
      finalPaymentDate: bookingDate,
      paymentMethod: paymentMethod,
      status: recalculatedStatus,
    });

    await receipt.save();

    // التحقق من طريقة الدفع
    if (paymentMethod === "نقدًا") {
      // إذا كانت نقدًا، حفظ الحجز والفاتورة فقط
      res.status(201).json({
        message: "Reservation and receipt created successfully for cash payment",
        reservation: savedReservation,
        receipt,
      });
    } else {
      // إذا كانت طريقة الدفع أخرى، استدعاء بوابة الدفع
      const paymentResponse = await createPayment({
        payment_method: paymentMethod,
        amount: amountPaid,
        invoice_no: savedReservation._id.toString(), // استخدام رقم الحجز كـ invoice_no
      });

      res.status(201).json({
        message: "Reservation and receipt created",
        redirect_url: paymentResponse,
        reservation: savedReservation,
        receipt,
      });
    }
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Failed to create reservation", error });
  }
};

//دالة جلب الاشعارات
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // الحصول على معرف المستخدم
    const notifications = await Reservation.find({
      user_id: userId,
      notified: true, // فقط الحجوزات التي تم إشعارها
    }).select("customerName classification bookingDate");

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};


// controllers/reservationController.js

exports.getUserReservations = async (req, res) => {
  try {
    // استخراج الدور و معرف المستخدم من JWT (أو من `req.user` إذا كان مسجلاً بواسطة middleware)
    const userId = req.user.id;
    const userRole = req.user.role;

    let reservations;
    if (userRole === "admin") {
      // المدير يمكنه رؤية كل الحجوزات
      reservations = await Reservation.find()
        .populate("decoration_id", "name")
        .populate("user_id", "name");
    } else {
      // الزبون يمكنه رؤية حجوزاته فقط
      reservations = await Reservation.find({ user_id: userId }).populate(
        "decoration_id",
        "name"
      );
    }

    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching reservations", error: error.message });
  }
};

// controllers/reservationController.js
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("decoration_id", "name pictures") // تضمين بيانات الديكورات
      .populate("user_id", "name"); // تضمين اسم المستخدم

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve reservations", error });
  }
};


// controllers/reservationController.js
exports.getTotalEarnings = async (req, res) => {
  try {
    // جمع المبالغ المدفوعة من جميع الحجوزات
    const totalEarnings = await Reservation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amountPaid" }, // جمع الحقول `amountPaid`
        },
      },
    ]);

    const total = totalEarnings[0]?.total || 0; // التأكد من وجود نتيجة
    res.status(200).json({ total });
  } catch (error) {
    console.error("Error fetching total earnings:", error);
    res.status(500).json({ message: "Failed to retrieve total earnings", error });
  }
};



// controllers/reservationController.js

exports.getMonthlyEarnings = async (req, res) => {
  try {
    const year = req.params.year; // السنة المحددة من الطلب
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);

    const earnings = await Reservation.aggregate([
      {
        $match: {
          bookingDate: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: '$bookingDate' },
          total: { $sum: '$amountPaid' },
        },
      },
    ]);

    const monthlyEarnings = Array(12).fill(0);
    earnings.forEach((earning) => {
      monthlyEarnings[earning._id - 1] = earning.total; // تحديث الأرباح حسب الشهر
    });

    res.status(200).json({ monthlyEarnings });
  } catch (error) {
    console.error('Error fetching monthly earnings:', error);
    res.status(500).json({ message: 'Failed to retrieve monthly earnings', error });
  }
};

// جلب الأرباح لهذا الشهر
exports.getEarningsForCurrentMonth = async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const earnings = await Reservation.aggregate([
      {
        $match: {
          bookingDate: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
        },
      },
    ]);

    const totalEarnings = earnings[0]?.total || 0;
    res.status(200).json({ totalEarnings });
  } catch (error) {
    console.error('Error fetching earnings for current month:', error);
    res.status(500).json({ message: 'Failed to fetch earnings for current month', error });
  }
};


exports.getAvailableYears = async (req, res) => {
  try {
    const years = await Reservation.aggregate([
      {
        $group: {
          _id: { $year: '$bookingDate' }, // جلب السنوات من تواريخ الحجوزات
        },
      },
      {
        $project: {
          year: '$_id',
          _id: 0,
        },
      },
      {
        $sort: { year: 1 },
      },
    ]);

    const availableYears = years.map((y) => y.year); // استخراج قائمة السنوات
    res.status(200).json({ years: availableYears });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({ message: 'Failed to fetch available years', error });
  }
};





exports.getReservedDates = async (req, res) => {
  try {
    const reservations = await Reservation.find({}, "bookingDate");
    const reservedDates = reservations.map(
      (reservation) => reservation.bookingDate.toISOString().split("T")[0] // تحويل إلى صيغة YYYY-MM-DD
    );
    res.status(200).json(reservedDates);
  } catch (error) {
    console.error("Error fetching reserved dates:", error);
    res.status(500).json({ message: "Failed to fetch reserved dates", error });
  }
};



// Get a specific reservation by ID
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("decoration_id", "name")
      .populate("user_id", "name");
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve reservation", error });
  }
};

// controllers/reservationController.js

exports.updateReservation = async (req, res) => {
  try {

    console.log('Request Body:', req.body);
    console.log('Reservation ID:', req.params.id);
    const {
      customerName,
      customerPhone,
      classification,
      numberOfChairs,
      bookingDate,
      amountPaid,
      status,
    } = req.body;

    // التحقق من وجود الحجز أولاً
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // تحديث بيانات الحجز
    reservation.customerName = customerName || reservation.customerName;
    reservation.customerPhone = customerPhone || reservation.customerPhone;
    reservation.classification = classification || reservation.classification;
    reservation.numberOfChairs = numberOfChairs || reservation.numberOfChairs;
    reservation.bookingDate = bookingDate || reservation.bookingDate;
    reservation.amountPaid = amountPaid || reservation.amountPaid;
    reservation.status = status || reservation.status;

    // حفظ التحديثات
    const updatedReservation = await reservation.save();

    res.status(200).json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: "Failed to update reservation", error });
  }
};



