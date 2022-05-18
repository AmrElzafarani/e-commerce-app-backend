const express = require('express');
const {Product} = require('../models/product');
const {Category} = require("../models/category");
const {ProductColor} = require("../models/product-color");



const router = express.Router();
const multer = require('multer');
const mongoose = require("mongoose");


const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});
const uploadOptions = multer({ storage: storage });


//Get all products and products by categoryId
// localhost:3000/api/v1/products?categories=category-id

router.get('/', async (req, res) => {
    let filterProductsByCat = {};
    try{
        if(req.query.categories) {
            filterProductsByCat = {category: req.query.categories.split(',')}
        }
        const productList = await Product.find(filterProductsByCat)
            .populate('category')
            .populate('productColors')
        res.send(productList);
    } catch (err) {
        res.status(400).json(err)
    }
})

//Get product by ID
router.get("/:id", async (req, res) => {
    try {
        const productId = await Product.findById(req.params.id)
            .populate('category')
            .populate('productColors');
        res.send(productId);
    } catch (err) {
        return res.status(404).json({
            success: false,
            message: "product-id is incorrect"
        })

    }
})

//Create product
router.post('/create-product',uploadOptions.single('image'), async (req, res) => {

    const productColorsIds = Promise.all(req.body.productColors.map(async productColor => {
        let newProductColor = new ProductColor({
            colorName: productColor.colorName,
            quantity: productColor.quantity
        })
        newProductColor = await newProductColor.save();
        return newProductColor._id;
    }))
    const productColorIsResolved = await productColorsIds;

    const totalQuantities = await Promise.all(productColorIsResolved.map(async (productColorId) => {
        const productColor = await ProductColor.findById(productColorId);
        const totalQuantity = productColor.quantity;
        return totalQuantity
    }))

    const totalQuantity = totalQuantities.reduce((a,b) => a +b , 0);


    try {
        const category = await Category.findById(req.body.category);
        if (!category) {
            return res.status(404).send("Invalid Category")
        }

        const file = req.file;
        // if(!file) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Please upload image"
        //     })
        // }
        // const fileName = file.filename;
        // const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        const product = new Product({
            name: req.body.name,
            // image: `${basePath}${fileName}`,
            description: req.body.description,
            richDescription: req.body.richDescription,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: totalQuantity,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            productColors: productColorIsResolved,


        })
        if (!product) return res.status(400).json({
            success: false,
            message: "can't create product"
        })
        const createdProduct = await product.save();
        
        return res.send(createdProduct);
    } catch (error) {
        return res.status(400).send(error);

    }

})

//Update product by ID
router.put('/:id', uploadOptions.single('image'),  async (req, res) => {
    try {
        const category = await Category.findById(req.body.category);
        if (!category) return res.status(400).send({
            success: false,
            message: "Invalid Category"
        })

        const product = await Product.findById(req.params.id);
        if(!product) return res.status(400).send({
            success: false,
            message: "Invalid Product"
        })

        const file = req.file;
        let imagePath;

        if(file) {
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
            imagePath = `${basePath}${fileName}`
        } else {
            imagePath = product.image;
        }
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                image: imagePath,
                description: req.body.description,
                richDescription: req.body.richDescription,
                brand: req.body.brand,
                price: req.body.price,
                category: req.body.category,
                countInStock: req.body.countInStock,
                rating: req.body.rating,
                numReviews: req.body.numReviews,
                isFeatured: req.body.isFeatured,
            },
            {new: true})

        if(!updatedProduct) return res.status(500)
            .send("product can't be updated")

        res.send(updatedProduct)
    } catch(err) {
        res.status(400).json({
            success: false,
            message: "product_id is invalid"
        })
    }
})

//Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndRemove(req.params.id);


        if(!product) {
            return res.status(400).json({
                success: false,
                message: "product_id is invalid"
            })
        } else {
            return res.status(200).json({
                message: "Product deleted successfully"
            })
        }
    } catch(err) {

        res.status(400).json({
            message: "Enter valid product-id"
        })

    }
})

//get products count
router.get('/get/count', async (req, res) => {
    const productsCount = await Product.countDocuments()

    if(!productsCount) {
        res.status(500).json({success: false})
    }
    res.send({
        productCounts: productsCount
    });
});

//upload gallery-images for Product ID
router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    try{
        if(!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product Id"
            })
        }
        const product = await Product.findById(req.params.id);
        if(!product) return res.status(400).send({
            success: false,
            message: "Invalid Product"
        })
        const files = req.files;
        let imagesPaths = product.images;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        if(files) {
            files.map(file => {
                imagesPaths.push(`${basePath}${file.filename}`)
            })
        }
        const images = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            {new: true}
        );
        res.send(images);
    } catch(err) {
        res.status(500).json({
            success: false,
            message: err
        })
    }
})

//Get featured products
router.get('/get/featured/:count', async (req, res) => {
    try {
        const count = req.params.count ? req.params.count : 0;
        const products = await Product.find({isFeatured: true}).limit(+count);
        res.send(products)
    } catch {
        res.status(500).json({
            success: false
        })
    }
})



module.exports = router;