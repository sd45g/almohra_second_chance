// controllers/invoiceController.js

const Receipt = require("../models/receipt");
const Reservation = require("../models/reservation");

// إنشاء الفاتورة بناءً على ا
// استيراد النماذج

// دالة المدير لرؤية كل الفواتير
exports.getAllReceiptsForAdmin = async (req, res) => {
  try {
    const receipts = await Receipt.find({}).populate({
      path: "reservation_id",
      select: "classification bookingDate numberOfChairs decoration_id notes", // إضافة notes هنا
      populate: [
        {
          path: "decoration_id", // جلب معلومات الديكور
          select: "dec_name", // اسم الديكور فقط
        },
      ],
    });

    const formattedReceipts = receipts.map((receipt) => ({
      id: receipt._id,
      name: receipt.recipient_name,
      date: receipt.bookingDate.toISOString().split("T")[0], // تحويل التاريخ إلى تنسيق بسيط
      quantity: receipt.numberOfChairs,
      eventType: receipt.reservation_id.classification,
      decorName: receipt.reservation_id.decoration_id?.dec_name || "غير محدد", // اسم الديكور
      paymentMethod: receipt.paymentMethod,
      paidAmount: receipt.amountPaid,
      totalAmount: receipt.total_amount,
      remainingAmount: receipt.total_amount - receipt.amountPaid,
      status: receipt.status,
      notes: receipt.reservation_id.notes || "لا توجد ملاحظات", // جلب الملاحظات إذا وجدت
    }));
    res.status(200).json(formattedReceipts);
  } catch (error) {
    console.error("Error fetching receipts for customer:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch receipts for customer", error });
  }
};

// دالة الزبون لرؤية الفواتير المرتبطة بحجوزاته
exports.getReceiptsForCustomer = async (req, res) => {
  try {
    const userId = req.user.id;

    // جلب الحجوزات الخاصة بالزبون
    const reservations = await Reservation.find({ user_id: userId }).select(
      "_id"
    );
    const reservationIds = reservations.map((reservation) => reservation._id);

    // جلب الفواتير المرتبطة بالحجوزات
    const receipts = await Receipt.find({
      reservation_id: { $in: reservationIds },
    }).populate({
      path: "reservation_id",
      select: "classification bookingDate numberOfChairs decoration_id",
      populate: {
        path: "decoration_id", // جلب معلومات الديكور
        select: "dec_name", // اسم الديكور فقط
      },
    });

    const formattedReceipts = receipts.map((receipt) => ({
      id: receipt._id,
      name: receipt.recipient_name,
      date: receipt.bookingDate.toISOString().split("T")[0], // تحويل التاريخ إلى تنسيق بسيط
      quantity: receipt.numberOfChairs,
      eventType: receipt.reservation_id.classification,
      decorName: receipt.reservation_id.decoration_id?.dec_name || "غير محدد", // اسم الديكور
      paymentMethod: receipt.paymentMethod,
      paidAmount: receipt.amountPaid,
      totalAmount: receipt.total_amount,
      remainingAmount: receipt.total_amount - receipt.amountPaid,
      status: receipt.status,
    }));
    res.status(200).json(formattedReceipts);
  } catch (error) {
    console.error("Error fetching receipts for customer:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch receipts for customer", error });
  }
};

// عرض فاتورة واحدة بناءً على معرف الفاتورة
exports.getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.receiptId)
      .populate("reservation_id", "customerName bookingDate user_id")
      .populate("reservation_id.user_id", "name");

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // إذا كان المستخدم زبونًا، تأكد أن الفاتورة تخصه فقط
    if (
      req.user.role === "customer" &&
      receipt.reservation_id.user_id.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this receipt." });
    }

    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve receipt", error });
  }
};
//!----------------------------------------------------------------------

exports.updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, decorName, amountPaid } = req.body;

    const receipt = await Receipt.findById(id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    receipt.numberOfChairs = quantity || receipt.numberOfChairs;
    receipt.decorName = decorName || receipt.decorName;
    receipt.amountPaid = amountPaid || receipt.amountPaid;
    receipt.status = 'مؤكد';

    await receipt.save();
    res.status(200).json({ message: 'Receipt updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update receipt', error });
  }
};


