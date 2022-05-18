const mongoose = require('mongoose');

const ProductColorSchema = mongoose.Schema([{
    colorName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
}])

exports.ProductColor = mongoose.model('ProductColor', ProductColorSchema);
