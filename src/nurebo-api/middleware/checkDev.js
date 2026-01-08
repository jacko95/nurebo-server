module.exports = async (req, res, next) => {
    // console.log(process.env.NODE_ENV)
    if(process.env.NODE_ENV === 'PROD') {
        return res.status(547).json({
            errors: [
                {
                    msg: "Invalid route"
                }
            ]
        });
    }
    else{
        next();
    }
}