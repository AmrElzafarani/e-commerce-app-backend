const express = require("express");
const { Brand } = require("../models/brand");
const router = express.Router();

//Get All Brands
router.get("/", async (req, res) => {
  try {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const BrandsList = await Brand.find()
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
      const brandsCount = await Brand.count();
      res.json({
        success: true,
        message: BrandsList,
        total: brandsCount,
      });
  } catch (err) {
    res.status(400).json({
        success: false,
        message: err,
      });
  }
});

//Create Brand
router.post("/", async (req, res) => {
   try {
    let brand = new Brand({
        name: req.body.name
    });
    material = await brand.save();
    res.json({
        success: true,
        message: brand
    })
   } catch (err) {
    res.status(400).json({
        success: false,
        message: "Brand cannot be created"
    })
   }
})

//Search By Brand Name
router.post("/searchByBrandName", async (req, res) => {
  const name = req.body.name;
  let search = await Brand.find({
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
