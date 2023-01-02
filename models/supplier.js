const mongoose = require('mongoose');

const supplierSchema = mongoose.Schema({
    name: {
        type: String
    },
    phone: {
        type: String
    },
    address: {
        type: String
    }
});

exports.Supplier = mongoose.model('Supplier', supplierSchema)