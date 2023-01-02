const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();
const multer = require("multer");

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

//Get All Categories
router.get(`/`, async (req, res) => {
  try {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const categoryList = await Category.find()
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
    const categoriesCount = await Category.count();
    res.json({
      success: true,
      message: categoryList,
      total: categoriesCount,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err,
    });
  }
});

//Get Category by ID
router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);

  res.status(200).send(category);
});

//Update Category
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    let imagePath;

    if (file) {
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      imagePath = `${basePath}${fileName}`;
    } else {
      imagePath = product.image;
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
        image: imagePath,
      },
      { new: true }
    );
    res.send(category);
  } catch {
    res.status(400).send("The category cannot be created");
  }
});

//Create Category
router.post("/", uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Please upload image",
      });
    }
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    let category = new Category({
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
      image: `${basePath}${fileName}`,
    });
    category = await category.save();
    res.send(category);
  } catch (err) {
    res.status(400).send("category cannot be created");
  }
});

//Delete Category
router.delete("/:id", (req, res) => {
  Category.findByIdAndRemove(req.params.id)
    .then((category) => {
      if (category) {
        return res.status(200).json({
          success: true,
          message: "The category is deleted",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        error: err,
      });
    });
});

//Search By category Name
router.post("/searchByCategoryName", async (req, res) => {
  const name = req.body.name;
  let search = await Category.find({
    name: {
      $regex: new RegExp("^" + name + ".*", "i"),
    },
  }).exec();
  res.json({
    success: true,
    message: search,
  });
})

module.exports = router;
