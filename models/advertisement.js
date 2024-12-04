
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const advertisementSchema = new Schema({
    
    adImage: {
        type: String,// URL or image path
        required: true,
    }, 
    description: {
        type: String,
        maxlength: 500 // optional limit on description length
    },
    expiryDate: {
        type: Date
    },
    admin_id: {
        type: Schema.Types.ObjectId,// Admin reference
        ref: 'User',
    }, 
    
}, {
    timestamps: true,
  });

module.exports = mongoose.model('Advertisement', advertisementSchema);
