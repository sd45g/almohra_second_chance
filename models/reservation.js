//الحجوزات التي يمكن إجراؤها من قبل المستخدم أو المدير.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    customerName: {
        type: String,
        required: true
    },
    customerPhone:
    {
        type: String,
        required: true
    },
    decoration_id:
    {
        type: Schema.Types.ObjectId,
        ref: 'Decoration',
       // required: true
    },
    classification:
    {
        type: String,
        required: true
    }, // should match the classification of decoration
    numberOfChairs:
    {
        type: Number,
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,// Reference to the user who made the booking
        ref: 'User',
      //  required: true
    },
    amountPaid: {
        type: Number,
        required: true,
    },
    notes: {
        type: String,
    },
    paymentMethod: {
        type: String,
        enum: ['نقدًا', 'localbankcards'],
        required: true,
        default:'نقدًا',
      },
      notified: {
        type: Boolean,
        default: false, // الافتراضي: لم يتم الإشعار
      },

}, {
    timestamps: true,
});

module.exports = mongoose.model('Reservation', reservationSchema);



  
  
 
 
 
   
