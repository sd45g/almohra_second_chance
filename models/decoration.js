// الديكورات التي يمكن إضافتها من قبل المدير.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const decorationSchema = new Schema({
    dec_name: { // تعديل الاسم ليصبح dec_name
        type: String,
        required: true,
    },
    description: { // إضافة وصف الديكور
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['مفعل', 'معطل'],
        default: 'مفعل',
    },
    pictures: [{ // صور الديكور
        type: String, // URL or image path
        required: true,
    }],
    admin_id: { // مرجع المدير الذي أضاف الديكور
        type: Schema.Types.ObjectId,
        ref: 'User',
    }, 
});

module.exports = mongoose.model('Decoration', decorationSchema);