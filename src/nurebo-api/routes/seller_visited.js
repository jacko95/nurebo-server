const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
// const io = require("../index");
const AWS = require('aws-sdk');
const qr = require("qrcode");
const checkBusinessAuth = require("../middleware/checkBusinessAuth");
const checkBusiness = require("../middleware/checkBusiness");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'eu-central-1',
    signatureVersion: 'v4',
});

const rekognition = new AWS.Rekognition({
    region: 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

const storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, '')
    }
})

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         //console.log(req);
//         //TODO: CREARE (SE NON ESISTE GIà) UNA CARTELLA CON L'ID DELL UTENTE
//         //OGNI VOLTA CHE SI POSTA UN POST ED IL NOME DELL'IMMAGINE DOVREBBE
//         //ESSERE L'ID DEL POST
//         // cb(null, `./posts/${userId}/`);
//         // cb(null, `./event_images/`);
//         // cb(null, '')
//     },
//     // filename: function(req, file, cb) {
//     //     cb(null, file.originalname);
//     //     // cb(null, uuidv4() + file.originalname);
//     // },
// });

//only allow png or jpg file
const fileFilter = (req, file, cb) => {
    // reject a file
    // if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    //     cb(null, true);
    // } else {
    //     // cb(null, false);
    //     cb(new Error('File format not allowed'), false);
    // }
};

// //only allow file up to 5 MB
// const upload = multer({
//     storage: storage,
//     // limits: {
//     //     fileSize: 1024 * 1024 * 5
//     // },
//     fileFilter: fileFilter
// });

const upload = multer({
    storage
    // storage: storage,
    // fileFilter: fileFilter
}).single('image')


// ================================= GET ALL DATES ================================
Router.get('/', (req, res) => {
        const sql = `SELECT * 
                         FROM seller_visited
                         WHERE is_valid = 1
                         ORDER BY created_at DESC`;
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err);
                console.log(err);
            }
            console.log(result);
            res.json(result);
        })
    // }
});

// ================================= GET A DATES BY ID ================================
Router.post("/id", (req, res) => {
    let id = req.body.id;
    //console.log(id);

    const sql = `SELECT * FROM prestazione WHERE id = '${id}'`;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        // res.redirect('/category');
        res.json(result);
    });
});

// ================================= SEARCH A SINGLE EVENT ================================
Router.post("/search", (req, res) => {
    let title = req.body.title;
    //console.log(title);

    const sql = `SELECT * 
                    FROM seller_visited
                    WHERE name LIKE '%${title}%' OR address LIKE '%${title}%'`;
    // const sql = `SELECT *
    //                 FROM event
    // JOIN event_business ON event_business.id = event.event_business_id
    //                 WHERE title LIKE '%${name}%' OR title LIKE '%${name}%'`;

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        if (result != null) {
            //console.log(result);
            // res.redirect('/category');
            res.json(result);
        }
    });
});

// Router.post("/insert", upload, (req, res) => {
//
//     let businessId = req.body.business_id;
//     let price = req.body.price;
//     let title = req.body.title;
//     let description = req.body.description;
//     let duration = req.body.duration;
//     let id = uuidv4();
//
//     console.log(req.file)
//
//     let myFile = req.file.originalname.split(".")
//     const fileType = myFile[myFile.length - 1]
//
//     // res.send({
//     //     message: "Hello World!"
//     // })
//
//     const params = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         // Key: `${uuid()}.${fileType}`,
//         Key: `image/prestazione/${uuidv4()}.${fileType}`,
//         Body: req.file.buffer
//     }
//
//     s3.upload(
//         params,
//         (error, data) => {
//             if(error){
//                 console.log(error)
//                 res.status(500).send(error)
//             }
//             console.log(data);
//
//             const sql = `INSERT INTO prestazione(id, business_id, description, image, price, duration, title, is_valid, created_at)
//              VALUES(?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
//             db.query(sql, [id, businessId, description, data['Location'], price, duration, title, 1], (err, result) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//
//                 // res.status(200).send(data)
//                 res.status(200).send(
//                     JSON.stringify({
//                         'id': id,
//                         'image': data['Location'],
//                         'business_id': businessId,
//                         'description': description,
//                         'price': parseFloat(price),
//                         'duration': parseInt(duration),
//                         'title': title,
//                         'is_valid': 1,
//                         'previous': ''
//                     })
//                 );
//             });
//         }
//     );
//
// });

Router.post("/", /*checkBusinessAuth,*/ /*checkBusiness,*/(req, res, next) => {
    let name = req.body.name;
    let address = req.body.address;
    let report = req.body.report;
    let email = req.body.email;
    let phone = req.body.phone;
    let id = uuidv4();

    const sql = `INSERT INTO seller_visited(id, report, name, email, phone, address, is_valid, created_at)
             VALUES(?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
    db.query(sql, [id, report, name, email, phone, address, 1], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }

        res.json(result);
    });

});

Router.put("/", /*checkBusinessAuth,*/ /*checkBusiness,*/ /*upload,*/ (req, res) => {
    // let prestazioneId = req.body.prestazione_id;
    // let businessId = req.body.business_id;
    // let price = req.body.price;
    // let title = req.body.title;
    // let image = req.body.image;
    // let description = req.body.description;
    // let duration = req.body.duration;

    let reportId = req.body.id;
    let name = req.body.name;
    let address = req.body.address;
    let report = req.body.report;
    let email = req.body.email;
    let phone = req.body.phone;

    //console.log(price);
    // price = parseFloat(price.toString());
    // //console.log(price);

    const sql0 = `UPDATE seller_visited SET is_valid = ?
                    WHERE id = ?`;
    db.query(sql0, [0, reportId], (err, result0) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }

        let id = uuidv4();

        const sql = `INSERT INTO seller_visited(id, report, name, email, phone, address, previous, is_valid, created_at)
             VALUES(?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
        db.query(sql, [id, report, name, email, phone, address, id, 1], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // res.status(200).send(data)
            // res.status(200).send(
            //     JSON.stringify({
            //         'id': id,
            //         'image': image,
            //         'business_id': businessId,
            //         'description': description,
            //         'price': parseFloat(price),
            //         'duration': parseInt(duration),
            //         'title': title,
            //         'is_valid': 1,
            //         'previous': ''
            //     })
            // );
            res.status(200).json(result);
        });

    });
});


module.exports = Router;