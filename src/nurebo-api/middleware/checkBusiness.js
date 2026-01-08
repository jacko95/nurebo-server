const db = require("../database/dbconnection");

module.exports = async (req, res, next) => {
    // console.log(req);
    console.log(req.body);
    console.log(req.decoded);
    console.log(req.decoded.id);

    const sql = `SELECT business_id FROM business_authentication WHERE id = ?`;

    db.query(sql, [req.decoded.id], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        console.log('checkBusiness')
        console.log(result)
        console.log(result[0].business_id)
        // console.log(result[0]['categoryId'])
        // res.send(result);

        if(result[0].business_id === req.body.business_id || result[0].business_id === req.params.business_id)
            next();
        else{
            // res.status(401).send(result);
            console.log("Invalid business")
            res.status(401).json({
                errors: [
                    {
                        msg: "Invalid business"
                    }
                ]
            });
            // return next();
        }
    });

    // next();
}