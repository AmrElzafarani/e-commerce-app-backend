const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    richDescription: {
        type: String,
        default: ''
    },
    image:{
        type:String,
        default: ''
    },
    // images: [{
    //     type:String,
    // }],
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    },
    price: {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material'
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
    },
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    dataCreated: {
        type: Date,
        default: Date.now
    },

    // productColors: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'ProductColor',
    //     required:true
    // }]

})

exports.Product = mongoose.model('Product', productSchema);
