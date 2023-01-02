const mongoose = require('mongoose');

const materialSchema = mongoose.Schema({
    name: {
        type: String,
    }
})

exports.Material = mongoose.model('Material', materialSchema);