exports.confirmReservation = async (req, res) => {
  try {
    const { receiptId } = req.params;
    const { amountPaid } = req.body;

    if (!receiptId || !amountPaid) {
      return res
        .status(400)
        .json({ message: "Missing reservation ID or payment amount." });
    }

    const receipt = await Receipt.findById(receiptId);
    if (!receipt) {
      return res.status(404).json({ message: "الحجز غير موجود" });
    }

    // if (receipt.user_id.toString() !== req.user.id) {
    //   return res.status(403).json({ message: 'لا يمكنك تعديل هذا الحجز' });
    // }

    receipt.amountPaid = amountPaid;
    receipt.status = "مؤكد";

    await receipt.save();

    res.status(200).json({ message: "تم تأكيد الحجز بنجاح" });
  } catch (error) {
    console.error("Error confirming reservation:", error);
    res.status(500).json({ message: "فشل في تأكيد الحجز", error });
  }
};

// Update a receipt and its associated reservation
exports.updateReceipt = async (req, res) => {
  try {
    const receiptId = req.params.id;
    const {
      name,
      date,
      quantity,
      decorId,
      eventType,
      paymentMethod,
      paidAmount,
      totalAmount,
      status,
    } = req.body;
    
    const receipt = await Receipt.findById(receiptId);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Update the receipt
    receipt.recipient_name = name || receipt.recipient_name;
    receipt.bookingDate = date || receipt.bookingDate;
    receipt.numberOfChairs = quantity || receipt.numberOfChairs;
    receipt.paymentMethod = paymentMethod || receipt.paymentMethod;
    receipt.amountPaid = paidAmount || receipt.amountPaid;
    receipt.total_amount = totalAmount || receipt.total_amount;
    receipt.status = status || receipt.status;

    // Update the associated reservation
    const reservation = await Reservation.findById(receipt.reservation_id);
    if (reservation) {
      reservation.customerName = name || reservation.customerName;
      reservation.bookingDate = date || reservation.bookingDate;
      reservation.numberOfChairs = quantity || reservation.numberOfChairs;
      reservation.decoration_id = decorId || reservation.decoration_id;
      reservation.classification = eventType || reservation.classification;

      await reservation.save();
    }

    await receipt.save();

    res
      .status(200)
      .json({
        message: "Receipt and associated reservation updated successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update receipt and reservation", error });
  }
};

exports.getReservedDatesforadmin = async (req, res) => {
  try {
    // جلب جميع الفواتير مع حقل التاريخ والحالة
    const receipts = await Receipt.find({}, "bookingDate status");

    // تحويل البيانات إلى صيغة مناسبة
    const reservedDates = receipts.map((receipt) => ({
      date: receipt.bookingDate.toISOString().split("T")[0], // تحويل التاريخ إلى صيغة YYYY-MM-DD
      status: receipt.status,
    }));

    res.status(200).json(reservedDates); // إرسال البيانات إلى الواجهة الأمامية
  } catch (error) {
    console.error("Error fetching reserved dates:", error);
    res.status(500).json({ message: "Failed to fetch reserved dates", error });
  }
};

// Delete a reservation by ID
// Delete a receipt and its associated reservation by ID
exports.deleteReservation = async (req, res) => {
  try {
    // حذف الفاتورة بناءً على ID
    const receipt = await Receipt.findByIdAndDelete(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // حذف الحجز المرتبط بالفاتورة باستخدام reservation_id
    const reservation = await Reservation.findByIdAndDelete(
      receipt.reservation_id
    );

    if (!reservation) {
      return res
        .status(404)
        .json({ message: "Associated reservation not found" });
    }

    res
      .status(200)
      .json({
        message: "Receipt and associated reservation deleted successfully",
      });
  } catch (error) {
    console.error("Error deleting reservation and receipt:", error);
    res
      .status(500)
      .json({ message: "Failed to delete reservation and receipt", error });
  }
};
