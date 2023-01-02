const express = require("express");
const { Material } = require("../models/material");
const router = express.Router();

//Get All Materials
router.get("/", async (req, res) => {
  try {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const materialsList = await Material.find()
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
      const materialsCount = await Material.count();
      res.json({
        success: true,
        message: materialsList,
        total: materialsCount,
      });
  } catch (err) {
    res.status(400).json({
        success: false,
        message: err,
      });
  }
});

//Create Material
router.post("/", async (req, res) => {
   try {
    let material = new Material({
        name: req.body.name
    });
    material = await material.save();
    res.json({
        success: true,
        message: material
    })
   } catch (err) {
    res.status(400).json({
        success: false,
        message: "Material cannot be created"
    })
   }
})

//Search By Material Name
router.post("/searchByMaterialName", async (req, res) => {
  const name = req.body.name;
  let search = await Material.find({
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
