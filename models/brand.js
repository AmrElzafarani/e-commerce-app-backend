const mongoose = require('mongoose');

const brandSchema = ({
    name: {
        type: String,
    }
})

exports.Brand = mongoose.model('Brand', brandSchema);