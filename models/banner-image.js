const mongoose = require('mongoose');

const bannerImageSchema = mongoose.Schema({
    image: {
        type:String,
        default: ''
    },
})

exports.BannerImage = mongoose.model('BannerImage', bannerImageSchema);