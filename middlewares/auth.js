const jsonwebtoken = require('jsonwebtoken');

//  const authToken = (user) => {
//     return jsonwebtoken.sign(user, process.env.TOKEN_SECRET)
// }

const checkAuthHeader = ( req, res, next) => {
    if(!req.headers.authorization) {
        res.status(401);
        res.json({
            success: false,
            message: "No token provided!"
        });

        return false;
    }
    try {
        const token = req.headers.authorization.split(" ")[1];
        jsonwebtoken.verify(token, process.env.TOKEN_SECRET)
        next()
    } catch(err) {
        res.status(401);
        res.json({
            success: false,
            message: "Invalid Token"
        })

        return false;
    }
}

module.exports = checkAuthHeader;


