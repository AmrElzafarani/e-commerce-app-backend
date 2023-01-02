const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Get All Users
router.get("/", async (req, res) => {
  try {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const users = await User.find()
      .select("-passwordHash")
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
    const usersCount = await User.count();
    res.json({
      success: true,
      message: users,
      total: usersCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error,
    });
  }
});

//Create new user
router.post("/create-user", async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    });

    const existUser = await User.findOne({ email: req.body.email });
    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "Email is Exist",
      });
    }

    const createdUser = await user.save();
    return res.send(createdUser);
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "the user cannot be created!",
    });
  }
});

//Get User by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    res.status(200).json(user);
  } catch {
    res.status(400).json({
      success: false,
      message: "Invalid user_id",
    });
  }
});

//Update user
router.put("/:id", async (req, res) => {
  try {
    //update user with/without password
    const userExist = await User.findById(req.params.id);
    let newPassword = {};
    if (req.body.password) {
      newPassword = bcrypt.hashSync(req.body.password, 10);
    } else {
      newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        passwordHash: newPassword,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
      },
      { new: true }
    );
    res.status(200).send(user);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "can't update user",
    });
  }
});

//Login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "The user not found",
      });
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          //to check user isAdmin
          isAdmin: user.isAdmin,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      console.log(token);
      res.status(200).json({
        token: token,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "password is wrong",
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Enter required data",
    });
  }
});

//get count of users
router.get("/get/count", async (req, res) => {
  const userCount = await User.count();

  if (!userCount) {
    res.status(500).json({
      success: false,
    });
  }
  res.send({
    userCount: userCount,
  });
});

module.exports = router;
