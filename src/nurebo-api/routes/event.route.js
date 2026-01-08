const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
// const welcome_email = require("../template/email/welcome_email.html");
const { v4: uuidv4 } = require('uuid');
const JWT = require('jsonwebtoken')
const nodemailer = require('nodemailer');
const axios = require('axios');
const socket = require('../index'); //import socket  from app.js
// const request = require('request');
const fs = require("fs");
const multer = require('multer');
const checkUserAuth = require("../middleware/checkUserAuth");
const checkUser = require("../middleware/checkUser");
const checkDev = require("../middleware/checkDev");
const AWS = require('aws-sdk');
const qr = require("qrcode");
const formData = require('form-data');
const sharp = require('sharp');

const userController = require('../controllers/user.controller');

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


// Router.get('/', (req, res) => {
Router.get("/", /*checkDev,*/ (req, res) => {
    try {
        const appVersionName = req.headers['x-app-version-name'];
        const appVersionNumber = parseInt(req.headers['x-app-version-number']);
        console.log('appVersion')
        console.log(appVersionName)
        console.log('appVersionNumber')
        console.log(appVersionNumber)

        // if (appVersionName === '2.0.1'){
        if (appVersionNumber < 226){
            res.status(459).send(`${appVersionNumber+15}`);
        }
        else /*if (appVersion === '1.0')*/{
            const sql = `SELECT event.title AS event_title, 
                    event.id AS event_id, event.description AS event_description,
                    event.begin_at AS event_begin_at, event.end_at AS event_end_at, 
                    event.is_valid AS event_is_valid, event.image AS event_image,
                    event.created_at AS event_created_at,
                    
                    business.profile_image AS business_profile_image, business.description AS business_description, 
                    business.email AS business_email, /*business.email_notification AS business_email_notification,*/
                    business.max_contemporary_appointments, business.category_id AS business_category_id, 
                    business.phone AS business_phone, business.name AS business_name, business.id AS business_id, 
                    business.address AS business_address, business.type_id AS business_type_id,
                    business.longitude AS business_longitude, business.latitude AS business_latitude

                FROM event
                JOIN business ON business.id = event.business_id
                WHERE business.is_visible = 1`;
            db.query(sql, (err, rows) => {
                //console.log(rows);
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                res.json(rows);
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/id", (req, res) => {
Router.get("/:id", /*checkDev,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM event WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            // res.redirect('/category');
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.get("/recommended", /*checkDev,*/ (req, res) => {
//     // let eventBusinessId = req.body.business_id;
//     // //console.log(eventBusinessId);
//
//     // const sql = `SELECT * FROM event WHERE business_id = '${eventBusinessId}' AND is_visible = 1`;
//     const sql = `SELECT recommended_event.id AS recommended_id, recommended_event.created_at AS recommended_created_at,
//
//             max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//             business.name AS business_name, business.id AS business_id, business.address AS business_address,
//             /*business.email_notification AS business_email_notification,*/
//             business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//             business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
//
//             category.id AS category_id, category.name AS category_name, category.image AS category_image,
//
//             event.price AS event_price,
//             event.duration AS event_duration, event.description AS event_description,
//             event.created_at AS event_created_at,
//             event.image AS event_image, event.id AS event_id, event.title AS event_title
//
//                     FROM recommended_event
//                     JOIN event ON recommended_event.event_id = event.id
//                     JOIN business ON event.business_id = business.id
//                     JOIN category ON business.category_id = category.id
//                     WHERE event.is_valid = 1 AND recommended_event.is_active = 1`;
//     db/*.promise()*/.query(sql, (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

// Router.post("/search", (req, res) => {
Router.post("/search", (req, res) => {
    try {
        let title = req.body.title;

        const sql = `SELECT * 
                    FROM event
                    JOIN business ON event.business_id = business.id
                    WHERE title LIKE '%?%' OR business.name LIKE '%?%' AND is_visible = 1`;
        // const sql = `SELECT *
        //                 FROM event
        // JOIN event_business ON event_business.id = event.event_business_id
        //                 WHERE title LIKE '%${name}%' OR title LIKE '%${name}%'`;

        db.query(sql, [title, title], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (result != null) {
                //console.log(result);
                // res.redirect('/category');
                res.json(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
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

// Router.post("/upbooking", upload, (req, res) => {
//
//     let prestazioneId = req.body.prestazione_id;
//     let businessId = req.body.business_id;
//     let price = req.body.price;
//     let title = req.body.title;
//     let description = req.body.description;
//     let duration = req.body.duration;
//     var result;
//
//     //console.log(price);
//     // price = parseFloat(price.toString());
//     // //console.log(price);
//
//     const sql0 = `UPDATE prestazione SET is_valid = ?
//                     WHERE id = ?`;
//     db.query(sql0, [0, prestazioneId], (err, result0) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//
//         let id = uuidv4();
//
//
//
//         console.log(req.file)
//         let myFile = req.file.originalname.split(".")
//         const fileType = myFile[myFile.length - 1]
//
//         // res.send({
//         //     message: "Hello World!"
//         // })
//
//         const params = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             // Key: `${uuid()}.${fileType}`,
//             Key: `image/prestazione/${uuidv4()}.${fileType}`,
//             Body: req.file.buffer
//         }
//
//         s3.upload(
//             params,
//             (error, data) => {
//                 if (error) {
//                     console.log(error)
//                     res.status(500).send(error)
//                 }
//                 console.log(data);
//
//                 const sql1 = `INSERT INTO prestazione(id, image, business_id, description, price, duration, title, is_valid, previous, created_at)
//                  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
//
//                 db.query(sql1, [id, data['Location'], businessId, description, price, duration, title, 1, prestazioneId], (err, result1) => {
//                     if (err) {
//                         console.log(err)
//                         return res.status(500).send(err);
//                     }
//                     //UPDATE prestazione_recommended SET prestazione_id = 'd8611f51-3745-4fa2-8be7-9ac5ccfaff97' WHERE prestazione_id = 'scdvfb4dg8nbsdv4'
//
//                     const sql = `UPDATE prestazione_recommended SET prestazione_id = ? WHERE prestazione_id = ?`;
//                     db.query(sql, [id, prestazioneId], (err, result2) => {
//                         if (err) {
//                             console.log(err)
//                             return res.status(500).send(err);
//                         }
//                         //UPDATE prestazione_recommended SET prestazione_id = 'd8611f51-3745-4fa2-8be7-9ac5ccfaff97' WHERE prestazione_id = 'scdvfb4dg8nbsdv4'
//
//
//                         // res.json(result1);
//                         // res.json({
//                         //     id,
//                         //     'image': "",
//                         //     'business_id': businessId,
//                         //     description,
//                         //     'price': parseFloat(price),
//                         //     'duration': parseInt(duration),
//                         //     title,
//                         //     'is_valid': 1,
//                         //     'previous': prestazioneId
//                         // });
//
//                         res.status(200).send(
//                             JSON.stringify({
//                                 id,
//                                 'image': data['Location'],
//                                 'business_id': businessId,
//                                 description,
//                                 'price': parseFloat(price),
//                                 'duration': parseInt(duration),
//                                 'title': title,
//                                 'is_valid': 1,
//                                 'previous': prestazioneId
//                             })
//                         );
//                         // result = result1;
//                     });
//
//                     // res.json(result1);
//                     // res.json({
//                     //     id,
//                     //     'image': "",
//                     //     'business_id': businessId,
//                     //     description,
//                     //     'price': parseFloat(price),
//                     //     'duration': parseInt(duration),
//                     //     title,
//                     //     'is_valid': 1,
//                     //     'previous': prestazioneId
//                     // });
//                     // result = result1;
//                 });
//
//             }
//         );
//
//     });
// });

// Router.post("/delete", (req, res) => {
//
//     let prestazioneId = req.body.prestazione_id;
//
//     const sql = `DELETE FROM prestazione
//                     WHERE id = '${prestazioneId}'`;
//     db.query(sql, (err, result) => {
//         if (err) {
//             //console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });


// Router.get("/bestsellers", (req, res) => {
Router.get("/bestsellers", (req, res) => {
    try {
        // let title = req.body.title;
        //console.log(title);

        const sql = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        /*business.email_notification AS business_email_notification,*/
                        business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                        business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                        category.id AS category_id, category.name AS category_name, category.image AS category_image,

                        event.price AS event_price, event.created_at AS event_created_at,
                        event.duration AS event_duration, event.description AS event_description,
                        event.image AS event_image, event.id AS event_id, event.title AS event_title

                 FROM event
                          JOIN business ON event.business_id = business.id
                          JOIN category ON business.category_id = category.id
                 WHERE event.is_valid = 1 AND event.image != '' AND business.is_visible = 1
                 ORDER BY RAND()
                 LIMIT 10`;
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.get("/bestsellers", async (req, res) => {
//     // let title = req.body.title;
//     //console.log(title);
//     let array = [];
//     let bho = [];
//
//     const sql0 = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//                         business.name AS business_name, business.id AS business_id, business.address AS business_address,
//                         business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//                         business.latitude AS business_latitude, business.description AS business_description, business.business_type_id
//
//                  FROM business
//                  ORDER BY RAND()
//                  LIMIT 10`;
//
//     await db.query(sql0, async (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         // console.log(result);
//
//         // array.push(result)
//         array = result;
//
//         // await new Promise((resolve) => {
//         //     setTimeout(resolve, 500);
//         // });
//
//         array.forEach(async (each) => {
//         // for(let i = 0; i < array.length; i++) {
//             // console.log(array[i]['business_id']);
//
//             const sql1 = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//                                 business.name AS business_name, business.id AS business_id, business.address AS business_address,
//                                 business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//                                 business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
//
//                                 category.id AS category_id, category.name AS category_name, category.image AS category_image,
//
//                                 prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  prestazione.created_at AS prestazione_created_at,
//                                 prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
//                                 prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title
//
//                          FROM prestazione
//                                   JOIN business ON prestazione.business_id = business.id
//                                   JOIN category ON business.category_id = category.id
//                          WHERE is_valid = 1 AND business.id = ?
//                          ORDER BY RAND()
//                          LIMIT 10`;
//
//             // await db.query(sql1, [array[i]['business_id']], async (err, result) => {
//             await db.query(sql1, [each['business_id']], async (err, result) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//
//                 // await new Promise((resolve) => {
//                 //     setTimeout(resolve, 500);
//                 // });
//
//                 bho = result;
//                 // bho.push(result);
//
//                 // console.log(result)
//                 // console.log(bho)
//
//                 // res.json(result);
//                 // array[i]['prestazioni'] = result;
//                 // array[i]['prestazioni'] = 'result';
//                 each['prestazioni'] = 'result';
//             });
//
//             // array[i]['prestazionisss'] = 'ciccio';
//             // each['prestazionisss'] = 'ciccio';
//             each['prestazionisss'] = 'ciccio';
//             // array[i]['prestazionisss'] = bho;
//             // each['prestazionisss'] = bho;
//             // bho = [];
//         // }
//         });
//         console.log(array);
//
//         // res.json(result);
//
//         return res.json(array);
//     });
//     // res.json(array);
// });

// Router.get("/bestsellers", async (req, res) => {
//     // let title = req.body.title;
//     //console.log(title);
//     let array = [];
//     let bho = [];
//
//     const sql0 = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//                         business.name AS business_name, business.id AS business_id, business.address AS business_address,
//                         business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//                         business.latitude AS business_latitude, business.description AS business_description, business.business_type_id
//
//                  FROM business
//                  ORDER BY RAND()
//                  LIMIT 10`;
//
//     await db.query(sql0, /*async (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         // console.log(result);
//
//         // array.push(result)
//         array = result;
//
//         // await new Promise((resolve) => {
//         //     setTimeout(resolve, 500);
//         // });
//
//         array.forEach(async (each) => {
//         // for(let i = 0; i < array.length; i++) {
//             // console.log(array[i]['business_id']);
//
//             const sql1 = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//                                 business.name AS business_name, business.id AS business_id, business.address AS business_address,
//                                 business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//                                 business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
//
//                                 category.id AS category_id, category.name AS category_name, category.image AS category_image,
//
//                                 prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  prestazione.created_at AS prestazione_created_at,
//                                 prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
//                                 prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title
//
//                          FROM prestazione
//                                   JOIN business ON prestazione.business_id = business.id
//                                   JOIN category ON business.category_id = category.id
//                          WHERE is_valid = 1 AND business.id = ?
//                          ORDER BY RAND()
//                          LIMIT 10`;
//
//             // await db.query(sql1, [array[i]['business_id']], async (err, result) => {
//             await db.query(sql1, [each['business_id']], async (err, result) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//
//                 // await new Promise((resolve) => {
//                 //     setTimeout(resolve, 500);
//                 // });
//
//                 bho = result;
//                 // bho.push(result);
//
//                 // console.log(result)
//                 // console.log(bho)
//
//                 // res.json(result);
//                 // array[i]['prestazioni'] = result;
//                 // array[i]['prestazioni'] = 'result';
//                 each['prestazioni'] = 'result';
//             });
//
//             // array[i]['prestazionisss'] = 'ciccio';
//             // each['prestazionisss'] = 'ciccio';
//             each['prestazionisss'] = 'ciccio';
//             // array[i]['prestazionisss'] = bho;
//             // each['prestazionisss'] = bho;
//             // bho = [];
//         // }
//         });
//         console.log(array);
//
//         // res.json(result);
//
//         return res.json(array);
//     }*/).then( users => {
//         console.log('users')
//         console.log(users)
//     });
//     // res.json(array);
// });

// Router.get("/bestsellers", async (req, res) => {
//     // let title = req.body.title;
//     //console.log(title);
//     let array = [];
//     let bho = [];
//
//     const sql0 = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//                         business.name AS business_name, business.id AS business_id, business.address AS business_address,
//                         business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//                         business.latitude AS business_latitude, business.description AS business_description, business.business_type_id
//
//                  FROM business
//                  ORDER BY RAND()
//                  LIMIT 10`;
//
//     await db.query(sql0, async (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         // console.log(result);
//
//         // array.push(result)
//         array = result;
//
//         const queryResults = await Promise.all(
//             Object.keys(array).map(async (key) => {
//                 const state1 = key;
//                 const state2 = array[key];
//
//                 const sql_select = 'SELECT column1,column2 from database WHERE state = ? OR state=?';
//
//                 return new Promise((resolve, reject) =>
//                     db.query(sql_select,[state1,state2], (err, result) => {
//                         if (err)
//                             return reject(err)
//                         else
//                             return resolve(result)
//                     })
//                 )
//             })
//         )
//         console.log('queryResults', queryResults)
//
//         // array.forEach(async (each) => {
//         // array.forEach(async (data, cb) => {
//         // // for(let i = 0; i < array.length; i++) {
//         //     // console.log(array[i]['business_id']);
//         //
//         //     const sql1 = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//         //                         business.name AS business_name, business.id AS business_id, business.address AS business_address,
//         //                         business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//         //                         business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
//         //
//         //                         category.id AS category_id, category.name AS category_name, category.image AS category_image,
//         //
//         //                         prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  prestazione.created_at AS prestazione_created_at,
//         //                         prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
//         //                         prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title
//         //
//         //                  FROM prestazione
//         //                           JOIN business ON prestazione.business_id = business.id
//         //                           JOIN category ON business.category_id = category.id
//         //                  WHERE is_valid = 1 AND business.id = ?
//         //                  ORDER BY RAND()
//         //                  LIMIT 10`;
//         //
//         //     // await db.query(sql1, [array[i]['business_id']], async (err, result) => {
//         //     await db.query(sql1, [each['business_id']], async (err, result) => {
//         //         if (err) {
//         //             console.log(err)
//         //             return res.status(500).send(err);
//         //         }
//         //
//         //         // await new Promise((resolve) => {
//         //         //     setTimeout(resolve, 500);
//         //         // });
//         //
//         //         bho = result;
//         //         // bho.push(result);
//         //
//         //         // console.log(result)
//         //         // console.log(bho)
//         //
//         //         // res.json(result);
//         //         // array[i]['prestazioni'] = result;
//         //         // array[i]['prestazioni'] = 'result';
//         //         // each['prestazioni'] = 'result';
//         //         each['prestazioni'] = result;
//         //     });
//         //
//         //     // array[i]['prestazionisss'] = 'ciccio';
//         //     // each['prestazionisss'] = 'ciccio';
//         //     // array[i]['prestazionisss'] = bho;
//         //     each['prestazionisss'] = bho;
//         //     // bho = [];
//         // // }
//         // });
//
//         console.log(array);
//
//         // res.json(result);
//
//         return res.json(array);
//     });
//     // res.json(array);
// });

Router.post("/:event_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let eventId = req.body.event_id;
        let id = uuidv4();
        //console.log(userId);
        //console.log(postId);

        let sql1 = `SELECT *
                FROM event_favorite
                WHERE user_id = ? AND event_id = ?`;
        db.query(sql1, [userId, eventId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                //console.log(result);
                // res.redirect('/category');
                res.json(result);
            } else /*if (result.length === 0)*/{
                //console.log(result);
                let sql = `INSERT INTO event_favorite(id, user_id, event_id, created_at) 
                VALUES(?, ?, ?, ?)`;
                db.query(sql, [id, userId, eventId, new Date(Date.now()).toISOString()], (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    //console.log(result);
                    // res.redirect('/category');
                    res.json(result);
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:event_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let eventId = req.body.event_id;
        //console.log(userId);
        //console.log(postId);

        let sql = `DELETE FROM event_favorite 
                WHERE user_id = ? AND event_id = ?`;
        db.query(sql, [userId, eventId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(result.affectedRows);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:event_id/like", (req, res) => {
    try {
        let prestazioneId = req.body.event_id;
        // let postId = req.body.post_id;
        //console.log(businessPostId);
        // //console.log(postId);
        // SELECT *
        // FROM post_like
        // JOIN post ON post.id = post_like.post_id
        // WHERE post_like.user_id = ${userId}
        let sql = `SELECT DISTINCT *
                FROM event_favorite
                JOIN user ON event_favorite.user_id = user.id
                WHERE event_favorite.event_id = ?
                ORDER BY event_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [prestazioneId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // //console.log(result.length)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/reservation", /*checkDev,*/ (req, res) => {
    try {
        const sql = "SELECT * FROM event_reservation";
        db.query(sql, (err, rows) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(rows);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:id/ticket/:ticket_id/reservation", checkUserAuth, checkUser, async (req, res) => {
    try {
        let userId = req.body.user_id;
        let singleEventTicketCategoryId = req.body.event_ticket_id;
        let userOrderId = req.body.user_order_id;
        let isShared = req.body.is_shared;
        // let singleEventId = req.body.event_id;
        // let fullPrice = req.body.full_price;
        // let quantity = req.body.quantity;
        // let url = 'http://192.168.1.252/kadingira-server';
        // var qrDataURL;
        let id = uuidv4();
        console.log('userOrderId55')
        console.log(userOrderId)

        // //console.log(userId);
        // //console.log(singleEventTicketCategoryId);
        // //console.log(exhibitionId);
        // //console.log(fullPrice);
        // //console.log(quantity);

        // qr.toFile('qr_codes/' + singleEventTicketId + '.png', /*Date().toString()*/singleEventTicketId, {
        //     // qr.toFile(Date().toString() + '.png', Date().toString(), {
        //     errorCorrectionLevel: 'H',
        //     type: 'image/png',
        //     quality: 0.3,
        //     margin: 5,
        //     color: {
        //         // dark:"#010599FF",
        //         dark:"#2196F3",
        //         light:"#FFFFFF"
        //         // light:"#FFBF60FF"
        //     }
        // }, function (err) {
        //     if (err) {
        //         console.log(err);
        //         console.log(err)
        //     }
        //     //console.log('qr code png image created');
        //     let query = `INSERT INTO event_reservation(id, user_id, event_ticket_id, created_at, qr_code)
        //         VALUES('${singleEventTicketId}', '${userId}', ${singleEventTicketCategoryId}, UTC_TIMESTAMP(), '${url + '/qr_codes/' + singleEventTicketId + '.png'}')`;
        //     db.query(query, (err, result) => {
        //         if (err) {
        //             console.log(err);
        //             return res.status(500).send(err);
        //         }
        //         res.result;
        //     });
        // });

        // let qrString = await qr.toString(
        //     // let buffer = qr.toFile(
        //     // const buffer = await qr.toDataURL(
        //     // './src/qr_codes/' + id + '.png',
        //     id.toString(),
        //     {
        //         // type: 'utf8',
        //         // type: 'terminal',
        //         type: 'svg',
        //     },
        //     function (err) {
        //         // (err) => {
        //         if (err) {
        //             console.log(err);
        //             // console.log(err)
        //         }
        //
        //     }
        // );

        const buffer = await qr.toBuffer(
            // let buffer = qr.toFile(
            // const buffer = await qr.toDataURL(
            //     './src/qr_codes/' + id + '.png',
            id.toString(),
            id.toString(),
            {
                // qr.toFile(Date().toString() + '.png', Date().toString(), {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                // type: 'png',
                quality: 0.3,
                // quality: 0.9,
                margin: 5,
                color: {
                    // dark:"#010599FF",
                    dark: "#2196F3",
                    light: "#FFFFFF"
                    // light:"#FFBF60FF"
                }
            },
            function (err) {
                // (err) => {
                if (err) {
                    console.log(err);
                    // console.log(err)
                }
            }
        );

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            // Key: `${uuid()}.${fileType}`,
            // Key: `image/qrcode/${id}/${id}.png`,
            Key: `image/qrcode/${id}.png`,
            // Key: `image/qrcode/${id}`,
            Body: buffer
            // Body:
        }

        s3.upload(
            params,
            (error, data) => {
                if (error) {
                    console.log(error)
                    //
                    // const sql2 = `DELETE FROM prestazione WHERE id = ?`;
                    // db.query(sql2, [id],(err, result) => {
                    //     if (err) {
                    //         //console.log(err)
                    //         return res.status(500).send(err);
                    //     }
                    //     res.status(500);
                    // });

                    res.status(500).send(error)
                }
                console.log(data);

                let query = `INSERT INTO event_reservation(id, user_id, event_ticket_id, user_order_id, qr_code, is_shared, created_at)
                            VALUES(?, ?, ?, ?, ?, ?, ?)`;
                db.query(query, [id, userId, singleEventTicketCategoryId, userOrderId, data['Key'], isShared, new Date(Date.now()).toISOString()], async (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }

                    res.status(200).json(result);
                });
            }
        );

        // res.status(200);

        // /*var qrCodeString = */qr.toString(
        //     /*Date().toString()*/singleEventTicketId,
        //     {
        //     // qr.toFile(Date().toString() + '.png', Date().toString(), {
        //     errorCorrectionLevel: 'H',
        //     type: 'image/png',
        //     quality: 0.3,
        //     margin: 5,
        //     color: {
        //         // dark:"#010599FF",
        //         dark:"#2196F3",
        //         light:"#FFFFFF"
        //         // light:"#FFBF60FF"
        //     }
        // }, function (err) {
        //     if (err) {
        //         console.log(err);
        //         console.log(err)
        //     }
        //     //console.log('qr code string created');
        //     //console.log(qr);
        // })

        //TODO: FUNZIONA, MA IL SUBSTRING MEGLIO FARLO NEL CLIENT
        // qr.toDataURL(
        //     singleEventTicketId,
        //     {
        //         // qr.toFile(Date().toString() + '.png', Date().toString(), {
        //         errorCorrectionLevel: 'H',
        //         // type: 'image/png',
        //         quality: 0.3,
        //         margin: 5,
        //         color: {
        //             // dark:"#010599FF",
        //             dark:"#2196F3",
        //             light:"#FFFFFF"
        //             // light:"#FFBF60FF"
        //         }
        //     },
        //     (err, src) => {
        //         if (err) {
        //             console.log(err);
        //         }
        //         //console.log('qr code string dataUrl');
        //         //console.log(src.toString().substring(22));
        //         // qrDataURL = src;
        //         // res.send(src);
        //         let query = `INSERT INTO event_reservation(id, user_id, event_ticket_id, created_at, qr_code)
        //                         VALUES('${singleEventTicketId}', ${userId}, ${singleEventTicketCategoryId}, UTC_TIMESTAMP(), '${src.toString().substring(22)}')`;
        //         db.query(query, (err, result) => {
        //             if (err) {
        //                 console.log(err);
        //                 return res.status(500).send(err);
        //             }
        //             res.result;
        //         });
        //     }
        // );

        // let query = `INSERT INTO event_reservation(id, user_id, event_ticket_id, created_at, qr_code)
        // VALUES('${singleEventTicketId}', ${userId}, ${singleEventTicketCategoryId}, UTC_TIMESTAMP(), '${qrDataURL}')`;
        // db.query(query, (err, result) => {
        //     if (err) {
        //         console.log(err);
        //         return res.status(500).send(err);
        //     }
        //     res.result;
        // });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:event_id/reservation/user", (req, res) => {
    try {
        // let eventId = req.body.event_id;
        let eventId = req.params.event_id;

        const sql = `SELECT DISTINCT user.id, is_shared, user.username, user.name, user.phone, user.email, user.profile_image, 
                    user.description
                    FROM event_reservation
                    JOIN event_ticket ON event_ticket_id = event_ticket.id
                    JOIN event ON event.id = event_ticket.event_id
                    JOIN user ON event_reservation.user_id = user.id
                    WHERE event_reservation.is_shared = 1 AND event.id = ?
                    ORDER BY event_reservation.created_at DESC`;
        db.query(sql, [eventId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:eventId/reservation/:reservationId/validate", /*checkDev,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let singleEventTicketId = req.body.event_reservation_id;
        // let singleEventId = req.body.event_id;
        // let fullPrice = req.body.full_price;
        // let quantity = req.body.quantity;
        let url = 'http://192.168.1.252/kadingira-server';
        // var qrDataURL;

        // //console.log(userId);
        //console.log(singleEventTicketId);
        // //console.log(exhibitionId);
        // //console.log(fullPrice);
        // //console.log(quantity);

        // let singleEventTicketId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        // //console.log(singleEventTicketId);

        const sql = `SELECT * FROM event_reservation WHERE id = '${singleEventTicketId}'`;

        db.query(sql, (err, result) => {
            if (err) {
                //console.log(err)
                return res.status(500).send(err);
            }
            if (result.length === 0) {
                //console.log(result);
                //console.log('QR code non associato a nessun biglietto kadingira');
                res.json(result.length);
            } else if (result.length === 1) {
                //console.log(result[0].is_validated);
                if (result[0].is_validated === 0 && result[0].is_expired === 0) {
                    //console.log('Biglietto da convalidare');

                    const sql0 = `UPDATE event_reservation SET is_validated = 1 WHERE id = '${singleEventTicketId}'`;

                    db.query(sql0, (err, result) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }
                        // res.redirect('/category');
                        // res.json(result);
                    });
                    res.json(result);
                } else if (result[0].is_validated === 1) {
                    //console.log('Biglietto già convalidato');
                    res.json(result);
                } else if (result[0].is_validated === 0 && result[0].is_expired === 1) {
                    //console.log('Biglietto scaduto');
                    res.json(result);
                } else {
                    //console.log('errore1');
                }
                // res.json(result);
            } else {
                //console.log('errore');
                res.json(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/ticket", /*checkDev,*/ (req, res) => {
    try {
        const sql = "SELECT * FROM event_ticket";
        db.query(sql, (err, rows) => {
            //console.log(rows);
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(rows);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/ticket/:id", (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM event_ticket WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:event_id/ticket", (req, res) => {
    try {
        // let eventId = req.body.event_id;
        let eventId = req.params.event_id;

        const sql = `SELECT * FROM event_ticket WHERE event_id = ?`;
        db.query(sql, [eventId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

module.exports = Router;