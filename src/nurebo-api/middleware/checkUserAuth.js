const JWT = require("jsonwebtoken");
// const tok = require("../index");
const db = require("../database/dbconnection");

module.exports = async (req, res, next) => {
    // const token = req.headers.authorization;
    if(!req.headers.authorization){
        console.log("No token found")
        return res.status(401).json({
            errors: [
                {
                    msg: "No token found"
                }
            ]
        })
    }

    try{
        console.log('req.headers.authorization');
        console.log(req.headers.authorization);
        const decoded = JWT.verify(req.headers.authorization, process.env.JWT_KEY)
        // const decoded = JWT.verify(req.headers.authorization, global.JWT_KEY)
        console.log('decoded')
        console.log(decoded)

        const sql = `SELECT is_logout
                     FROM user_authentication
                     WHERE id = ?`;
        db.query(sql, [decoded.id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            try {
                console.log('checkAuth')
                console.log('result')
                console.log(result)
                console.log('result[0]')
                console.log(result[0])
                console.log('result[0].is_logout')
                console.log(result[0].is_logout)
                // console.log(result)
                // console.log(result[0]['categoryId'])
                // res.send(result);

                if (result[0].is_logout === 0) {
                    req.decoded = decoded;
                    next()
                } else {
                    console.log("Expired Token")
                    // res.status(401).send(result);
                    res.status(401).json({
                        errors: [
                            {
                                msg: "Expired Token"
                            }
                        ]
                    });
                    // return next();
                }
            } catch(error) {
                console.log(error)
                console.log("Error on logout")
                return res.status(500).json({
                    errors: [
                        {
                            msg: "Error on logout"
                        }
                    ]
                })
                // /*return*/ res.status(401).end(
                // // /*return */res.status(401).send(
                //     'Autenticazione fallita: token non valido'
                // )
                // next()
            }
        });


        // req.decoded = decoded;
        // next()
    } catch(error){
        console.log(error)
        console.log("Invalid token")
        return res.status(401).json({
            errors: [
                {
                    msg: "Invalid token"
                }
            ]
        })
        // /*return*/ res.status(401).end(
        // // /*return */res.status(401).send(
        //     'Autenticazione fallita: token non valido'
        // )
        // next()
    }

    // const token = req.header('x-auth-token')
    //
    // // CHECK IF WE EVEN HAVE A TOKEN
    // if(!token){
    //     res.status(401).json({
    //         errors: [
    //             {
    //                 msg: "No token found"
    //             }
    //         ]
    //     })
    // }
    //
    // try {
    //     const user = await jwt.verify(token, "nfb32iur32ibfqfvi3vf932bg932g932")
    //     req.user = user.email
    //     next()
    // } catch (error) {
    //     res.status(400).json({
    //         errors: [
    //             {
    //                 msg: 'Invalid Token'
    //             }
    //         ]
    //     })
    // }
}