const express = require("express");
const { Supplier } = require("../models/supplier");
const router = express.Router();


//Get All Suppliers
router.get("/", async (req, res) => {
    try {
        const pageSize = +req.query.pagesize;
        const currentPage = +req.query.page;
        const suppliersList = await Supplier.find()
          .skip(pageSize * (currentPage - 1))
          .limit(pageSize);
          const suppliersCount = await Supplier.count();
          res.json({
            success: true,
            message: suppliersList,
            total: suppliersCount,
          });
    } catch(err) {
        res.status(400).json({
            success: false,
            message: err,
          });
    }
});

//Create Supplier
router.post("/", async (req, res) => {
    try {
     let supplier = new Supplier({
         name: req.body.name,
         phone: req.body.phone,
         address: req.body.address
     });
     supplier = await supplier.save();
     res.json({
         success: true,
         message: supplier
     })
    } catch (err) {
     res.status(400).json({
         success: false,
         message: err
     })
    }
 })

 //Search By Supplier Name
router.post("/searchBySupplierName", async (req, res) => {
  const name = req.body.name;
  let search = await Supplier.find({
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

