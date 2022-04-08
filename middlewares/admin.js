// const expressJwt = require('express-jwt');
//
// function authJwt() {
//     const secret = process.env.TOKEN_SECRET;
//     const api = process.env.API_URL;
//     return expressJwt({
//         secret,
//         algorithms: ['HS256'],
//         isRevoked: isRevoked
//     })
// }
//
// async function isRevoked(req, payload, done) {
//     if(!payload.isAdmin) {
//         done(null, true)
//     }
//
//     done();
// }
//
//
//
// module.exports = authJwt



// const verifyAdmin = (req, res, next) => {
//     if(req.decode.isAdmin) {
//         return next();
//     } else {
//         return next("err")
//     }
// };
//
// module.exports = verifyAdmin;


// const vAdmin = (req, res, next) => {
//     if(req.headers.isAdmin) {
//         return next();
//     } else {
//         return next("err")
//     }
// }
//
// module.exports = vAdmin;

