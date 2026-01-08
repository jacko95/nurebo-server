const db = require("../database/dbconnection");
// const multer = require('multer');
// var upload = multer();


module.exports = async (req, res, next) => {
    // console.log(req);
    console.log(req.body);
    // console.log(upload.array());
    // console.log(req.fieldname);
    console.log(req.decoded);
    console.log(req.decoded.id);

    const sql = `SELECT user_id FROM user_authentication WHERE id = ?`;
    db.query(sql, [req.decoded.id], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        console.log('checkUser')
        console.log(result)
        console.log(result[0].user_id)
        // console.log(result[0]['categoryId'])
        // res.send(result);

        if(result[0].user_id === req.body.user_id || result[0].user_id === req.params.user_id) {
            next();
        }
        else{
            // res.status(401).send(result);
            console.log("Invalid user")
            res.status(401).json({
                errors: [
                    {
                        msg: "Invalid user"
                    }
                ]
            });
            // return next();
        }
    });

    // next();
}