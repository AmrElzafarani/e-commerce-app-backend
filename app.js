const express = require('express');
const app = express();
const cors = require('cors')
const morgan = require('morgan');
const mongoose = require('mongoose');
const authJwt = require("./middlewares/auth");

require("dotenv/config");

// const api = process.env.API_URL;

const corsOption = {
    optionsSuccessStatus: 200
};


const productsRouter = require('./routers/products');
const usersRouter = require('./routers/users');
const categoriesRouter = require('./routers/categories');
const ordersRouter = require('./routers/orders');


//Middleware
app.use(cors(corsOption));
app.use(express.json());
app.use(morgan('tiny'));
// app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))

//Routers
app.use(`/products`, productsRouter);
app.use(`/users`, usersRouter);
app.use(`/categories`, categoriesRouter);
app.use(`/orders`, ordersRouter);



//Database
mongoose
    .connect(process.env.CONNECTION_STRING,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: process.env.DB_NAME,
        })
    .then(() => {
        console.log("Database Connection is ready...");
    })
    .catch((err) => {
        console.log(err);
    });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("server running")
})