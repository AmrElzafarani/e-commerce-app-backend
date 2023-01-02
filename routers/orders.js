const express = require("express");
const { Order } = require("../models/order");
const { Product } = require("../models/product");
const { OrderItem } = require("../models/order-item");
const stripe = require("stripe")(
  "sk_test_51L1vfBKyFUqEluimuqNjUssq2OYxAAL1y0IWwhutfiRnhYkpr6fxDKfqYdpiCeupGDQYqWuBaApo1V3TgyQEQlNy00ZFKrBpyQ"
);
const router = express.Router();

//Get All orders
router.get("/", async (req, res) => {
  try {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const ordersList = await Order.find()
      .populate("user", "name")
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
    const ordersCount = await Order.count();
    res.json({
      success: true,
      message: ordersList,
      total: ordersCount,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err,
    });
  }
});

//Get order by id
router.get("/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderById = await Order.findById(orderId)
      .populate("user", "name")
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          populate: {
            path: "category",
          },
        },
      });

    res.send(orderById);
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err,
    });
  }
});

//Create order
router.post("/", async (req, res) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemsIds;

  //Calculate totalPrice of order
  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );
  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);
  console.log(totalPrice);
  console.log(totalPrices);

  try {
    const order = new Order({
      orderItems: orderItemsIdsResolved,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      totalPrice: totalPrice,
      user: req.body.user,
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "The order can't be created",
      });
    }
    const createdOrder = await order.save();

    res.send(createdOrder);
  } catch (error) {
    return res.status(400).send(error);
  }
});

// Create checkout session for payment
router.post("/create-checkout-session", async (req, res) => {
  try {
    const orderItems = req.body;

    if (!orderItems) {
      return res.status(400).send("checkout session cannot created");
    }
    const lineItems = await Promise.all(
      orderItems.map(async (orderItem) => {
        const product = await Product.findById(orderItem.product);
        return {
          price_data: {
            currency: "egp",
            product_data: {
              name: product.name,
            },
            unit_amount: product.price * 100,
          },
          quantity: orderItem.quantity,
        };
      })
    );
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:4200/success",
      cancel_url: "http://localhost:4200/error",
    });
    res.json({ id: session.id });
  } catch (err) {
    return res.status(400).send(err);
  }
});

//Update order status
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      { new: true }
    );

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "the order cannot be update!",
      });
    }
    res.send(order);
  } catch (err) {
    res.send({
      success: false,
      message: err,
    });
  }
});

// Delete order & orderItems
router.delete("/:id", (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndRemove(orderItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "the order is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "order not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

//get TotalPrice of all orders
router.get("/get/totalSales", async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalsales: { $sum: "$totalPrice" },
      },
    },
  ]);
  res.send({
    totalsales: totalSales.pop().totalsales,
  });
});

//get TotalPrice of all orders
router.get("/get/totalSaless/", async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalsales: { $sum: "$totalPrice" },
      },
    },
  ]);
  console.log(totalSales);
  res.send({
    totalsales: totalSales.pop().totalsales,
  });
});

//get count for all orders
router.get("/get/count", async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    res.send({
      orderCount: orderCount,
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

//orders count per month
router.get("/get/countss", async (req, res) => {
  try {
    // if(req.query.month) {
    //   // console.log(req.query.month)
    //   const orderCount = await Order.aggregate([
    //     {$addFields: { "month" : {$month: "$dateOrdered"}}},
    //     {$match: { month: req.query.month }}
    //   ])
    //   console.log(orderCount)
     
    // }

    const orderCount = await Order.aggregate([
      {$addFields: { "month" : {$month: "$dateOrdered"}}},
      {$match: { month: 12 }}
    ])
    console.log(orderCount)
    
  } catch (err) {

  }
})

router.get("/get/user/orders", async (req, res) => {
  try {
    if (req.query.user) {
      const userId = { user: req.query.user };
      console.log(userId);
      const userOrdersList = await Order.find(userId);

      const sale = [];
      userOrdersList.map((q) => {
        sale.push(q.totalPrice);
       
      });
      const total = sale.reduce((a, b) => a + b, 0);


      res.json({
        success: true,
        message: userOrdersList,
        totalPrice: total
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
