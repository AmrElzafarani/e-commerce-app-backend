const express = require("express");
const { BannerImage } = require("../models/banner-image");
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

//Get Banner Image
router.get('/image/:count', async (req, res) => {
  try {
    const count = req.params.count ? req.params.count : 0;
    const bannerImage = await BannerImage.find().limit(+count);
    res.send(bannerImage)
  }catch (err) {
    res.status(400).json({
      message: err
    })
  }
})

//upload Banner image for home Page
router.post(
  "/",
  uploadOptions.single("images"),
  async (req, res) => {
    try {
      const file = req.file;
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Please upload image",
        });
      }

      let bannerImage = new BannerImage({
        image: `${basePath}${fileName}`,
      });
      bannerImage = await bannerImage.save();
      res.json({
        success: true,
        message: bannerImage,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err,
      });
    }
  }
);

module.exports = router;
