const express = require("express");
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const { Material } = require("../models/material");
const { Brand } = require("../models/brand");
const { Supplier } = require("../models/supplier");

const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});
const uploadOptions = multer({ storage: storage });

//Get all products and products by categoryId
// localhost:3000/products?categories=category-id

router.get("/", async (req, res) => {
  // let filterProductsByCat = {};
  // let filteredByBrand = {};
  // const query = {};

  try {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;

    let categoriesId = {};
    let brandsId = {};

    if (req.query.categories) {
      categoriesId = { category: req.query.categories.split(",") };
    }

    if (req.query.brands) {
      brandsId = { brand: req.query.brands.split(",") };
    }

    const productList = await Product.find({
      $and: [brandsId, categoriesId],
    })
      .populate("category")
      .populate("material")
      .populate("brand")
      .populate("supplier")
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
    const productsCount = await Product.find({
      $and: [brandsId, categoriesId],
    }).count();
    return res.json({
      success: true,
      message: productList,
      total: productsCount,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err,
    });
  }
});

//Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const productId = await Product.findById(req.params.id)
      .populate("category")
      .populate("material")
      .populate("brand")
      .populate("supplier");
    res.send(productId);
  } catch {
    return res.status(404).json({
      success: false,
      message: "product-id is incorrect",
    });
  }
});

//Create product
router.post(
  "/create-product",
  uploadOptions.single("image"),
  async (req, res) => {
    try {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Invalid Category",
        });
      }

      const material = await Material.findById(req.body.material);
      if (!material) {
        return res.status(400).json({
          success: false,
          message: "Invalid Material",
        });
      }

      const brand = await Brand.findById(req.body.brand);
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: "Invalid Brand",
        });
      }

      const supplier = await Supplier.findById(req.body.supplier);
      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: "Invalid upplier",
        });
      }

      const file = req.file;
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Please upload image",
        });
      }

      const newProduct = new Product({
        name: req.body.name,
        image: `${basePath}${fileName}`,
        description: req.body.description,
        richDescription: req.body.richDescription,
        price: req.body.price,
        isFeatured: req.body.isFeatured,
        countInStock: req.body.countInStock,
        category: req.body.category,
        brand: req.body.brand,
        supplier: req.body.supplier,
        material: req.body.material,
      });
      if (!newProduct)
        return res.status(400).json({
          success: false,
          message: "Some fields are missing",
        });
      const createdProduct = await newProduct.save();

      return res.json({
        success: true,
        message: createdProduct,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err,
      });
    }
  }
);

//Update product by ID
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    // const category = await Category.findById(req.body.category);
    // if (!category)
    //   return res.status(400).send({
    //     success: false,
    //     message: "Invalid Category",
    //   });

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(400).send({
        success: false,
        message: "Invalid Product",
      });

    const file = req.file;
    let imagePath;

    if (file) {
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      imagePath = `${basePath}${fileName}`;
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
      { new: true }
    );

    if (!updatedProduct)
      return res.status(500).send("product can't be updated");

    res.send(updatedProduct);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "product_id is invalid",
    });
  }
});

//Delete product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndRemove(req.params.id);

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "product_id is invalid",
      });
    } else {
      return res.status(200).json({
        message: "Product deleted successfully",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: "Enter valid product-id",
    });
  }
});

//get products count
router.get("/get/count", async (req, res) => {
  const productsCount = await Product.countDocuments();

  if (!productsCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    productCounts: productsCount,
  });
});

//upload gallery-images for Product ID
router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Product Id",
        });
      }
      const product = await Product.findById(req.params.id);
      if (!product)
        return res.status(400).send({
          success: false,
          message: "Invalid Product",
        });
      const files = req.files;
      console.log(`files: ${files}`);

      let imagesPaths = product.images;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      if (files) {
        files.map((file) => {
          console.log("FileName" + file.filename);

          imagesPaths.push(`${basePath}${file.filename}`);
          console.log(`path: ${imagesPaths}`);
        });
      }
      const images = await Product.findByIdAndUpdate(
        req.params.id,
        {
          images: imagesPaths,
        },
        { new: true }
      );
      res.send(images);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err,
      });
    }
  }
);

//Get featured products
router.get("/get/featured/:count", async (req, res) => {
  try {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({ isFeatured: true }).limit(+count);
    res.send(products);
  } catch {
    res.status(500).json({
      success: false,
    });
  }
});

//Search By Product Name
router.post("/searchByProductName", async (req, res) => {
  const name = req.body.name;
  let search = await Product.find({
    name: {
      $regex: new RegExp("^" + name + ".*", "i"),
    },
  }).exec();
  res.json({
    success: true,
    message: search,
  });
});

//Two params ProductName, Category

module.exports = router;
