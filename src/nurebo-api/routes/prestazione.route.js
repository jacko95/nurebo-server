const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
// const io = require("../index");
const AWS = require('aws-sdk');
const qr = require("qrcode");
// const socket = require('../index'); //import socket  from app.js
const checkBusinessAuth = require("../middleware/checkBusinessAuth");
const checkBusiness = require("../middleware/checkBusiness");
const checkDev = require("../middleware/checkDev");
const checkUserAuth = require("../middleware/checkUserAuth");
const checkUser = require("../middleware/checkUser");
const turf = require('@turf/turf');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'eu-central-1',
    signatureVersion: 'v4',
})

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


Router.get("/", (req, res) => {
    try {
        const sql = `SELECT *
                 FROM prestazione
                    JOIN business ON business.id = prestazione.business_id AND business.is_visible = 1`;
        db.query(sql, (err, rows) => {
            //console.log(rows);
            if (err) {
                console.log(err);
                console.log(err);
            }
            res.json(rows);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/is_valid", (req, res) => {
    try {
        let ipLatitude = req.query.ip_latitude;
        let ipLongitude = req.query.ip_longitude;
        let geoLatitude = req.query.geo_latitude;
        let geoLongitude = req.query.geo_longitude;
        let ipLocation;
        let geoLocation;
        const locationsWithinRadius = new Set();


        console.log(req.query);

        if(ipLatitude && ipLongitude){
            ipLocation = turf.point([ipLongitude, ipLatitude]);
        }
        if(geoLatitude && geoLongitude){
            geoLocation = turf.point([geoLongitude, geoLatitude]);
        }

        const userLocation = geoLocation !== undefined ? geoLocation : ipLocation;

        console.log('geoLocation');
        console.log(geoLocation);
        console.log('ipLocation');
        console.log(ipLocation);
        console.log('userLocation');
        console.log(userLocation);

        const sql = `SELECT prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                    prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                    prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                    prestazione.is_price_range AS prestazione_is_price_range, prestazione.description AS prestazione_description,
                    prestazione.id AS prestazione_id, prestazione.created_at AS prestazione_created_at, 
                    prestazione.is_valid AS prestazione_is_valid,
                    
                    business_room.id AS business_room_id,
                    
                    category.id AS category_id, category.name AS category_name, category.image AS category_image,
                    
                    business.profile_image AS business_profile_image, business.description AS business_description, business.email AS business_email,
                    /*business.email_notification AS business_email_notification,*/
                    business.max_contemporary_appointments, business.category_id AS business_category_id, business.phone AS business_phone,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id,
                    business.longitude AS business_longitude, business.latitude AS business_latitude
            
                FROM prestazione
                    LEFT JOIN business ON business.id = prestazione.business_id
                    LEFT JOIN business_room ON business.id = business_room.business_id
                    LEFT JOIN category ON business.category_id = category.id
                WHERE prestazione.is_valid = 1 AND business.is_visible = 1`;
        db.query(sql, [], (err, result) => {
            //console.log(rows);
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            try {
                result.forEach(location => {
                    location.turfPoint = turf.point([location.business_longitude, location.business_latitude]);
                });

                result.forEach(location => {
                    const distance = turf.distance(userLocation, location.turfPoint, { units: 'kilometers' });
                    // console.log('distance4555')
                    // console.log(distance)
                    location.business_distance = distance;
                    // if (distance <= 30/*km*/) {
                    // if (distance <= global.maxDistanceBusinessSearch/*km*/) {
                    if (distance <= parseInt(process.env.MAX_DISTANCE_BUSINESS_SEARCH)){
                        locationsWithinRadius.add(location);
                    }
                });

                console.log(Array.from(locationsWithinRadius));
                // res.status(201).json(result);
                res.status(201).json(Array.from(locationsWithinRadius));
            } catch (e) {
                res.status(510).send(err);
            }

            // res.json(rows);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.get("/prestazione/:id", (req, res) => {
// // Router.get("/:id", (req, res) => {
//     try {
//         // let id = req.body.id;
//         let id = req.params.id;
//
//         const sql = `SELECT * FROM prestazione WHERE id = ?`;
//         db.query(sql, [id], (err, result) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//             // res.redirect('/category');
//             res.json(result);
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("");
//     }
// });

// Router.post("/buyers", (req, res) => {
Router.get("/:prestazione_id/user/is_shared", (req, res) => {
    try {
        // let prestazioneId = req.body.prestazione_id;
        let prestazioneId = req.params.prestazione_id;

        const sql = `SELECT DISTINCT user.id, is_shared, user.username, user.name, user.phone, user.email, user.profile_image, 
                    user.description
                    FROM booking
                    JOIN prestazione ON prestazione.id = booking.prestazione_id
                    /*JOIN user ON booking.user_id = user.id*/
                    JOIN user_order ON user_order.id = booking.user_order_id
                    JOIN user ON user.id = user_order.user_id
                    WHERE booking.is_shared = 1 AND prestazione.id = ? AND user.is_deleted = 0
                    ORDER BY booking.created_at DESC`;
        db.query(sql, [prestazioneId], (err, result) => {
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

Router.get("/recommended", /*async*/ (req, res) => {
// Router.get("/prestazione/recommended", (req, res) => {
    try {
        // let eventBusinessId = req.body.business_id;
        // //console.log(eventBusinessId);
        let ipLatitude = req.query.ip_latitude;
        let ipLongitude = req.query.ip_longitude;
        let geoLatitude = req.query.geo_latitude;
        let geoLongitude = req.query.geo_longitude;
        let ipLocation;
        let geoLocation;
        const locationsWithinRadius = new Set();

        console.log(req.query);

        if(ipLatitude && ipLongitude){
            ipLocation = turf.point([ipLongitude, ipLatitude]);
        }
        if(geoLatitude && geoLongitude){
            geoLocation = turf.point([geoLongitude, geoLatitude]);
        }

        const userLocation = geoLocation !== undefined ? geoLocation : ipLocation;

        console.log('geoLocation');
        console.log(geoLocation);
        console.log('ipLocation');
        console.log(ipLocation);
        console.log('userLocation');
        console.log(userLocation);

        // const sql = `SELECT * FROM event WHERE business_id = '${eventBusinessId}' AND is_visible = 1`;
        const sql = `SELECT prestazione_recommended.id AS recommended_id, prestazione_recommended.created_at AS recommended_created_at,

            max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
            business.name AS business_name, business.id AS business_id, business.address AS business_address,
            /*business.email_notification AS business_email_notification,*/
            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

            category.id AS category_id, category.name AS category_name, category.image AS category_image,

            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max,
            prestazione.is_price_range AS prestazione_is_price_range,
            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
            prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
            prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                    FROM prestazione_recommended
                        JOIN prestazione ON prestazione_recommended.prestazione_id = prestazione.id
                        JOIN business ON prestazione.business_id = business.id
                        JOIN category ON business.category_id = category.id
                    WHERE prestazione.is_valid = 1 AND prestazione_recommended.is_active = 1
                    AND business.is_visible = 1
                    ORDER BY RAND()
                    /*LIMIT 15*/`;
        db./*promise().*/query(sql, [], (err, result) => {
        // await db.promise().query(sql, [], ).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            try {
                result.forEach(location => {
                    location.turfPoint = turf.point([location.business_longitude, location.business_latitude]);
                });

                result.forEach(location => {
                    const distance = turf.distance(userLocation, location.turfPoint, { units: 'kilometers' });
                    // console.log('distance4555')
                    // console.log(distance)
                    location.business_distance = distance;
                    // if (distance <= 30/*km*/) {
                    // if (distance <= global.maxDistanceBusinessSearch){
                    if (distance <= parseInt(process.env.MAX_DISTANCE_BUSINESS_SEARCH)){
                        locationsWithinRadius.add(location);
                    }
                });

                if(locationsWithinRadius.size >= 5){
                    res.status(201).json(Array.from(locationsWithinRadius).slice(0, 15));
                }
                else {
                    res.status(200).json(result.slice(0, 15));
                }
            } catch (e) {
                console.log(e);
                res.status(510).send(err);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/search", (req, res) => {
    try {
        let title = req.body.title;
        //console.log(title);

        const sql = `SELECT * 
                    FROM prestazione
                    JOIN business ON prestazione.business_id = business.id
                    WHERE title LIKE '%?%' OR business.name LIKE '%?%' AND is_visible = 1`;
        // const sql = `SELECT *
        //                 FROM event
        // JOIN event_business ON event_business.id = event.event_business_id
        //                 WHERE title LIKE '%${name}%' OR title LIKE '%${name}%'`;

        db.query(sql, [title, title], (err, result) => {
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
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/bestsellers", (req, res) => {
// Router.get("/prestazione/bestsellers", (req, res) => {
// Router.get("bestsellers", (req, res) => {

    try {
        const sql = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        /*business.email_notification AS business_email_notification,*/
                        business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                        business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                        business_room.id AS business_room_id,
                        
                        category.id AS category_id, category.name AS category_name, category.image AS category_image,

                        prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                        prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                        prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                        prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                 FROM prestazione
                          LEFT JOIN business ON prestazione.business_id = business.id
                          LEFT JOIN business_room ON business.id = business_room.business_id
                          LEFT JOIN category ON business.category_id = category.id
                 WHERE prestazione.is_valid = 1 AND prestazione.image != '' AND business.is_visible = 1
                 ORDER BY RAND()
                 LIMIT 10`;
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // console.log(result)
            res.status(201).json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:prestazione_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let prestazioneId = req.body.prestazione_id;
        let id = uuidv4();
        //console.log(userId);
        //console.log(postId);

        let sql1 = `SELECT *
                FROM prestazione_favorite
                WHERE user_id = ? AND prestazione_id = ?`;
        db.query(sql1, [userId, prestazioneId], (err, result) => {
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
                let sql = `INSERT INTO prestazione_favorite(id, user_id, prestazione_id, created_at)
                VALUES(?, ?, ?, ?)`;
                db.query(sql, [id, userId, prestazioneId, new Date(Date.now()).toISOString()], (err, result) => {
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

Router.delete("/:prestazione_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let prestazioneId = req.body.prestazione_id;
        //console.log(userId);
        //console.log(postId);

        let sql = `DELETE FROM prestazione_favorite
                WHERE user_id = ? AND prestazione_id = ?`;
        db.query(sql, [userId, prestazioneId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // let messaggio = "ciccio";
            res.json(result.affectedRows);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:prestazione_id/like", (req, res) => {
    try {
        // let prestazioneId = req.body.prestazione_id;
        let prestazioneId = req.params.prestazione_id;

        let sql = `SELECT DISTINCT *
                FROM prestazione_favorite
                JOIN user ON prestazione_favorite.user_id = user.id
                WHERE prestazione_favorite.prestazione_id = ? AND user.is_deleted = 0
                ORDER BY prestazione_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [prestazioneId], (err, result) => {
            if (err) {
                console.log(err);
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

module.exports = Router;