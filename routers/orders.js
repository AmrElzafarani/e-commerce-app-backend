const express = require('express');
const {Order} = require("../models/order");
const {OrderItem} = require("../models/order-item");
const router = express.Router();


//Get All orders
router.get('/', async (req, res) => {
    try {
        const ordersList = await Order.find().populate('user', 'name');

        if (!ordersList) {
            res.status(500).json({
                success: false,
                message: "Can't get orders"
            })
        }

        res.send(ordersList)

    } catch (err) {
        res.status(400).send("err")
    }
})

//Get order by id
router.get('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderById = await Order.findById(orderId)
            .populate('user', 'name')
            .populate({
                path: 'orderItems',
                populate:  {path: 'product',
                    populate: {
                    path: 'category'
                    }}
            })

        res.send(orderById)
    } catch (err) {
        return res.status(404).json({
            success: false,
            message: err
        })
    }
})

//Create order
router.post('/', async (req, res) => {

    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))

    const orderItemsIdsResolved = await orderItemsIds;
    console.log(` orders : ${orderItemsIdsResolved}`)

    //Calculate totalPrice of order
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))
    const totalPrice = totalPrices.reduce((a,b) => a +b , 0);
    console.log(totalPrice)

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
        })

        if (!order) {
            return res.status(400).json({
                success: false,
                message: "The order can't be created"
            })
        }
        const createdOrder = await order.save();

        res.send(createdOrder);
    } catch (error) {
        return res.status(400).send(error);

    }
})

//Update order status
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id,
            {
                status: req.body.status
            },
            {new: true}
        )

        if (!order) {
            return res.status(400).json({
                success: false,
                message: "the order cannot be update!"
            })
        }
        res.send(order)
    } catch (err) {
        res.send({
            success: false,
            message: err
        })
    }
})

// Delete order & orderItems
router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false, message: "order not found!"})
        }
    }).catch(err => {
        return res.status(500).json({success: false, error: err})
    })
})

//get TotalPrice of all orders
router.get('/get/totalSales', async (req, res) => {
const totalSales = await Order.aggregate([
    {
        $group: {
            _id: null,
            totalsales: {$sum: '$totalPrice'}
        }
    }
])
    res.send({
        totalsales: totalSales.pop().totalsales
    })
})

//get count for all orders
router.get('/get/count', async (req, res) => {
    try {
        const orderCount = await Order.countDocuments();
        res.send({
            orderCount: orderCount
        })
    } catch(err) {
        res.status(400).send(err)
    }

})



// get user orders
router.get('/get/userorders/:userid', async (req, res) => {
    try {
        const userOrdersList = await Order.find({
            user: req.params.userid
        }).populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category'
            }
        }).sort({'dateOrdered': -1})

        res.send(userOrdersList)
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err
        })
    }
})

// router.get('/get/count/:id', async (req, res) => {
//     try {
//         const userId = req.params.userid;
//
//         const orderCount = await Order.findById(userId).countDocuments();
//         res.send({
//             orderCount: orderCount
//         })
//     } catch(err) {
//         res.status(400).send(err)
//     }
//
// })



module.exports = router;