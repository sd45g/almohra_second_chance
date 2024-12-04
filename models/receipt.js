//التقارير التي يمكن إنشاؤها لإدارة المعلومات المالية المتعلقة بالحجوزات.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const receiptSchema = new Schema({
    reservation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
      //  required: true,
    },
    recipient_name: {
        type: String,
       // required: true,
    },
    numberOfChairs: {
        type: Number, // عدد الكراسي
      //  required: true
    },
    bookingDate: {
        type: Date,// تاريخ المناسبة (نفس تاريخ الحجز)
        //required: true
    },
    amountPaid: {
        type: Number,  // تعديل النوع إلى رقم
        //required: true, // المستخدم سيدخل المبلغ المدفوع
    },
    total_amount: {
        type: Number,
      //  required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['نقدًا', 'localbankcards'],
        required: true,
        default:'نقدًا',
      },
    remainingAmount: {
        type: Number, // يتم حسابه تلقائيًا بناءً على المبلغ المدفوع
        default: function () {
            return this.total_amount - this.amountPaid;
          },
    },
    finalPaymentDate: {
        type: Date,// تاريخ السداد النهائي (نفس تاريخ المناسبة)
       // required: true,
    },
    status: {  // الحقل الجديد لحالة الحجز
        type: String,
        enum: ['مؤكد', 'مؤقت', 'ملغية', 'مؤجلة'],
        default: 'مؤقت'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    
  
}, {
    timestamps: true,
});




module.exports = mongoose.model('Receipt', receiptSchema);








 

