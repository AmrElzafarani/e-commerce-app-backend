const mongoose = require('mongoose');

const colorSchema = mongoose.Schema([{
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
}])

exports.Color = mongoose.model('Color', colorSchema);
