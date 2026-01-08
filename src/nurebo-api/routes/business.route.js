const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
// const welcome_email = require("../template/email/welcome_email.html");
const { v4: uuidv4 } = require('uuid');
const JWT = require('jsonwebtoken')
const nodemailer = require('nodemailer');
const axios = require('axios');
const firebase = require("../firebase/firebase");
const socket = require('../index'); //import socket  from app.js
// const request = require('request');
const fs = require("fs");
const multer = require('multer');
const checkUserAuth = require("../middleware/checkUserAuth");
const checkUser = require("../middleware/checkUser");
const checkDev = require("../middleware/checkDev");
const checkBusinessAuth = require("../middleware/checkBusinessAuth");
const checkBusiness = require("../middleware/checkBusiness");
const AWS = require('aws-sdk')
const formData = require('form-data');
const sharp = require('sharp');
const turf = require('@turf/turf');
const rateLimiter = require("express-rate-limit");

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'eu-central-1',
    // signatureVersion: 'v4',
});

const sns = new AWS.SNS();
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

const registerLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 2, //5 requests
    message: {
        code: 429, //HTTP code per too many requests
        message: "Troppe richieste, riprova più tardi."
    }
});

let transporter = nodemailer.createTransport({
    // service: 'gmail',
    // service: 'iCloud',
    // host: 'authsmtp.securemail.pro',
    host: 'email-smtp.eu-central-1.amazonaws.com',
    port: 465,
    // port: 587,
    secure: true, // true for 465, false for other ports
    // secure: false,
    auth: {
        // user: process.env.EMAIL_USER,
        user: process.env.AWS_SMTP_USER,
        // pass: process.env.EMAIL_PASSWORD
        pass: process.env.AWS_SMTP_PASSWORD
    },
    //TODO: da testare
    tls: {
        rejectUnauthorized: false
    }
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
// const fileFilter = (req, file, cb) => {
//     // reject a file
//     // if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
//     //     cb(null, true);
//     // } else {
//     //     // cb(null, false);
//     //     cb(new Error('File format not allowed'), false);
//     // }
// };

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

const upload1 = multer();


Router.get("/", async (req, res) => {
    try {

        const sql = `SELECT *
                            FROM business`;
        db.query(sql, [], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log(result);

            res.status(200).json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.get("/email/:email", (req, res) => {
    try {
        // let email = req.body.email;
        let email = req.params.email;

        const sql = `SELECT * FROM business WHERE email = ?`;
        db.query(sql, [email], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                res.json(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/room", (req, res) => {
    // let userId = req.body.user_id;
    //console.log('userId4564');
    //console.log(userId);

    const sql = `SELECT business_room.id AS business_room_id, business_room.business_id, business_room.created_at
                 FROM business_room`;
    db.query(sql, [], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

Router.get("/post/is_visible", /*checkDev,*/ async (req, res) => {
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

        const sql = `SELECT business_post.id AS post_id, business_post.description AS post_description,
                        business_post.image_url AS post_image_url, business_post.is_visible AS post_is_visible,
                        business_post.created_at AS post_created_at,

                        user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                        user.username AS user_username, user.phone AS user_phone, 
                        user.name AS user_name, user.description AS user_description,
                        
                        business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        /*business.email_notification AS business_email_notification,*/
                        business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                        business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
                        
                        category.id AS category_id, category.name AS category_name, category.image AS category_image,
        
                        prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                        prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                        prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                        prestazione.is_price_range AS prestazione_is_price_range,  
                        prestazione.description AS prestazione_description, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.business_id, prestazione.id AS prestazione_id

                     FROM business_post
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN business ON business.id = prestazione.business_id
                        LEFT JOIN user ON user.id = business_post.user_id
                        LEFT JOIN category ON business.category_id = category.id
                     WHERE business_post.is_visible = 1 AND user.is_deleted = 0
                     AND business.is_visible = 1
                     ORDER BY post_created_at DESC;`;
        await db.promise().query(sql, []).then(async (result, err) => {
            //console.log(rows);
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            // console.log('result88899g9gg6');
            // console.log(result);
            // console.log(result[0]);

            try {
                result[0].forEach(location => {
                    // console.log('fff5ghh66')
                    // console.log(location.business_longitude)
                    location.turfPoint = turf.point([location.business_longitude, location.business_latitude]);
                });

                result[0].forEach(location => {
                    const distance = turf.distance(userLocation, location.turfPoint, { units: 'kilometers' });
                    // console.log('distance4555')
                    // console.log(distance)
                    location.business_distance = distance;
                    // if (distance <= 30/*km*/) {
                    // if (distance <= global.maxDistanceBusinessSearch){
                    if (distance <= process.env.MAX_DISTANCE_BUSINESS_SEARCH){
                        locationsWithinRadius.add(location);
                    }
                });

                // res.status(201).json(result);
                res.status(201).json(Array.from(locationsWithinRadius));
            } catch (e) {
                console.log(e);
                res.status(510).send(e);
            }
            // console.log('resultg5fr6frf6f6ff6ff6h');
            // console.log(result[0].length);
            // console.log(locationsWithinRadius.size);
            // // console.log(locationsWithinRadius);
            //
            // // res.json(result[0]);
            // res.json(Array.from(locationsWithinRadius));
        })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/post/home", (req, res) => {
    try {
        // const appVersion = req.headers['X-App-Version'];
        const appVersionName = req.headers['x-app-version-name'];
        const appVersionNumber = parseInt(req.headers['x-app-version-number']);
        const appClientType = req.headers['x-client-type'];

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

        console.log('appVersion')
        console.log(appVersionName)
        console.log('appVersionNumber')
        console.log(appVersionNumber)
        console.log('appClientType')
        console.log(appClientType)
        // let businessId = req.params.business_id;

        // if (appVersionName === '2.0.1'){
        //     res.status(459).send(`${appVersionNumber+15}`);
        // }
        // else /*if (appVersion === '1.0')*/{
        // let action = req.body.action;
        //console.log(req.body);

        // if(action === 'GET') {
        const sql = `SELECT  
                            business_post.id AS post_id, business_post.description AS post_description,
                            business_post.image_url AS post_image_url, business_post.is_visible AS post_is_visible,
                            business_post.created_at AS post_created_at,

                            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                            business.name AS business_name, business.id AS business_id, business.address AS business_address,
                            /*business.email_notification AS business_email_notification,*/
                            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                            category.id AS category_id, category.name AS category_name, category.image AS category_image,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                            user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                            prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                            prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                     FROM business_post
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN user ON user.id = business_post.user_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON category.id = business.category_id
                    WHERE business_post.is_visible = 1 AND user.is_deleted = 0
                    ORDER BY RAND()
                    /*LIMIT 10*/`;
        db.query(sql, [], (err, result) => {
            // console.log(result);
            if (err) {
                console.log(err);
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

            // console.log('resultg5hh5h5h5h');
            // console.log(result);
            // console.log(locationsWithinRadius);
            //
            // // res.status(200).json(result);
            // res.status(200).json(Array.from(locationsWithinRadius));
        })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/room", (req, res) => {
    let businessId = req.params.business_id;
    //console.log('userId4564');
    //console.log(userId);

    const sql = `SELECT business_room.id AS business_room_id, business_room.business_id, business_room.created_at
                 FROM business_room
                 WHERE business_id = ?`;
    db.query(sql, [businessId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log('f5bfbf54bf54b4b55')
        console.log(result)
        res.json(result);
    });
});

Router.get("/post", (req, res) => {
    try {
        // const appVersion = req.headers['X-App-Version'];
        const appVersionName = req.headers['x-app-version-name'];
        const appVersionNumber = parseInt(req.headers['x-app-version-number']);
        const appClientType = req.headers['x-client-type'];
        console.log('appVersion')
        console.log(appVersionName)
        console.log('appVersionNumber')
        console.log(appVersionNumber)
        console.log('appClientType')
        console.log(appClientType)

        // if (appVersionName === '2.0.1'){
        //     res.status(459).send(`${appVersionNumber+15}`);
        // }
        // else /*if (appVersion === '1.0')*/{
            // let action = req.body.action;
            //console.log(req.body);

            // if(action === 'GET') {
            const sql = `SELECT business_post.id, prestazione.business_id, business_post.image_url, business_post.prestazione_id, business_post.description, business_post.created_at,

                            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                            business.name AS business_name, business.id AS business_id, business.address AS business_address,
                            /*business.email_notification AS business_email_notification,*/
                            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                            category.id AS category_id, category.name AS category_name, category.image AS category_image,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                            user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                            prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                            prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                     FROM business_post
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN user ON user.id = business_post.user_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON category.id = business.category_id
                     WHERE business.is_visible = 1 AND user.is_deleted = 0`;
            db.query(sql, (err, result) => {
                // console.log(result);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }

                res.status(200).json(result);
            })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/post/home", (req, res) => {
    try {
        // const appVersion = req.headers['X-App-Version'];
        const appVersionName = req.headers['x-app-version-name'];
        const appVersionNumber = parseInt(req.headers['x-app-version-number']);
        const appClientType = req.headers['x-client-type'];
        console.log('appVersion')
        console.log(appVersionName)
        console.log('appVersionNumber')
        console.log(appVersionNumber)
        console.log('appClientType')
        console.log(appClientType)
        let businessId = req.params.business_id;

        // if (appVersionName === '2.0.1'){
        //     res.status(459).send(`${appVersionNumber+15}`);
        // }
        // else /*if (appVersion === '1.0')*/{
            // let action = req.body.action;
            //console.log(req.body);

            // if(action === 'GET') {
            const sql = `SELECT  
                            business_post.id AS post_id, business_post.description AS post_description,
                            business_post.image_url AS post_image_url, business_post.is_visible AS post_is_visible,
                            business_post.created_at AS post_created_at,

                            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                            business.name AS business_name, business.id AS business_id, business.address AS business_address,
                            /*business.email_notification AS business_email_notification,*/
                            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                            category.id AS category_id, category.name AS category_name, category.image AS category_image,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                            user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                            prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                            prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                     FROM business_post
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN user ON user.id = business_post.user_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON category.id = business.category_id
                    WHERE business_post.is_visible = 1 AND business.id = ? AND user.is_deleted = 0
                    ORDER BY RAND()
                    LIMIT 10`;
            db.query(sql, [businessId], (err, result) => {
                // console.log(result);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }

                res.status(200).json(result);
            })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/post", (req, res) => {
    try {
        let businessId = req.params.business_id;
        // const appVersion = req.headers['X-App-Version'];
        const appVersionName = req.headers['x-app-version-name'];
        const appVersionNumber = parseInt(req.headers['x-app-version-number']);
        const appClientType = req.headers['x-client-type'];
        console.log('appVersion')
        console.log(appVersionName)
        console.log('appVersionNumber')
        console.log(appVersionNumber)
        console.log('appClientType')
        console.log(appClientType)

        // if (appVersionName === '2.0.1'){
        //     res.status(459).send(`${appVersionNumber+15}`);
        // }
        // else /*if (appVersion === '1.0')*/{
            // let action = req.body.action;
            //console.log(req.body);

            // if(action === 'GET') {
        if(req.query.home === 1){
            const sql = `SELECT business_post_comment.id AS business_post_comment_id, 
                        business_post_comment.created_at AS business_post_comment_created_at, 
                        business_post_comment.text AS business_post_comment_text, 
                        business_post_comment.is_visible AS business_post_comment_is_visible, 
                        business_post_comment.is_admin AS business_post_comment_is_admin,
            
                        business_post.id AS post_id, business_post.description AS post_description,
                        business_post.image_url AS post_image_url, business_post.is_visible AS post_is_visible,
                        business_post.created_at AS post_created_at,

                        business.max_contemporary_appointments, business.email AS business_email, 
                        business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        /*business.email_notification AS business_email_notification,*/
                        business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                        business.latitude AS business_latitude, business.description AS business_description, 
                        business.type_id AS business_type_id,

                        category.id AS category_id, category.name AS category_name, category.image AS category_image,
                        
                        user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                        user.username AS user_username, user.phone AS user_phone, 
                        user.name AS user_name, user.description AS user_description,

                        user_like.profile_image AS user_like_profile_image, user_like.id AS user_like_id, 
                        user_like.email AS user_like_email, user_like.username AS user_like_username, 
                        user_like.name AS user_like_name, user_like.description AS user_like_description,

                        user_comment.profile_image AS user_comment_profile_image, user_comment.id AS user_comment_id, 
                        user_comment.email AS user_comment_email, user_comment.username AS user_comment_username, 
                        user_comment.name AS user_comment_name, user_comment.description AS user_comment_description,

                        prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                        prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                        prestazione.created_at AS prestazione_created_at,
                        prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                        prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.title AS prestazione_title

                 FROM business_post
                    LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                    LEFT JOIN business_post_comment ON business_post.id = business_post_comment.business_post_id
                    LEFT JOIN business_post_like ON business_post.id = business_post_like.business_post_id
                    LEFT JOIN user ON user.id = business_post.user_id
                    LEFT JOIN user AS user_comment ON user.id = business_post_comment.user_id
                    LEFT JOIN user AS user_like ON user.id = business_post_like.user_id
                    LEFT JOIN business ON business.id = prestazione.business_id
                    LEFT JOIN category ON category.id = business.category_id
                    
                 WHERE business_post.is_visible = 1 AND prestazione.business_id = ? AND business.is_visible = 1
                 AND user.is_deleted = 0
                 ORDER BY RAND()
                 LIMIT 10`;
            db.query(sql, [businessId], (err, result) => {
                // console.log(result);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }

                res.status(200).json(result);
            })
        }
        else {
            const sql = `SELECT business_post.id, prestazione.business_id, business_post.image_url, business_post.prestazione_id, business_post.description, business_post.created_at,

                            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                            business.name AS business_name, business.id AS business_id, business.address AS business_address,
                            /*business.email_notification AS business_email_notification,*/
                            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                            category.id AS category_id, category.name AS category_name, category.image AS category_image,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                            user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                            prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                            prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                     FROM business_post
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN user ON user.id = business_post.user_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON category.id = business.category_id
                     WHERE prestazione.business_id = ? AND business.is_visible = 1 AND user.is_deleted = 0
                     ORDER BY business_post.created_at DESC`;
            db.query(sql, [businessId], (err, result) => {
                // console.log(result);
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }

                res.status(200).json(result);
            })
        }
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/room/:room_id/message", checkBusinessAuth, checkBusiness, (req, res) => {
    // let chatId = req.body.chat_id;
    // let userId = req.body.user_id;
    // let businessId = req.params.business_id;
    // let text = req.body.text;
    // let sentAt = req.body.sent_at;
    let text = req.body.business_room_message_text;
    let sentAt = req.body.business_room_message_sent_at;
    let businessRoomMessageId = uuidv4();
    let businessRoomId = req.params.room_id;
    let businessId = req.params.business_id;
    let array = [];

    console.log('req.bodyg65g6b6h55');
    console.log(req.body);

    // let query = `SELECT business_room.id AS business_room_id FROM business_room WHERE business_room.business_id = ?`;
    // db.query(query, [businessId,], async (err, result025) => {
    //     if (err) {
    //         console.log(err);
    //         return res.status(500).send(err);
    //     }
    //
    //     // console.log(result025);
    //     businessRoomId = result025[0].business_room_id;
    //     // console.log(result025[0].business_room_id);

    let query = `INSERT INTO business_room_message(id, business_room_id, text, sent_at)
                    VALUES (?, ?, ?, ?)`;
    db.query(query, [businessRoomMessageId, businessRoomId, text, sentAt], async (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        //dovrebbe funzionare questo job
        /*const someDate = new Date(sentAt)//italia = UTC+1
        var d2 = new Date(someDate);
        d2.setMinutes(someDate.getMinutes() + 1);
        schedule.scheduleJob('mmm', /!*someDate*!/d2, ( ) => {
            //console.log('job eseguito alle', new Date().toString())
            let sql = `DELETE FROM single_event_room WHERE id = '${id}'`;
            db.query(sql, (err, result) => {
                if(err) throw err;
                // let messaggio = "ciccio";
                schedule.cancelJob('mmm')
                // res.json(result.affectedRows);
            });
        })*/

        var rooms = await socket.ioObject.of('/').adapter.allRooms();
        // console.log(`socket.ioObject.of('/').adapter.allRooms()`);
        // console.log(rooms);
        console.log('rooms.has(businessRoomId)gg6gg6gfgf6');
        console.log(rooms.has(businessRoomId));
        console.log(businessRoomId);

        // var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
        // console.log(`socket.ioObject.of('/').adapter.sockets`);
        // console.log(sockets);
        //
        // var sids = await socket.ioObject.of('/').adapter.sids;
        // console.log(`socket.ioObject.of('/').adapter.sids`);
        // console.log(sids);
        //
        // var rooms1 = await socket.ioObject.of('/').adapter.rooms;
        // console.log(`socket.ioObject.of('/').adapter.rooms`);
        // console.log(rooms1);

        // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
        // if (rooms.has(businessRoomId)) {
        //     socket.ioObject.sockets.to(businessRoomId).emit(
        //         // "send_user-business_room_message",
        //         // "receive_user-business_room_message",
        //         "receive-business_room_message",
        //         {
        //             // "booking_id": req.body.booking_id,
        //             // "begin_at": req.body.begin_at,
        //             // "user_id": userId,
        //             // "username": req.body.username,
        //             // "is_deleted": 0,
        //             // "text": text,
        //             // "sent_at": sentAt,
        //             // "business_id": req.params.business_id,
        //             "business_room_id": businessRoomId,
        //             "business_room_message_id": businessRoomMessageId,
        //             // "prestazione_image": `${req.body.prestazione_image}`,
        //             ...req.body
        //         }
        //     );
        // }

        // console.log('resultfdgg5g54');
        // console.log(result);
        // console.log(result.affectedRows);

        if (result.affectedRows === 1) {
            res.status(200).json(result);
        } else {
            res.status(500).send(result.info);
        }
        // schedule.cancelJob('mmm')
    });
    // });
});

// // Router.post("/", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
// Router.get("/:business_id", /*checkDev,*/ /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
//     // let businessId = req.body.business_id;
//     let businessId = req.params.business_id;
//
//     // const sql = `SELECT
//     //                 max_contemporary_appointments, business.profile_image AS business_profile_image, business.email AS business_email,
//     //                 business.name AS business_name, business.id AS business_id, business.address AS business_address,
//     //                 business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//     //                 business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
//     //
//     //                 category.id AS category_id, category.name AS category_name, category.image AS category_image
//     //
//     //                 FROM ??
//     //                 JOIN category ON business.category_id = category.id
//     //                 WHERE ?? = ?`;
//     // const formatSql = db.format(sql, ['business', 'business.id', id]);
//     const sql = `SELECT
//         max_contemporary_appointments, business.profile_image AS business_profile_image, business.email AS business_email,
//         business.name AS business_name, business.id AS business_id, business.address AS business_address,
//         /*business.email_notification AS business_email_notification,*/ business.type_id AS business_type_id,
//         business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//         business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
//
//         business_room.id AS business_room_id,
//
//         category.id AS category_id, category.name AS category_name, category.image AS category_image
//
//         FROM business
//             LEFT JOIN category ON business.category_id = category.id
//             LEFT JOIN business_room ON business_room.business_id = business.id
//         WHERE business.id = ? AND business.is_visible = 1`;
//     // const formatSql = db.format(sql, [businessId]);
//     // const formatSql = db.query(sql, [businessId]);
//     db.query(sql, [businessId], (err, result) => {
//         // db.query(formatSql, (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         // console.log(result);
//         res.json(result);
//     });
// });

Router.get("/:business_id", async (req, res) => {
    try {
        let businessId = req.params.business_id;


        // const sql = `SELECT *
        //                      FROM business
        //                      JOIN business_form ON business.id = business_form.business_id
        //                      JOIN business_form_color ON business_form_color.id = business_form.business_form_color_id
        //                      WHERE business.id = ?`;
        const sql = `SELECT 
                                business.id AS business_id,
                                business.name AS business_name,
                                business.cell AS business_cell,
                                business.info AS business_info,
                                business.image_url AS business_image_url,
                                business.phone AS business_phone,
                                business.email AS business_email,
                                business.address AS business_address,
                                business.city AS business_city,
                                business.province AS business_province,
                                business.postal_code AS business_postal_code,
                                business.region AS business_region,
                                business.address_number AS business_address_number,
                                business.created_at AS business_created_at,
                                business_form.id AS business_form_id,
                                business_form_color.id AS business_form_color_id,
                                business_form.created_at AS business_form_created_at,
                                business_form_color.id AS business_form_color_id,
                                business_form_color.background AS business_form_color_background,
                                business_form_color.active AS business_form_color_active
                            FROM 
                                business
                            LEFT JOIN 
                                business_form ON business.id = business_form.business_id
                            LEFT JOIN 
                                business_form_color ON business_form_color.id = business_form.business_form_color_id
                            WHERE 
                                business.id = ?;`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log(result);

            if (result.length === 0) {
                return res.status(404).json({ message: "business not found" });
            }

            // Restituisci tutti i risultati
            res.status(200).json(result[0]);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

// Router.put("/", (req, res) => {
Router.put("/:business_id", checkBusinessAuth, checkBusiness, upload1.single('image'), async (req, res) => {
    try {
        let name = req.body.name;
        // let profileImage = req.body.profile_image;
        // let address = req.body.address;
        let phoneNumber = req.body.phone;
        let email = req.body.email;
        let maxContemporaryAppointments = req.body.max_contemporary_appointments;
        let description = req.body.description;
        let businessId = req.body.business_id;

        // console.log(req.file)

        const sql = `UPDATE business SET name = ?, phone = ?, email = ?, max_contemporary_appointments = ?, description = ?
                    WHERE id = ?`;
        db.query(sql, [name, /*profileImage, address,*/ phoneNumber, email, maxContemporaryAppointments, description, businessId], async (err, result) => {
            try {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }

                if (req.file !== undefined) {
                    if (req.file.mimetype === "image/png" || req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/webp") {
                        const resizedImage = await sharp(/*getObjectResult.Body*/Buffer.from(req.file.buffer))
                            .resize(
                                960,
                                960,
                                {
                                    kernel: sharp.kernel.nearest,
                                    fit: sharp.fit.outside,
                                    // withoutEnlargement: true,
                                    // withoutReduction: true,
                                    // position: 'right top',
                                    // background: { r: 255, g: 255, b: 255, alpha: 0.5 }
                                }
                            )
                            // .webp({
                            //     quality: 100,
                            //     lossless: true,
                            //     effort: 6,
                            // })
                            // .png({
                            //     quality: /*100*/5,
                            //     effort: 10,
                            //     palette: true,
                            //     // progressive: true,
                            //     // adaptiveFiltering: true,
                            // })
                            .jpeg(
                                {
                                    quality: 60,
                                    force: true,
                                    progressive: true,
                                    trellisQuantisation: true,
                                    optimiseScans: true,
                                    chromaSubsampling: '4:4:4',
                                    mozjpeg: true,
                                }
                            )
                            // .heif({
                            //     compression: "av1",
                            //     quality: 100,
                            //     effort: 9,
                            //     lossless: true,
                            // })
                            .toBuffer();

                        const params = {
                            Image: {
                                // Bytes: req.file.buffer,
                                // Bytes: Buffer.from(req.file.buffer),
                                Bytes: /*data1*//*modifiedImage*/resizedImage,
                                // Bytes: resizedImage,
                            },
                            MinConfidence: 90, // Imposta la soglia di confidenza desiderata
                        };

                        let detectLabels = await rekognition.detectModerationLabels(params).promise();

                        console.log(detectLabels)

                        const moderationLabels = detectLabels.ModerationLabels;

                        if (moderationLabels.length > 0) {
                            console.log('L immagine contiene contenuti pornografici.');
                            console.log('Etichette rilevate:', moderationLabels);
                            await res.status(400).json({error: "L'immagine contiene contenuti non adatti."});
                            return;
                        } else {
                            console.log('L\'immagine è accettabile.');
                            // res.json({ message: 'L\'immagine è accettabile.' });
                            // Procedi con il salvataggio dell'immagine su S3
                        }

                        console.log(req.file)
                        let myFile = req.file.originalname.split(".")
                        const fileType = myFile[myFile.length - 1]
                        let s3Path = `image/business/${businessId}/${uuidv4()}.${fileType}`;

                        const putObjectParams = {
                            Bucket: process.env.AWS_BUCKET_NAME,
                            // Key: `image/user/${userId}/${uuidv4()}.${fileType}`,
                            Key: s3Path,
                            Body: /*modifiedImage*/resizedImage,
                            // ACL: 'private', // Imposta l'ACL su "private" per limitare l'accesso all'immagine ridimensionata
                        };

                        // await s3.putObject(putObjectParams).promise();
                        await s3.upload(
                            putObjectParams,
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

                                const sql0 = `UPDATE business SET profile_image = ? WHERE id = ?`;
                                db.query(sql0, [/*data['Location']*/s3Path, businessId], (err, result) => {
                                    try {
                                        if (err) {
                                            console.log(err)
                                            return res.status(500).send(err);
                                        }

                                        // res.status(200).send(data)

                                        // res.json(result);

                                        res.status(200).send(
                                            JSON.stringify({
                                                // 'id': ,
                                                'image': /*data['Location']*/s3Path,
                                                'business_id': businessId,
                                                'description': description,
                                                'phone': phoneNumber,
                                                'max_contemporary_appointments': maxContemporaryAppointments,
                                                email,
                                                name,
                                            })
                                        );
                                    } catch (error) {
                                        console.error(error);
                                        // res.status(500).json("");
                                    }
                                });
                            }
                        );
                    } else {
                        res.status(521).send("Immagine con formato non supportato");
                    }
                }

                // res.json({
                //     id,
                //     'image': "",
                //     'business_id': businessId,
                //     description,
                //     'price': parseFloat(price),
                //     'duration': parseInt(duration),
                //     title,
                //     'is_valid': 1,
                //     'previous': prestazioneId
                // });

                else {
                    res.status(200).send(
                        JSON.stringify({
                            // 'id': ,
                            // 'image': /*data['Location']*/s3Path,
                            'image': "",
                            'business_id': businessId,
                            'description': description,
                            'phone': phoneNumber,
                            'max_contemporary_appointments': maxContemporaryAppointments,
                            email,
                            name,
                        })
                    );
                }

                // result = result0;
                // res.json({result});
                // res.json(result0);

                // res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("");
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/booking", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        // const sql = `SELECT booking.id AS booking_id, booking.begin_at, booking.created_at, booking.is_canceled,
        //
        // prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
        // prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   prestazione.description AS prestazione_description,
        // prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id,
        //
        // user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
        // user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description
        //
        //                 FROM booking
        //                 JOIN user ON user_id = user.id
        //                 JOIN prestazione ON prestazione_id = prestazione.id
        //                 WHERE business_id = ?
        //                 /*ORDER BY begin_at DESC*/
        //                 ORDER BY created_at DESC`;
        const sql = `SELECT booking.id AS booking_id, booking.begin_at, booking.created_at, booking.is_canceled, booking.is_shared,
        
                        prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                        prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                        prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                        prestazione.is_price_range AS prestazione_is_price_range,   
                        prestazione.description AS prestazione_description, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id,

                        user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                        user.phone AS user_phone, user.name AS user_name, user.description AS user_description

                 FROM booking
                          LEFT JOIN user ON user_id = user.id
                          JOIN prestazione ON prestazione_id = prestazione.id
                 WHERE business_id = ?
                 /*ORDER BY begin_at DESC*/
                 ORDER BY created_at DESC`;

        db.query(sql, [businessId], (err, result) => {
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

Router.put("/:business_id/booking/guest/:id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let id = req.body.id;
        let name = req.body.name;
        let prestazioneId = req.body.prestazione_id;
        let beginAt = req.body.begin_at;
        let phone = req.body.phone;
        let email = req.body.email;
        let note = req.body.note;
        console.log(req.body);

        const sql = `UPDATE guest_booking 
                 SET name = ?, phone = ?, email = ?, begin_at = ?, prestazione_id = ?, note = ? 
                 WHERE id = ?`;
        db.query(sql, [name, phone, email, beginAt, prestazioneId, note, id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            console.log(result)

            // res.json({
            //     id,
            //     'image': "",
            //     'business_id': businessId,
            //     description,
            //     'price': parseFloat(price),
            //     'duration': parseInt(duration),
            //     title,
            //     'is_valid': 1,
            //     'previous': prestazioneId
            // });

            // result = result0;
            // res.json({result});
            res.json(result);
            // res.json(result0);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});


Router.get("/:business_id/prestazione/like/count", /*checkUserAuth, checkUser,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let businessId = req.params.business_id;

        let sql = `SELECT DISTINCT COUNT(*) AS count
    
                    FROM prestazione_favorite
                        JOIN prestazione ON prestazione.id = prestazione_favorite.prestazione_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON business.category_id = category.id
                    WHERE business.id = ? AND prestazione.is_valid = 1
                    /*ORDER BY prestazione_favorite.created_at DESC*/`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [businessId], (err, result) => {
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

// Router.post("/booking_business/appointments", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
Router.get("/:business_id/booking/is_visible", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        const sql = `SELECT booking.id AS booking_id, 
        
        prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
        prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
        prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
        prestazione.description AS prestazione_description,
        prestazione.is_valid AS prestazione_is_valid, prestazione.business_id AS prestazione_business_id, 
        
        user.profile_image AS user_profile_image,
        user.email AS user_email, user.username AS user_username, user.phone AS user_phone, user.name AS user_name,
        user.first_name AS user_first_name, booking.created_at, booking.begin_at, booking.is_shared, booking.is_canceled
                    FROM booking
                        JOIN user ON user_id = user.id
                        JOIN prestazione ON prestazione_id = prestazione.id
                    WHERE business_id = ? AND booking.is_canceled = 0
                    ORDER BY created_at DESC`;
        db.query(sql, [businessId], (err, result) => {
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

Router.get("/:business_id/booking/is_visible/count", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        const sql = `SELECT COUNT(*) AS count
                        FROM booking
                            JOIN user ON user_id = user.id
                            JOIN prestazione ON prestazione_id = prestazione.id
                        WHERE business_id = ? AND booking.is_canceled = 0
                        /*ORDER BY created_at DESC*/`;
        db.query(sql, [businessId], (err, result) => {
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

Router.get("/:business_id/is_visible", /*checkDev,*/ /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    // let businessId = req.body.business_id;
    let businessId = req.params.business_id;

    // const sql = `SELECT
    //                 max_contemporary_appointments, business.profile_image AS business_profile_image, business.email AS business_email,
    //                 business.name AS business_name, business.id AS business_id, business.address AS business_address,
    //                 business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
    //                 business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
    //
    //                 category.id AS category_id, category.name AS category_name, category.image AS category_image
    //
    //                 FROM ??
    //                 JOIN category ON business.category_id = category.id
    //                 WHERE ?? = ?`;
    // const formatSql = db.format(sql, ['business', 'business.id', id]);
    const sql = `SELECT
                    max_contemporary_appointments, business.profile_image AS business_profile_image, business.email AS business_email,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    business.city AS business_city,
                                business.province AS business_province,
                                business.postal_code AS business_postal_code,
                                business.region AS business_region,
                                business.address_number AS business_address_number,
                    /*business.email_notification AS business_email_notification,*/ business.type_id AS business_type_id,
                    business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                    business_room.id AS business_room_id,
                    
                    category.id AS category_id, category.name AS category_name, category.image AS category_image

                    FROM business
                        LEFT JOIN category ON business.category_id = category.id
                        LEFT JOIN business_room ON business_room.business_id = business.id
                    WHERE business.id = ? AND business.is_visible = 1`;
    // const formatSql = db.format(sql, [businessId]);
    // const formatSql = db.query(sql, [businessId]);
    db.query(sql, [businessId], (err, result) => {
        // db.query(formatSql, (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        // res.redirect('/category');
        console.log(result);
        res.json(result);
    });
});

// Router.get('/old', function(req, res) {
//     // res.redirect('https://www.google.com');
//     // res.redirect('/business');
//     res.redirect('/business/is_visible');
//     // console.log('esckilos')
// });

Router.get("/:business_id/event/is_visible", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        // io.on("connection", (socket) => {
        //     /*var era = */socket.broadcast.emit(
        //         'broad',
        //         'esquilo from everywhere',
        //         // (response) => {
        //         //     console.log('allaahhhhhh')
        //         //     console.log(response)
        //         // }
        //         // function (arg, ack) {
        //         //     console.log('ferret')
        //         //     ack('woot');
        //         // }
        //
        //         // {
        //         //     'content': msg.content,
        //         //     'senderId': senderId,
        //         //     'receiverId':receiverId,
        //         // }
        //     )
        // });

        const sql = `SELECT *
                    FROM event
                    WHERE business_id = ? AND is_valid = ?
                    ORDER BY begin_at ASC
                    /*ORDER BY title ASC*/`;
        db.query(sql, [businessId, 1], (err, result) => {
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

Router.post("/:business_id/authentication/send_email", /*registerLimiter,*/ (req, res) => {
    try {
        let businessId = req.body.business_id;
        let email = req.body.email;
        let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        var otp = makeid(6);

        //console.log("businessId");
        //console.log(businessId);
        //console.log("email");
        //console.log(email);
        console.log("otp");
        console.log(otp);

        // //console.log(id);
        // let sent_otp = req.body.sent_otp;
        // //console.log(user_id);
        // //console.log(sent_otp);

        //chiedere di inserire l'username ed inviare l'email (o sms) all'email dell'utente con quell'username.
        //verficando prima che quell'utente esiste

        // const sql = `SELECT email FROM user WHERE id = ${user_id}`;
        // db.query(sql, (err, rows) => {
        //     //console.log(rows);
        //     if (err) console.log(err);
        //     //console.log("rows[0]");
        //     //console.log(rows[0]);
        //     // res.json(rows);
        // });

        let now = new Date(Date.now());
        // //console.log(now);
        // //console.log(now.getTime());

        // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
        let query = `INSERT INTO business_authentication (id, auth_type, business_id, sent_otp, sent_otp_at, is_success, is_logout) 
            VALUES (?, 'EMAIL', ?, ?, ?, 0, 0)`;
        db.query(query, [id, businessId, otp, new Date(Date.now()).toISOString()], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(new Date(Date.now()));

            // Step 1
            let transporter = nodemailer.createTransport({
                // service: 'gmail',
                // service: 'iCloud',
                // host: 'authsmtp.securemail.pro',
                host: 'email-smtp.eu-central-1.amazonaws.com',
                port: 465,
                // port: 587,
                secure: true, // true for 465, false for other ports
                // secure: false,
                auth: {
                    // user: process.env.EMAIL_USER,
                    user: process.env.AWS_SMTP_USER,
                    // pass: process.env.EMAIL_PASSWORD
                    pass: process.env.AWS_SMTP_PASSWORD
                },
                //TODO: da testare
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Step 2
            let mailOptions = {
                from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                to: email,
                // to: "bar@example.com, baz@example.com", // list of receivers
                // cc: 'ragon@gmail.com',
                subject: 'Codice di autenticazione per il tentativo di accesso',
                // subject: 'Hello ✔ Nodemailer - Test',
                // text: 'Wooohooo it works!!',
                html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
            };

            // Step 3
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) {
                    console.log('Error occurs', err);
                    return;
                }
                console.log('Email sent!!!');
            });

            res.json(id);
        });
        // res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/authentication/send_sms", /*registerLimiter,*/ (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let phone = req.body.phone;
        let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        var otp = makeid(6);

        //console.log("businessId");
        //console.log(businessId);
        //console.log("email");
        //console.log(email);
        console.log("otp");
        console.log(otp);

        // //console.log(id);
        // let sent_otp = req.body.sent_otp;
        // //console.log(user_id);
        // //console.log(sent_otp);

        //chiedere di inserire l'username ed inviare l'email (o sms) all'email dell'utente con quell'username.
        //verficando prima che quell'utente esiste

        // const sql = `SELECT email FROM user WHERE id = ${user_id}`;
        // db.query(sql, (err, rows) => {
        //     //console.log(rows);
        //     if (err) console.log(err);
        //     //console.log("rows[0]");
        //     //console.log(rows[0]);
        //     // res.json(rows);
        // });

        let now = new Date(Date.now());
        // //console.log(now);
        // //console.log(now.getTime());

        // const sql = `SELECT * FROM business WHERE phone = ? OR phone = '+39'?`;
        const sql = `SELECT 
                                business.id AS business_id,
                                business.name AS business_name,
                                business.cell AS business_cell,
                                business.info AS business_info,
                                business.image_url AS business_image_url,
                                business.phone AS business_phone,
                                business.email AS business_email,
                                business.address AS business_address,
                                business.city AS business_city,
                                business.province AS business_province,
                                business.postal_code AS business_postal_code,
                                business.region AS business_region,
                                business.address_number AS business_address_number,
                                business.created_at AS business_created_at
                            FROM business 
                            WHERE phone REGEXP ?;`;
        const regex = `^(\\+39)?${phone.replace(/^\+39/, '')}$`;
        // const regex = /^(\+39\s*)?3\d{1,2}\s*\d{3}\s*\d{3,4}$/;
        db.query(sql, [/*phone*/regex], (err, result12) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // console.log('result123355656')
            // console.log(result12)
            // console.log(result12[0].phone)

            if(result12.length === 0 || result12.length > 1) {
                return res.status(420).json({
                    success: false,
                });
            }

            // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
            let query = `INSERT INTO business_authentication (id, auth_type, business_id, sent_otp, sent_otp_at, is_success, is_logout) 
                VALUES (?, 'SMS', ?, ?, ?, 0, 0)`;
            db.query(query, [id, /*businessId*/result12[0].business_id, otp, new Date(Date.now()).toISOString()], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                // //console.log(new Date(Date.now()));


                // const params = {
                //     // Message: 'Questo è un messaggio di prova inviato 8564 gli ottomani 84668852 tramite AWS SNS 3552126666',
                //     Message: `Ciao, hai ricevuto una nuova richiesta di prenotazione! Il tuo codice di accesso è ${otp}. Per convalidarla accedi a questo link: www.nurebo.com.`,
                //     // PhoneNumber: '+393792216112',
                //     // PhoneNumber: '+393701315819',
                //     // PhoneNumber: `+39${phone}`,
                //     PhoneNumber: `${phone.startsWith('+39') ? phone : '+39'+phone}`,
                //     MessageAttributes: {
                //         'AWS.SNS.SMS.SenderID': {
                //             DataType: 'String',
                //             // BinaryValue: Buffer.from('...') || 'STRING_VALUE' /* Strings will be Base-64 encoded on your behalf */,
                //             StringValue: 'Nurebo'
                //         },
                //         // 'AWS.SNS.SMS.MaxPrice': {
                //         //     DataType: 'Number',
                //         //     StringValue: '0.10' // Costo massimo per SMS in USD
                //         // },
                //         'AWS.SNS.SMS.SMSType': {
                //             DataType: 'String',
                //             // StringValue: 'Promotional',
                //             StringValue: 'Transactional',
                //         },
                //         // 'AWS.SNS.SMS.OriginationIdentity': {
                //         //     DataType: 'String',
                //         //     StringValue: 'Mycompaguagli'
                //         // },
                //     },
                //     // MessageDeduplicationId: 'STRING_VALUE',
                //     // MessageGroupId: 'STRING_VALUE',
                //     // MessageStructure: 'STRING_VALUE',
                //     // Subject: 'subject otp',
                //     // TargetArn: 'STRING_VALUE',
                //     // TopicArn: 'STRING_VALUE'
                // };
                //
                // sns.publish(params, (err, data) => {
                //     if (err) {
                //         console.error("Errore nell'invio dell'SMS:");
                //         console.error(err);
                //     } else {
                //         console.log("SMS inviato con successo! ID messaggio:");
                //         console.log(data);
                //     }
                // });

                // Step 2
                let mailOptions = {
                    from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                    to: result12[0].business_email,
                    // to: "bar@example.com, baz@example.com", // list of receivers
                    // cc: 'ragon@gmail.com',
                    subject: 'Codice di autenticazione per il tentativo di accesso',
                    // subject: 'Hello ✔ Nodemailer - Test',
                    // text: 'Wooohooo it works!!',
                    html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
                };

                // Step 3
                transporter.sendMail(mailOptions, (err, data) => {
                    if (err) {
                        console.log('Error occurs', err);
                        return;
                    }
                    console.log('Email sent!!!');
                });

                //todo: restituire business e auth id

                res.json({
                    "business_authentication_id": id,
                    ...result12[0]
                });
            });
            // res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/authentication/:authentication_id/verify", /*registerLimiter,*/ (req, res) => {
    try {
        let id = req.body.id;
        let insertedOtp = req.body.inserted_otp;
        //console.log(req.body);
        //
        // console.log('JWT_key')
        // console.log(JWT_key)
        // console.log('process.env.JWT_KEY')
        // console.log(process.env.JWT_KEY)

        const sql1 = `UPDATE business_authentication SET inserted_otp = ?, inserted_otp_at = ? WHERE id = ?`;
        db.query(sql1, [insertedOtp, new Date(Date.now()).toISOString(), id], (err, rows) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // //console.log('>> results: ', rows);
            // var string = JSON.stringify(rows);
            // //console.log('>> string: ', string);
            // var json = JSON.parse(string);
            // //console.log('>> json: ', json);
            // //console.log('>> user.sent_otp: ', json[0].sent_otp);
            // //console.log('>> rows:', rows[0]);
        });

        const quer = `SELECT sent_otp, sent_otp_at FROM business_authentication WHERE id = ?`;
        db.query(quer, [id], (err, rows) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            let now = new Date(Date.now());
            let sent_otp_at = new Date(rows[0].sent_otp_at);
            console.log(now)
            // console.log(rows[0].sent_otp_at)
            console.log(sent_otp_at)
            console.log(now.getSeconds() - sent_otp_at.getSeconds())

            //console.log(rows[0].sent_otp);
            var success;
            if (insertedOtp === rows[0].sent_otp && now.getSeconds() - sent_otp_at.getSeconds() <= 300) {
                success = 1;
                const token = JWT.sign(
                    {id},
                    process.env.JWT_KEY,
                    // {expiresIn: 360000}
                );
                const sql2 = `UPDATE business_authentication 
                          SET is_success = ?, login_at = ? 
                          WHERE id = ?`;
                db.query(sql2, [success, new Date(Date.now()).toISOString(), id], (err, rows) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }
                });
                res.json({
                    success,
                    token
                });
            } else {
                success = 0;
                const sql2 = `UPDATE business_authentication SET is_success = ? WHERE id = ?`;
                db.query(sql2, [success, id], (err, rows) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }
                });
                res.json({
                    success,
                });
            }
            //console.log("success");
            //console.log(success);

            // //console.log("res.success");
            // //console.log(res.json(success));
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/authentication/:authentication_id/logout", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let authId = req.body.auth_id;

        const sql = `UPDATE business_authentication SET is_logout = ?, logout_at = ?
                    WHERE id = ?`;
        db.query(sql, [1, new Date(Date.now()).toISOString(), authId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // res.json({
            //     id,
            //     'image': "",
            //     'business_id': businessId,
            //     description,
            //     'price': parseFloat(price),
            //     'duration': parseInt(duration),
            //     title,
            //     'is_valid': 1,
            //     'previous': prestazioneId
            // });

            // result = result0;
            // res.json({result});
            res.json(result);
            // res.json(result0);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/register", (req, res) => {
//     let name = req.body.name;
//     let address = req.body.address;
//     let eventCategoryId = req.body.event_category_id;
//     let email = req.body.email;
//     let phone_number = req.body.phone_number;
//
//     //console.log(name);
//     // //console.log(username);
//     //console.log(email);
//     //console.log(phone_number);
//
//     let sql1 = `INSERT INTO business(name, email, address, phone_number) VALUES('${name}', '${email}', '${address}', '${phone_number}')`;
//     db.query(sql1, (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         //console.log('result');
//         //console.log(result);
//         // res.end(result);
//         // res.result;
//         res.json('ciao');
//     });
// });

// Router.post("/images", (req, res) => {
//     let businessId = req.body.id;
//     // //console.log(eventBusinessId);
//
//     const sql = `SELECT *
//                     FROM business_image
//                     WHERE business_id = '${businessId}'`;
//
//     db.query(sql, (err, result) => {
//         if (err) {
//             //console.log(err)
//             return res.status(500).send(err);
//         }
//         if (result != null) {
//             // //console.log(result);
//             // res.redirect('/category');
//             res.json(result);
//         }
//     });
//
// });

Router.get("/campaign/type", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        const sql = `SELECT *
                     FROM business_campaign_type
                     ORDER BY id ASC`;
        db.query(sql, [], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            res.json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/campaign", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let businessId = req.params.business_id;

        const sql = `SELECT 
                     business_campaign.id AS business_campaign_id, business_campaign.business_campaign_type_id,
                     business_campaign.business_id, business_campaign.created_at, 
                     
                     business_campaign_type.icon AS business_campaign_type_icon, 
                     business_campaign_type.icon_size AS business_campaign_type_icon_size, 
                     business_campaign_type.title AS business_campaign_type_title,
                     business_campaign_type.description AS business_campaign_type_description
                     
                     FROM business_campaign
                        LEFT JOIN business_campaign_type ON business_campaign.business_campaign_type_id = business_campaign_type.id
                     WHERE business_campaign.business_id = ?
                     ORDER BY business_campaign.created_at DESC`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // console.log('resultG5G5GBG5');
            // console.log(businessId);
            // console.log(result);

            res.json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/campaign", async (req, res) => {
Router.post("/campaign", /*checkDev,*/ async (req, res) => {
    try {
        //TODO: INVIARE A CLIENTI CHE SONO GIà STATI IN QUEL LOCALE
        let title = req.body.title;
        let body = req.body.body;
        let image = req.body.image;
        let array = [];

        const sql = `SELECT fcm_token FROM business
                 WHERE fcm_token IS NOT NULL AND fcm_token <> ''
                 ORDER BY RAND()
                 LIMIT 1000`;
        db.query(sql, [], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log(result);

            for (let i = 0; i < result.length; i++) {
                console.log(result[i].fcm_token);
                // if(result[i].fcm_token !== null){
                array.push(result[i].fcm_token);
                // }
            }

            await axios({
                method: 'POST',
                url: 'https://fcm.googleapis.com/fcm/send',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                },
                data: {
                    "notification": {
                        "title": `${title}`,
                        // "subtitle": /*`${}`*/"Promozione",
                        "body": `${body}`,
                        // "channel_id": "fcm_nurebo_admin_channel",
                        "android_channel_id": "fcm_nurebo_admin_channel",
                        // "image": `${image}`,
                        "vibrate": true,
                        "icon": "calendar",
                        // "sound": "piece_of_cake_611.mp3"
                        // "sound": "default",
                        // "tag": "ciccio"
                    },
                    "direct_boot_ok": true,
                    "data": {
                        "keyname": "any value"
                    },
                    "android": {
                        "notification": {
                            "image": `${image}`,
                            "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                            "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],

                            // "sound": "piece_of_cake_611.mp3",
                            // "sound": "default",
                            // "tag": "ciccio"
                        },
                        "direct_boot_ok": true
                    },
                    "registration_ids": array,
                    // "registration_ids": [`${result1[0].fcm_token}`, ],
                    // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                }
            }).then(function (response) {
                console.log(response.status);
                console.log(response.data);
                console.log(response.data.success);
            }).catch(function (error) {
                console.log(error);
            });

            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/campaign/device", /*checkDev,*/ async (req, res) => {
    try {
        //TODO: INVIARE A CLIENTI CHE SONO GIà STATI IN QUEL LOCALE
        let title = req.body.title;
        let body = req.body.body;
        let image = req.body.image;
        let array = [];

        const sql = `SELECT fcm_token 
                    FROM business_device
                 WHERE fcm_token IS NOT NULL AND fcm_token <> ''
                 ORDER BY RAND()
                 LIMIT 1000`;
        db.query(sql, /*[],*/ async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log(result);

            for (let i = 0; i < result.length; i++) {
                console.log(result[i].fcm_token);
                // if(result[i].fcm_token !== null){
                array.push(result[i].fcm_token);
                // }
            }

            await axios({
                method: 'POST',
                url: 'https://fcm.googleapis.com/fcm/send',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                },
                data: {
                    "notification": {
                        "title": `${title}`,
                        // "subtitle": /*`${}`*/"Promozione",
                        "body": `${body}`,
                        // "channel_id": "fcm_nurebo_admin_channel",
                        "android_channel_id": "fcm_nurebo_admin_channel",
                        "image": `${image}`,
                        "vibrate": true,
                        "icon": "calendar",
                        // "sound": "piece_of_cake_611.mp3",
                        // "sound": "default",
                        // "tag": "ciccio"
                    },
                    "direct_boot_ok": true,
                    "data": {
                        "keyname": "any value"
                    },
                    "android": {
                        "notification": {
                            // "image": `${image}`,
                            "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                            "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],

                            "sound": "piece_of_cake_611.mp3",
                            // "sound": "default",
                            // "tag": "ciccio"
                        },
                        "direct_boot_ok": true
                    },
                    "registration_ids": array,
                    // "registration_ids": [`${result1[0].fcm_token}`, ],
                    // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                }
            }).then(function (response) {
                console.log(response.status);
                console.log(response.data);
                console.log(response.data.success);
            }).catch(function (error) {
                console.log(error);
            });

            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/campaign/:campaign_id/user", /*checkBusinessAuth, checkBusiness,*/ async (req, res) => {
    try {
        let businessId = req.params.business_id;
        // let businessCampaignTypeId = parseInt(req.params.campaign_id);
        let businessCampaignId = req.params.campaign_id;
        // let title = req.body.title;
        // let body = req.body.body;
        // let image = req.body.image;
        // let array = [];
        // let businessCampaignId = uuidv4();
        // let businessCampaignNotificationId = uuidv4();
        // let maxBusinessCampaignPerWeek = 2;
        // let imageUrl = '';

            const sql = `SELECT DISTINCT 
                            business_campaign_notification_device.is_open,
                            
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,

                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description

                        FROM business_campaign_notification_device 
                            LEFT JOIN business_campaign_notification ON business_campaign_notification.id = business_campaign_notification_device.business_campaign_notification_id
                            LEFT JOIN business_campaign ON business_campaign.id = business_campaign_notification.business_campaign_id
                            LEFT JOIN user_device ON user_device.id = business_campaign_notification_device.user_device_id
                            LEFT JOIN user ON user_device.user_id = user.id
                            LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                        WHERE user_device.fcm_token IS NOT NULL 
                            AND user_device.fcm_token <> '' AND user.is_deleted = 0
                            AND user_authentication.is_success = 1 AND business_campaign.id = ?
                        ORDER BY user.name ASC`;
            await db.promise().query(sql, [businessCampaignId]).then(async (result, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                console.log('resultfg5g5ggg5');
                // console.log(result);
                console.log(result[0][0]);

                // for (let i = 0; i < result[0].length; i++) {
                //     console.log(result[0][i].fcm_token);
                //     // // if(result[i].fcm_token !== null){
                //     // array.push(result[0][i].fcm_token);
                //     // // }
                //     array.push(result[0][i]);
                // }

                res.json(result[0]);
            });

        // if (businessCampaignTypeId === 0) {
        //     console.log('businessCampaignTypeId')
        //     console.log(businessCampaignTypeId)
        //     const sql = `SELECT DISTINCT
        //                     user_device.id AS device_id, user_device.fcm_token,
        //                     user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
        //
        //                     user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email,
        //                     user.username AS user_username, user.phone_number AS user_phone_number,
        //                     user.name AS user_name, user.description AS user_description
        //
        //                 FROM user
        //                     LEFT JOIN user_authentication ON user_authentication.user_id = user.id
        //                     LEFT JOIN user_device ON user_device.user_id = user.id
        //                 WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
        //                     AND user_device.fcm_token <> '' AND user.is_deleted = 0
        //                     AND user_authentication.is_success = 1
        //                 ORDER BY user_device.created_at DESC
        //                 LIMIT 1000`;
        //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
        //         if (err) {
        //             console.log(err)
        //             return res.status(500).send(err);
        //         }
        //         console.log('resultfg5g5ggg5');
        //         // console.log(result);
        //         console.log(result[0][0]);
        //
        //         for (let i = 0; i < result[0].length; i++) {
        //             console.log(result[0][i].fcm_token);
        //             // // if(result[i].fcm_token !== null){
        //             // array.push(result[0][i].fcm_token);
        //             // // }
        //             array.push(result[0][i]);
        //         }
        //
        //         // res.json(result);
        //     });
        // }
        // else if (businessCampaignTypeId === 1) {
        //     const sql = `SELECT DISTINCT
        //                     user_device.id AS device_id, user_device.fcm_token,
        //                     user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
        //
        //                     user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email,
        //                     user.username AS user_username, user.phone_number AS user_phone_number,
        //                     user.name AS user_name, user.description AS user_description
        //
        //             FROM user_device
        //              LEFT JOIN user ON user_device.user_id = user.id
        //              LEFT JOIN user_authentication ON user_authentication.user_id = user.id
        //              LEFT JOIN user_order ON user_order.user_id = user.id
        //             WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
        //             AND user_device.fcm_token <> '' AND user_authentication.is_success = 1
        //             AND user_order.id IS NULL AND user.is_deleted = 0
        //             ORDER BY user_device.created_at DESC
        //             LIMIT 1000`;
        //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
        //         if (err) {
        //             console.log(err)
        //             return res.status(500).send(err);
        //         }
        //         // console.log(result);
        //
        //         for (let i = 0; i < result[0].length; i++) {
        //             console.log(result[0][i].fcm_token);
        //             // // if(result[i].fcm_token !== null){
        //             // array.push(result[0][i].fcm_token);
        //             // // }
        //
        //             array.push(result[0][i]);
        //         }
        //
        //     });
        // }
        // else if (businessCampaignTypeId === 2) {
        //     const sql = `SELECT DISTINCT
        //                     user_device.id AS device_id, user_device.fcm_token,
        //                     user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
        //
        //                     user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email,
        //                     user.username AS user_username, user.phone_number AS user_phone_number,
        //                     user.name AS user_name, user.description AS user_description
        //
        //             FROM user_device
        //              LEFT JOIN user ON user_device.user_id = user.id
        //              LEFT JOIN user_authentication ON user_authentication.user_id = user.id
        //              LEFT JOIN user_order ON user_order.user_id = user.id
        //             WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
        //             AND user_device.fcm_token <> '' AND user_authentication.is_success = 1
        //             AND user.is_deleted = 0
        //             ORDER BY user_device.created_at DESC
        //             LIMIT 1000`;
        //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
        //         if (err) {
        //             console.log(err)
        //             return res.status(500).send(err);
        //         }
        //         // console.log('result');
        //         // console.log(result);
        //
        //         for (let i = 0; i < result[0].length; i++) {
        //             console.log(result[0][i].fcm_token);
        //             // // if(result[i].fcm_token !== null){
        //             // array.push(result[0][i].fcm_token);
        //             // // }
        //             array.push(result[0][i]);
        //         }
        //
        //     });
        // }
        // else if (businessCampaignTypeId === 3) {
        //     const sql = `SELECT DISTINCT
        //                     user_device.id AS device_id, user_device.fcm_token,
        //                     user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
        //
        //                     user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email,
        //                     user.username AS user_username, user.phone_number AS user_phone_number,
        //                     user.name AS user_name, user.description AS user_description
        //                 FROM user_device
        //                   JOIN user ON user_device.user_id = user.id
        //                   JOIN user_authentication ON user_authentication.user_id = user.id
        //                   JOIN business_post ON business_post.user_id = user.id
        //                 WHERE user_authentication.business_id = ?
        //                     AND user_device.fcm_token IS NOT NULL AND user_device.fcm_token <> ''
        //                     AND user_authentication.is_success = 1 AND user.is_deleted = 0
        //                 ORDER BY user_device.created_at DESC
        //                 LIMIT 1000`;
        //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
        //         if (err) {
        //             console.log(err)
        //             return res.status(500).send(err);
        //         }
        //         // console.log(result);
        //
        //         for (let i = 0; i < result[0].length; i++) {
        //             console.log(result[0][i].fcm_token);
        //             // // if(result[i].fcm_token !== null){
        //             // array.push(result[0][i].fcm_token);
        //             // // }
        //             array.push(result[0][i]);
        //         }
        //
        //     });
        // }
        // else if (businessCampaignTypeId === 4) {
        //     const sql = `SELECT DISTINCT
        //                     user_device.id AS device_id, user_device.fcm_token,
        //                     user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
        //
        //                     user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email,
        //                     user.username AS user_username, user.phone_number AS user_phone_number,
        //                     user.name AS user_name, user.description AS user_description
        //
        //             FROM user_device
        //               LEFT JOIN user ON user_device.user_id = user.id
        //               LEFT JOIN user_authentication ON user_authentication.user_id = user.id
        //               LEFT JOIN user_order ON user_order.user_id = user.id
        //               LEFT JOIN prestazione_favorite ON prestazione_favorite.user_id = user.id
        //               LEFT JOIN prestazione ON prestazione_favorite.prestazione_id = prestazione.id
        //               LEFT JOIN business ON business.id = prestazione.business_id
        //             WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
        //             AND user_device.fcm_token <> '' AND user_authentication.is_success = 1 AND business.id = ?
        //             AND business.is_visible = 1 AND user.is_deleted = 0
        //             ORDER BY user_device.created_at DESC
        //             LIMIT 1000`;
        //     await db.promise().query(sql, [businessId, businessId]).then(async (result, err) => {
        //         if (err) {
        //             console.log(err)
        //             return res.status(500).send(err);
        //         }
        //         // console.log(result);
        //
        //         for (let i = 0; i < result[0].length; i++) {
        //             console.log(result[0][i].fcm_token);
        //             // // if(result[i].fcm_token !== null){
        //             // array.push(result[0][i].fcm_token);
        //             // // }
        //             array.push(result[0][i]);
        //         }
        //
        //         // res.json(result);
        //     });
        // }

        // console.log('array.length');
        // console.log(array.length);
        // /*await*/ res.json(array);

    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/campaign/type/:campaign_type_id/user", /*checkBusinessAuth, checkBusiness,*/ async (req, res) => {
    try {
        let businessId = req.params.business_id;
        let businessCampaignTypeId = parseInt(req.params.campaign_type_id);
        // let title = req.body.title;
        // let body = req.body.body;
        // let image = req.body.image;
        let array = [];
        // let businessCampaignId = uuidv4();
        // let businessCampaignNotificationId = uuidv4();
        // let maxBusinessCampaignPerWeek = 2;
        // let imageUrl = '';

        if (businessCampaignTypeId === 0) {
            console.log('businessCampaignTypeId')
            console.log(businessCampaignTypeId)
            const sql = `SELECT DISTINCT 
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description
                            
                        FROM user 
                            LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                            LEFT JOIN user_device ON user_device.user_id = user.id
                        WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL 
                            AND user_device.fcm_token <> '' AND user.is_deleted = 0
                            AND user_authentication.is_success = 1
                        ORDER BY user_device.created_at DESC
                        LIMIT 1000`;
            await db.promise().query(sql, [businessId]).then(async (result, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                console.log('resultfg5g5ggg5');
                // console.log(result);
                console.log(result[0][0]);

                for (let i = 0; i < result[0].length; i++) {
                    console.log(result[0][i].fcm_token);
                    // // if(result[i].fcm_token !== null){
                    // array.push(result[0][i].fcm_token);
                    // // }
                    array.push(result[0][i]);
                }

                // await axios({
                //     method: 'POST',
                //     url: 'https://fcm.googleapis.com/fcm/send',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                //     },
                //     data: {
                //         "notification": {
                //             "title": `${title}`,
                //             // "subtitle": /*`${}`*/"Promozione",
                //             "body": `${body}`,
                //             // "channel_id": "fcm_nurebo_admin_channel",
                //             "android_channel_id": "fcm_nurebo_admin_channel",
                //             // "image": `${signedUrl}`,
                //             "vibrate": true,
                //             "icon": "calendar",
                //             // "sound": "piece_of_cake_611.mp3",
                //             // "sound": "default",
                //             // "tag": "ciccio"
                //         },
                //         "direct_boot_ok": true,
                //         "data": {
                //             "keyname": "any value"
                //         },
                //         "android": {
                //             "notification": {
                //                 // "image": `${image}`,
                //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                //
                //                 "sound": "piece_of_cake_611.mp3",
                //                 // "sound": "default",
                //                 // "tag": "ciccio"
                //             },
                //             "direct_boot_ok": true
                //         },
                //         "registration_ids": array,
                //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                //     }
                // }).then(function (response) {
                //     console.log(response.status);
                //     console.log(response.data);
                //     console.log(response.data.success);
                // }).catch(function (error) {
                //     console.log(error);
                // });
                //
                // res.json(result);
            });
        }
        else if (businessCampaignTypeId === 1) {
            const sql = `SELECT DISTINCT 
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description
                            
                    FROM user_device 
                     LEFT JOIN user ON user_device.user_id = user.id
                     LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                     LEFT JOIN user_order ON user_order.user_id = user.id
                    WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL 
                    AND user_device.fcm_token <> '' AND user_authentication.is_success = 1
                    AND user_order.id IS NULL AND user.is_deleted = 0
                    ORDER BY user_device.created_at DESC
                    LIMIT 1000`;
            await db.promise().query(sql, [businessId]).then(async (result, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                console.log(result);

                for (let i = 0; i < result[0].length; i++) {
                    console.log(result[0][i].fcm_token);
                    // // if(result[i].fcm_token !== null){
                    // array.push(result[0][i].fcm_token);
                    // // }

                    array.push(result[0][i]);
                }

            });
        }
        else if (businessCampaignTypeId === 2) {
            const sql = `SELECT DISTINCT 
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description
                            
                    FROM user_device 
                     LEFT JOIN user ON user_device.user_id = user.id
                     LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                     LEFT JOIN user_order ON user_order.user_id = user.id
                    WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL 
                    AND user_device.fcm_token <> '' AND user_authentication.is_success = 1
                    AND user.is_deleted = 0
                    ORDER BY user_device.created_at DESC
                    LIMIT 1000`;
            await db.promise().query(sql, [businessId]).then(async (result, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                console.log(result);

                for (let i = 0; i < result[0].length; i++) {
                    console.log(result[0][i].fcm_token);
                    // // if(result[i].fcm_token !== null){
                    // array.push(result[0][i].fcm_token);
                    // // }
                    array.push(result[0][i]);
                }

            });
        }
        else if (businessCampaignTypeId === 3) {
            const sql = `SELECT DISTINCT 
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description
                        FROM user_device 
                          JOIN user ON user_device.user_id = user.id
                          JOIN user_authentication ON user_authentication.user_id = user.id
                          JOIN business_post ON business_post.user_id = user.id
                        WHERE user_authentication.business_id = ?
                            AND user_device.fcm_token IS NOT NULL AND user_device.fcm_token <> ''
                            AND user_authentication.is_success = 1 AND user.is_deleted = 0
                        ORDER BY user_device.created_at DESC
                        LIMIT 1000`;
            await db.promise().query(sql, [businessId]).then(async (result, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                console.log(result);

                for (let i = 0; i < result[0].length; i++) {
                    console.log(result[0][i].fcm_token);
                    // // if(result[i].fcm_token !== null){
                    // array.push(result[0][i].fcm_token);
                    // // }
                    array.push(result[0][i]);
                }

            });
        }
        else if (businessCampaignTypeId === 4) {
            const sql = `SELECT DISTINCT 
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description
                            
                    FROM user_device 
                      LEFT JOIN user ON user_device.user_id = user.id
                      LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                      LEFT JOIN user_order ON user_order.user_id = user.id
                      LEFT JOIN prestazione_favorite ON prestazione_favorite.user_id = user.id
                      LEFT JOIN prestazione ON prestazione_favorite.prestazione_id = prestazione.id
                      LEFT JOIN business ON business.id = prestazione.business_id
                    WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL 
                    AND user_device.fcm_token <> '' AND user_authentication.is_success = 1 AND business.id = ?
                    AND business.is_visible = 1 AND user.is_deleted = 0
                    ORDER BY user_device.created_at DESC
                    LIMIT 1000`;
            await db.promise().query(sql, [businessId, businessId]).then(async (result, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                console.log(result);

                for (let i = 0; i < result[0].length; i++) {
                    console.log(result[0][i].fcm_token);
                    // // if(result[i].fcm_token !== null){
                    // array.push(result[0][i].fcm_token);
                    // // }
                    array.push(result[0][i]);
                }

            });
        }

        console.log('array.length');
        console.log(array.length);
        res.json(array);

    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/campaign/device", /*checkBusinessAuth, checkBusiness,*/ upload1.single('image'), async (req, res) => {
    try {
        let businessId = req.params.business_id;
        let businessCampaignTypeId = parseInt(req.query.campaign_type_id);
        let title = req.body.title;
        let body = req.body.body;
        // let image = req.body.image;
        let userDeviceJson = JSON.parse(req.body.user_device);
        let array = [];
        let campaignNotificationDeviceInsertRows = [];
        let arrayDeviceIds = [];
        let businessCampaignId = uuidv4();
        let businessCampaignNotificationId = uuidv4();
        let maxBusinessCampaignPerWeek = 2;
        let imageUrl = '';
        console.log('userDeviceg5gg5h5');
        console.log(userDeviceJson);



        const sql599 = `SELECT COUNT(*) AS business_campaign_count
                        FROM business_campaign
                        WHERE business_campaign.business_id = ? AND business_campaign.created_at > 
                          CONCAT(SUBDATE(SUBDATE(DATE(?), WEEKDAY(?)), 0), ' 00:00:00')
                          AND business_campaign.created_at IS NOT NULL
                        ORDER BY business_campaign.created_at DESC`;
        await db.promise().query(sql599, [businessId, new Date(Date.now()).toISOString(), new Date(Date.now()).toISOString()]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            console.log('resultfgv6b');
            // console.log(result[0][0]);
            // console.log(result[0][0].business_campaign_count);
            console.log(parseInt(maxBusinessCampaignPerWeek) - parseInt(result[0][0].business_campaign_count));
            // console.log((parseInt(maxBusinessCampaign) - parseInt(result[0][0].business_campaign_count)) <= 0);

            if(1 <= 0){
            // if((parseInt(maxBusinessCampaignPerWeek) - parseInt(result[0][0].business_campaign_count)) <= 0){
                /*return*/ res.status(409).send('');
            }
            else{
                for (let i = 0; i < userDeviceJson.length; i++) {
                    // console.log(userDeviceJson[i].id);
                    // if(result[i].fcm_token !== null){
                    arrayDeviceIds.push(userDeviceJson[i].fcm_token);
                    // }
                }
                console.log('arrayDeviceIdsffff6ff6');
                console.log(arrayDeviceIds);

                const sql = `INSERT INTO business_campaign(id, business_campaign_type_id, business_id, created_at)
                 VALUES (?, ?, ?, ?)`;
                await db.promise().query(sql, [businessCampaignId, businessCampaignTypeId, businessId, new Date(Date.now()).toISOString()]).then(async (result, err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    // if (businessCampaignTypeId === 0) {
                    //     console.log('businessCampaignTypeId')
                    //     console.log(businessCampaignTypeId)
                    //     const sql = `SELECT DISTINCT user_device.fcm_token
                    //                 FROM user
                    //                 LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //                 LEFT JOIN user_device ON user_device.user_id = user.id
                    //                 WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
                    //                 AND user_device.fcm_token <> '' AND user.is_deleted = 0
                    //                 AND user_authentication.is_success = 1
                    //                 ORDER BY user_device.created_at DESC
                    //                 LIMIT 1000`;
                    //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
                    //         if (err) {
                    //             console.log(err)
                    //             return res.status(500).send(err);
                    //         }
                    //         console.log('resultfg5g5ggg5');
                    //         // console.log(result);
                    //         console.log(result[0][0]);
                    //
                    //         for (let i = 0; i < result[0].length; i++) {
                    //             console.log(result[0][i].fcm_token);
                    //             // if(result[i].fcm_token !== null){
                    //             array.push(result[0][i].fcm_token);
                    //             // }
                    //         }
                    //
                    //         // await axios({
                    //         //     method: 'POST',
                    //         //     url: 'https://fcm.googleapis.com/fcm/send',
                    //         //     headers: {
                    //         //         'Content-Type': 'application/json',
                    //         //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //         //     },
                    //         //     data: {
                    //         //         "notification": {
                    //         //             "title": `${title}`,
                    //         //             // "subtitle": /*`${}`*/"Promozione",
                    //         //             "body": `${body}`,
                    //         //             // "channel_id": "fcm_nurebo_admin_channel",
                    //         //             "android_channel_id": "fcm_nurebo_admin_channel",
                    //         //             // "image": `${signedUrl}`,
                    //         //             "vibrate": true,
                    //         //             "icon": "calendar",
                    //         //             // "sound": "piece_of_cake_611.mp3",
                    //         //             // "sound": "default",
                    //         //             // "tag": "ciccio"
                    //         //         },
                    //         //         "direct_boot_ok": true,
                    //         //         "data": {
                    //         //             "keyname": "any value"
                    //         //         },
                    //         //         "android": {
                    //         //             "notification": {
                    //         //                 // "image": `${image}`,
                    //         //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //         //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //         //
                    //         //                 "sound": "piece_of_cake_611.mp3",
                    //         //                 // "sound": "default",
                    //         //                 // "tag": "ciccio"
                    //         //             },
                    //         //             "direct_boot_ok": true
                    //         //         },
                    //         //         "registration_ids": array,
                    //         //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //         //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //         //     }
                    //         // }).then(function (response) {
                    //         //     console.log(response.status);
                    //         //     console.log(response.data);
                    //         //     console.log(response.data.success);
                    //         // }).catch(function (error) {
                    //         //     console.log(error);
                    //         // });
                    //         //
                    //         // res.json(result);
                    //     });
                    // }
                    // else if (businessCampaignTypeId === 1) {
                    //     const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id,
                    // user_device.fcm_token, user_device.manufacturer, user_device.model
                    // FROM user_device
                    //  LEFT JOIN user ON user_device.user_id = user.id
                    //  LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //  LEFT JOIN user_order ON user_order.user_id = user.id
                    // WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
                    // AND user_device.fcm_token <> '' AND user_authentication.is_success = 1
                    // AND user_order.id IS NULL AND user.is_deleted = 0
                    // ORDER BY user_device.created_at DESC
                    // LIMIT 1000`;
                    //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
                    //         if (err) {
                    //             console.log(err)
                    //             return res.status(500).send(err);
                    //         }
                    //         console.log(result);
                    //
                    //         for (let i = 0; i < result[0].length; i++) {
                    //             console.log(result[0][i].fcm_token);
                    //             // if(result[i].fcm_token !== null){
                    //             array.push(result[0][i].fcm_token);
                    //             // }
                    //         }
                    //
                    //         // await axios({
                    //         //     method: 'POST',
                    //         //     url: 'https://fcm.googleapis.com/fcm/send',
                    //         //     headers: {
                    //         //         'Content-Type': 'application/json',
                    //         //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //         //     },
                    //         //     data: {
                    //         //         "notification": {
                    //         //             "title": `${title}`,
                    //         //             // "subtitle": /*`${}`*/"Promozione",
                    //         //             "body": `${body}`,
                    //         //             // "channel_id": "fcm_nurebo_admin_channel",
                    //         //             "android_channel_id": "fcm_nurebo_admin_channel",
                    //         //             "image": `${image}`,
                    //         //             "vibrate": true,
                    //         //             "icon": "calendar",
                    //         //             // "sound": "piece_of_cake_611.mp3",
                    //         //             // "sound": "default",
                    //         //             // "tag": "ciccio"
                    //         //         },
                    //         //         "direct_boot_ok": true,
                    //         //         "data": {
                    //         //             "keyname": "any value"
                    //         //         },
                    //         //         "android": {
                    //         //             "notification": {
                    //         //                 // "image": `${image}`,
                    //         //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //         //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //         //
                    //         //                 "sound": "piece_of_cake_611.mp3",
                    //         //                 // "sound": "default",
                    //         //                 // "tag": "ciccio"
                    //         //             },
                    //         //             "direct_boot_ok": true
                    //         //         },
                    //         //         "registration_ids": array,
                    //         //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //         //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //         //     }
                    //         // }).then(function (response) {
                    //         //     console.log(response.status);
                    //         //     console.log(response.data);
                    //         //     console.log(response.data.success);
                    //         // }).catch(function (error) {
                    //         //     console.log(error);
                    //         // });
                    //         //
                    //         // res.json(result);
                    //     });
                    // }
                    // else if (businessCampaignTypeId === 2) {
                    //     const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id,
                    // user_device.fcm_token, user_device.manufacturer, user_device.model
                    // FROM user_device
                    //  LEFT JOIN user ON user_device.user_id = user.id
                    //  LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //  LEFT JOIN user_order ON user_order.user_id = user.id
                    // WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
                    // AND user_device.fcm_token <> '' AND user_authentication.is_success = 1 AND user.is_deleted = 0
                    // ORDER BY user_device.created_at DESC
                    // LIMIT 1000`;
                    //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
                    //         if (err) {
                    //             console.log(err)
                    //             return res.status(500).send(err);
                    //         }
                    //         console.log(result);
                    //
                    //         for (let i = 0; i < result[0].length; i++) {
                    //             console.log(result[0][i].fcm_token);
                    //             // if(result[i].fcm_token !== null){
                    //             array.push(result[0][i].fcm_token);
                    //             // }
                    //         }
                    //
                    //         // await axios({
                    //         //     method: 'POST',
                    //         //     url: 'https://fcm.googleapis.com/fcm/send',
                    //         //     headers: {
                    //         //         'Content-Type': 'application/json',
                    //         //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //         //     },
                    //         //     data: {
                    //         //         "notification": {
                    //         //             "title": `${title}`,
                    //         //             // "subtitle": /*`${}`*/"Promozione",
                    //         //             "body": `${body}`,
                    //         //             // "channel_id": "fcm_nurebo_admin_channel",
                    //         //             "android_channel_id": "fcm_nurebo_admin_channel",
                    //         //             "image": `${image}`,
                    //         //             "vibrate": true,
                    //         //             "icon": "calendar",
                    //         //             // "sound": "piece_of_cake_611.mp3",
                    //         //             // "sound": "default",
                    //         //             // "tag": "ciccio"
                    //         //         },
                    //         //         "direct_boot_ok": true,
                    //         //         "data": {
                    //         //             "keyname": "any value"
                    //         //         },
                    //         //         "android": {
                    //         //             "notification": {
                    //         //                 // "image": `${image}`,
                    //         //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //         //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //         //
                    //         //                 "sound": "piece_of_cake_611.mp3",
                    //         //                 // "sound": "default",
                    //         //                 // "tag": "ciccio"
                    //         //             },
                    //         //             "direct_boot_ok": true
                    //         //         },
                    //         //         "registration_ids": array,
                    //         //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //         //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //         //     }
                    //         // }).then(function (response) {
                    //         //     console.log(response.status);
                    //         //     console.log(response.data);
                    //         //     console.log(response.data.success);
                    //         // }).catch(function (error) {
                    //         //     console.log(error);
                    //         // });
                    //         //
                    //         // res.json(result);
                    //     });
                    // }
                    // else if (businessCampaignTypeId === 3) {
                    //     const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id, user_device.fcm_token, user_device.manufacturer, user_device.model
                    // FROM user_device
                    //   JOIN user ON user_device.user_id = user.id
                    //   JOIN user_authentication ON user_authentication.user_id = user.id
                    //   JOIN business_post ON business_post.user_id = user.id
                    // WHERE user_authentication.business_id = ?
                    //     AND user_device.fcm_token IS NOT NULL AND user_device.fcm_token <> ''
                    //     AND user_authentication.is_success = 1 AND user.is_deleted = 0
                    // ORDER BY user_device.created_at DESC
                    // LIMIT 1000`;
                    //     await db.promise().query(sql, [businessId]).then(async (result, err) => {
                    //         if (err) {
                    //             console.log(err)
                    //             return res.status(500).send(err);
                    //         }
                    //         console.log(result);
                    //
                    //         for (let i = 0; i < result[0].length; i++) {
                    //             console.log(result[0][i].fcm_token);
                    //             // if(result[i].fcm_token !== null){
                    //             array.push(result[0][i].fcm_token);
                    //             // }
                    //         }
                    //
                    //         // await axios({
                    //         //     method: 'POST',
                    //         //     url: 'https://fcm.googleapis.com/fcm/send',
                    //         //     headers: {
                    //         //         'Content-Type': 'application/json',
                    //         //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //         //     },
                    //         //     data: {
                    //         //         "notification": {
                    //         //             "title": `${title}`,
                    //         //             // "subtitle": /*`${}`*/"Promozione",
                    //         //             "body": `${body}`,
                    //         //             // "channel_id": "fcm_nurebo_admin_channel",
                    //         //             "android_channel_id": "fcm_nurebo_admin_channel",
                    //         //             "image": `${image}`,
                    //         //             "vibrate": true,
                    //         //             "icon": "calendar",
                    //         //             // "sound": "piece_of_cake_611.mp3",
                    //         //             // "sound": "default",
                    //         //             // "tag": "ciccio"
                    //         //         },
                    //         //         "direct_boot_ok": true,
                    //         //         "data": {
                    //         //             "keyname": "any value"
                    //         //         },
                    //         //         "android": {
                    //         //             "notification": {
                    //         //                 // "image": `${image}`,
                    //         //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //         //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //         //
                    //         //                 "sound": "piece_of_cake_611.mp3",
                    //         //                 // "sound": "default",
                    //         //                 // "tag": "ciccio"
                    //         //             },
                    //         //             "direct_boot_ok": true
                    //         //         },
                    //         //         "registration_ids": array,
                    //         //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //         //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //         //     }
                    //         // }).then(function (response) {
                    //         //     console.log(response.status);
                    //         //     console.log(response.data);
                    //         //     console.log(response.data.success);
                    //         // }).catch(function (error) {
                    //         //     console.log(error);
                    //         // });
                    //         //
                    //         // res.json(result);
                    //     });
                    // }
                    // else if (businessCampaignTypeId === 4) {
                    //     const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id,
                    // user_device.fcm_token, user_device.manufacturer, user_device.model
                    // FROM user_device
                    //   LEFT JOIN user ON user_device.user_id = user.id
                    //   LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //   LEFT JOIN user_order ON user_order.user_id = user.id
                    //   LEFT JOIN prestazione_favorite ON prestazione_favorite.user_id = user.id
                    //   LEFT JOIN prestazione ON prestazione_favorite.prestazione_id = prestazione.id
                    //   LEFT JOIN business ON business.id = prestazione.business_id
                    // WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
                    // AND user_device.fcm_token <> '' AND user_authentication.is_success = 1 AND business.id = ?
                    // AND business.is_visible = 1 AND user.is_deleted = 0
                    // ORDER BY user_device.created_at DESC
                    // LIMIT 1000`;
                    //     await db.promise().query(sql, [businessId, businessId]).then(async (result, err) => {
                    //         if (err) {
                    //             console.log(err)
                    //             return res.status(500).send(err);
                    //         }
                    //         console.log(result);
                    //
                    //         for (let i = 0; i < result[0].length; i++) {
                    //             console.log(result[0][i].fcm_token);
                    //             // if(result[i].fcm_token !== null){
                    //             array.push(result[0][i].fcm_token);
                    //             // }
                    //         }
                    //
                    //     });
                    // }
                    //
                    // console.log('arrayhh8h8h8hh55');
                    // console.log(array);

                    if (req.file !== undefined) {
                        if (req.file.mimetype === "image/png" || req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/webp") {
                            const resizedImage = await sharp(/*getObjectResult.Body*/Buffer.from(req.file.buffer))
                                .resize(
                                    960,
                                    960,
                                    {
                                        kernel: sharp.kernel.nearest,
                                        fit: sharp.fit.outside,
                                        // withoutEnlargement: true,
                                        // withoutReduction: true,
                                        // position: 'right top',
                                        // background: { r: 255, g: 255, b: 255, alpha: 0.5 }
                                    }
                                )
                                // .webp({
                                //     quality: 100,
                                //     lossless: true,
                                //     effort: 6,
                                // })
                                // .png({
                                //     quality: /*100*/5,
                                //     effort: 10,
                                //     palette: true,
                                //     // progressive: true,
                                //     // adaptiveFiltering: true,
                                // })
                                .jpeg(
                                    {
                                        quality: 60,
                                        force: true,
                                        progressive: true,
                                        trellisQuantisation: true,
                                        optimiseScans: true,
                                        chromaSubsampling: '4:4:4',
                                        mozjpeg: true,
                                    }
                                )
                                // .heif({
                                //     compression: "av1",
                                //     quality: 100,
                                //     effort: 9,
                                //     lossless: true,
                                // })
                                .toBuffer();

                            const params = {
                                Image: {
                                    // Bytes: req.file.buffer,
                                    // Bytes: Buffer.from(req.file.buffer),
                                    Bytes: /*data1*//*modifiedImage*/resizedImage,
                                    // Bytes: resizedImage,
                                },
                                MinConfidence: 90, // Imposta la soglia di confidenza desiderata
                            };

                            let detectLabels = await rekognition.detectModerationLabels(params).promise();

                            console.log(detectLabels)

                            const moderationLabels = detectLabels.ModerationLabels;

                            if (moderationLabels.length > 0) {
                                console.log('L\'immagine contiene contenuti pornografici.');
                                console.log('Etichette rilevate:', moderationLabels);
                                await res.status(400).json({error: "L immagine contiene contenuti non adatti."});
                                return;
                            } else {
                                console.log('L\'immagine è accettabile.');
                                // res.json({ message: 'L\'immagine è accettabile.' });
                                // Procedi con il salvataggio dell'immagine su S3
                            }

                            console.log(req.file)
                            let myFile = req.file.originalname.split(".")
                            const fileType = myFile[myFile.length - 1]
                            let s3Path = `image/${businessId}/campaign/${businessCampaignNotificationId}.${fileType}`;

                            const putObjectParams = {
                                Bucket: process.env.AWS_BUCKET_NAME,
                                // Key: `image/user/${userId}/${uuidv4()}.${fileType}`,
                                Key: s3Path,
                                Body: /*modifiedImage*/resizedImage,
                                // ACL: 'private', // Imposta l'ACL su "private" per limitare l'accesso all'immagine ridimensionata
                            };

                            // await s3.putObject(putObjectParams).promise();
                            await s3.upload(
                                putObjectParams,
                                async (error, data) => {
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
                                    console.log('data55999');
                                    console.log(data);

                                    const sql56 = `INSERT INTO business_campaign_notification (id, business_campaign_id, title, body, image_url, created_at)
                                            VALUES (?, ?, ?, ?, ?, ?)`;
                                    await db.promise().query(sql56, [businessCampaignNotificationId, businessCampaignId, title, body, /*data['Location']*/s3Path, new Date(Date.now()).toISOString()]).then(async (result, err) => {
                                        if (err) {
                                            console.log(err)
                                            return res.status(500).send(err);
                                        }

                                        for (let i = 0; i < userDeviceJson.length; i++) {
                                            console.log(userDeviceJson[i].id);
                                            // if(result[i].fcm_token !== null){
                                            campaignNotificationDeviceInsertRows.push([businessCampaignNotificationId, userDeviceJson[i].id, 0, new Date(Date.now()).toISOString()]);
                                            // }
                                        }

                                        const sql56 = `INSERT INTO business_campaign_notification_device (business_campaign_notification_id, user_device_id, is_open, created_at)
                                            VALUES ?`;
                                        // await db.promise().query(sql56, [businessCampaignNotificationId, , 0, new Date(Date.now()).toISOString()]).then(async (result, err) => {
                                        await db.promise().query(sql56, [campaignNotificationDeviceInsertRows]).then(async (result, err) => {
                                            if (err) {
                                                console.log(err)
                                                return res.status(500).send(err);
                                            }

                                            // res.status(200).send(data)
                                            // res.json(result);
                                            // res.status(200).send(
                                            //     JSON.stringify({
                                            //         // 'id': ,
                                            //         'image': /*data['Location']*/s3Path,
                                            //         'business_id': businessId,
                                            //         'description': description,
                                            //         'phone_number': phoneNumber,
                                            //         'max_contemporary_appointments': maxContemporaryAppointments,
                                            //         email,
                                            //         name,
                                            //     })
                                            // );

                                            const params = {
                                                // Bucket: 'nexyra-s3',
                                                // Bucket: 'nurebo-s3',
                                                Bucket: process.env.AWS_BUCKET_NAME,
                                                // Key: "pexels-cottonbro-3826676.jpg"
                                                // Key: "image/user/11/6b3d3928-9084-4352-bd38-b909f2e955bd.jpg"
                                                // Key: req.params.path
                                                // Key: req.query.path,
                                                Key: s3Path,
                                                Expires: 3600/*10*/, // Durata in secondi per cui l'URL sarà valido
                                            };

                                            /*imageUrl = await*/
                                            s3.getSignedUrl('getObject', params, async (err, signedUrl) => {
                                                if (err) {
                                                    console.error(err);
                                                    // res.status(500).send('');
                                                } else {
                                                    // console.log('signedUrl')
                                                    // console.log(signedUrl)

                                                    // imageUrl = signedUrl;

                                                    await axios({
                                                        method: 'POST',
                                                        url: 'https://fcm.googleapis.com/fcm/send',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            // Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                                                            Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                                                        },
                                                        data: {
                                                            "notification": {
                                                                "title": `${title}`,
                                                                // "subtitle": /*`${}`*/"Promozione",
                                                                "body": `${body}`,
                                                                // "channel_id": "fcm_nurebo_admin_channel",
                                                                "android_channel_id": "fcm_nurebo_channel",
                                                                // "image": `${s3Path}`,
                                                                "image": `${signedUrl}`,
                                                                "vibrate": true,
                                                                "icon": "calendar",
                                                                // "sound": "piece_of_cake_611.mp3",
                                                                // "sound": "default",
                                                                // "tag": "ciccio"
                                                            },
                                                            "direct_boot_ok": true,
                                                            "data": {
                                                                "keyname": "any value"
                                                            },
                                                            "android": {
                                                                "notification": {
                                                                    // "image": `${image}`,
                                                                    "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                                                    "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                                                                    "sound": "piece_of_cake_611.mp3",
                                                                    // "sound": "default",
                                                                    // "tag": "ciccio"
                                                                },
                                                                "direct_boot_ok": true
                                                            },
                                                            // "registration_ids": array,
                                                            "registration_ids": arrayDeviceIds,
                                                            // "registration_ids": [`${result1[0].fcm_token}`, ],
                                                            // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                                                        }
                                                    }).then(function (response) {
                                                        console.log(response.status);
                                                        // console.log(response.data);
                                                        console.log(response.data.success);
                                                    }).catch(function (error) {
                                                        console.log(error);
                                                    });

                                                    // res.send(signedUrl);
                                                }
                                            });
                                        });
                                    });
                                }
                            );
                        } else {
                            res.status(521).send("Immagine con formato non supportato");
                        }
                    }
                    else {
                        const sql56 = `INSERT INTO business_campaign_notification (id, business_campaign_id, title, body, created_at)
                                VALUES (?, ?, ?, ?, ?)`;
                        await db.promise().query(sql56, [businessCampaignNotificationId, businessCampaignId, title, body, new Date(Date.now()).toISOString()]).then(async (result, err) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }

                            // res.status(200).send(data)

                            // res.json(result);
                            await axios({
                                method: 'POST',
                                url: 'https://fcm.googleapis.com/fcm/send',
                                headers: {
                                    'Content-Type': 'application/json',
                                    // Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                                    Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                                },
                                data: {
                                    "notification": {
                                        "title": `${title}`,
                                        // "subtitle": /*`${}`*/"Promozione",
                                        "body": `${body}`,
                                        // "channel_id": "fcm_nurebo_admin_channel",
                                        "android_channel_id": "fcm_nurebo_channel",
                                        // "image": `${s3Path}`,
                                        // "image": `${imageUrl}`,
                                        "vibrate": true,
                                        "icon": "calendar",
                                        // "sound": "piece_of_cake_611.mp3",
                                        // "sound": "default",
                                        // "tag": "ciccio"
                                    },
                                    "direct_boot_ok": true,
                                    "data": {
                                        "keyname": "any value"
                                    },
                                    "android": {
                                        "notification": {
                                            // "image": `${image}`,
                                            "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                            "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                                            "sound": "piece_of_cake_611.mp3",
                                            // "sound": "default",
                                            // "tag": "ciccio"
                                        },
                                        "direct_boot_ok": true
                                    },
                                    // "registration_ids": array,
                                    "registration_ids": arrayDeviceIds,
                                    // "registration_ids": [`${result1[0].fcm_token}`, ],
                                    // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                                }
                            }).then(function (response) {
                                console.log(response.status);
                                // console.log(response.data);
                                console.log(response.data.success);
                            }).catch(function (error) {
                                console.log(error);
                            });

                        });

                    }

                    console.log('arrayf6gg6g6g');
                    console.log(array);
                    console.log(imageUrl);

                    res.json(result);


                    // const params = {
                    //     // Bucket: 'nexyra-s3',
                    //     // Bucket: 'nurebo-s3',
                    //     Bucket: process.env.AWS_BUCKET_NAME,
                    //     // Key: "pexels-cottonbro-3826676.jpg"
                    //     // Key: "image/user/11/6b3d3928-9084-4352-bd38-b909f2e955bd.jpg"
                    //     // Key: req.params.path
                    //     Key: req.query.path,
                    //     Expires: 3600/*10*/, // Durata in secondi per cui l'URL sarà valido
                    // };
                    //
                    // /*const signedUrl = await*/
                    // s3.getSignedUrl('getObject', params, (err, signedUrl) => {
                    //
                    //     console.error(err);
                    //
                    //     // console.log(signedUrl)
                    //
                    //     if (businessCampaignTypeId === 0) {
                    //         const sql = `SELECT DISTINCT user_device.fcm_token
                    //                 FROM user
                    //                 LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //                 LEFT JOIN user_device ON user_device.user_id = user.id
                    //                 WHERE user_authentication.business_id = ? AND fcm_token IS NOT NULL AND fcm_token <> ''
                    //                 AND user_authentication.is_success = 1
                    //                 ORDER BY user_device.created_at DESC
                    //                 LIMIT 1000`;
                    //         db.query(sql, [businessId], async (err, result) => {
                    //             if (err) {
                    //                 console.log(err)
                    //                 return res.status(500).send(err);
                    //             }
                    //             console.log(result);
                    //
                    //             for (let i = 0; i < result.length; i++) {
                    //                 console.log(result[i].fcm_token);
                    //                 // if(result[i].fcm_token !== null){
                    //                 array.push(result[i].fcm_token);
                    //                 // }
                    //             }
                    //
                    //             await axios({
                    //                 method: 'POST',
                    //                 url: 'https://fcm.googleapis.com/fcm/send',
                    //                 headers: {
                    //                     'Content-Type': 'application/json',
                    //                     Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //                 },
                    //                 data: {
                    //                     "notification": {
                    //                         "title": `${title}`,
                    //                         // "subtitle": /*`${}`*/"Promozione",
                    //                         "body": `${body}`,
                    //                         // "channel_id": "fcm_nurebo_admin_channel",
                    //                         "android_channel_id": "fcm_nurebo_admin_channel",
                    //                         "image": `${signedUrl}`,
                    //                         "vibrate": true,
                    //                         "icon": "calendar",
                    //                         // "sound": "piece_of_cake_611.mp3",
                    //                         // "sound": "default",
                    //                         // "tag": "ciccio"
                    //                     },
                    //                     "direct_boot_ok": true,
                    //                     "data": {
                    //                         "keyname": "any value"
                    //                     },
                    //                     "android": {
                    //                         "notification": {
                    //                             // "image": `${image}`,
                    //                             "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //                             "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //
                    //                             "sound": "piece_of_cake_611.mp3",
                    //                             // "sound": "default",
                    //                             // "tag": "ciccio"
                    //                         },
                    //                         "direct_boot_ok": true
                    //                     },
                    //                     "registration_ids": array,
                    //                     // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //                     // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //                 }
                    //             }).then(function (response) {
                    //                 console.log(response.status);
                    //                 console.log(response.data);
                    //                 console.log(response.data.success);
                    //             }).catch(function (error) {
                    //                 console.log(error);
                    //             });
                    //
                    //             res.json(result);
                    //         });
                    //     }
                    //     else if (businessCampaignTypeId === 1) {
                    //         const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id,
                    //                     user_device.fcm_token, user_device.manufacturer, user_device.model
                    //                     FROM user_device
                    //                      LEFT JOIN user ON user_device.user_id = user.id
                    //                      LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //                      LEFT JOIN user_order ON user_order.user_id = user.id
                    //                     WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
                    //                     AND user_device.fcm_token <> '' AND user_authentication.is_success = 1
                    //                     AND user_order.id IS NULL
                    //                     ORDER BY user_device.created_at DESC
                    //                     LIMIT 1000`;
                    //         db.query(sql, [businessId], async (err, result) => {
                    //             if (err) {
                    //                 console.log(err)
                    //                 return res.status(500).send(err);
                    //             }
                    //             console.log(result);
                    //
                    //             for (let i = 0; i < result.length; i++) {
                    //                 console.log(result[i].fcm_token);
                    //                 // if(result[i].fcm_token !== null){
                    //                 array.push(result[i].fcm_token);
                    //                 // }
                    //             }
                    //
                    //             await axios({
                    //                 method: 'POST',
                    //                 url: 'https://fcm.googleapis.com/fcm/send',
                    //                 headers: {
                    //                     'Content-Type': 'application/json',
                    //                     Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //                 },
                    //                 data: {
                    //                     "notification": {
                    //                         "title": `${title}`,
                    //                         // "subtitle": /*`${}`*/"Promozione",
                    //                         "body": `${body}`,
                    //                         // "channel_id": "fcm_nurebo_admin_channel",
                    //                         "android_channel_id": "fcm_nurebo_admin_channel",
                    //                         "image": `${image}`,
                    //                         "vibrate": true,
                    //                         "icon": "calendar",
                    //                         // "sound": "piece_of_cake_611.mp3",
                    //                         // "sound": "default",
                    //                         // "tag": "ciccio"
                    //                     },
                    //                     "direct_boot_ok": true,
                    //                     "data": {
                    //                         "keyname": "any value"
                    //                     },
                    //                     "android": {
                    //                         "notification": {
                    //                             // "image": `${image}`,
                    //                             "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //                             "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //
                    //                             "sound": "piece_of_cake_611.mp3",
                    //                             // "sound": "default",
                    //                             // "tag": "ciccio"
                    //                         },
                    //                         "direct_boot_ok": true
                    //                     },
                    //                     "registration_ids": array,
                    //                     // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //                     // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //                 }
                    //             }).then(function (response) {
                    //                 console.log(response.status);
                    //                 console.log(response.data);
                    //                 console.log(response.data.success);
                    //             }).catch(function (error) {
                    //                 console.log(error);
                    //             });
                    //
                    //             res.json(result);
                    //         });
                    //     }
                    //     else if (businessCampaignTypeId === 2) {
                    //         const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id,
                    //                     user_device.fcm_token, user_device.manufacturer, user_device.model
                    //                     FROM user_device
                    //                      LEFT JOIN user ON user_device.user_id = user.id
                    //                      LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //                      LEFT JOIN user_order ON user_order.user_id = user.id
                    //                     WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
                    //                     AND user_device.fcm_token <> '' AND user_authentication.is_success = 1
                    //                     ORDER BY user_device.created_at DESC
                    //                     LIMIT 1000`;
                    //         db.query(sql, [businessId], async (err, result) => {
                    //             if (err) {
                    //                 console.log(err)
                    //                 return res.status(500).send(err);
                    //             }
                    //             console.log(result);
                    //
                    //             for (let i = 0; i < result.length; i++) {
                    //                 console.log(result[i].fcm_token);
                    //                 // if(result[i].fcm_token !== null){
                    //                 array.push(result[i].fcm_token);
                    //                 // }
                    //             }
                    //
                    //             await axios({
                    //                 method: 'POST',
                    //                 url: 'https://fcm.googleapis.com/fcm/send',
                    //                 headers: {
                    //                     'Content-Type': 'application/json',
                    //                     Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //                 },
                    //                 data: {
                    //                     "notification": {
                    //                         "title": `${title}`,
                    //                         // "subtitle": /*`${}`*/"Promozione",
                    //                         "body": `${body}`,
                    //                         // "channel_id": "fcm_nurebo_admin_channel",
                    //                         "android_channel_id": "fcm_nurebo_admin_channel",
                    //                         "image": `${image}`,
                    //                         "vibrate": true,
                    //                         "icon": "calendar",
                    //                         // "sound": "piece_of_cake_611.mp3",
                    //                         // "sound": "default",
                    //                         // "tag": "ciccio"
                    //                     },
                    //                     "direct_boot_ok": true,
                    //                     "data": {
                    //                         "keyname": "any value"
                    //                     },
                    //                     "android": {
                    //                         "notification": {
                    //                             // "image": `${image}`,
                    //                             "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //                             "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //
                    //                             "sound": "piece_of_cake_611.mp3",
                    //                             // "sound": "default",
                    //                             // "tag": "ciccio"
                    //                         },
                    //                         "direct_boot_ok": true
                    //                     },
                    //                     "registration_ids": array,
                    //                     // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //                     // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //                 }
                    //             }).then(function (response) {
                    //                 console.log(response.status);
                    //                 console.log(response.data);
                    //                 console.log(response.data.success);
                    //             }).catch(function (error) {
                    //                 console.log(error);
                    //             });
                    //
                    //             res.json(result);
                    //         });
                    //     }
                    //     else if (businessCampaignTypeId === 3) {
                    //         const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id, user_device.fcm_token, user_device.manufacturer, user_device.model
                    //                     FROM user_device
                    //                       JOIN user ON user_device.user_id = user.id
                    //                       JOIN user_authentication ON user_authentication.user_id = user.id
                    //                       JOIN business_post ON business_post.user_id = user.id
                    //                     WHERE user_authentication.business_id = ?
                    //                         AND user_device.fcm_token IS NOT NULL AND user_device.fcm_token <> ''
                    //                         AND user_authentication.is_success = 1
                    //                     ORDER BY user_device.created_at DESC
                    //                     LIMIT 1000`;
                    //         db.query(sql, [businessId], async (err, result) => {
                    //             if (err) {
                    //                 console.log(err)
                    //                 return res.status(500).send(err);
                    //             }
                    //             console.log(result);
                    //
                    //             for (let i = 0; i < result.length; i++) {
                    //                 console.log(result[i].fcm_token);
                    //                 // if(result[i].fcm_token !== null){
                    //                 array.push(result[i].fcm_token);
                    //                 // }
                    //             }
                    //
                    //             await axios({
                    //                 method: 'POST',
                    //                 url: 'https://fcm.googleapis.com/fcm/send',
                    //                 headers: {
                    //                     'Content-Type': 'application/json',
                    //                     Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //                 },
                    //                 data: {
                    //                     "notification": {
                    //                         "title": `${title}`,
                    //                         // "subtitle": /*`${}`*/"Promozione",
                    //                         "body": `${body}`,
                    //                         // "channel_id": "fcm_nurebo_admin_channel",
                    //                         "android_channel_id": "fcm_nurebo_admin_channel",
                    //                         "image": `${image}`,
                    //                         "vibrate": true,
                    //                         "icon": "calendar",
                    //                         // "sound": "piece_of_cake_611.mp3",
                    //                         // "sound": "default",
                    //                         // "tag": "ciccio"
                    //                     },
                    //                     "direct_boot_ok": true,
                    //                     "data": {
                    //                         "keyname": "any value"
                    //                     },
                    //                     "android": {
                    //                         "notification": {
                    //                             // "image": `${image}`,
                    //                             "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //                             "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //
                    //                             "sound": "piece_of_cake_611.mp3",
                    //                             // "sound": "default",
                    //                             // "tag": "ciccio"
                    //                         },
                    //                         "direct_boot_ok": true
                    //                     },
                    //                     "registration_ids": array,
                    //                     // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //                     // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //                 }
                    //             }).then(function (response) {
                    //                 console.log(response.status);
                    //                 console.log(response.data);
                    //                 console.log(response.data.success);
                    //             }).catch(function (error) {
                    //                 console.log(error);
                    //             });
                    //
                    //             res.json(result);
                    //         });
                    //     }
                    //     else if (businessCampaignTypeId === 4) {
                    //         const sql = `SELECT DISTINCT user.id AS user_id, user_device.id AS device_id,
                    //                     user_device.fcm_token, user_device.manufacturer, user_device.model
                    //                     FROM user_device
                    //                       LEFT JOIN user ON user_device.user_id = user.id
                    //                       LEFT JOIN user_authentication ON user_authentication.user_id = user.id
                    //                       LEFT JOIN user_order ON user_order.user_id = user.id
                    //                       LEFT JOIN prestazione_favorite ON prestazione_favorite.user_id = user.id
                    //                       LEFT JOIN prestazione ON prestazione_favorite.prestazione_id = prestazione.id
                    //                       LEFT JOIN business ON business.id = prestazione.business_id
                    //                     WHERE user_authentication.business_id = ? AND user_device.fcm_token IS NOT NULL
                    //                     AND user_device.fcm_token <> '' AND user_authentication.is_success = 1 AND business.id = ?
                    //                     ORDER BY user_device.created_at DESC
                    //                     LIMIT 1000`;
                    //         db.query(sql, [businessId, businessId], async (err, result) => {
                    //             if (err) {
                    //                 console.log(err)
                    //                 return res.status(500).send(err);
                    //             }
                    //             console.log(result);
                    //
                    //             for (let i = 0; i < result.length; i++) {
                    //                 console.log(result[i].fcm_token);
                    //                 // if(result[i].fcm_token !== null){
                    //                 array.push(result[i].fcm_token);
                    //                 // }
                    //             }
                    //
                    //             await axios({
                    //                 method: 'POST',
                    //                 url: 'https://fcm.googleapis.com/fcm/send',
                    //                 headers: {
                    //                     'Content-Type': 'application/json',
                    //                     Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                    //                 },
                    //                 data: {
                    //                     "notification": {
                    //                         "title": `${title}`,
                    //                         // "subtitle": /*`${}`*/"Promozione",
                    //                         "body": `${body}`,
                    //                         // "channel_id": "fcm_nurebo_admin_channel",
                    //                         "android_channel_id": "fcm_nurebo_admin_channel",
                    //                         "image": `${image}`,
                    //                         "vibrate": true,
                    //                         "icon": "calendar",
                    //                         // "sound": "piece_of_cake_611.mp3",
                    //                         // "sound": "default",
                    //                         // "tag": "ciccio"
                    //                     },
                    //                     "direct_boot_ok": true,
                    //                     "data": {
                    //                         "keyname": "any value"
                    //                     },
                    //                     "android": {
                    //                         "notification": {
                    //                             // "image": `${image}`,
                    //                             "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                    //                             "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                    //
                    //                             "sound": "piece_of_cake_611.mp3",
                    //                             // "sound": "default",
                    //                             // "tag": "ciccio"
                    //                         },
                    //                         "direct_boot_ok": true
                    //                     },
                    //                     "registration_ids": array,
                    //                     // "registration_ids": [`${result1[0].fcm_token}`, ],
                    //                     // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    //                 }
                    //             }).then(function (response) {
                    //                 console.log(response.status);
                    //                 console.log(response.data);
                    //                 console.log(response.data.success);
                    //             }).catch(function (error) {
                    //                 console.log(error);
                    //             });
                    //
                    //             res.json(result);
                    //         });
                    //     }
                    //
                    // });
                });

            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:business_id/booking/guest/:booking_id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let bookingId = req.body.booking_id;
        console.log(bookingId)

        const sql = `UPDATE guest_booking
                    SET is_canceled = 1, deleted_at = ?
                    WHERE id = ?`;
        db.query(sql, [new Date(Date.now()).toISOString(), bookingId], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            console.log(result);
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/prestazione", checkBusinessAuth, /*checkBusiness,*/ /*upload,*/ upload1.single("image"), (req, res, next) => {
    try {
        let businessId = req.body.business_id;
        let price = req.body.price;
        let priceMin = req.body.price_min;
        let priceMax = req.body.price_max;
        let isPriceRange = req.body.is_price_range;
        let title = req.body.title;
        let description = req.body.description;
        let duration = req.body.duration;
        let id = uuidv4();

        // checkBusiness(req, res, next);
        const sql6 = `SELECT business_id FROM business_authentication WHERE id = ?`;
        db.query(sql6, [req.decoded.id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkBusiness')
            console.log(result[0].business_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            if (result[0].business_id !== req.body.business_id) {
                // res.status(401).send(result);
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

        const sql = `INSERT INTO prestazione(id, business_id, description, is_price_range, price, price_min, price_max, duration, title, is_valid, created_at)
             VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [id, businessId, description, isPriceRange, price, priceMin, priceMax, duration, title, 1, new Date(Date.now()).toISOString()], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            if (req.file === undefined) {
                // res.status(200).send(data)
                res.status(200).send(
                    JSON.stringify({
                        'id': id,
                        'image': '',
                        'business_id': businessId,
                        'description': description,
                        'is_price_range': isPriceRange,
                        'price': parseFloat(price),
                        'price_min': parseFloat(priceMin),
                        'price_max': parseFloat(priceMax),
                        'duration': parseInt(duration),
                        'title': title,
                        'is_valid': 1,
                        'previous': ''
                    })
                );
            } else {
                if (req.file.mimetype === "image/png" || req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/webp") {

                    // const {buffer, originalname} = req.file;
                    //
                    // const form = new formData();
                    // form.append('imagerr', buffer, {filename: originalname});
                    //
                    // const response = await axios.post('http://localhost:7979/compress-image', form, {
                    //     headers: form.getHeaders(),
                    //     responseType: 'arraybuffer'
                    // });
                    //
                    // // Elabora la risposta
                    // const modifiedImage = response.data;

                    const resizedImage = await sharp(/*getObjectResult.Body*/Buffer.from(req.file.buffer))
                        .resize(
                            960,
                            960,
                            {
                                kernel: sharp.kernel.nearest,
                                fit: sharp.fit.outside,
                                // withoutEnlargement: true,
                                // withoutReduction: true,
                                // position: 'right top',
                                // background: { r: 255, g: 255, b: 255, alpha: 0.5 }
                            }
                        )
                        // .webp({
                        //     quality: 100,
                        //     lossless: true,
                        //     effort: 6,
                        // })
                        // .png({
                        //     quality: /*100*/5,
                        //     effort: 10,
                        //     palette: true,
                        //     // progressive: true,
                        //     // adaptiveFiltering: true,
                        // })
                        .jpeg(
                            {
                                quality: 60,
                                force: true,
                                progressive: true,
                                trellisQuantisation: true,
                                optimiseScans: true,
                                chromaSubsampling: '4:4:4',
                                mozjpeg: true,
                            }
                        )
                        // .heif({
                        //     compression: "av1",
                        //     quality: 100,
                        //     effort: 9,
                        //     lossless: true,
                        // })
                        .toBuffer();

                    const rekognitionParams = {
                        Image: {
                            // Bytes: req.file.buffer,
                            // Bytes: Buffer.from(req.file.buffer),
                            Bytes: /*modifiedImage*/resizedImage,
                        },
                        MinConfidence: 90, // Imposta la soglia di confidenza desiderata
                    };

                    let detectLabels = await rekognition.detectModerationLabels(rekognitionParams).promise();

                    console.log(detectLabels)

                    const moderationLabels = detectLabels.ModerationLabels;

                    if (moderationLabels.length > 0) {
                        console.log('L\'immagine contiene contenuti pornografici.');
                        console.log('Etichette rilevate:', moderationLabels);
                        // return res.status(400).json({ error: 'L\'immagine contiene contenuti pornografici.' });
                    }
                    else {
                        console.log('L\'immagine è accettabile.');
                        // res.json({ message: 'L\'immagine è accettabile.' });
                        // Procedi con il salvataggio dell'immagine su S3
                    }

                    console.log(req.file)
                    let myFile = req.file.originalname.split(".")
                    const fileType = myFile[myFile.length - 1]
                    let s3Path = `image/prestazione/${id}/${uuidv4()}.${fileType}`;

                    // res.send({
                    //     message: "Hello World!"
                    // })

                    const params = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        // Key: `${uuid()}.${fileType}`,
                        // Key: `image/prestazione/${id}/${uuidv4()}.${fileType}`,
                        Key: s3Path,
                        // Body: req.file.buffer
                        Body: /*modifiedImage*/resizedImage,
                    }

                    s3.upload(
                        params,
                        (error, data) => {
                            if (error || moderationLabels.length > 0) {
                                console.log(error)

                                const sql2 = `DELETE FROM prestazione WHERE id = ?`;
                                db.query(sql2, [id], (err, result) => {
                                    if (err) {
                                        console.log(err)
                                        return res.status(500).send(err);
                                    }
                                    res.status(500).send("");
                                });
                                if (error) {
                                    res.status(500).send(error)
                                } else if (moderationLabels.length > 0) {
                                    return res.status(400).send('L\'immagine contiene contenuti sensibili.');
                                }
                            }
                            console.log(data);

                            const sql0 = `UPDATE prestazione SET image = ?
                                WHERE id = ?`;
                            db.query(sql0, [/*data['Location']*/s3Path, id], (err, result0) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).send(err);
                                }

                                // res.status(200).send(data)
                                res.status(200).send(
                                    JSON.stringify({
                                        'id': id,
                                        'image': /*data['Location']*/s3Path,
                                        'business_id': businessId,
                                        'description': description,
                                        'price': parseFloat(price),
                                        'price_min': parseFloat(priceMin),
                                        'price_max': parseFloat(priceMax),
                                        'is_price_range': isPriceRange,
                                        'duration': parseInt(duration),
                                        'title': title,
                                        'is_valid': 1,
                                        'previous': ''
                                    })
                                );
                            });
                        }
                    );
                }
                    // else if (req.file.mimetype === "image/webp") {
                    //     res.status(520).send("Immagine con formato non supportato");
                // }
                else {
                    res.status(521).send("Immagine con formato non supportato");
                }
            }
        });
    }
    catch (error) {
        console.error('Errore durante l\'invio dell\'immagine:', error);
        res.status(500).send('Errore durante l\'invio dell\'immagine');
    }
});

Router.put("/:business_id/prestazione/:prestazione_id", checkBusinessAuth, /*checkBusiness,*/ /*upload*/upload1.single("image"), (req, res) => {
    try {
        let prestazioneId = req.body.prestazione_id;
        let businessId = req.body.business_id;
        let price = req.body.price;
        let priceMin = req.body.price_min;
        let priceMax = req.body.price_max;
        let isPriceRange = req.body.is_price_range;
        let title = req.body.title;
        let image = req.body.image;
        let description = req.body.description;
        let duration = req.body.duration;

        //console.log(price);
        // price = parseFloat(price.toString());
        // //console.log(price);

        // checkBusiness(req, res, next);
        const sql6 = `SELECT business_id FROM business_authentication WHERE id = ?`;
        db.query(sql6, [req.decoded.id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkBusiness')
            console.log(result[0].business_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            if (result[0].business_id !== req.body.business_id) {
                // res.status(401).send(result);
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

        const sql0 = `UPDATE prestazione SET is_valid = ?
                    WHERE id = ?`;
        db.query(sql0, [0, prestazioneId], async (err, result0) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            let id = uuidv4();

            if (req.file === undefined) {
                const sql5 = `INSERT INTO prestazione(id, business_id, image, description, is_price_range, price, price_min, price_max, duration, title, is_valid, previous, created_at)
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.query(sql5, [id, businessId, image, description, isPriceRange, price, priceMin, priceMax, duration, title, 1, prestazioneId, new Date(Date.now()).toISOString()], async (err, result1) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    const sql165 = `UPDATE business_post 
                                    SET business_post.prestazione_id = ?
                                    WHERE business_post.prestazione_id = ?`;
                    db.query(sql165, [id, prestazioneId], (err, result) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send('');
                        }

                        // res.status(200).send(data)
                        res.status(200).send(
                            JSON.stringify({
                                'id': id,
                                'image': image,
                                'business_id': businessId,
                                'description': description,
                                'price': parseFloat(price),
                                'price_min': parseFloat(priceMin),
                                'is_price_range': isPriceRange,
                                'price_max': parseFloat(priceMax),
                                'duration': parseInt(duration),
                                'title': title,
                                'is_valid': 1,
                                'previous': ''
                            })
                        );
                    });
                });
            }
            else {
                if (req.file.mimetype === "image/png" || req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/webp") {

                    // const {buffer, originalname} = req.file;
                    //
                    // const form = new formData();
                    // form.append('imagerr', buffer, {filename: originalname});
                    //
                    // const response = await axios.post('http://localhost:7979/compress-image', form, {
                    //     headers: form.getHeaders(),
                    //     responseType: 'arraybuffer'
                    // });
                    //
                    // const modifiedImage = response.data;

                    const resizedImage = await sharp(/*getObjectResult.Body*/Buffer.from(req.file.buffer))
                        .resize(
                            960,
                            960,
                            {
                                kernel: sharp.kernel.nearest,
                                fit: sharp.fit.outside,
                                // withoutEnlargement: true,
                                // withoutReduction: true,
                                // position: 'right top',
                                // background: { r: 255, g: 255, b: 255, alpha: 0.5 }
                            }
                        )
                        // .webp({
                        //     quality: 100,
                        //     lossless: true,
                        //     effort: 6,
                        // })
                        // .png({
                        //     quality: /*100*/5,
                        //     effort: 10,
                        //     palette: true,
                        //     // progressive: true,
                        //     // adaptiveFiltering: true,
                        // })
                        .jpeg(
                            {
                                quality: 60,
                                force: true,
                                progressive: true,
                                trellisQuantisation: true,
                                optimiseScans: true,
                                chromaSubsampling: '4:4:4',
                                mozjpeg: true,
                            }
                        )
                        // .heif({
                        //     compression: "av1",
                        //     quality: 100,
                        //     effort: 9,
                        //     lossless: true,
                        // })
                        .toBuffer();

                    const rekognitionParams = {
                        Image: {
                            // Bytes: req.file.buffer,
                            // Bytes: Buffer.from(req.file.buffer),
                            Bytes: /*modifiedImage*/resizedImage,
                        },
                        MinConfidence: 90, // Imposta la soglia di confidenza desiderata
                    };

                    let detectLabels = await rekognition.detectModerationLabels(rekognitionParams).promise();

                    console.log(detectLabels)

                    const moderationLabels = detectLabels.ModerationLabels;

                    const sql1 = `INSERT INTO prestazione(id, business_id, description, is_price_range, price, price_min, price_max, duration, title, is_valid, previous, created_at)
                     VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    db.query(sql1, [id, businessId, description, isPriceRange, price, priceMin, priceMax, duration, title, 1, prestazioneId, new Date(Date.now()).toISOString()], (err, result1) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }

                    });

                    if (moderationLabels.length > 0) {
                        // console.log('L\'immagine contiene contenuti pornografici.');
                        console.log('Etichette rilevate:', moderationLabels);
                        // return res.status(400).json({ error: 'L\'immagine contiene contenuti pornografici.' });
                    } else {
                        console.log('L\'immagine è accettabile.');
                        // res.json({ message: 'L\'immagine è accettabile.' });
                        // Procedi con il salvataggio dell'immagine su S3
                    }

                    console.log(req.file)
                    let myFile = req.file.originalname.split(".")
                    const fileType = myFile[myFile.length - 1]
                    let s3Path = `image/prestazione/${id}/${uuidv4()}.${fileType}`;


                    // res.send({
                    //     message: "Hello World!"
                    // })

                    const params = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        // Key: `${uuid()}.${fileType}`,
                        // Key: `image/prestazione/${id}/${uuidv4()}.${fileType}`,
                        Key: s3Path,
                        Body: /*req.file.buffer*//*modifiedImage*/resizedImage
                    }

                    s3.upload(
                        params,
                        (error, data) => {
                            if (error || moderationLabels.length > 0) {
                                console.log(error)

                                const sql2 = `DELETE FROM prestazione WHERE id = ?`;
                                db.query(sql2, [id], (err, result) => {
                                    if (err) {
                                        console.log(err)
                                        return res.status(500).send(err);
                                    }

                                    const sql4 = `UPDATE prestazione SET is_valid = ? WHERE id = ?`;
                                    db.query(sql4, [1, prestazioneId], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                            return res.status(500).send(err);
                                        }

                                        // res.status(500).send("");
                                    });

                                    // res.status(500);
                                });
                                if (error) {
                                    res.status(500).send(error)
                                } else if (moderationLabels.length > 0) {
                                    return res.status(400).send('L\'immagine contiene contenuti sensibili.');
                                }
                            }
                            else {
                                console.log(data);

                                const sql3 = `UPDATE prestazione SET image = ? WHERE id = ?`;
                                db.query(sql3, [/*data['Location']*/s3Path, id], (err, result) => {
                                    if (err) {
                                        console.log(err)
                                        return res.status(500).send(err);
                                    }

                                    const sql1656 = `UPDATE business_post 
                                                    SET business_post.prestazione_id = ?
                                                    WHERE business_post.prestazione_id = ?`;
                                    db.query(sql1656, [id, prestazioneId], (err, result) => {
                                        if (err) {
                                            console.log(err);
                                            return res.status(500).send('');
                                        }

                                        // res.status(200).send(data)
                                        res.status(200).send(
                                            JSON.stringify({
                                                'id': id,
                                                'image': /*data['Location']*/s3Path,
                                                'business_id': businessId,
                                                'description': description,
                                                'price': parseFloat(price),
                                                'price_min': parseFloat(priceMin),
                                                'price_max': parseFloat(priceMax),
                                                'is_price_range': isPriceRange,
                                                'duration': parseInt(duration),
                                                'title': title,
                                                'is_valid': 1,
                                                'previous': ''
                                            })
                                        );
                                    });
                                });
                            }
                        }
                    );
                    // } else if (req.file.mimetype === "image/webp") {
                    //     res.status(520).send("Immagine con formato non supportato");
                } else {
                    res.status(521).send("Immagine con formato non supportato");
                }
            }
        });
    } catch(error){
        console.log(error)
        res.status(500).send("");
    }
});

Router.delete("/:business_id/prestazione/:prestazione_id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let prestazioneId = req.body.prestazione_id;

        const sql = `UPDATE prestazione SET is_valid = ?
                    WHERE id = ?`;
        db.query(sql, [0, prestazioneId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // res.json(result);
            res.json({
                'id': prestazioneId
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/event/ticket", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let businessId = req.params.business_id;

        const sql = `SELECT event_ticket.id AS event_ticket_id, event_ticket.title AS event_ticket_title,  
                        event_ticket.additional AS event_ticket_additional, event_ticket.price AS event_ticket_price,
                        event_ticket.created_at AS event_ticket_created_at,
                        
                        business.profile_image AS business_profile_image, business.description AS business_description, 
                        business.email AS business_email, /*business.email_notification AS business_email_notification,*/
                        business.max_contemporary_appointments, business.category_id AS business_category_id, 
                        business.phone AS business_phone, business.name AS business_name, business.id AS business_id, 
                        business.address AS business_address, business.type_id AS business_type_id,
                        business.longitude AS business_longitude, business.latitude AS business_latitude,
                        
                        category.id AS category_id, category.name AS category_name, category.image AS category_image,

                        event.title AS event_title, event.id AS event_id,
                        event.description AS event_description,
                        event.begin_at AS event_begin_at, event.end_at AS event_end_at,
                        event.is_valid AS event_is_valid, event.image AS event_image
                 
                    FROM event_ticket
                        LEFT JOIN event ON event_ticket.event_id = event.id
                        LEFT JOIN business ON business.id = event.business_id
                        LEFT JOIN category ON business.category_id = category.id
                    WHERE business_id = ? AND event.is_valid = 1/*AND category.is_valid = 1*/
                    AND business.is_visible = 1`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            res.json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/event", checkBusinessAuth, /*checkBusiness,*/ /*upload,*/ upload1.single("image"), async (req, res, next) => {
    try {
        let businessId = req.body.business_id;
        // let businessId = req.params.business_id;
        // let price = req.body.price;
        let title = req.body.title;
        let categoryId = req.body.category_id;
        let beginAt = req.body.begin_at;
        let endAt = req.body.end_at;
        let description = req.body.description;
        // let tickets = req.body.tickets;
        let tickets = JSON.parse(req.body.tickets);
        // let duration = req.body.duration;
        let eventId = uuidv4();
        let ticketsAdded = [];

        console.log('req.bodydf65b65cxd');
        console.log(req.body);
        console.log(tickets);

        // checkBusiness(req, res, next);
        const sql6 = `SELECT business_id FROM business_authentication WHERE id = ?`;
        await db.promise().query(sql6, [req.decoded.id]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkBusiness')
            // console.log(result)
            console.log(result[0][0].business_id)
            // console.log(result[0].business_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            // if (result[0].business_id !== req.body.business_id) {
            if (result[0][0].business_id !== req.body.business_id) {
                // res.status(401).send(result);
                return await res.status(401).json({
                    errors: [
                        {
                            msg: "Invalid business"
                        }
                    ]
                });
                // return next();
            }
        });

        const sql = `INSERT INTO event(id, business_id, category_id, description, title, begin_at, end_at, is_valid, created_at)
                        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.promise().query(sql, [eventId, businessId, categoryId, description, title, beginAt, endAt, 1, new Date(Date.now()).toISOString()]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500)/*.send(err)*/;
            }

            for(let i = 0; i < tickets.length; i++) {
                let ticketId = uuidv4();
                const sql = `INSERT INTO event_ticket(id, event_id, title, additional, price, created_at)
                                VALUES(?, ?, ?, ?, ?, ?)`;
                await db.promise().query(sql, [ticketId, eventId, tickets[i].title, tickets[i].additional, parseFloat(tickets[i].price), new Date(Date.now()).toISOString()],).then(async (result566, err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500)/*.send(err)*/;
                    }

                    console.log('result566');
                    console.log(result566);

                    ticketsAdded.push({
                        'id': ticketId,
                        'event_id': eventId,
                        'title': tickets[i].title,
                        'additional': tickets[i].additional,
                        'price': parseFloat(tickets[i].price),
                        'created_at': new Date(Date.now()).toISOString()
                    })
                });
            }

            console.log('ticketsAdded5bx5bx54')
            console.log(ticketsAdded)

            if (req.file === undefined) {
                // res.status(200).send(data)
                res.status(200).send(
                    JSON.stringify({
                        'id': eventId,
                        'image': '',
                        'business_id': businessId,
                        'description': description,
                        // 'price': parseFloat(price),
                        // 'duration': parseInt(duration),
                        'begin_at': beginAt,
                        'end_at': endAt,
                        'title': title,
                        'is_valid': 1,
                        'previous': '',
                        'tickets': ticketsAdded
                    })
                );
            }
            else {
                console.log(req.file)
                let myFile = req.file.originalname.split(".")
                const fileType = myFile[myFile.length - 1]

                // res.send({
                //     message: "Hello World!"
                // })

                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    // Key: `${uuid()}.${fileType}`,
                    Key: `image/event/${eventId}/${uuidv4()}.${fileType}`,
                    Body: req.file.buffer
                }

                s3.upload(
                    params,
                    async (error, data) => {
                        if (error) {
                            console.log(error)

                            const sql2 = `DELETE FROM event WHERE id = ?`;
                            await db.promise().query(sql2, [eventId]).then(async (result, err) => {
                                if (err) {
                                    //console.log(err)
                                    return res.status(500).send(err);
                                }
                                res.status(500).send("");
                            });

                            res.status(500).send(error)
                        }
                        console.log(data);

                        const sql0 = `UPDATE event SET image = ? WHERE id = ?`;
                        await db.promise().query(sql0, [data['Key']/*data['Location']*/, eventId]).then(async (result0, err) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }

                            // res.status(200).send(data)
                            res.status(200).send(
                                JSON.stringify({
                                    'id': eventId,
                                    'image': data['Key'],
                                    'business_id': businessId,
                                    'description': description,
                                    // 'price': parseFloat(price),
                                    // 'duration': parseInt(duration),
                                    'begin_at': beginAt,
                                    'end_at': endAt,
                                    'title': title,
                                    'is_valid': 1,
                                    'previous': '',
                                    'tickets': ticketsAdded
                                })
                            );
                        });
                    }
                );
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500)/*.send("")*/;
    }
});

Router.put("/:business_id/event/:event_id", checkBusinessAuth, /*checkBusiness,*/ upload, (req, res) => {
    try {
        let eventId = req.body.event_id;
        let businessId = req.body.business_id;
        let price = req.body.price;
        let title = req.body.title;
        let image = req.body.image;
        let description = req.body.description;
        let duration = req.body.duration;

        //console.log(price);
        // price = parseFloat(price.toString());
        // //console.log(price);

        // checkBusiness(req, res, next);
        const sql6 = `SELECT business_id FROM business_authentication WHERE id = ?`;

        db.query(sql6, [req.decoded.id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkBusiness')
            console.log(result[0].business_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            if (result[0].business_id !== req.body.business_id) {
                // res.status(401).send(result);
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

        const sql0 = `UPDATE event SET is_valid = ?
                    WHERE id = ?`;
        db.query(sql0, [0, eventId], (err, result0) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            let id = uuidv4();

            if (req.file === undefined) {
                const sql5 = `INSERT INTO event(id, business_id, image, description, price, duration, title, is_valid, previous, created_at)
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.query(sql5, [id, businessId, image, description, price, duration, title, 1, eventId, new Date(Date.now()).toISOString()], (err, result1) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    // res.status(200).send(data)
                    res.status(200).send(
                        JSON.stringify({
                            'id': id,
                            'image': image,
                            'business_id': businessId,
                            'description': description,
                            'price': parseFloat(price),
                            'duration': parseInt(duration),
                            'title': title,
                            'is_valid': 1,
                            'previous': ''
                        })
                    );
                });
            } else {
                const sql1 = `INSERT INTO event(id, business_id, description, price, duration, title, is_valid, previous, created_at)
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.query(sql1, [id, businessId, description, price, duration, title, 1, eventId, new Date(Date.now()).toISOString()], (err, result1) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                });

                console.log(req.file)
                let myFile = req.file.originalname.split(".")
                const fileType = myFile[myFile.length - 1]

                // res.send({
                //     message: "Hello World!"
                // })

                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    // Key: `${uuid()}.${fileType}`,
                    Key: `images/event/${id}/${uuidv4()}.${fileType}`,
                    Body: req.file.buffer
                }

                s3.upload(
                    params,
                    (error, data) => {
                        if (error) {
                            console.log(error)

                            const sql2 = `DELETE FROM event WHERE id = ?`;
                            db.query(sql2, [id], (err, result) => {
                                if (err) {
                                    //console.log(err)
                                    return res.status(500).send(err);
                                }

                                const sql4 = `UPDATE event SET is_valid = ? WHERE id = ?`;
                                db.query(sql4, [1, eventId], (err, result) => {
                                    if (err) {
                                        //console.log(err)
                                        return res.status(500).send(err);
                                    }

                                    res.status(500).send("");
                                });

                                // res.status(500);
                            });

                            res.status(500).send(error)
                        }
                        console.log(data);

                        const sql3 = `UPDATE event SET image = ? WHERE id = ?`;
                        db.query(sql3, [data['Location'], id], (err, result) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }

                            // res.status(200).send(data)
                            res.status(200).send(
                                JSON.stringify({
                                    'id': id,
                                    'image': data['Location'],
                                    'business_id': businessId,
                                    'description': description,
                                    'price': parseFloat(price),
                                    'duration': parseInt(duration),
                                    'title': title,
                                    'is_valid': 1,
                                    'previous': ''
                                })
                            );
                        });
                    }
                );
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:business_id/event/:event_id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let eventId = req.body.event_id;

        const sql = `UPDATE event SET is_valid = ?
                    WHERE id = ?`;
        db.query(sql, [0, eventId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // res.json(result);
            res.json({
                'id': eventId
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/fcm_token", (req, res) => {
Router.put("/:business_id/fcm_token", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let fcmToken = req.body.fcm_token;
        let businessId = req.body.business_id;
        //console.log(id);

        const sql = `UPDATE business
                    SET fcm_token = ?
                    WHERE id = ?`;
        db.query(sql, [fcmToken, businessId], (err, result) => {
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

// Router.post("/device", (req, res) => {
Router.post("/:business_id/device", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let fcmToken = req.body.fcm_token;
        let businessId = req.body.business_id;
        let manufacturer = req.body.manufacturer;
        let model = req.body.model;
        let sdkVersion = req.body.sdk_version;
        let releaseVersion = req.body.release_version;
        console.log(req.body);

        let sql1 = `SELECT *
                FROM business_device
                WHERE business_id = ? AND manufacturer = ? AND model = ?`;
        db.query(sql1, [businessId, manufacturer, model,], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            if (result.length > 0) {
                // for(let i = 0; i < result.length; i++) {
                // id = uuidv4();
                let sql2 = `UPDATE business_device SET fcm_token = ?, created_at = ?
                        WHERE business_id = ? AND manufacturer = ? AND model = ?`;
                db.query(sql2, [fcmToken, new Date(Date.now()).toISOString(), businessId, manufacturer, model,], (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    //console.log('result');
                    //console.log(result);
                    // res.end(result);
                    // res.result;
                    //     res.json(id);
                    //     res.json(result);
                    res.json(result);
                });
                // }
            } else {
                let id = uuidv4();
                const sql = `INSERT INTO business_device (id, manufacturer, model, business_id, fcm_token, sdk_version, release_version, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.query(sql, [id, manufacturer, model, businessId, fcmToken, sdkVersion, releaseVersion, new Date(Date.now()).toISOString()], (err, result) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    res.json(result);
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// // Router.patch("/email_notification", checkBusinessAuth, checkBusiness, (req, res) => {
// Router.patch("/:business_id/email_notification", checkBusinessAuth, checkBusiness, (req, res) => {
//     try {
//         let emailNotification = req.body.email_notification;
//         let businessId = req.body.business_id;
//         // //console.log("req.body");
//         // //console.log(req.body);
//
//         const sql1 = `UPDATE business
//                     SET email_notification = ?
//                     WHERE id = ?`;
//         db.query(sql1, [emailNotification, businessId], (err, result) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//             res.send(result);
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("");
//     }
// });
Router.patch("/:business_id/email_notification/:email_notification", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let emailNotification = req.params.email_notification;
        let businessId = req.params.business_id;
        // //console.log("req.body");
        // //console.log(req.body);

        const sql1 = `UPDATE business_setting
                    SET email_notification = ?
                    WHERE business_id = ?`;
        db.query(sql1, [emailNotification, businessId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.send(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.patch("/:business_id/chat_notification/:chat_notification", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let chatNotification = req.params.chat_notification;
        let businessId = req.params.business_id;
        // //console.log("req.body");
        // //console.log(req.body);

        const sql1 = `UPDATE business_setting
                        SET chat_notification = ?
                        WHERE business_id = ?`;
        db.query(sql1, [chatNotification, businessId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log(result);
            res.send(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/setting", checkBusinessAuth, checkBusiness, async (req, res) => {
    try {
        // let emailNotification = req.body.email_notification;
        let businessId = req.params.business_id;

        const sql = `SELECT business_setting.business_id, business_setting.email_notification, 
                        business_setting.chat_notification
                     FROM business_setting
                          /*LEFT JOIN business ON business.id = prestazione.business_id*/
                     WHERE business_setting.business_id = ?;`;
        db.query(sql, [businessId], (err, result) => {
        // await db.promise().query(sql, [businessId]).then(async (result, err) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            console.log(result);

            res.status(200).json(result);
            // res.status(200).send(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/booking/user", /*checkBusinessAuth, checkBusiness,*/ async (req, res) => {
    try {
        // let emailNotification = req.body.email_notification;
        let businessId = req.params.business_id;

        const sql = `SELECT DISTINCT user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                        user.username AS user_username,
                        user.phone AS user_phone, user.name AS user_name, user.description AS user_description
                    
                     FROM booking
                        JOIN prestazione ON prestazione.id = booking.prestazione_id
                        JOIN business ON business.id = prestazione.business_id
                        /*JOIN user ON booking.user_id = user.id*/
                        JOIN user_order ON user_order.id = booking.user_order_id
                        JOIN user ON user.id = user_order.user_id
                        WHERE booking.is_shared = 1 AND business.id = ? AND user.is_deleted = 0
                     ORDER BY booking.created_at DESC;`;
        db.query(sql, [businessId], (err, result) => {
        // await db.promise().query(sql, [businessId]).then(async (result, err) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            console.log(result);

            res.status(200).json(result);
            // res.status(200).send(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/booking", checkBusinessAuth, checkBusiness, async (req, res) => {
// Router.post("/business/booking", checkBusinessAuth, checkBusiness, async (req, res) => {
//     let businessId = req.body.business_id;
//     let prestazioneId = req.body.prestazione_id;
//     let prestazionePrice = req.body.prestazione_price;
//     let note = req.body.note;
//     let bookingBeginAt = req.body.begin_at;
//     var newDateBeginAt = new Date(bookingBeginAt);
//     let id = uuidv4();
//     var duration;
//
//     //TODO: SE LA DIFFERENZA TRA BEGINAT E NOW (O IL VALORE CHE GLI INVIAMO DA CLIENT)
//     //è MAGGIORE DI 24 ORE RETURN RES.JSON
//     var nowDate = Date.now();
//
//     // var timeDifference = Math.abs(newDateBeginAt.getTime() - nowDate.getTime());
//     // //console.log(timeDifference);
//     //
//     // var differentInHours = Math.ceil(timeDifference / (1000 * 3600));
//     // //console.log(differentInHours);
//
//     const diffInMs = Math.abs(newDateBeginAt - nowDate);
//     let differentInHours1 = diffInMs / (1000 * 60 * 60);
//     // //console.log('differentInHours1');
//     // //console.log(differentInHours1);
//
//     if(differentInHours1 <= 24)
//         return res.status(419).send("Prenotare un appuntamento con almeno 24 ore di anticipo")
//     // return res.json("Prenotare un appuntamento con almeno 24 ore di anticipo")
//
//     const sql0 = `SELECT *
//                      FROM prestazione
//                      WHERE id = ?`;
//     await db.promise().query(sql0, [prestazioneId]).then(async (result, err) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//
//         console.log('uallaaaua')
//         console.log(result[0])
//         console.log(result[0][0].id)
//         // // res.json(result);
//         // //console.log('result')
//         // //console.log(result)
//         // //console.log('result[0].duration')
//         // //console.log(result[0].duration)
//         // // duration = result[0].duration;
//         // //console.log('bookingBeginAt')
//         // //console.log(bookingBeginAt)
//
//         // //console.log('Date.parse(bookingBeginAt)')
//         // //console.log(Date.parse(bookingBeginAt)/*.getMinutes()*/)
//
//         // var newDateBeginAt = new Date(bookingBeginAt);
//         var newDateEndAt = new Date(newDateBeginAt);
//         // booking = Date.parse(bookingBeginAt);
//         // //console.log(bookingEndAt.getDate());
//         // //console.log(bookingEndAt.getMinutes());
//
//         newDateEndAt.setMinutes(newDateBeginAt.getMinutes() + result[0][0].duration);
//         // //console.log('bookingEndAt');
//         // //console.log(bookingEndAt);
//         // //console.log('newDateBeginAt');
//         // //console.log(newDateBeginAt);
//
//         // SELECT *
//         // FROM occupied_booking
//         // WHERE DAY("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = DAY(occupied_from) AND
//         // WHERE MONTH("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = MONTH(occupied_from) AND
//         // WHERE YEAR("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = YEAR(occupied_from)
//         // ORDER BY created_at DESC
//         const sql1 = `SELECT *
//                  FROM occupied_booking
//                  WHERE business_id = ?
//                  ORDER BY occupied_from ASC`;
//         await db.promise().query(sql1, [businessId]).then(async (result, err) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//             // res.json(result);
//             // console.log('occupied_booking')
//             // console.log(result)
//             // //console.log(result[0].occupied_from)
//
//             var c = 0;
//             //console.log(c);
//             //console.log(result.length)
//             for(var i = 0; i < result[0].length-1; i++){
//                 // if((newDateBeginAt < result[i].occupied_until && bookingEndAt > result[i+1].occupied_from) ||
//                 //     (newDateBeginAt === result[i].occupied_from && bookingEndAt > result[i+1].occupied_from)
//                 /*|| (newDateBeginAt > result[i].occupied_from && bookingEndAt < result[i].occupied_until)
//                 || newDateBeginAt < result[0].occupied_from || bookingEndAt > result[result.length-1].occupied_until*/
//                 // ){
//                 // console.log('newDateBeginAt');
//                 // console.log(newDateBeginAt);
//                 // console.log('newDateEndAt');
//                 // console.log(newDateEndAt);
//                 var occupiedFrom = new Date(result[0][i].occupied_from);
//                 var occupiedUntil = new Date(result[0][i].occupied_until);
//                 console.log('occupiedFrom')
//                 console.log(occupiedFrom)
//                 console.log('occupiedUntil')
//                 console.log(occupiedUntil)
//                 // console.log('\n')
//                 if((occupiedUntil.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedUntil.getTime()) ||
//                     (occupiedFrom.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedFrom.getTime()) ||
//                     /*(occupiedUntil.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === occupiedFrom.getTime()) ||*/
//                     (occupiedFrom.getTime() === newDateBeginAt.getTime()) || (occupiedUntil.getTime() === newDateEndAt.getTime())){
//                     c++
//                 }
//                 // if(newDateBeginAt.toString() === result[i].occupied_from.toString()) {
//                 //     c++;
//                 // }
//             }
//             console.log('c');
//             console.log(c);
//
//             if(c >= 1){
//                 return res.status(419).send("Lo slot è già occupato")
//                 // res.json("Lo slot è già occupato");
//             }
//             else if(c === 0){
//                 const sql2 = `SELECT *
//                              FROM business
//                              JOIN prestazione ON prestazione.business_id = business.id
//                              WHERE prestazione.id = ?`;
//                 await db.promise().query(sql2, [prestazioneId]).then(async (result, err) => {
//                     if (err) {
//                         console.log(err)
//                         return res.status(500).send(err);
//                     }
//                     // res.json(result);
//                     // //console.log(result[0].business_id);
//
//                     var day;
//                     if(newDateBeginAt.getDay() === 0)
//                         day = 7;
//                     else
//                         day = newDateBeginAt.getDay();
//                     const sql3 = `SELECT *
//                                  FROM timetable
//                                  WHERE business_id = ?
//                                  AND weekday_id = ?`;
//                     await db.promise().query(sql3, [result[0][0].business_id, day]).then(async (result, err) => {
//                         if (err) {
//                             console.log(err)
//                             return res.status(500).send(err);
//                         }
//
//                         //console.log(result);
//                         var c1 = 0;
//                         for(var j = 0; j < result[0].length; j++) {
//                             //console.log('rrrrr');
//                             //creo il bookingtime di tutti i giorni e vedo se end booking è maggiore
//                             var closeAt = new Date(newDateBeginAt);
//                             var openAt = new Date(newDateBeginAt);
//                             // booking = Date.parse(bookingBeginAt);
//                             openAt.setMinutes(result[0][j].open_at_minute)
//                             openAt.setHours(result[0][j].open_at_hour)
//                             closeAt.setMinutes(result[0][j].close_at_minute)
//                             closeAt.setHours(result[0][j].close_at_hour)
//                             // console.log('openAt');
//                             // console.log(openAt);
//                             // console.log('closeAt');
//                             // console.log(closeAt);
//                             console.log('newDateBeginAt');
//                             console.log(newDateBeginAt);
//                             console.log('newDateEndAt');
//                             console.log(newDateEndAt);
//                             if((closeAt < newDateEndAt && newDateBeginAt < closeAt) || (openAt < newDateEndAt && newDateBeginAt < openAt)
//                                 /*|| (newDateBeginAt > closeAt && newDateEndAt < openAt)*/ /*|| (newDateBeginAt > closeAt) || (newDateEndAt < openAt)*/
//                                 //todo: non va bene perchè apre due volte nello stesso giorno ed esce fuori da uno degli orari di apertura di quel giorno,
//                                 // comunque va bene questo controllo, ma va aggiunto il fatto che deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
//                                 /*|| (newDateBeginAt < openAt && newDateEndAt < openAt) || (newDateBeginAt > closeAt && newDateEndAt > closeAt)*/){
//                                 c1++;
//                                 // break;
//                             }
//                             console.log('c1')
//                             console.log(c1)
//                         }
//
//                         //todo: deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
//                         if(c1 >= 1) {
//                             return res.status(419).send("L'appuntamento si incastra con gli orari di apertura e di chiusura o non è compreso tra gli orari di apertura e chiusura")
//                             // res.json("L'appuntamento si incastra con gli orari di apertura e di chiusura");
//                         }
//                         else if(c1 === 0){
//                             const sql4 = `SELECT max_contemporary_appointments
//                                           FROM business
//                                           WHERE id = ?`;
//                             await db.promise().query(sql4, [businessId]).then(async (result, err) => {
//                                 if (err) {
//                                     console.log(err)
//                                     return res.status(500).send(err);
//                                 }
//                                 var maxContemporaryAppointments = result[0][0].max_contemporary_appointments;
//
//                                 const sql5 = `SELECT *
//                                               FROM booking
//                                                        JOIN prestazione ON prestazione.id = booking.prestazione_id
//                                                        JOIN business ON business.id = prestazione.business_id
//                                               WHERE /*prestazione_id = ? AND*/ is_canceled = 0
//                                               ORDER BY booking.created_at DESC`;
//                                 await db.promise().query(sql5, [prestazioneId]).then(async (result, err) => {
//                                     if (err) {
//                                         console.log(err)
//                                         return res.status(500).send(err);
//                                     }
//                                     // res.json(result);
//                                     console.log('result4654646');
//                                     console.log(result[0]);
//                                     //console.log('ooooooo');
//
//                                     var c2 = 0;
//                                     for (var i = 0; i < result[0].length; i++) {
//                                         var tempDateBeginAt = new Date(result[0][i].begin_at);
//                                         // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)
//
//                                         var tempDateEndAt = new Date(result[0][i].begin_at);
//                                         tempDateEndAt.setMinutes(tempDateEndAt.getMinutes() + result[0][i].duration)
//
//                                         console.log('tempDateBeginAt')
//                                         console.log(tempDateBeginAt)
//                                         console.log('tempDateEndAt')
//                                         console.log(tempDateEndAt)
//                                         // var eee = new Date(bookingBeginAt);
//
//                                         // if((tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateEndAt.getTime()) ||
//                                         //     (tempDateBeginAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
//                                         //     (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
//                                         //     (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())){
//                                         if ((tempDateEndAt.getTime() < newDateEndAt.getTime() && tempDateEndAt.getTime() > newDateBeginAt.getTime()) ||
//                                             (tempDateBeginAt.getTime() > newDateBeginAt.getTime() && tempDateBeginAt.getTime() < newDateEndAt.getTime()) ||
//                                             (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
//                                             (tempDateEndAt.getTime() > newDateEndAt.getTime() && newDateBeginAt.getTime() > tempDateBeginAt.getTime()) ||
//                                             (tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
//                                             (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())) {
//                                             c2++;
//                                             //console.log('tempDateBeginAt');
//                                             //console.log(tempDateBeginAt);
//                                             // break;
//                                         }
//                                     }
//                                     console.log('c2')
//                                     console.log(c2)
//
//                                     // //console.log(result);
//
//                                     // //console.log('result[0].max_contemporary_appointments');
//                                     // //console.log(result[0].max_contemporary_appointments);
//                                     //console.log('maxContemporaryAppointments');
//                                     //console.log(maxContemporaryAppointments);
//                                     // //console.log(result.max_contemporary_appointments);
//
//                                     // if(c2 >= /*3*/result[0].max_contemporary_appointments){
//                                     if (c2 >= /*3*/maxContemporaryAppointments) {
//                                         return res.status(419).send("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotati")
//                                         // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
//                                     } else /*if(c === 0)*/{
//                                         // let id = uuidv4();
//                                         // //console.log('eeeeeeeeee')
//                                         // //console.log(eee)
//                                         // var rrr = new Date(bookingBeginAt);
//                                         // //console.log('rrr')
//                                         // //console.log(rrr)
//
//                                         const sql6 = `INSERT INTO booking(id, prestazione_id, begin_at, guest_name, guest_contact, note, created_at)
//                                                       VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
//                                         await db.promise().query(sql6, [id, prestazioneId, bookingBeginAt, req.body.guest_name, req.body.guest_contact, note]).then(async (result, err) => {
//                                             if (err) {
//                                                 console.log(err)
//                                                 return res.status(500).send(err);
//                                             }
//
//                                         });
//
//                                         // res.json(result);
//                                         res.json(id);
//                                     }
//                                 });
//                             });
//                         }
//                     });
//                 });
//             }
//         });
//     });
//     // await //console.log('duration')
//     // //console.log(duration)
// });

// Router.post("/booking/guest", (req, res) => {
Router.post("/:business_id/booking/guest", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let guestEmail = req.body.guest_email;
        let guestPhone = req.body.guest_phone;
        let guestName = req.body.guest_name;
        let prestazioneId = req.body.prestazione_id;
        let beginAt = req.body.begin_at;
        // let businessId = req.body.business_id;
        let note = req.body.note;
        // let created_at = req.body.created_at;
        //console.log(userId);
        let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'

        let query = `INSERT INTO guest_booking(id, prestazione_id, name, phone, email, begin_at,
                note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
        db.query(query, [id, prestazioneId, guestName, guestPhone, guestEmail, beginAt, note, /*created_at*/], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.json(id);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/event/delete", (req, res) => {
Router.delete("/:business_id/event/:event_id", /*checkDev,*/ checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let businessId = req.body.business_id;
        let singleEventId = req.body.event_id;
        // //console.log(eventBusinessId);

        // const sql0 = `DELETE FROM event_room WHERE event_id = '${singleEventId}'`;
        // db.query(sql0, (err, result) => {
        //     if (err) {
        //         //console.log(err)
        //         return res.status(500).send(err);
        //     }
        //     // res.json(result);
        // });
        //
        // const sql1 = `DELETE FROM event_ticket WHERE event_id = '${singleEventId}'`;
        // db.query(sql1, (err, result) => {
        //     if (err) {
        //         //console.log(err)
        //         return res.status(500).send(err);
        //     }
        //     // res.json(result);
        // });
        //
        // const sql = `DELETE FROM event WHERE id = '${singleEventId}' AND event_business_id = '${eventBusinessId}'`;
        // db.query(sql, (err, result) => {
        //     if (err) {
        //         //console.log(err)
        //         return res.status(500).send(err);
        //     }
        //     res.json(result);
        // });

        // const sql = `DELETE FROM event WHERE id = '${singleEventId}' AND event_business_id = '${eventBusinessId}'`;
        const sql = `UPDATE event SET is_visible = 0
                 WHERE id = ? AND business_id = ?`;
        db.query(sql, [singleEventId, businessId], (err, result) => {
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

Router.get("/:business_id/order/user/grouped-by-order", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        //console.log(req.body);
        console.log('req.params');
        console.log(req.params);
        console.log('req.query');
        console.log(req.query);

        // const sql = `SELECT COUNT(booking.id), booking.prestazione_id
        //                 FROM booking
        //                 GROUP BY booking.prestazione_id
        //                 ORDER BY COUNT(booking.id) DESC;`;
        // const sql = `SELECT COUNT(booking.user_id), booking.user_id
        //              FROM booking
        //              GROUP BY booking.user_id
        //              ORDER BY COUNT(booking.user_id) DESC;`;
        // const sql = `SELECT COUNT(booking.user_id) AS ranking,
        //
        //                     user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
        //                     user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description,
        //
        //                     business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
        //                     business.name AS business_name, business.id AS business_id, business.address AS business_address,
        //                     /*business.email_notification AS business_email_notification,*/
        //                     business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
        //                     business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
        //
        //                     category.id AS category_id, category.name AS category_name, category.image AS category_image,
        //
        //                     prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   prestazione.created_at AS prestazione_created_at,
        //                     prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
        //                     prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title
        //
        //              FROM booking
        //                   JOIN prestazione ON booking.prestazione_id = prestazione.id
        //                   JOIN user ON booking.user_id = user.id
        //                   JOIN business ON prestazione.business_id = business.id
        //                   JOIN category ON business.category_id = category.id
        //              WHERE prestazione.business_id = ?
        //              GROUP BY booking.user_id
        //              ORDER BY COUNT(booking.user_id) DESC;`;
        const sql = `SELECT COUNT(user_order.user_id) AS ranking,

                        user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                        user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                        business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        /*business.email_notification AS business_email_notification,*/
                        business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                        business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                        category.id AS category_id, category.name AS category_name, category.image AS category_image,

                        prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                        prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                        prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                        prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                 FROM booking
                      JOIN prestazione ON booking.prestazione_id = prestazione.id
                      JOIN user_order ON user_order.id = booking.user_order_id
                      JOIN user ON user.id = user_order.user_id
                      JOIN business ON prestazione.business_id = business.id
                      JOIN category ON business.category_id = category.id
                 WHERE prestazione.business_id = ? AND business.is_visible = 1 AND booking.is_canceled = 0
                 GROUP BY user_order.user_id
                 ORDER BY COUNT(user_order.user_id) DESC;`;
        db.query(sql, [req.query.business_id], (err, rows) => {
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

Router.get("/:business_id/order/user/grouped-by-prestazione", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        //console.log(req.body);

        // const sql = `SELECT COUNT(booking.user_id) AS ranking,
        //
        //                 user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
        //                 user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description,
        //
        //                 business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
        //                 business.name AS business_name, business.id AS business_id, business.address AS business_address,
        //                 /*business.email_notification AS business_email_notification,*/
        //                 business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
        //                 business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
        //
        //                 category.id AS category_id, category.name AS category_name, category.image AS category_image,
        //
        //                 prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   prestazione.created_at AS prestazione_created_at,
        //                 prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
        //                 prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title
        //
        //              FROM booking
        //                       JOIN prestazione ON booking.prestazione_id = prestazione.id
        //                       JOIN user ON booking.user_id = user.id
        //                       JOIN business ON prestazione.business_id = business.id
        //                       JOIN category ON business.category_id = category.id
        //              WHERE prestazione.business_id = ?
        //              GROUP BY prestazione.id
        //              ORDER BY COUNT(booking.user_id) DESC;`;
        const sql = `SELECT COUNT(user_order.user_id) AS ranking,

                    user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                    user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                    business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image,

                    prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                    prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                    prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                    prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                    prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                 FROM booking
                          JOIN prestazione ON booking.prestazione_id = prestazione.id
                          JOIN user_order ON user_order.id = booking.user_order_id
                          JOIN user ON user.id = user_order.user_id
                          JOIN business ON prestazione.business_id = business.id
                          JOIN category ON business.category_id = category.id
                 WHERE prestazione.business_id = ? AND business.is_visible = 1 AND booking.is_canceled = 0
                 GROUP BY prestazione.id
                 ORDER BY COUNT(user_order.user_id) DESC;`;
        db.query(sql, [req.query.business_id], (err, rows) => {
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

Router.get("/:business_id/booking/occupied", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    // let businessId = req.body.business_id;
    let businessId = req.params.business_id;
    // //console.log(eventBusinessId);

    const sql = `SELECT * 
                 FROM booking_occupied
                 WHERE business_id = ?
                 ORDER BY occupied_from ASC`;
    db.query(sql, [businessId], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }

        // console.log(result)
        res.json(result);
    });
});

Router.post("/:business_id/booking/occupied", checkBusinessAuth, checkBusiness, (req, res) => {
    // let businessId = req.body.business_id;
    let businessId = req.params.business_id;
    let occupiedFrom = req.body.occupied_from;
    let occupiedUntil = req.body.occupied_until;
    // let id = uuidv4();

    const sql = `INSERT INTO booking_occupied(business_id, occupied_from, occupied_until, created_at) 
                 VALUES(?, ?, ?, ?)`;
    db.query(sql, [businessId, occupiedFrom, occupiedUntil, new Date(Date.now()).toISOString()], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }

        res.json(result);
    });
});

Router.delete("/:business_id/booking/occupied", checkBusinessAuth, checkBusiness, (req, res) => {
    // let businessId = req.body.business_id;
    let businessId = req.params.business_id;
    let occupiedFrom = req.body.occupied_from;
    let occupiedUntil = req.body.occupied_until;
    //console.log(businessId);
    //console.log(occupiedFrom);
    //console.log(occupiedUntil);

    const sql = `DELETE FROM booking_occupied 
                    WHERE occupied_from = ? 
                    AND occupied_until = ? 
                    AND business_id = ?`;
    db.query(sql, [occupiedFrom, occupiedUntil, businessId], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }

        res.json(result);
    });
});

// Router.get("/:business_id/booking", checkBusinessAuth, checkBusiness, (req, res) => {
//     try {
//         // let businessId = req.body.business_id;
//         let businessId = req.params.business_id;
//
//         // const sql = `SELECT booking.id AS booking_id, booking.begin_at, booking.created_at, booking.is_canceled,
//         //
//         // prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
//         // prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   prestazione.description AS prestazione_description,
//         // prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id,
//         //
//         // user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
//         // user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description
//         //
//         //                 FROM booking
//         //                 JOIN user ON user_id = user.id
//         //                 JOIN prestazione ON prestazione_id = prestazione.id
//         //                 WHERE business_id = ? AND is_canceled = 0
//         //                 ORDER BY begin_at DESC`;
//         const sql = `SELECT booking.id AS booking_id, booking.begin_at, booking.created_at, booking.is_canceled,
//                 /*IF(booking.guest_name <> NULL, booking.guest_name, ''), IF(booking.guest_contact <> NULL, booking.guest_contact, ''),*/
//                 /*booking.guest_name, booking.guest_contact,*/
//
//                 prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
//                 prestazione.is_valid AS prestazione_is_valid,
//                 prestazione.image AS prestazione_image, prestazione.price AS prestazione_price,
//                 prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max,
//                 prestazione.is_price_range AS prestazione_is_price_range,
//                 prestazione.description AS prestazione_description,
//                 prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id,
//
//                 user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
//                 user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description
//
//                  FROM booking
//                           LEFT JOIN user ON user_id = user.id
//                           JOIN prestazione ON prestazione_id = prestazione.id
//                  WHERE business_id = ? AND is_canceled = ?
//                      /*ORDER BY begin_at DESC*/
//                  ORDER BY created_at DESC`;
//         db.query(sql, [businessId, req.query.is_canceled ?? 0], (err, result) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//             res.json(result);
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("");
//     }
// });

Router.get("/:business_id/prestazione/is_valid", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        // io.on("connection", (socket) => {
        //     /*var era = */socket.broadcast.emit(
        //         'broad',
        //         'esquilo from everywhere',
        //         // (response) => {
        //         //     console.log('allaahhhhhh')
        //         //     console.log(response)
        //         // }
        //         // function (arg, ack) {
        //         //     console.log('ferret')
        //         //     ack('woot');
        //         // }
        //
        //         // {
        //         //     'content': msg.content,
        //         //     'senderId': senderId,
        //         //     'receiverId':receiverId,
        //         // }
        //     )
        // });

        const sql = `SELECT *
                    FROM prestazione
                    WHERE business_id = ? AND is_valid = ?
                    /*ORDER BY created_at DESC*/
                    ORDER BY title ASC`;
        db.query(sql, [businessId, 1], (err, result) => {
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

Router.get("/:business_id/prestazione/:prestazione_id/length", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let prestazioneId = req.body.prestazione_id;
        let userId = req.params.user_id;
        let prestazioneId = req.params.prestazione_id;

        // let postId = req.body.post_id;
        //console.log(userId);
        // //console.log(postId);
        // SELECT *
        // FROM post_like
        // JOIN post ON post.id = post_like.post_id
        // WHERE post_like.user_id = ${userId}
        let sql = `SELECT DISTINCT *
                FROM prestazione_favorite
                /*JOIN prestazione ON prestazione.id = prestazione_favorite.prestazione_id*/
                WHERE prestazione_favorite.user_id = ? AND prestazione_favorite.prestazione_id = ?
                ORDER BY prestazione_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [userId, prestazioneId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // console.log(result.length)
            res.json(result.length);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/booking/begin-at-duration", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // const options = { timeZone: 'Europe/Rome', hour12: false };
        // const formatter = new Intl.DateTimeFormat('it-IT', options);
        // const formattedDate = formatter.format(new Date());
        // let arr = [];

        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        const sql = `SELECT booking.begin_at, prestazione.duration
                    FROM booking
                        /*JOIN user ON user_id = user.id*/
                        JOIN prestazione ON prestazione_id = prestazione.id
                    WHERE business_id = ? AND is_canceled = 0`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // console.log(result);

            // for(let i = 0; i < result.length; i++){
            //     console.log(result[i])
            //     console.log(new Date(result[i].begin_at))
            //     console.log(formatter.format(new Date(result[i].begin_at)))
            //     // arr.push(formatter.format(new Date(e.begin_at)))
            // }
            res.json(result);
            // res.json(arr);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/booking/guest/begin-at-duration", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // const options = { timeZone: 'Europe/Rome', hour12: false };
        // const formatter = new Intl.DateTimeFormat('it-IT', options);
        // const formattedDate = formatter.format(new Date());
        // let arr = [];

        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;
        const sql = `SELECT guest_booking.begin_at, prestazione.duration
                 FROM guest_booking
                    JOIN prestazione ON prestazione_id = prestazione.id
                 WHERE business_id = ? AND is_canceled = 0`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // for(let e in result){
            //     console.log(formatter.format(new Date(e.begin_at)))
            //     // arr.push(formatter.format(new Date(e.begin_at)))
            // }
            res.json(result);
            // res.json(arr);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.put("/:business_id/booking/guest/:id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let id = req.body.id;
        let name = req.body.name;
        let prestazioneId = req.body.prestazione_id;
        let beginAt = req.body.begin_at;
        let phone = req.body.phone;
        let email = req.body.email;
        let note = req.body.note;
        console.log(req.body);

        const sql = `UPDATE guest_booking
                 SET name = ?, phone = ?, email = ?, begin_at = ?, prestazione_id = ?, note = ?
                 WHERE id = ?`;
        db.query(sql, [name, phone, email, beginAt, prestazioneId, note, id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            console.log(result)

            // res.json({
            //     id,
            //     'image': "",
            //     'business_id': businessId,
            //     description,
            //     'price': parseFloat(price),
            //     'duration': parseInt(duration),
            //     title,
            //     'is_valid': 1,
            //     'previous': prestazioneId
            // });

            // result = result0;
            // res.json({result});
            res.json(result);
            // res.json(result0);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/booking/begin_at", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;
        // let bookingBeginAtDay = req.body.begin_at_day;
        // let bookingBeginAtMonth = req.body.begin_at_month;
        // let bookingBeginAtYear = req.body.begin_at_year;
        let bookingBeginAtDay = req.query.day;
        let bookingBeginAtMonth = req.query.month;
        let bookingBeginAtYear = req.query.year;

        // const sql = `SELECT booking.id AS booking_id, booking.begin_at, booking.created_at, booking.is_canceled,
        //                 booking.guest_name, booking.guest_contact, guest_phone, guest_email,
        //
        //                 prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
        //                 prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   prestazione.description AS prestazione_description,
        //                 prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id,
        //
        //                 user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
        //                 user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description
        //
        //             FROM booking
        //                 LEFT JOIN prestazione ON prestazione_id = prestazione.id
        //                 LEFT JOIN user ON user_id = user.id
        //             WHERE business_id = ? AND is_canceled = 0
        //                 AND DAY(begin_at) = ?
        //                 AND MONTH(begin_at) = ?
        //                 AND YEAR(begin_at) = ?
        //                 OR (guest_name IS NOT NULL AND guest_contact IS NOT NULL AND guest_email IS NOT NULL)
        //             /*ORDER BY begin_at ASC*/`;
        const sql = `SELECT booking.id AS booking_id, booking.begin_at, booking.created_at, booking.is_canceled, booking.is_shared,
                    /*booking.guest_name, booking.guest_contact, guest_phone, guest_email,*/

                    prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title, 
                    prestazione.is_valid AS prestazione_is_valid,
                    prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                    prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                    prestazione.is_price_range AS prestazione_is_price_range,   
                    prestazione.description AS prestazione_description,
                    prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id,

                    user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                    user.phone AS user_phone, user.name AS user_name, user.description AS user_description

                FROM booking
                    JOIN prestazione ON prestazione_id = prestazione.id
                    JOIN user ON user_id = user.id

                WHERE business_id = ? AND is_canceled = 0
                    AND DAY(begin_at) = ?
                    AND MONTH(begin_at) = ?
                    AND YEAR(begin_at) = ?
                /*ORDER BY begin_at ASC*/`;
        db.query(sql, [businessId, bookingBeginAtDay, bookingBeginAtMonth, bookingBeginAtYear], (err, result) => {
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

Router.delete("/:business_id/booking/guest/:booking_id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let bookingId = req.body.booking_id;
        console.log(bookingId)

        const sql = `UPDATE guest_booking
                    SET is_canceled = 1, deleted_at = UTC_TIMESTAMP()
                    WHERE id = ?`;
        db.query(sql, [bookingId], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            console.log(result);
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/booking/guest/begin_at", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;
        // let bookingBeginAtDay = req.body.begin_at_day;
        // let bookingBeginAtMonth = req.body.begin_at_month;
        // let bookingBeginAtYear = req.body.begin_at_year;
        let bookingBeginAtDay = req.query.day;
        let bookingBeginAtMonth = req.query.month;
        let bookingBeginAtYear = req.query.year;

        const sql = `SELECT guest_booking.id AS booking_id, guest_booking.begin_at,
                    guest_booking.created_at, guest_booking.is_canceled, guest_booking.name, guest_booking.phone,
                    guest_booking.email, guest_booking.note,

                    prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                    prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                    prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                    prestazione.is_price_range AS prestazione_is_price_range,   prestazione.description AS prestazione_description,
                    prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id

                FROM guest_booking
                    JOIN prestazione ON prestazione_id = prestazione.id

                WHERE business_id = ? AND is_canceled = 0
                    AND DAY(begin_at) = ?
                    AND MONTH(begin_at) = ?
                    AND YEAR(begin_at) = ?
                /*ORDER BY begin_at ASC*/`;
        db.query(sql, [businessId, bookingBeginAtDay, bookingBeginAtMonth, bookingBeginAtYear], (err, result) => {
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

Router.get("/:business_id/booking/guest", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        const sql = `SELECT guest_booking.id AS booking_id, guest_booking.begin_at,
                    guest_booking.created_at, guest_booking.is_canceled, guest_booking.name, guest_booking.phone,
                    guest_booking.email, guest_booking.note,

                    prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                    prestazione.image AS prestazione_image, prestazione.price AS prestazione_price,
                    prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max,
                    prestazione.is_price_range AS prestazione_is_price_range,
                    prestazione.description AS prestazione_description,
                    prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id

                FROM guest_booking
                    JOIN prestazione ON prestazione_id = prestazione.id

                WHERE business_id = ? AND is_canceled = 0
                /*ORDER BY begin_at ASC*/`;
        db.query(sql, [businessId,], (err, result) => {
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

Router.get('/', /*checkAuth,*/ /*checkUser,*/ (req, res) => {
    try {
        // let categoryId = req.params.category_id;
        let sql = '';
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

        if (req.query.is_visible && !req.query.is_valid) {
            sql = `SELECT max_contemporary_appointments, business.profile_image AS business_profile_image, 
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id, 
                    business.description AS business_description, business.email AS business_email,
                    
                    business_room.id AS business_room_id,
                    
                    category.id AS category_id, category.name AS category_name, category.image AS category_image
            
                FROM category
                    JOIN business ON business.category_id = category.id
                    LEFT JOIN business_room ON business.id = business_room.business_id
                WHERE business.is_visible = ?`;
        }
        else if (req.query.is_visible && req.query.is_valid) {
            sql = `SELECT max_contemporary_appointments, business.profile_image AS business_profile_image, 
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, 
                    business.type_id AS business_type_id, 
                    business.description AS business_description, business.email AS business_email,
                    
                    business_room.id AS business_room_id,
                    
                    category.id AS category_id, category.name AS category_name, category.image AS category_image
            
                FROM category
                    JOIN business ON business.category_id = category.id
                    LEFT JOIN business_room ON business.id = business_room.business_id
                WHERE business.is_visible = ? AND category.is_valid = ?`;
        }
        else if (!req.query.is_visible && !req.query.is_valid) {
            sql = `SELECT max_contemporary_appointments, business.profile_image AS business_profile_image, 
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id, 
                    business.description AS business_description, business.email AS business_email,
                    
                    business_room.id AS business_room_id,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image
            
                FROM category
                    JOIN business ON business.category_id = category.id
                    LEFT JOIN business_room ON business.id = business_room.business_id`;
        }
        db.query(sql, [/*categoryId,*/ req.query.is_visible ?? 1, req.query.is_valid ?? 1], (err, result) => {
            if (err) {
                console.log(err);
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

                console.log(Array.from(locationsWithinRadius));

                // res.status(201).json(result);
                res.status(200).json(Array.from(locationsWithinRadius));
            } catch (e) {
                res.status(510).send(err);
            }

            // res.json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.delete("/:business_id/booking/:booking_id", checkBusinessAuth, checkBusiness, (req, res) => {
//     let businessId = req.body.business_id;
//     let userId = req.body.user_id;
//     let bookingId = req.body.booking_id;
//     let array = [];
//
//     console.log(bookingId)
//
//     const sql = `UPDATE booking
//                     SET is_canceled = 1
//                     WHERE id = ?`;
//     db.query(sql, [bookingId], async (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//
//         console.log(result);
//
//         // const rooms = await socket.ioObject.of('/').adapter.allRooms();
//         var rooms = await socket.ioObject.of('/').adapter.allRooms();
//         console.log(`socket.ioObject.of('/').adapter.allRooms()`);
//         console.log(rooms);
//
//         var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
//         console.log(`socket.ioObject.of('/').adapter.sockets`);
//         console.log(sockets);
//
//         var sids = await socket.ioObject.of('/').adapter.sids;
//         console.log(`socket.ioObject.of('/').adapter.sids`);
//         console.log(sids);
//
//         var rooms1 = await socket.ioObject.of('/').adapter.rooms;
//         console.log(`socket.ioObject.of('/').adapter.rooms`);
//         console.log(rooms1);
//
//         //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
//         // if(socket.ioObject.sockets.adapter.rooms[req.body.user_id] === undefined) {
//         if(!rooms.has(req.body.user_id) && req.body.user_id != null) {
//             let id = uuidv4();
//             let sql1 = `INSERT INTO business_user_notification(id, type, business_id, user_id, booking_id, sent_at)
//                             VALUES(?, '2', ?, ?, ?, ?)`;
//             db.query(sql1, [id, req.body.business_id, req.body.user_id, req.body.booking_id, (new Date()).toISOString()], (err, result) => {
//                 if (err) {
//                     console.log(err);
//                     return res.status(500).send(err);
//                 }
//                 //console.log('result');
//                 //console.log(result);
//                 // res.end(result);
//                 // res.result;
//                 //     res.json(id);
//                 //     res.json(result);
//             });
//         }
//         else{
//             socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.user_id)/*sockets.broadcast*/.emit(
//                 'cancel_user_appointment_notification',
//                 {
//                     "booking_id": req.body.booking_id,
//                     // "begin_at": req.body.begin_at,
//                     "user_id": req.body.user_id,
//                     // "username": req.body.username,
//                     // "user_profile_image": req.body.user_profile_image,
//                     "prestazione_title": req.body.prestazione_title,
//                     "business_id": req.body.business_id,
//                     "prestazione_image": `${req.body.prestazione_image}`,
//                 }
//             );
//         }
//
//         const sql3 = `SELECT * FROM user WHERE id = ?`;
//         db.query(sql3, [userId], async (err, result0) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//
//             const sql4 = `SELECT * FROM business WHERE id = ?`;
//             db.query(sql4, [businessId], async (err, result1) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//
//                 const sql5 = `SELECT * FROM booking WHERE id = ?`;
//                 db.query(sql5, [bookingId], async (err, result2) => {
//                     if (err) {
//                         console.log(err)
//                         return res.status(500).send(err);
//                     }
//
//                     console.log('result2')
//                     console.log(result2)
//                     console.log('result1')
//                     console.log(result1)
//                     console.log('result0')
//                     console.log(result0)
//
//                     var bookingDate = new Date(result2[0].begin_at);
//                     const offset = bookingDate.getTimezoneOffset();
//                     var localBookingDate = new Date(bookingDate.setMinutes(bookingDate.getMinutes() /*- offset*/+ 120));
//                     let localeBookingString = localBookingDate.toLocaleString(
//                         'it-IT',
//                         {
//                             year: 'numeric',
//                             month: '2-digit',
//                             day: '2-digit',
//                             weekday: "long",
//                             hour: '2-digit',
//                             hour12: false,
//                             minute:'2-digit',
//                             second:'2-digit'
//                         }
//                     );
//
//                     // Step 1
//                     let transporter = nodemailer.createTransport({
//                         // service: 'gmail',
//                         // service: 'iCloud',
//                         // host: 'authsmtp.securemail.pro',
//                         host: 'email-smtp.eu-central-1.amazonaws.com',
//                         port: 465,
//                         // port: 587,
//                         secure: true, // true for 465, false for other ports
//                         // secure: false,
//                         auth: {
//                             // user: process.env.EMAIL_USER,
//                             user: process.env.AWS_SMTP_USER,
//                             // pass: process.env.EMAIL_PASSWORD
//                             pass: process.env.AWS_SMTP_PASSWORD
//                         },
//                         //TODO: da testare
//                         tls: {
//                             rejectUnauthorized: false
//                         }
//                     });
//
//                     if(result0.length > 0){
//                         if(result0[0].email_notification === 1){
//                             // Step 2
//                             let mailOptions = {
//                                 // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
//                                 from: `"${result1[0].name}" support@nurebo.com`, // sender address
//                                 to: result0[0].email,
//                                 // to: "bar@example.com, baz@example.com", // list of receivers
//                                 subject: `Cancellazione prenotazione di ${req.body.prestazione_title} da ${result1[0].name} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                 // subject: 'Hello ✔ Nodemailer - Test',
//                                 // text: 'Wooohooo it works!!',
//                                 html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${result1[0].name} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stato cancellata.</h1>
//                                <h1>La inviatiamo a prenotare nuovamente.</h1>
//                                <h1>Ci scusiamo per il disagio.</h1>
//                                <h1>A presto!</h1>`,
//                             };
//
//                             // Step 3
//                             await transporter.sendMail(mailOptions, (err, data) => {
//                                 if (err) {
//                                     console.log('Error occurs', err);
//                                     return log('Error occurs', err);
//                                 }
//                                 return log('Email sent!!!');
//                                 // console.log(otp);
//                                 // console.log('Email sent!!!');
//                             });
//                         }
//
//                         const sql = `SELECT fcm_token
//                                          FROM user_device
//                                          WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND user_id = ?
//                                          ORDER BY RAND()
//                                          LIMIT 1000`;
//                         db.query(sql, [userId], async (err, result6) => {
//                             if (err) {
//                                 console.log(err)
//                                 return res.status(500).send(err);
//                             }
//                             console.log('result6');
//                             console.log(result6);
//
//                             for (let i = 0; i < result6.length; i++) {
//                                 console.log(result6[i].fcm_token);
//                                 // if(result[i].fcm_token !== null){
//                                 array.push(result6[i].fcm_token);
//                                 // }
//                             }
//
//                             await axios({
//                                 method: 'POST',
//                                 url: 'https://fcm.googleapis.com/fcm/send',
//                                 headers: {
//                                     'Content-Type': 'application/json',
//                                     Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
//                                 },
//                                 data: {
//                                     "notification": {
//                                         "title": `${req.body.prestazione_title}`,
//                                         "subtitle": /*`${}`*/"Cancellazione",
//                                         "body": `Cancellazione da ${result1[0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                         // "channel_id": "fcm_nurebo_admin_channel",
//                                         "android_channel_id": "fcm_nurebo_channel",
//                                         // "image": `${req.body.prestazione_image}`,
//                                         "icon": "calendar",
//                                         "vibrate": true
//                                     },
//                                     "direct_boot_ok" : true,
//                                     "data": {
//                                         "keyname": "any value",
//                                         "prestazione_image": `${req.body.prestazione_image}`,
//                                         // "prestazione_image": `https://i.ytimg.com/vi/8GX9krUThE8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAePWH4j0Y1GoGZxmtpwB3veL30_Q`
//
//                                         "booking_id": req.body.booking_id,
//                                         // "begin_at": req.body.begin_at,
//                                         "user_id": req.body.user_id,
//                                         // "username": req.body.username,
//                                         // "user_profile_image": req.body.user_profile_image,
//                                         "prestazione_title": req.body.prestazione_title,
//                                         "business_id": req.body.business_id,
//                                     },
//                                     "android": {
//                                         "notification": {
//                                             "image": `${req.body.prestazione_image}`,
//                                             "bodyLocKey": "STOCK_NOTIFICATION_BODY",
//                                             "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
//                                         },
//                                         "direct_boot_ok": true
//                                     },
//                                     // "registration_ids": [`${result0[0].fcm_token}`, ],
//                                     "registration_ids": array,
//                                     // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
//                                 }
//                             }).then(function (response) {
//                                 console.log(response.status);
//                                 console.log(response.data);
//                                 console.log(response.data.success);
//                             }).catch(function (error) {
//                                 console.log(error);
//                             });
//                         });
//
//                     }
//
//                 });
//             });
//
//         });
//
//         res.json(result);
//     });
// });

// Router.delete("/:business_id/booking/:booking_id", checkBusinessAuth, checkBusiness, (req, res) => {
//     try {
//         let businessId = req.body.business_id;
//         let userId = req.body.user_id;
//         let bookingId = req.body.booking_id;
//         let array = [];
//
//         console.log(bookingId)
//         console.log('req.body');
//         console.log(req.body);
//
//         const sql = `UPDATE booking
//                     SET is_canceled = 1
//                     WHERE id = ?`;
//         db.query(sql, [bookingId], async (err, result) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//
//             console.log(result);
//
//             // const rooms = await socket.ioObject.of('/').adapter.allRooms();
//             var rooms = await socket.ioObject.of('/').adapter.allRooms();
//             console.log(`socket.ioObject.of('/').adapter.allRooms()`);
//             console.log(rooms);
//
//             var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
//             console.log(`socket.ioObject.of('/').adapter.sockets`);
//             console.log(sockets);
//
//             var sids = await socket.ioObject.of('/').adapter.sids;
//             console.log(`socket.ioObject.of('/').adapter.sids`);
//             console.log(sids);
//
//             var rooms1 = await socket.ioObject.of('/').adapter.rooms;
//             console.log(`socket.ioObject.of('/').adapter.rooms`);
//             console.log(rooms1);
//
//             //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
//             // if(socket.ioObject.sockets.adapter.rooms[req.body.user_id] === undefined) {
//             if (!rooms.has(req.body.user_id) && req.body.user_id != null) {
//                 let id = uuidv4();
//                 let sql1 = `INSERT INTO business_user_notification(id, type, business_id, user_id, booking_id, sent_at)
//                             VALUES(?, '2', ?, ?, ?, ?/*UTC_TIMESTAMP()*/)`;
//                 db.query(sql1, [id, req.body.business_id, req.body.user_id, req.body.booking_id, new Date(Date.now()).toISOString()], (err, result) => {
//                     if (err) {
//                         console.log(err);
//                         return res.status(500).send(err);
//                     }
//                     //console.log('result');
//                     //console.log(result);
//                     // res.end(result);
//                     // res.result;
//                     //     res.json(id);
//                     //     res.json(result);
//                 });
//             } else {
//                 socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.user_id)/*sockets.broadcast*/.emit(
//                     'cancel_user_appointment_notification',
//                     {
//                         "booking_id": req.body.booking_id,
//                         // "begin_at": req.body.begin_at,
//                         "user_id": req.body.user_id,
//                         // "username": req.body.username,
//                         // "user_profile_image": req.body.user_profile_image,
//                         "prestazione_title": req.body.prestazione_title,
//                         "business_id": req.body.business_id,
//                         "prestazione_image": `${req.body.prestazione_image}`,
//                     }
//                     // {
//                     //     "booking_id": req.body.booking_id,
//                     //     "prestazione_id": result2[0].prestazione_id,
//                     //     "note": result2[0].note,
//                     //     "begin_at": result2[0].begin_at,
//                     //     'prestazione_duration': result2[0].prestazione_duration,
//                     //     'prestazione_image': result2[0].prestazione_image,
//                     //     'prestazione_description': result2[0].prestazione_description,
//                     //     'prestazione_title': result2[0].prestazione_title,
//                     //     'prestazione_price': result2[0].prestazione_price,
//                     //     'presale_price': result2[0].presale_price,
//                     //     'user_id': req.body.user_id,
//                     //     'user_username': result0[0].username,
//                     //     'user_name': result0[0].name,
//                     //     'user_profile_image': `${result0[0].profile_image}`,
//                     //     'user_phone_number': result0[0].user_phone_number,
//                     //     'user_email': result0[0].email,
//                     //     // 'price': req.body.prestazione_price,
//                     //     'business_id': req.body.business_id,
//                     //     'business_name': result1[0].name,
//                     //     'business_type_id': result1[0].business_type_id,
//                     //     'business_profile_image': `${result1[0].profile_image}`,
//                     //     'business_description': result1[0].description,
//                     //     'business_address': result1[0].address,
//                     //     'business_phone_number': result1[0].phone_number,
//                     //     'max_contemporary_appointments': result1[0].max_contemporary_appointments,
//                     //     'is_canceled': 1,
//                     //     'created_at': new Date(Date.now()).toISOString(),
//                     // }
//                 );
//             }
//
//             const sql3 = `SELECT * FROM user WHERE id = ?`;
//             db.query(sql3, [userId], async (err, result0) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//
//                 const sql4 = `SELECT * FROM business WHERE id = ?`;
//                 db.query(sql4, [businessId], async (err, result1) => {
//                     if (err) {
//                         console.log(err)
//                         return res.status(500).send(err);
//                     }
//
//                     const sql5 = `SELECT * FROM booking WHERE id = ?`;
//                     db.query(sql5, [bookingId], async (err, result2) => {
//                         if (err) {
//                             console.log(err)
//                             return res.status(500).send(err);
//                         }
//
//                         console.log('result2')
//                         console.log(result2)
//                         console.log('result1')
//                         console.log(result1)
//                         console.log('result0')
//                         console.log(result0)
//
//                         var bookingDate = new Date(result2[0].begin_at);
//                         const offset = bookingDate.getTimezoneOffset();
//                         const clientTimezone = req.headers['timezone-offset'];
//                         // var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getMinutes() /*- offset*/ + 120));
//                         // var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getMinutes() + (parseInt(clientTimezone)*60)));
//                         var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getUTCMinutes() + (parseInt(clientTimezone)*60)));
//                         let localeBookingString = localBookingDate.toLocaleString(
//                             'it-IT',
//                             {
//                                 year: 'numeric',
//                                 month: '2-digit',
//                                 day: '2-digit',
//                                 weekday: "long",
//                                 hour: '2-digit',
//                                 hour12: false,
//                                 minute: '2-digit',
//                                 second: '2-digit'
//                             }
//                         );
//
//                         // Step 1
//                         let transporter = nodemailer.createTransport({
//                             // service: 'gmail',
//                             // service: 'iCloud',
//                             // host: 'authsmtp.securemail.pro',
//                             host: 'email-smtp.eu-central-1.amazonaws.com',
//                             port: 465,
//                             // port: 587,
//                             secure: true, // true for 465, false for other ports
//                             // secure: false,
//                             auth: {
//                                 // user: process.env.EMAIL_USER,
//                                 user: process.env.AWS_SMTP_USER,
//                                 // pass: process.env.EMAIL_PASSWORD
//                                 pass: process.env.AWS_SMTP_PASSWORD
//                             },
//                             //TODO: da testare
//                             tls: {
//                                 rejectUnauthorized: false
//                             }
//                         });
//
//                         if (result0.length > 0) {
//                             if (result0[0].email_notification === 1) {
//                                 // Step 2
//                                 let mailOptions = {
//                                     // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
//                                     from: `"${result1[0].name}" support@nurebo.com`, // sender address
//                                     to: result0[0].email,
//                                     // to: "bar@example.com, baz@example.com", // list of receivers
//                                     subject: `Cancellazione prenotazione di ${req.body.prestazione_title} da ${result1[0].name} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                     // subject: 'Hello ✔ Nodemailer - Test',
//                                     // text: 'Wooohooo it works!!',
//                                     html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${result1[0].name} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stato cancellata.</h1>
//                                <h1>La inviatiamo a prenotare nuovamente.</h1>
//                                <h1>Ci scusiamo per il disagio.</h1>
//                                <h1>A presto!</h1>`,
//                                 };
//
//                                 // Step 3
//                                 await transporter.sendMail(mailOptions, (err, data) => {
//                                     if (err) {
//                                         console.log('Error occurs', err);
//                                         return;
//                                     }
//                                     console.log('Email sent!!!');
//                                     // console.log(otp);
//                                     // console.log('Email sent!!!');
//                                 });
//                             }
//
//                             const sql = `SELECT fcm_token
//                                          FROM user_device
//                                          WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND user_id = ?
//                                          ORDER BY RAND()
//                                          LIMIT 1000`;
//                             db.query(sql, [userId], async (err, result6) => {
//                                 if (err) {
//                                     console.log(err)
//                                     return res.status(500).send(err);
//                                 }
//                                 console.log('result6');
//                                 console.log(result6);
//
//                                 for (let i = 0; i < result6.length; i++) {
//                                     console.log(result6[i].fcm_token);
//                                     // if(result[i].fcm_token !== null){
//                                     array.push(result6[i].fcm_token);
//                                     // }
//
//                                     const message = {
//                                         message: {
//                                             // "name": "Nometring",
//                                             "data": {
//                                                 "mass": "1.3kg",
//                                                 "count": "3",
//                                                 // count23: '36652',
//                                             },
//                                             "notification": {
//                                                 // title: 'Hello World',
//                                                 // body: 'This is a Firebase Cloud Messaging notification',
//                                                 // image: 'https://images.pexels.com/photos/8448578/pexels-photo-8448578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
//                                             },
//                                             "android": {
//                                                 // "collapse_key": string,
//                                                 "priority": "HIGH",
//                                                 // "priority": "NORMAL",
//                                                 // "ttl": '153s',
//                                                 // "restricted_package_name": string,
//                                                 "data": {
//                                                     "keyname": "any value",
//                                                     "prestazione_image": `${req.body.prestazione_image}`,
//                                                     // "prestazione_image": `https://i.ytimg.com/vi/8GX9krUThE8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAePWH4j0Y1GoGZxmtpwB3veL30_Q`
//                                                     "booking_id": req.body.booking_id,
//                                                     // "begin_at": req.body.begin_at,
//                                                     "user_id": req.body.user_id,
//                                                     // "username": req.body.username,
//                                                     // "user_profile_image": req.body.user_profile_image,
//                                                     "prestazione_title": req.body.prestazione_title,
//                                                     "business_id": req.body.business_id,
//                                                 },
//                                                 "notification": {
//                                                     "title": `${req.body.prestazione_title}`,
//                                                     "body": `Cancellazione da ${result1[0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                                     "channel_id": "fcm_nurebo_channel",
//                                                     "icon": 'android12splash',
//                                                     // "icon": 'splash',
//                                                     // "icon": 'calendar_1',
//                                                     // "icon": 'ic_launcher',
//                                                     // "color": '#0020FF',
//                                                     "sound": 'piece_of_cake_611',
//                                                     // "tag": 'stringbbbb',
//                                                     // "click_action": string,
//                                                     "bodyLocKey": "STOCK_NOTIFICATION_BODY",
//                                                     "bodyLocArgs": ["FooCorp", "11.80", "835.67", "1.43"],
//                                                     // "title_loc_key": string,
//                                                     // "title_loc_args": [
//                                                     //   string
//                                                     // ],
//                                                     // "channel_id": string,
//                                                     // "ticker": string,
//                                                     // "sticky": true,
//                                                     // "event_time": string,
//                                                     // "local_only": boolean,
//                                                     // "notification_priority": "PRIORITY_MAX",
//                                                     "default_sound": true,
//                                                     "default_vibrate_timings": true,
//                                                     "default_light_settings": true,
//                                                     // "vibrate_timings": [
//                                                     //   "3.0s",
//                                                     //   "1.0s",
//                                                     //   "3.0s",
//                                                     //   "2.0s",
//                                                     // ],
//                                                     // "visibility": "PUBLIC",
//                                                     // "notification_count": integer,
//                                                     // "light_settings": {
//                                                     //   "color": {
//                                                     //     "red": 125,
//                                                     //     "green": 126,
//                                                     //     "blue": 200,
//                                                     //     // "alpha": number
//                                                     //   },
//                                                     //   light_on_duration: "2s",
//                                                     //   light_off_duration: "4s"
//                                                     // },
//                                                     // "image": string,
//                                                 },
//                                                 "fcm_options": {
//                                                     // object (AndroidFcmOptions)
//                                                 },
//                                                 "direct_boot_ok": true
//                                             },
//                                             "webpush": {
//                                                 // object (WebpushConfig)
//                                             },
//                                             "apns": {
//                                                 "payload": {
//
//                                                 }
//                                             },
//                                             "fcm_options": {
//                                                 // object (FcmOptions)
//                                             },
//                                             // token:"efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
//                                             // "token":"dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
//                                             // token:"cGicYG7eSD2s-CWTfp2F-m:APA91bGrb5WJAsjpSMg5sW31hIlx2TQbvYopDc4Zn8OgkhroZKHY9JgLelZl0AGiSHk83_PWsXKztV2lztsE9b8a84OXrl8iju1-kdVpd7cZ_ZLD_a_E-bzLdJ1MS6ZvblHW4boAi-Bw",
//                                             token: result6[i].fcm_token,
//                                             // "topic": 'string2g2gg2g2',
//                                             // "condition": string
//                                         },
//                                     };
//                                     firebase.getNureboAccessToken().then(async function(accessToken) {
//                                         await axios.post(
//                                             // `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
//                                             `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_NUREBO_PROJECT_ID}/messages:send`,
//                                             message,
//                                             {
//                                                 headers: {
//                                                     'Authorization': `Bearer ${accessToken}`,
//                                                     'Content-Type': 'application/json'
//                                                 }
//                                             }
//                                         ).then(function (response) {
//                                             console.log(response.status);
//                                             // console.log(response.data);
//                                             // console.log(response.data.success);
//                                         }).catch(function (error) {
//                                             if (error.response) {
//                                                 // La richiesta è stata fatta e il server ha risposto con uno status code
//                                                 // che cade fuori del range dei 2xx
//                                                 console.log('Response data:', error.response.data);
//                                                 console.log('Response status:', error.response.status);
//                                                 console.log('Response headers:', error.response.headers);
//                                             } else if (error.request) {
//                                                 // La richiesta è stata fatta ma nessuna risposta è stata ricevuta
//                                                 // `error.request` è un'istanza di XMLHttpRequest nel browser e un'istanza di
//                                                 // http.ClientRequest in node.js
//                                                 console.log('Request data:', error.request);
//                                             } else {
//                                                 // Qualcosa è successo durante l'impostazione della richiesta che ha innescato un errore
//                                                 console.log('Error message:', error.message);
//                                             }
//                                             console.log('Error config:', error.config);
//                                         });
//                                     });
//                                 }
//
//                                 // await axios({
//                                 //     method: 'POST',
//                                 //     url: 'https://fcm.googleapis.com/fcm/send',
//                                 //     headers: {
//                                 //         'Content-Type': 'application/json',
//                                 //         Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
//                                 //     },
//                                 //     data: {
//                                 //         "notification": {
//                                 //             "title": `${req.body.prestazione_title}`,
//                                 //             "body": `Cancellazione da ${result1[0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                 //             // "channel_id": "fcm_nurebo_admin_channel",
//                                 //             "android_channel_id": "fcm_nurebo_channel",
//                                 //             // "image": `${req.body.prestazione_image}`,
//                                 //             // "icon": "splash",
//                                 //             "icon": "calendar",
//                                 //             "vibrate": true
//                                 //         },
//                                 //         "direct_boot_ok": true,
//                                 //         "data": {
//                                 //             "keyname": "any value",
//                                 //             "prestazione_image": `${req.body.prestazione_image}`,
//                                 //             // "prestazione_image": `https://i.ytimg.com/vi/8GX9krUThE8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAePWH4j0Y1GoGZxmtpwB3veL30_Q`
//                                 //             "booking_id": req.body.booking_id,
//                                 //             // "begin_at": req.body.begin_at,
//                                 //             "user_id": req.body.user_id,
//                                 //             // "username": req.body.username,
//                                 //             // "user_profile_image": req.body.user_profile_image,
//                                 //             "prestazione_title": req.body.prestazione_title,
//                                 //             "business_id": req.body.business_id,
//                                 //         },
//                                 //         "android": {
//                                 //             "notification": {
//                                 //                 "image": `${req.body.prestazione_image}`,
//                                 //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
//                                 //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
//                                 //             },
//                                 //             "direct_boot_ok": true
//                                 //         },
//                                 //         "apns": {
//                                 //             "payload": {
//                                 //                 "aps": {
//                                 //                     "sound": 65,
//                                 //                     "blimblo": 'fffdgdg',
//                                 //                     "blimbl44o": "vdgvdgvdgg",
//                                 //                 }
//                                 //             }
//                                 //         },
//                                 //         // "registration_ids": [`${result0[0].fcm_token}`, ],
//                                 //         "registration_ids": array,
//                                 //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
//                                 //     }
//                                 // }).then(function (response) {
//                                 //     console.log(response.status);
//                                 //     console.log(response.data);
//                                 //     console.log(response.data.success);
//                                 // }).catch(function (error) {
//                                 //     console.log(error);
//                                 // });
//                             });
//
//                         }
//
//                     });
//                 });
//
//             });
//
//             res.json(result);
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("");
//     }
// });

Router.delete("/:business_id/booking/:booking_id", checkBusinessAuth, checkBusiness, async (req, res) => {
    try {
        let businessId = req.body.business_id;
        let userId = req.body.user_id;
        let bookingId = req.body.booking_id;
        let array = [];

        // console.log(bookingId)
        console.log('req.bodyvvvvvvv')
        console.log(req.body)

        const sql = `UPDATE booking
                    SET is_canceled = 1
                    WHERE id = ?`;
        await db.promise().query(sql, [bookingId]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // console.log(result);

            const sql3 = `SELECT * FROM user WHERE id = ?`;
            await db.promise().query(sql3, [userId]).then(async (result0, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }

                const sql4 = `SELECT * FROM business WHERE id = ?`;
                await db.promise().query(sql4, [businessId]).then(async (result1, err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    const sql5 = `SELECT booking.id AS booking_id, booking.created_at AS booking_created_at, booking.begin_at,
                        booking.note, booking.is_canceled,

                        prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                        prestazione.image AS prestazione_image, prestazione.price AS prestazione_price,
                        prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max,
                        prestazione.is_price_range AS prestazione_is_price_range,
                        prestazione.description AS prestazione_description, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id

                                FROM booking
                                JOIN prestazione ON prestazione.id = booking.prestazione_id
                                WHERE booking.id = ?`;
                    await db.promise().query(sql5, [bookingId]).then(async (result2, err) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }

                        console.log('result2[0][0]')
                        console.log(result2[0][0])
                        console.log('result1[0][0]')
                        console.log(result1[0][0])
                        console.log('result0[0][0]')
                        console.log(result0[0][0])

                        // const rooms = await socket.ioObject.of('/').adapter.allRooms();
                        var rooms = await socket.ioObject.of('/').adapter.allRooms();
                        console.log(`socket.ioObject.of('/').adapter.allRooms()`);
                        console.log(rooms);

                        var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
                        console.log(`socket.ioObject.of('/').adapter.sockets`);
                        console.log(sockets);

                        var sids = await socket.ioObject.of('/').adapter.sids;
                        console.log(`socket.ioObject.of('/').adapter.sids`);
                        console.log(sids);

                        var rooms1 = await socket.ioObject.of('/').adapter.rooms;
                        console.log(`socket.ioObject.of('/').adapter.rooms`);
                        console.log(rooms1);

                        //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
                        // if(socket.ioObject.sockets.adapter.rooms[req.body.user_id] === undefined) {
                        if (!rooms.has(req.body.user_id)) {
                            let id = uuidv4();
                            let sql1 = `INSERT INTO business_user_notification(id, type, business_id, user_id, booking_id, sent_at)
                                        VALUES(?, '2', ?, ?, ?, ?/*UTC_TIMESTAMP()*/)`;
                            await db.promise().query(sql1, [id, req.body.business_id, req.body.user_id, req.body.booking_id, new Date(Date.now()).toISOString()]).then(async (result455, err) => {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send(err);
                                }
                                //console.log('result');
                                //console.log(result);
                                // res.end(result);
                                // res.result;
                                //     res.json(id);
                                //     res.json(result);
                            });

                        }
                        else {
                            socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.user_id)/*sockets.broadcast*/.emit(
                                'cancel_business_appointment_notification',
                                // {
                                //     "booking_id": req.body.booking_id,
                                //     "begin_at": req.body.begin_at,
                                //     "user_id": req.body.user_id,
                                //     "user_username": req.body.user_username,
                                //     "user_name": req.body.user_name,
                                //     "user_profile_image": req.body.user_profile_image,
                                //     "prestazione_title": req.body.prestazione_title,
                                //     "prestazione_image": req.body.prestazione_image,
                                //     "prestazione_id": req.body.prestazione_id,
                                //     "business_id": req.body.business_id,
                                //     "business_name": req.body.business_name,
                                //     "is_canceled": req.body.is_canceled,
                                // }
                                {
                                    "booking_id": req.body.booking_id,
                                    "prestazione_id": result2[0][0].prestazione_id,
                                    "note": result2[0][0].note,
                                    "begin_at": result2[0][0].begin_at,
                                    'prestazione_duration': result2[0][0].prestazione_duration,
                                    'prestazione_image': result2[0][0].prestazione_image,
                                    'prestazione_description': result2[0][0].prestazione_description,
                                    'prestazione_title': result2[0][0].prestazione_title,
                                    'prestazione_price': result2[0][0].prestazione_price,
                                    'presale_price': result2[0][0].presale_price,
                                    'user_id': req.body.user_id,
                                    'user_username': result0[0][0].username,
                                    'user_name': result0[0][0].name,
                                    'user_profile_image': `${result0[0][0].profile_image}`,
                                    'user_phone': result0[0][0].user_phone,
                                    'user_email': result0[0][0].email,
                                    // 'price': req.body.prestazione_price,
                                    'business_id': req.body.business_id,
                                    'business_name': result1[0][0].name,
                                    'business_type_id': result1[0][0].business_type_id,
                                    'business_profile_image': `${result1[0][0].profile_image}`,
                                    'business_description': result1[0][0].description,
                                    'business_address': result1[0][0].address,
                                    'business_phone': result1[0][0].phone,
                                    'max_contemporary_appointments': result1[0][0].max_contemporary_appointments,
                                    'is_canceled': 1,
                                    'created_at': new Date(Date.now()).toISOString(),
                                }
                            );
                        }

                        var bookingDate = new Date(result2[0][0].begin_at);
                        const clientTimezone = req.headers['timezone-offset'];
                        const offset = bookingDate.getTimezoneOffset();
                        // var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getMinutes() /*- offset*/ + 120));
                        var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getUTCMinutes() + (parseInt(clientTimezone)*60)));
                        let localeBookingString = localBookingDate.toLocaleString(
                            'it-IT',
                            {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                weekday: "long",
                                hour: '2-digit',
                                hour12: false,
                                minute: '2-digit',
                                second: '2-digit'
                            }
                        );

                        // Step 1
                        let transporter = nodemailer.createTransport({
                            // service: 'gmail',
                            // service: 'iCloud',
                            // host: 'authsmtp.securemail.pro',
                            host: 'email-smtp.eu-central-1.amazonaws.com',
                            port: 465,
                            // port: 587,
                            secure: true, // true for 465, false for other ports
                            // secure: false,
                            auth: {
                                // user: process.env.EMAIL_USER,
                                user: process.env.AWS_SMTP_USER,
                                // pass: process.env.EMAIL_PASSWORD
                                pass: process.env.AWS_SMTP_PASSWORD
                            },
                            //TODO: da testare
                            tls: {
                                rejectUnauthorized: false
                            }
                        });

                        if (result1[0][0].email_notification === 1) {
                            // Step 2
                            let mailOptions = {
                                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                from: `"${result0[0][0].name}" support@nurebo.com`, // sender address
                                to: result1[0][0].email,
                                // to: "bar@example.com, baz@example.com", // list of receivers
                                subject: `Cancellazione prenotazione di ${req.body.prestazione_title} da ${req.body.user_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                // subject: 'Hello ✔ Nodemailer - Test',
                                // text: 'Wooohooo it works!!',
                                html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${req.body.user_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stato cancellata.</h1>
                               <h1>Grazie.</h1>
                               <h1>A presto!</h1>`,
                            };

                            // Step 3
                            await transporter.sendMail(mailOptions, (err, data) => {
                                if (err) {
                                    console.log('Error occurs', err);
                                    return;
                                }
                                return;
                                // console.log(otp);
                                // console.log('Email sent!!!');
                            });
                        }
                        if (result0[0][0].email_notification === 1) {
                            // Step 2
                            let mailOptions1 = {
                                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                from: `"${result1[0][0].name}" support@nurebo.com`, // sender address
                                to: result0[0][0].email,
                                // to: "bar@example.com, baz@example.com", // list of receivers
                                subject: `Cancellazione prenotazione di ${req.body.prestazione_title} da ${result1[0][0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                // subject: 'Hello ✔ Nodemailer - Test',
                                // text: 'Wooohooo it works!!',
                                html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${result1[0][0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stato cancellata.</h1>
                               <h1>Grazie.</h1>
                               <h1>A presto!</h1>`,
                            };

                            // Step 3
                            await transporter.sendMail(mailOptions1, (err, data) => {
                                if (err) {
                                    console.log('Error occurs', err);
                                    return;
                                }
                                return;
                                // console.log(otp);
                                // console.log('Email sent!!!');
                            });
                        }

                        const sql = `SELECT fcm_token
                                         FROM user_device
                                         WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND user_id = ?
                                         ORDER BY RAND()
                                         LIMIT 1000`;
                        await db.promise().query(sql, [userId]).then(async (result6, err) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }
                            console.log('result6[0]');
                            console.log(result6[0]);
                            // console.log('result0');
                            // console.log(result0);
                            // console.log('result1');
                            // console.log(result1);
                            // console.log('result2');
                            // console.log(result2);

                            let templatesssss = {
                                "booking_id": req.body.booking_id,
                                "prestazione_id": result2[0][0].prestazione_id,
                                "begin_at": result2[0][0].begin_at,
                                'prestazione_duration': result2[0][0].prestazione_duration,
                                'prestazione_image': result2[0][0].prestazione_image,
                                'prestazione_description': result2[0][0].prestazione_description,
                                'prestazione_title': result2[0][0].prestazione_title,
                                'prestazione_price': result2[0][0].prestazione_price,
                                'user_id': req.body.user_id,
                                'user_username': result0[0][0].username,
                                'user_name': result0[0][0].name,
                                'user_profile_image': `${result0[0][0].profile_image}`,
                                'user_email': result0[0][0].email,
                                'business_id': req.body.business_id,
                                'business_name': result1[0][0].name,
                                'business_type_id': result1[0][0].business_type_id,
                                'business_profile_image': `${result1[0][0].profile_image}`,
                                'business_description': result1[0][0].description,
                                'business_address': result1[0][0].address,
                                'business_phone': result1[0][0].phone,
                                'max_contemporary_appointments': result1[0][0].max_contemporary_appointments,
                                'is_canceled': '1',
                                'created_at': new Date(Date.now()).toISOString(),
                            }.toString();
                            console.log('templatesssss');
                            // console.log(templatesssss.toString());
                            console.log(templatesssss);
                            for (let i = 0; i < result6[0].length; i++) {
                                console.log('result6[0][i].fcm_token');
                                console.log(result6[0][i].fcm_token);
                                // if(result[i].fcm_token !== null){
                                array.push(result6[0][i].fcm_token);
                                // }

                                const message = {
                                    message: {
                                        // "name": "Nometring",
                                        // "data": templatesssss,
                                        // "notification": {
                                        //     // title: 'Hello World',
                                        //     // body: 'This is a Firebase Cloud Messaging notification',
                                        //     // image: 'https://images.pexels.com/photos/8448578/pexels-photo-8448578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
                                        // },
                                        "android": {
                                            // "collapse_key": string,
                                            "priority": "HIGH",
                                            // "priority": "NORMAL",
                                            // "ttl": '153s',
                                            // "restricted_package_name": string,
                                            // "data": templatesssss,
                                            "notification": {
                                                "title": `${result2[0][0].prestazione_title}`,
                                                "body": `Cancellazione da ${result1[0][0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                "channel_id": "fcm_nurebo_channel",
                                                "icon": 'android12splash',
                                                // "icon": 'splash',
                                                // "icon": 'calendar_1',
                                                // "icon": 'ic_launcher',
                                                // "color": '#0020FF',
                                                "sound": 'piece_of_cake_611',
                                                // "tag": 'stringbbbb',
                                                // "click_action": string,
                                                "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                                "bodyLocArgs": ["FooCorp", "11.80", "835.67", "1.43"],
                                                // "title_loc_key": string,
                                                // "title_loc_args": [
                                                //   string
                                                // ],
                                                // "channel_id": string,
                                                // "ticker": string,
                                                // "sticky": true,
                                                // "event_time": string,
                                                // "local_only": boolean,
                                                // "notification_priority": "PRIORITY_MAX",
                                                "default_sound": true,
                                                "default_vibrate_timings": true,
                                                "default_light_settings": true,
                                                // "vibrate_timings": [
                                                //   "3.0s",
                                                //   "1.0s",
                                                //   "3.0s",
                                                //   "2.0s",
                                                // ],
                                                // "visibility": "PUBLIC",
                                                // "notification_count": integer,
                                                // "light_settings": {
                                                //   "color": {
                                                //     "red": 125,
                                                //     "green": 126,
                                                //     "blue": 200,
                                                //     // "alpha": number
                                                //   },
                                                //   light_on_duration: "2s",
                                                //   light_off_duration: "4s"
                                                // },
                                                // "image": string,
                                            },
                                            // "fcm_options": {
                                            //     // object (AndroidFcmOptions)
                                            // },
                                            "direct_boot_ok": true
                                        },
                                        // "webpush": {
                                        //     // object (WebpushConfig)
                                        // },
                                        // "apns": {
                                        //     "payload": {
                                        //
                                        //     }
                                        // },
                                        // "fcm_options": {
                                        //     // object (FcmOptions)
                                        // },
                                        // token:"efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
                                        // "token":"dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
                                        // token:"cGicYG7eSD2s-CWTfp2F-m:APA91bGrb5WJAsjpSMg5sW31hIlx2TQbvYopDc4Zn8OgkhroZKHY9JgLelZl0AGiSHk83_PWsXKztV2lztsE9b8a84OXrl8iju1-kdVpd7cZ_ZLD_a_E-bzLdJ1MS6ZvblHW4boAi-Bw",
                                        token: result6[0][i].fcm_token,
                                        // "topic": 'string2g2gg2g2',
                                        // "condition": string
                                    },
                                };
                                firebase.getNureboAccessToken().then(async function(accessToken) {
                                    await axios.post(
                                        // `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
                                        `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_NUREBO_PROJECT_ID}/messages:send`,
                                        message,
                                        {
                                            headers: {
                                                'Authorization': `Bearer ${accessToken}`,
                                                'Content-Type': 'application/json'
                                            }
                                        }
                                    ).then(function (response) {
                                        console.log(response.status);
                                        // console.log(response.data);
                                        // console.log(response.data.success);
                                    }).catch(function (error) {
                                        if (error.response) {
                                            // La richiesta è stata fatta e il server ha risposto con uno status code
                                            // che cade fuori del range dei 2xx
                                            console.log('Response data:', error.response.data);
                                            // console.log('Response status:', error.response.status);
                                            // console.log('Response headers:', error.response.headers);
                                        } else if (error.request) {
                                            // La richiesta è stata fatta ma nessuna risposta è stata ricevuta
                                            // `error.request` è un'istanza di XMLHttpRequest nel browser e un'istanza di
                                            // http.ClientRequest in node.js
                                            console.log('Request data:', error.request);
                                        } else {
                                            // Qualcosa è successo durante l'impostazione della richiesta che ha innescato un errore
                                            console.log('Error message:', error.message);
                                        }
                                        console.log('Error config:', error.config);
                                    });
                                });
                            }

                            // await axios({
                            //     method: 'POST',
                            //     url: 'https://fcm.googleapis.com/fcm/send',
                            //     headers: {
                            //         'Content-Type': 'application/json',
                            //         Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                            //     },
                            //     data: {
                            //         "notification": {
                            //             "title": `${result2[0][0].prestazione_title}`,
                            //             "subtitle": /*`${}`*/"Cancellazione",
                            //             "body": `Cancellazione da ${result0[0][0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                            //             // "channel_id": "fcm_nurebo_admin_channel",
                            //             "android_channel_id": "fcm_nurebo_channel",
                            //             // "image": `${req.body.prestazione_image}`,
                            //             "icon": "calendar",
                            //             "vibrate": true
                            //         },
                            //         "direct_boot_ok": true,
                            //         // "data": {
                            //         //     "keyname": "any value",
                            //         //     "booking_id": req.body.booking_id,
                            //         //     "begin_at": req.body.begin_at,
                            //         //     "user_id": req.body.user_id,
                            //         //     "user_username": req.body.user_username,
                            //         //     "user_name": req.body.user_name,
                            //         //     "user_profile_image": `${req.body.user_profile_image}`,
                            //         //     "prestazione_title": req.body.prestazione_title,
                            //         //     "prestazione_image": `${req.body.prestazione_image}`,
                            //         //     "prestazione_id": req.body.prestazione_id,
                            //         //     "business_id": req.body.business_id,
                            //         //     "business_name": req.body.business_name,
                            //         //     "is_canceled": req.body.is_canceled,
                            //         // },
                            //         // "data": {
                            //         //     "keyname": "any value",
                            //         //     "booking_id": req.body.booking_id,
                            //         //     "begin_at": result2[0].begin_at,
                            //         //     "user_id": req.body.user_id,
                            //         //     "user_username": result0[0].user_username,
                            //         //     "user_name": result0[0].user_name,
                            //         //     "user_profile_image": `${req.body.user_profile_image}`,
                            //         //     "prestazione_title": result2[0].prestazione_title,
                            //         //     "prestazione_image": `${result2[0].prestazione_image}`,
                            //         //     "prestazione_id": result2[0].prestazione_id,
                            //         //     "business_id": result1[0].id,
                            //         //     "business_name": result1[0].name,
                            //         //     "is_canceled": req.body.is_canceled,
                            //         // },
                            //         // "data": {
                            //         //     "booking_id": req.body.booking_id,
                            //         //     "prestazione_id": result2[0].prestazione_id,
                            //         //     "note": result2[0].note,
                            //         //     "begin_at": result2[0].begin_at,
                            //         //     'prestazione_duration': result2[0].prestazione_duration,
                            //         //     'prestazione_image': result2[0].prestazione_image,
                            //         //     'prestazione_description': result2[0].prestazione_description,
                            //         //     'prestazione_title': result2[0].prestazione_title,
                            //         //     'prestazione_price': result2[0].prestazione_price,
                            //         //     'presale_price': result2[0].presale_price,
                            //         //     'user_id': req.body.user_id,
                            //         //     'user_username': result0[0].username,
                            //         //     'user_name': result0[0].name,
                            //         //     'user_profile_image': `${result0[0].profile_image}`,
                            //         //     'user_phone_number': result0[0].user_phone_number,
                            //         //     'user_email': result0[0].email,
                            //         //     // 'price': req.body.prestazione_price,
                            //         //     'business_id': req.body.business_id,
                            //         //     'business_name': result1[0].name,
                            //         //     'business_type_id': result1[0].business_type_id,
                            //         //     'business_profile_image': `${result1[0].profile_image}`,
                            //         //     'business_description': result1[0].description,
                            //         //     'business_address': result1[0].address,
                            //         //     'business_phone_number': result1[0].phone_number,
                            //         //     'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                            //         //     'is_canceled': 1,
                            //         //     'created_at': new Date(Date.now()).toISOString(),
                            //         // },
                            //
                            //         "data": {
                            //             "booking_id": req.body.booking_id,
                            //             "prestazione_id": result2[0][0].prestazione_id,
                            //             // "note": result2[0][0].note,
                            //             "begin_at": result2[0][0].begin_at,
                            //             'prestazione_duration': result2[0][0].prestazione_duration,
                            //             'prestazione_image': result2[0][0].prestazione_image,
                            //             'prestazione_description': result2[0][0].prestazione_description,
                            //             'prestazione_title': result2[0][0].prestazione_title,
                            //             'prestazione_price': result2[0][0].prestazione_price,
                            //             // 'presale_price': result2[0][0].presale_price,
                            //             'user_id': req.body.user_id,
                            //             'user_username': result0[0][0].username,
                            //             'user_name': result0[0][0].name,
                            //             'user_profile_image': `${result0[0][0].profile_image}`,
                            //             // 'user_phone_number': result0[0][0].user_phone_number,
                            //             'user_email': result0[0][0].email,
                            //             // 'price': req.body.prestazione_price,
                            //             'business_id': req.body.business_id,
                            //             'business_name': result1[0][0].name,
                            //             'business_type_id': result1[0][0].business_type_id,
                            //             'business_profile_image': `${result1[0][0].profile_image}`,
                            //             'business_description': result1[0][0].description,
                            //             'business_address': result1[0][0].address,
                            //             'business_phone_number': result1[0][0].phone_number,
                            //             'max_contemporary_appointments': result1[0][0].max_contemporary_appointments,
                            //             'is_canceled': '1',
                            //             'created_at': new Date(Date.now()).toISOString(),
                            //         }/*.toString()*/,
                            //         "android": {
                            //             "notification": {
                            //                 "image": `${req.body.prestazione_image}`,
                            //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                            //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
                            //             },
                            //             "direct_boot_ok": true
                            //         },
                            //         "apns": {
                            //             "payload": {
                            //                 "aps": {
                            //                     "sound": 65,
                            //                     "blimblo": 'fffdgdg',
                            //                     "blimbl44o": "vdgvdgvdgg",
                            //                 }
                            //             }
                            //         },
                            //         "registration_ids": array,
                            //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                            //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                            //     }
                            // }).then(function (response) {
                            //     console.log(response.status);
                            //     console.log(response.data);
                            //     console.log(response.data.success);
                            // }).catch(function (error) {
                            //     console.log(error);
                            // });
                        });
                    });
                });

            });

            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/room", checkBusinessAuth, checkBusiness, (req, res) => {
    // let chatId = req.body.chat_id;
    let userId = req.body.user_id;
    let businessId = req.params.business_id;
    let text = req.body.text;
    let sentAt = req.body.sent_at;
    let id = uuidv4();
    let businessRoomId;

    let query = `SELECT business_room.id AS business_room_id FROM business_room WHERE business_room.business_id = ?`;
    db.query(query, [businessId,], async (err, result025) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        // console.log(result025);
        businessRoomId = result025[0].business_room_id;
        // console.log(result025[0].business_room_id);

        res.status(200).json(businessRoomId);
    });
});

Router.get("/:business_id/room/:room_id/message", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    // let singleEventId = req.body.event_id;
    let businessId = req.params.business_id;
    // //console.log(singleEventId);

    const sql = `SELECT business_room_message.id AS business_room_message_id, business_room_message.text AS business_room_message_text,
                    business_room_message.is_deleted AS business_room_message_is_deleted, business_room_message.sent_at AS business_room_message_sent_at,

                    user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                    user.username AS user_username, user.phone AS user_phone, 
                    user.name AS user_name, user.description AS user_description,
                    
                    business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image
                    
                 FROM business_room_message
                      LEFT JOIN user ON business_room_message.user_id = user.id
                      LEFT JOIN business_room ON business_room_message.business_room_id = business_room.id
                      LEFT JOIN business ON business_room.business_id = business.id
                      LEFT JOIN category ON business.category_id = category.id
                 WHERE business.id = ? AND (user.is_deleted = 0 OR business.is_visible = 1)
                 ORDER BY business_room_message.sent_at ASC`;
    db.query(sql, [businessId], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

Router.get("/:business_id/post/is_visible", /*checkDev,*/ (req, res) => {
    try {
        let businessId = req.params.business_id;
        console.log(businessId);

        const sql = `SELECT business_post.id AS post_id, business_post.description AS post_description,
                        business_post.image_url AS post_image_url, business_post.is_visible AS post_is_visible,
                        business_post.created_at AS post_created_at,

                        user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                        user.username AS user_username, user.phone AS user_phone, 
                        user.name AS user_name, user.description AS user_description,
                        
                        business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        /*business.email_notification AS business_email_notification,*/
                        business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                        business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
                        
                        category.id AS category_id, category.name AS category_name, category.image AS category_image,
        
                        prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                        prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                        prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                        prestazione.is_price_range AS prestazione_is_price_range,   
                        prestazione.description AS prestazione_description, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.business_id, prestazione.id AS prestazione_id

                     FROM business_post
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN business ON business.id = prestazione.business_id
                        LEFT JOIN user ON user.id = business_post.user_id
                        LEFT JOIN category ON business.category_id = category.id
                     WHERE business_post.is_visible = 1 AND prestazione.business_id = ? AND user.is_deleted = 0
                     AND business.is_visible = 1
                     ORDER BY post_created_at DESC`;
        // const sql = `SELECT booking_post.id AS post_id, booking_post.description AS post_description,
        //                 booking_post.image_url AS post_image_url, booking_post.is_visible AS post_is_visible,
        //                 booking_post.is_admin AS post_is_admin,
        //                 booking_post.created_at AS post_created_at,
        //
        //                 booking.id AS booking_id, booking.begin_at, booking.created_at, booking.is_canceled,
        //
        //                 business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
        //                 business.name AS business_name, business.id AS business_id, business.address AS business_address,
        //                 /*business.email_notification AS business_email_notification,*/
        //                 business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
        //                 business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
        //
        //                 category.id AS category_id, category.name AS category_name, category.image AS category_image,
        //
        //                 user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
        //                 user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description,
        //
        //                 prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
        //                 prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   prestazione.description AS prestazione_description,
        //                 prestazione.business_id, prestazione.id AS prestazione_id
        //
        //              FROM booking_post
        //                 LEFT JOIN booking ON booking.id = booking_post.booking_id
        //                 LEFT JOIN user_order ON user_order.id = booking.user_order_id
        //                 LEFT JOIN user ON user.id = user_order.user_id
        //                 LEFT JOIN prestazione ON prestazione.id = booking.prestazione_id
        //                 LEFT JOIN business ON business.id = prestazione.business_id
        //                 LEFT JOIN category ON business.category_id = category.id
        //              WHERE booking_post.is_visible = 1 AND business.id = ? AND booking_post.is_admin = 1
        //              ORDER BY post_created_at DESC`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/order/user", /*checkDev,*/ (req, res) => {
    try {
        let businessId = req.params.business_id;
        console.log(businessId);

        const sql = `SELECT DISTINCT user.profile_image AS user_profile_image, user.id AS user_id, 
                        user.email AS user_email, user.username AS user_username,
                        user.phone AS user_phone, user.name AS user_name, user.description AS user_description,
                        
                        prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                        prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                        prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                        prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title,

                        category.id AS category_id, category.name AS category_name, category.image AS category_image,
                        
                        business.profile_image AS business_profile_image, business.description AS business_description, business.email AS business_email,
                        /*business.email_notification AS business_email_notification,*/
                        business.max_contemporary_appointments, business.category_id AS business_category_id, business.phone AS business_phone,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id,
                        business.longitude AS business_longitude, business.latitude AS business_latitude
                
                    FROM user
                         JOIN user_order ON user.id = user_order.user_id
                         JOIN booking ON user_order.id = booking.user_order_id
                         JOIN prestazione ON prestazione.id = booking.prestazione_id
                         JOIN business ON business.id = prestazione.business_id
                         JOIN category ON business.category_id = category.id
                        /*JOIN user ON user.id = user_order.user_id*/
                    WHERE /*booking.is_shared = 1*/ business.id = ? AND user.is_deleted = 0
                    /*AND business.is_visible = 1*/
                    GROUP BY user.id
                    ORDER BY user_name ASC`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/post/:id", (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM business_post WHERE id = ?`;
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

Router.put("/:business_id/post/:post_id", checkBusinessAuth, /*checkBusiness,*/ /*upload*/upload1.single("image"), async (req, res) => {
    try {
        let postId = req.body.post_id;
        let userId = req.body.user_id;
        let prestazioneId = req.body.prestazione_id;
        let businessId = req.body.business_id;
        // let bookingId = req.body.booking_id;
        // let price = req.body.price;
        // let title = req.body.title;
        let imageUrl = req.body.image_url;
        let description = req.body.description;
        // let duration = req.body.duration;
        let array = [];

        //console.log(price);
        // price = parseFloat(price.toString());
        // //console.log(price);

        // checkBusiness(req, res, next);
        const sql6 = `SELECT business_id FROM business_authentication WHERE id = ?`;
        db.query(sql6, [req.decoded.id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkBusiness')
            console.log(result[0].business_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            if (result[0].business_id !== req.body.business_id) {
                // res.status(401).send(result);
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

        const sql0 = `UPDATE business_post SET is_visible = ?
                        WHERE id = ?`;
        // const sql0 = `UPDATE booking_post SET is_visible = ?
        //                 WHERE id = ?`;
        await db.promise().query(sql0, [0, postId]).then(async (result0, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            let id = uuidv4();

            if (req.file === undefined && imageUrl === null) {
                // console.log(err)
                res.status(500).send('No file image');
            }
            else if (req.file !== undefined) {
                if (req.file.mimetype === "image/png" || req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/webp" || imageUrl !== null) {

                    // const {buffer, originalname} = req.file;
                    //
                    // const form = new formData();
                    // form.append('imagerr', buffer, {filename: originalname});
                    //
                    // const response = await axios.post('http://localhost:7979/compress-image', form, {
                    //     headers: form.getHeaders(),
                    //     responseType: 'arraybuffer'
                    // });
                    //
                    // const modifiedImage = response.data;

                    const rekognitionParams = {
                        Image: {
                            // Bytes: req.file.buffer,
                            // Bytes: Buffer.from(req.file.buffer),
                            // Bytes: /*modifiedImage*/resizedImage,
                            Bytes: Buffer.from(req.file.buffer),
                        },
                        MinConfidence: 90, // Imposta la soglia di confidenza desiderata
                    };

                    let detectLabels = await rekognition.detectModerationLabels(rekognitionParams).promise();

                    console.log(detectLabels)

                    const moderationLabels = detectLabels.ModerationLabels;

                    if (moderationLabels.length > 0) {
                        // console.log('L\'immagine contiene contenuti pornografici.');
                        console.log('Etichette rilevate:', moderationLabels);
                        // return res.status(400).json({ error: 'L\'immagine contiene contenuti pornografici.' });
                        return res.status(500).json({ error: 'L\'immagine non è accettabile.' });
                    }
                    // else {
                    //     console.log('L\'immagine è accettabile.');
                    //     // res.json({ message: 'L\'immagine è accettabile.' });
                    //     // Procedi con il salvataggio dell'immagine su S3
                    // }

                    const sql1 = `INSERT INTO business_post(id, user_id, prestazione_id, image_url, description, is_visible, previous, created_at)
                                    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
                    // const sql1 = `INSERT INTO booking_post(id, booking_id, image_url, description, is_visible, is_admin, previous, created_at)
                    //                 VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
                    await db.promise().query(sql1, [id, userId, prestazioneId, imageUrl, description, 1, postId, new Date(Date.now()).toISOString()]).then(async (result1, err) => {
                    // db.query(sql1, [id, bookingId, imageUrl, description, 1, 1, postId, new Date(Date.now()).toISOString()], async (err, result1) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }

                        // if(req.file === undefined) {
                        //     return res.status(200).send(
                        //         JSON.stringify({
                        //             'id': id,
                        //             'image_url': imageUrl,
                        //             'business_id': businessId,
                        //             'user_id': userId,
                        //             'prestazione_id': prestazioneId,
                        //             'description': description,
                        //             'is_visible': 1,
                        //             'previous': postId
                        //         })
                        //     );
                        // }

                        const resizedImage = await sharp(/*getObjectResult.Body*/Buffer.from(req.file.buffer))
                            .resize(
                                960,
                                960,
                                {
                                    kernel: sharp.kernel.nearest,
                                    fit: sharp.fit.outside,
                                    // withoutEnlargement: true,
                                    // withoutReduction: true,
                                    // position: 'right top',
                                    // background: { r: 255, g: 255, b: 255, alpha: 0.5 }
                                }
                            )
                            // .webp({
                            //     quality: 100,
                            //     lossless: true,
                            //     effort: 6,
                            // })
                            // .png({
                            //     quality: /*100*/5,
                            //     effort: 10,
                            //     palette: true,
                            //     // progressive: true,
                            //     // adaptiveFiltering: true,
                            // })
                            .jpeg(
                                {
                                    quality: 60,
                                    force: true,
                                    progressive: true,
                                    trellisQuantisation: true,
                                    optimiseScans: true,
                                    chromaSubsampling: '4:4:4',
                                    mozjpeg: true,
                                }
                            )
                            // .heif({
                            //     compression: "av1",
                            //     quality: 100,
                            //     effort: 9,
                            //     lossless: true,
                            // })
                            .toBuffer();

                        console.log(req.file)
                        let myFile = req.file.originalname.split(".")
                        const fileType = myFile[myFile.length - 1]
                        let s3Path = `image/post/${id}/${uuidv4()}.${fileType}`;

                        // res.send({
                        //     message: "Hello World!"
                        // })

                        const params = {
                            Bucket: process.env.AWS_BUCKET_NAME,
                            // Key: `${uuid()}.${fileType}`,
                            // Key: `image/prestazione/${id}/${uuidv4()}.${fileType}`,
                            Key: s3Path,
                            Body: /*req.file.buffer*//*modifiedImage*/resizedImage
                        }

                        s3.upload(
                            params,
                            async (error, data) => {
                                if (error || moderationLabels.length > 0) {
                                    console.log(error)

                                    const sql2 = `DELETE FROM business_post WHERE id = ?`;
                                    // const sql2 = `DELETE FROM booking_post WHERE id = ?`;
                                    await db.promise().query(sql2, [id]).then(async (result, err) => {
                                        if (err) {
                                            console.log(err)
                                            return res.status(500).send(err);
                                        }

                                        const sql4 = `UPDATE business_post SET is_visible = ? WHERE id = ?`;
                                        // const sql4 = `UPDATE booking_post SET is_visible = ? WHERE id = ?`;
                                        await db.promise().query(sql4, [1, postId]).then(async (result, err) => {
                                            if (err) {
                                                console.log(err)
                                                return res.status(500).send(err);
                                            }

                                            // res.status(500).send("");
                                        });

                                        // res.status(500);
                                    });
                                    if (error) {
                                        console.log(err)
                                        res.status(500).send(error)
                                    }
                                    else if (moderationLabels.length > 0) {
                                        return res.status(400).send('L\'immagine contiene contenuti sensibili.');
                                    }
                                }
                                else {
                                    console.log(data);

                                    const sql3 = `UPDATE business_post SET image_url = ? WHERE id = ?`;
                                    // const sql3 = `UPDATE booking_post SET image_url = ? WHERE id = ?`;
                                    await db.promise().query(sql3, [/*data['Location']*/s3Path, id]).then(async (result, err) => {
                                        if (err) {
                                            console.log(err)
                                            return res.status(500).send(err);
                                        }

                                        const sql165 = `UPDATE business_post_comment 
                                    SET business_post_comment.business_post_id = ?
                                    WHERE business_post_comment.business_post_id = ?`;
                                        await db.promise().query(sql165, [id, postId]).then(async (result, err) => {
                                            if (err) {
                                                console.log(err);
                                                return res.status(500).send('');
                                            }
                                            // res.send(result);
                                            const sql1659 = `UPDATE business_post_like 
                                    SET business_post_like.business_post_id = ?
                                    WHERE business_post_like.business_post_id = ?`;
                                            await db.promise().query(sql1659, [id, postId]).then(async (result, err) => {
                                                if (err) {
                                                    console.log(err);
                                                    return res.status(500).send('');
                                                }
                                                // res.send(result);

                                                // res.status(200).send(data)
                                                res.status(200).send(
                                                    JSON.stringify({
                                                        'id': id,
                                                        'image_url': /*data['Location']*/s3Path,
                                                        'business_id': businessId,
                                                        // 'booking_id': bookingId,
                                                        'user_id': userId,
                                                        'prestazione_id': prestazioneId,
                                                        'description': description,
                                                        'is_visible': 1,
                                                        'created_at': new Date(Date.now()).toISOString(),
                                                        // 'is_admin': 1,
                                                        'previous': postId
                                                    })
                                                );
                                            });
                                        });
                                    });
                                }
                            }
                        );

                    });
                }
                // else if (req.file.mimetype === "image/webp") {
                else {
                    console.log(err)
                    res.status(521).send("Immagine con formato non supportato");
                }
            }
            else /*if (imageUrl !== null)*/ {
                const sql1 = `INSERT INTO business_post(id, user_id, prestazione_id, image_url, description, is_visible, previous, created_at)
                                    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
                // const sql1 = `INSERT INTO booking_post(id, booking_id, image_url, description, is_visible, is_admin, previous, created_at)
                //                     VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
                await db.promise().query(sql1, [id, userId, prestazioneId, imageUrl, description, 1, postId, new Date(Date.now()).toISOString()]).then(async (result1, err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send('');
                    }

                    const sql165 = `UPDATE business_post_comment 
                                    SET business_post_comment.business_post_id = ?
                                    WHERE business_post_comment.business_post_id = ?`;
                    await db.promise().query(sql165, [id, postId]).then(async (result, err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send('');
                        }
                        // res.send(result);
                        const sql1659 = `UPDATE business_post_like 
                                    SET business_post_like.business_post_id = ?
                                    WHERE business_post_like.business_post_id = ?`;
                        await db.promise().query(sql1659, [id, postId]).then(async (result, err) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send('');
                            }
                            // res.send(result);

                            const sql = `SELECT DISTINCT 
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description
                            
                            FROM user_device 
                             LEFT JOIN user ON user_device.user_id = user.id
                            WHERE user.id = ? AND user_device.fcm_token IS NOT NULL 
                            AND user_device.fcm_token <> ''
                            ORDER BY user_device.created_at DESC
                            LIMIT 1000`;
                            await db.promise().query(sql, [userId]).then(async (result10, err) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).send(err);
                                }

                                for (let i = 0; i < result10[0].length; i++) {
                                    console.log(result10[0][i].fcm_token);
                                    // if(result[i].fcm_token !== null){
                                    array.push(result10[0][i].fcm_token);
                                    // }
                                }

                                console.log('arrayggcc66cc6c6cc65gg5');
                                console.log(result10[0]);
                                console.log(array);

                                await axios({
                                    method: 'POST',
                                    url: 'https://fcm.googleapis.com/fcm/send',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                                    },
                                    data: {
                                        "notification": {
                                            "title": `Un post in cui sei stato taggato è stato modificato!`,
                                            // "subtitle": /*`${}`*/"Promozione",
                                            "body": `${req.body.business_name} ti ha taggato per ${req.body.prestazione_title}`,
                                            // "channel_id": "fcm_nurebo_admin_channel",
                                            "android_channel_id": "fcm_nurebo_channel",
                                            // "image": `${image}`,
                                            "vibrate": true,
                                            "icon": "calendar",
                                            // "sound": "piece_of_cake_611.mp3",
                                            // "sound": "default",
                                            // "tag": "ciccio"
                                        },
                                        "direct_boot_ok": true,
                                        "data": {
                                            "keyname": "any value"
                                        },
                                        "android": {
                                            "notification": {
                                                // "image": `${image}`,
                                                "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                                "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],

                                                "sound": "piece_of_cake_611.mp3",
                                                // "sound": "default",
                                                // "tag": "ciccio"
                                            },
                                            "direct_boot_ok": true
                                        },
                                        "registration_ids": array,
                                        // "registration_ids": [`${result1[0].fcm_token}`, ],
                                        // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                                    }
                                }).then(function (response) {
                                    console.log(response.status);
                                    console.log(response.data);
                                    console.log(response.data.success);
                                }).catch(function (error) {
                                    console.log(error);
                                });

                                // if (req.file === undefined) {
                                /*return*/
                                res.status(200).send(
                                    JSON.stringify({
                                        'id': id,
                                        'image_url': imageUrl,
                                        'business_id': businessId,
                                        'user_id': userId,
                                        'prestazione_id': prestazioneId,
                                        // 'booking_id': bookingId,
                                        'description': description,
                                        'is_visible': 1,
                                        'created_at': new Date(Date.now()).toISOString(),
                                        // 'is_admin': 1,
                                        'previous': postId
                                    })
                                );
                                // }
                            });
                        });
                    });
                });
            }
        });
    } catch(error){
        console.log(error)
        res.status(500).send("");
    }
});

Router.post("/:business_id/post", checkBusinessAuth, /*checkBusiness,*/ upload, async (req, res, next) => {
    try {
        let businessId = req.body.business_id;
        let prestazioneId = req.body.prestazione_id;
        let userId = req.body.user_id;
        let bookingId = req.body.booking_id;
        // let vote = req.body.vote;
        let imageUrl = req.body.image_url;
        let description = req.body.description;
        let id = uuidv4();
        let array = [];
        console.log('req.bodyvv56vv65x');
        console.log(req.decoded.id);

        // checkBusiness(req, res, next);
        const sql6 = `SELECT business_id FROM business_authentication WHERE id = ?`;
        // await db/*.promise()*/.query(sql6, [req.decoded.id]).then(async (result, err) => {
        /*await*/ db.query(sql6, [req.decoded.id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkUser')
            console.log(result[0].business_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            if (result[0].business_id !== req.body.business_id) {
                // res.status(401).send(result);
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

        const sql = `INSERT INTO business_post(id, user_id, prestazione_id, description, is_visible, created_at)
             VALUES(?, ?, ?, ?, ?, ?)`;
        // const sql = `INSERT INTO booking_post(id, booking_id, description, is_admin, is_visible, created_at)
        //      VALUES(?, ?, ?, ?, ?, ?)`;
        await db.promise().query(sql, [id, userId, prestazioneId, description, 1, new Date(Date.now()).toISOString()]).then(async (result, err) => {
        // db.query(sql, [id, /*businessId, userId, prestazioneId,*/bookingId, description, 1, 1, new Date(Date.now()).toISOString()], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            if (req.file === undefined) {
                // const sql = `SELECT DISTINCT
                //             user_device.id AS device_id, user_device.fcm_token,
                //             user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                //
                //             user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email,
                //             user.username AS user_username, user.phone_number AS user_phone_number,
                //             user.name AS user_name, user.description AS user_description
                //
                //     FROM user_device
                //      LEFT JOIN user ON user_device.user_id = user.id
                //     WHERE user.id = ? AND user_device.fcm_token IS NOT NULL
                //     AND user_device.fcm_token <> ''
                //     ORDER BY user_device.created_at DESC
                //     LIMIT 1000`;
                // await db.promise().query(sql, [userId]).then(async (result1, err) => {
                //     if (err) {
                //         console.log(err)
                //         return res.status(500).send(err);
                //     }
                //
                //     for (let i = 0; i < result1.length; i++) {
                //         console.log(result1[i].fcm_token);
                //         // if(result[i].fcm_token !== null){
                //         array.push(result1[i].fcm_token);
                //         // }
                //     }
                //
                //     console.log('arraygg5gg5');
                //     console.log(array);
                //
                //     await axios({
                //         method: 'POST',
                //         url: 'https://fcm.googleapis.com/fcm/send',
                //         headers: {
                //             'Content-Type': 'application/json',
                //             Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                //         },
                //         data: {
                //             "notification": {
                //                 "title": `Sei stato taggato in un post!`,
                //                 // "subtitle": /*`${}`*/"Promozione",
                //                 "body": `${req.body.business_name} ti ha taggato per ${req.body.prestazione_title}`,
                //                 // "channel_id": "fcm_nurebo_admin_channel",
                //                 "android_channel_id": "fcm_nurebo_channel",
                //                 // "image": `${image}`,
                //                 "vibrate": true,
                //                 "icon": "calendar",
                //                 // "sound": "piece_of_cake_611.mp3",
                //                 // "sound": "default",
                //                 // "tag": "ciccio"
                //             },
                //             "direct_boot_ok": true,
                //             "data": {
                //                 "keyname": "any value"
                //             },
                //             "android": {
                //                 "notification": {
                //                     // "image": `${image}`,
                //                     "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                //                     "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
                //
                //                     "sound": "piece_of_cake_611.mp3",
                //                     // "sound": "default",
                //                     // "tag": "ciccio"
                //                 },
                //                 "direct_boot_ok": true
                //             },
                //             "registration_ids": array,
                //             // "registration_ids": [`${result1[0].fcm_token}`, ],
                //             // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                //         }
                //     }).then(function (response) {
                //         console.log(response.status);
                //         console.log(response.data);
                //         console.log(response.data.success);
                //     }).catch(function (error) {
                //         console.log(error);
                //     });

                    // res.status(200).send(data)
                    // res.status(200).send(
                    //     JSON.stringify({
                    //         'id': id,
                    //         'image_url': '',
                    //         'business_id': businessId,
                    //         // 'booking_id': bookingId,
                    //         'description': description,
                    //         'prestazione_id': prestazioneId,
                    //         'user_id': userId,
                    //         'is_visible': 1,
                    //         // 'is_admin': 1
                    //     })
                    // );
                res.status(400).send('');
                // });
            }
            else {
                console.log(req.file)
                let myFile = req.file.originalname.split(".")
                const fileType = myFile[myFile.length - 1]

                // res.send({
                //     message: "Hello World!"
                // })

                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    // Key: `${uuid()}.${fileType}`,
                    Key: `image/post/${id}/${uuidv4()}.${fileType}`,
                    Body: req.file.buffer
                }

                s3.upload(
                    params,
                    async (error, data) => {
                        if (error) {
                            console.log(error)

                            const sql2 = `DELETE FROM business_post WHERE id = ?`;
                            // const sql2 = `DELETE FROM booking_post WHERE id = ?`;
                            await db.promise().query(sql2, [id]).then(async (result, err) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).send(err);
                                }
                                res.status(500);
                            });

                            res.status(500).send(error)
                        }
                        console.log(data);

                        const sql0 = `UPDATE business_post SET image_url = ?
                                        WHERE id = ?`;
                        // const sql0 = `UPDATE booking_post SET image_url = ?
                        //                 WHERE id = ?`;
                        await db.promise().query(sql0, [data['Key'], id]).then(async (result0, err) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }

                            const sql = `SELECT DISTINCT 
                            user_device.id AS device_id, user_device.fcm_token, 
                            user_device.manufacturer AS device_manufacturer, user_device.model AS device_model,
                            
                            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                            user.username AS user_username, user.phone AS user_phone, 
                            user.name AS user_name, user.description AS user_description
                            
                            FROM user_device 
                             LEFT JOIN user ON user_device.user_id = user.id
                            WHERE user.id = ? AND user_device.fcm_token IS NOT NULL 
                            AND user_device.fcm_token <> ''
                            ORDER BY user_device.created_at DESC
                            LIMIT 1000`;
                            await db.promise().query(sql, [userId]).then(async (result10, err) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).send(err);
                                }

                                for (let i = 0; i < result10[0].length; i++) {
                                    console.log(result10[0][i].fcm_token);
                                    // if(result[i].fcm_token !== null){
                                    array.push(result10[0][i].fcm_token);
                                    // }
                                }

                                console.log('arrayggcc66cc6c6cc65gg5');
                                console.log(result10[0]);
                                console.log(array);

                                await axios({
                                    method: 'POST',
                                    url: 'https://fcm.googleapis.com/fcm/send',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                                    },
                                    data: {
                                        "notification": {
                                            "title": `Sei stato taggato in un post!`,
                                            // "subtitle": /*`${}`*/"Promozione",
                                            "body": `${req.body.business_name} ti ha taggato per ${req.body.prestazione_title}`,
                                            // "channel_id": "fcm_nurebo_admin_channel",
                                            "android_channel_id": "fcm_nurebo_channel",
                                            // "image": `${image}`,
                                            "vibrate": true,
                                            "icon": "calendar",
                                            // "sound": "piece_of_cake_611.mp3",
                                            // "sound": "default",
                                            // "tag": "ciccio"
                                        },
                                        "direct_boot_ok": true,
                                        "data": {
                                            "keyname": "any value"
                                        },
                                        "android": {
                                            "notification": {
                                                // "image": `${image}`,
                                                "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                                "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],

                                                "sound": "piece_of_cake_611.mp3",
                                                // "sound": "default",
                                                // "tag": "ciccio"
                                            },
                                            "direct_boot_ok": true
                                        },
                                        "registration_ids": array,
                                        // "registration_ids": [`${result1[0].fcm_token}`, ],
                                        // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                                    }
                                }).then(function (response) {
                                    console.log(response.status);
                                    console.log(response.data);
                                    console.log(response.data.success);
                                }).catch(function (error) {
                                    console.log(error);
                                });

                                // res.status(200).send(data)
                                res.status(200).send(
                                    JSON.stringify({
                                        'id': id,
                                        'image_url': data['Key'],
                                        'business_id': businessId,
                                        // 'booking_id': bookingId,
                                        'description': description,
                                        'prestazione_id': prestazioneId,
                                        'user_id': userId,
                                        'is_visible': 1,
                                        // 'is_admin': 1
                                    })
                                );
                            });
                        });
                    }
                );
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:business_id/post/:post_id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let postId = req.params.post_id;

        const sql = `UPDATE business_post SET is_visible = ?
                    WHERE id = ?`;
        // const sql = `UPDATE booking_post SET is_visible = ?
        //             WHERE id = ?`;
        db.query(sql, [0, postId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // res.json(result);
            res.json({
                id: postId
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/validate", (req, res) => {
// Router.post("/event/validate", /*checkDev,*/ (req, res) => {
// Router.post("/event/:eventId/reservation/:reservationId/validate", /*checkDev,*/ (req, res) => {
    // let userId = req.body.user_id;
    let eventReservationId = req.body.event_reservation_id;
    let businessId = req.body.business_id;
    console.log(businessId);
    console.log(eventReservationId);
    let array = [];
    let validationId = uuidv4();
    // let singleEventId = req.body.event_id;
    // let fullPrice = req.body.full_price;
    // let quantity = req.body.quantity;
    // let url = 'http://192.168.1.252/kadingira-server';
    // var qrDataURL;

    // //console.log(userId);
    //console.log(singleEventTicketId);
    // //console.log(exhibitionId);
    // //console.log(fullPrice);
    // //console.log(quantity);

    // let singleEventTicketId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
    // //console.log(singleEventTicketId);

    const sql = `SELECT * 
                    FROM event_reservation 
                    JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
                    JOIN event ON event.id = event_ticket.event_id
                    JOIN business ON event.business_id = business.id
                    WHERE event_reservation.id = ? AND business.id = ?`;
    db.query(sql, [eventReservationId, businessId], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }

        console.log('result[0]');
        console.log(result[0]);

        if (result.length === 0) {
            //console.log(result);
            // console.log('QR code non associato a nessun biglietto kadingira');
            console.log('QR code non associato a nessun biglietto di questo business');
            // res.json(result.length);
            const sql565 = `INSERT INTO event_reservation_validation (id, event_reservation_id, result, created_at)
                                    VALUES(?, ?, ?, ?)`;
            db.query(sql565, [validationId, eventReservationId, 404, new Date(Date.now()).toISOString()], (err, result456) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                res.status(404).json(result.length);
            });
        }
        else if(result.length === 1) {
            console.log("result[0].is_validated");
            console.log(result[0].is_validated);
            // console.log("result[0].is_expired");
            // console.log(result[0].is_expired);
            if(result[0].is_validated === 0 && /*result[0].is_expired === 0*/
                new Date(result[0].begin_at) >= new Date(Date.now()) && result[0].user_id !== undefined) {
                console.log('Biglietto da convalidare');

                const sql0 = `UPDATE event_reservation 
                                SET is_validated = 1, is_validated_at = /*UTC_TIMESTAMP()*/?
                                WHERE id = ?`;
                db.query(sql0, [new Date(Date.now()).toISOString(), eventReservationId, ], (err, result456) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    // res.redirect('/category');
                    // res.json(result);
                    console.log('result[0].user_iddfgdg');
                    console.log(result[0].user_id);

                    const sql05 = `INSERT INTO event_reservation_validation(id, event_reservation_id, result, created_at)
                                    VALUES(?, ?, ?, ?)`;
                    db.query(sql05, [validationId, eventReservationId, 200, new Date(Date.now()).toISOString(), ], (err, result456) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }

                        const sql15 = `SELECT fcm_token 
                                     FROM user_device
                                     WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND user_id = ?
                                     ORDER BY RAND()
                                     LIMIT 1000`;
                        db.query(sql15, [result[0].user_id], async (err, result6) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }
                            console.log('result6');
                            console.log(result6);

                            for (let i = 0; i < result6.length; i++) {
                                console.log(result6[i].fcm_token);
                                // if(result[i].fcm_token !== null){
                                array.push(result6[i].fcm_token);
                                // }
                            }

                            await axios({
                                method: 'POST',
                                url: 'https://fcm.googleapis.com/fcm/send',
                                headers: {
                                    'Content-Type': 'application/json',
                                    // Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                                    Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                                },
                                data: {
                                    "notification": {
                                        // "title": `${req.body.prestazione_title}`,
                                        "title": `${result[0].title}`,
                                        // "title": `${result[0].name}`,
                                        "subtitle": /*`${}`*/"Prenotazione",
                                        // "body": `Prenotazione da ${/*req.body.user_name*/req.body.user_name !== null && req.body.user_name !== '' ? req.body.user_name : req.body.user_username} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                        "body": `Il biglietto è stato convalidato`,
                                        // "body": `Il biglietto per ${result[0].title} è stato convalidato`,
                                        // "channel_id": "fcm_nurebo_admin_channel",
                                        "android_channel_id": "fcm_nurebo_channel",
                                        // "image": `${req.body.prestazione_image}`,
                                        "vibrate": true,
                                        "icon": "calendar"
                                    },
                                    "direct_boot_ok": true,
                                    "data": {
                                        // "keyname": "any value",
                                        // "booking_id": id,
                                        // "prestazione_id": `dgggbg545`,
                                        // "note": req.body.note,
                                        // "begin_at": req.body.begin_at,
                                        // 'prestazione_duration': req.body.prestazione_duration,
                                        // "prestazione_image": `${req.body.prestazione_image}`,
                                        // 'prestazione_description': req.body.prestazione_description,
                                        // 'prestazione_title': req.body.prestazione_title,
                                        // 'prestazione_price': req.body.prestazione_price,
                                        // 'presale_price': req.body.presale_price,
                                        // 'user_id': req.body.user_id,
                                        // 'user_username': req.body.user_username,
                                        // 'user_name': req.body.user_name,
                                        // 'user_profile_image': `${req.body.user_profile_image}`,
                                        // 'user_phone_number': req.body.user_phone_number,
                                        // 'user_email': req.body.user_email,
                                        // // 'price': req.body.prestazione_price,
                                        // 'business_id': req.body.business_id,
                                        // 'business_name': req.body.business_name,
                                        // 'business_type_id': result1[0].business_type_id,
                                        // 'business_profile_image': `${result1[0].profile_image}`,
                                        // 'business_description': result1[0].description,
                                        // 'business_address': result1[0].address,
                                        // 'business_phone_number': result1[0].phone_number,
                                        // 'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                                        // 'is_canceled': 0,
                                        // 'created_at': new Date(Date.now()).toISOString(),
                                    },
                                    "android": {
                                        "notification": {
                                            // "image": `${req.body.prestazione_image}`,
                                            "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                            "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
                                        },
                                        "direct_boot_ok": true
                                    },
                                    // "registration_ids": [`${result1[0].fcm_token}`, ],
                                    "registration_ids": array,
                                    // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                                }
                            }).then(function (response) {
                                console.log(response.status);
                                console.log(response.data);
                                console.log(response.data.success);
                            }).catch(function (error) {
                                console.log(error);
                            });

                        });
                    });

                    res.status(200).json(result);
                });
                // res.status(200).json(result);
            }
            else if(result[0].is_validated === 1) {
                console.log('Biglietto già convalidato');
                const sql074 = `INSERT INTO event_reservation_validation(id, event_reservation_id, result, created_at)
                                    VALUES(?, ?, ?, ?)`;
                db.query(sql074, [validationId, eventReservationId, 428, new Date(Date.now()).toISOString(), ], (err, result456) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }

                    res.status(428).json(result);
                });
            }
            else if(result[0].is_validated === 0 && /*result[0].is_expired === 1*/
                new Date(result[0].begin_at) < new Date(Date.now())) {
                console.log('Biglietto scaduto');
                const sql55 = `INSERT INTO event_reservation_validation(id, event_reservation_id, result, created_at)
                                    VALUES(?, ?, ?, ?)`;
                db.query(sql55, [validationId, eventReservationId, 434, new Date(Date.now()).toISOString(), ], (err, result456) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }

                    res.status(434).json(result);
                });
            }
            else {
                console.log('errore1');
                const sql105 = `INSERT INTO event_reservation_validation(id, event_reservation_id, result, created_at)
                                    VALUES(?, ?, ?, ?)`;
                db.query(sql105, [validationId, eventReservationId, 540, new Date(Date.now()).toISOString(), ], (err, result456) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }

                    res.status(540).json(result);
                });
            }
            // res.json(result);
        }
        else {
            console.log('errore2');
            const sql043 = `INSERT INTO event_reservation_validation(id, event_reservation_id, result, created_at)
                                    VALUES(?, ?, ?, ?)`;
            db.query(sql043, [validationId, eventReservationId, 520, new Date(Date.now()).toISOString(), ], (err, result456) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }

                res.status(520).json(result);
            });
        }
    });
});

Router.get("/post/comment", /*checkDev,*/ (req, res) => {
    try {
        // let action = req.body.action;
        //console.log(req.body);

        const sql = "SELECT * FROM business_post_comment";
        // const sql = "SELECT * FROM booking_post_comment";
        db.query(sql, (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.json(rows);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/post/comment/:id", (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT *
                    FROM business_post_comment
                    WHERE id = ?`;
        // const sql = `SELECT *
        //             FROM booking_post_comment
        //             WHERE id = ?`;
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

// Router.get("/post/:post_id/comment", (req, res) => {
//     try {
//         // let postId = req.body.post_id;
//         let postId = req.params.post_id;
//
//         const sql = `SELECT *
//                     FROM business_post_comment
//                     JOIN user ON user.id = business_post_comment.user_id
//                     WHERE business_post_id = ?
//                     ORDER BY created_at DESC`;
//         // const sql = `SELECT *
//         //             FROM booking_post_comment
//         //             JOIN user ON user.id = booking_post_comment.user_id
//         //             WHERE booking_post_id = ?
//         //             ORDER BY created_at DESC`;
//         db.query(sql, [postId], (err, result) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//             res.json(result);
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("");
//     }
// });

Router.delete("/:business_id/post/comment/:id", /*checkDev,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        let sql = `DELETE FROM business_post_comment
                WHERE id = ?`;
        // let sql = `DELETE FROM booking_post_comment
        //         WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.json(result.affectedRows);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/post/:post_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let postId = req.body.post_id;
        let id = uuidv4();
        //console.log(userId);
        //console.log(postId);

        let sql1 = `SELECT *
                FROM business_post_like
                WHERE user_id = ? AND business_post_id = ?`;
        // let sql1 = `SELECT *
        //         FROM booking_post_like
        //         WHERE user_id = ? AND booking_post_id = ?`;
        db.query(sql1, [userId, postId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                //console.log(result);
                // res.redirect('/category');
                res.json(result);
            }
            else /*if (result.length === 0)*/{
                // let sql = `INSERT INTO booking_post_like(user_id, booking_post_id, created_at)
                //                 VALUES(?, ?, ?)`;
                let sql = `INSERT INTO business_post_like(user_id, business_post_id, created_at)
                                VALUES(?, ?, ?)`;
                db.query(sql, [userId, postId, new Date(Date.now()).toISOString()], (err, result) => {
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

Router.delete("/:business_id/post/:post_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let postId = req.body.post_id;
        //console.log(userId);
        //console.log(postId);

        let sql = `DELETE FROM business_post_like
                    WHERE user_id = ? AND business_post_id = ?`;
        // let sql = `DELETE FROM booking_post_like
        //             WHERE user_id = ? AND booking_post_id = ?`;
        db.query(sql, [userId, postId], (err, result) => {
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

// Router.get("/:business_id/post/:post_id/like", (req, res) => {
//     try {
//         // let businessPostId = req.body.booking_post_id;
//         let businessPostId = req.params.post_id;
//
//         // let sql = `SELECT DISTINCT *
//         //         FROM business_post_like
//         //         WHERE business_post_like.booking_post_id = ?
//         //         /*ORDER BY business_post_like.created_at DESC*/`;
//         let sql = `SELECT DISTINCT *
//                 FROM booking_post_like
//                 WHERE booking_post_like.booking_post_id = ?
//                 /*ORDER BY booking_post_like.created_at DESC*/`;
//         db.query(sql, [businessPostId], (err, result) => {
//             if (err) {
//                 console.log(err);
//                 throw err;
//             }
//
//             console.log('result.length5ff5ff6f')
//             console.log(result.length)
//             res.json(result);
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("");
//     }
// });

Router.get("/:business_id/post/like", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        // let sql = `SELECT DISTINCT *
        //
        //         FROM booking_post_like
        //             JOIN booking_post ON booking_post.id = booking_post_like.booking_post_id
        //             JOIN user ON booking_post_like.user_id = user.id
        //             JOIN booking ON booking.id = booking_post.booking_id
        //             JOIN user_order ON user_order.id = booking.user_order_id
        //             JOIN user ON user.id = user_order.user_id
        //             JOIN prestazione ON prestazione.id = booking_post.prestazione_id
        //             JOIN business ON business.id = prestazione.business_id
        //         WHERE business.id = ?
        //         ORDER BY booking_post_like.created_at DESC`;
        let sql = `SELECT DISTINCT business_post_like.created_at, 
        
                    business_post.id AS post_id, business_post.image_url AS post_image_url,
                    business_post.description AS post_description, business_post.created_at AS post_created_at,

                    user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                    user.username AS user_username,
                    user.phone AS user_phone, user.name AS user_name, user.description AS user_description,
                    
                    prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                    prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
                    prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                    prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                    prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image,
    
                    business.max_contemporary_appointments, business.category_id AS business_category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.profile_image AS business_profile_image, business.description AS business_description,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id

                    FROM business_post_like
                        JOIN business_post ON business_post.id = business_post_like.business_post_id
                        JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        JOIN user ON business_post_like.user_id = user.id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON category.id = business.category_id
                    WHERE business.id = ? AND business.is_visible = 1 AND user.is_deleted = 0
                    ORDER BY business_post_like.created_at DESC;`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            // //console.log(result.length)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/prestazione/recommended", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let prestazioneId = req.body.prestazione_id;
        let businessId = req.params.business_id;
        // let postCommentId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'

        let query = `INSERT INTO prestazione_recommended (prestazione_id, is_active, created_at)
                        VALUES(?, ?, ?)`;
        db.query(query, [prestazioneId, 1, new Date(Date.now()).toISOString()], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:business_id/prestazione/recommended/:prestazione_id", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let id = req.body.id;
        let prestazioneId = req.params.prestazione_id;
        let businessId = req.params.business_id;

        let sql = `DELETE FROM prestazione_recommended
                WHERE prestazione_id = ?`;
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

Router.get("/:business_id/prestazione/recommended", (req, res) => {
    try {
        let businessId = req.params.business_id;

        const sql = `SELECT prestazione_recommended.id AS recommended_id, prestazione_recommended.created_at AS recommended_created_at,

            max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
            business.name AS business_name, business.id AS business_id, business.address AS business_address,
            /*business.email_notification AS business_email_notification,*/
            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

            category.id AS category_id, category.name AS category_name, category.image AS category_image,

            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,   
            prestazione.is_valid AS prestazione_is_valid,
            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
            prestazione.created_at AS prestazione_created_at,
            prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title

                    FROM prestazione_recommended
                        JOIN prestazione ON prestazione_recommended.prestazione_id = prestazione.id
                        JOIN business ON prestazione.business_id = business.id
                        JOIN category ON business.category_id = category.id
                    WHERE prestazione.is_valid = 1 AND prestazione_recommended.is_active = 1 
                    AND business_id = ? AND business.is_visible = 1`;
        db/*.promise()*/.query(sql, [businessId], (err, result) => {
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

Router.delete("/notification/booking", /*checkDev,*/ (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let notificationId = req.body.notification_id;

        console.log(notificationId)

        let sql = `DELETE FROM booking_notification WHERE id = ?`;
        db.query(sql, [notificationId], (err, result) => {
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

Router.get("/:business_id/save/user", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        let businessId = req.params.business_id;
        // let postId = req.body.post_id;
        //console.log(businessPostId);
        // //console.log(postId);
        // SELECT *
        // FROM post_like
        // JOIN post ON post.id = post_like.post_id
        // WHERE post_like.user_id = ${userId}
        let sql = `SELECT DISTINCT user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                        user.username AS user_username, user.phone AS user_phone, 
                        user.name AS user_name, user.description AS user_description
                        
                    FROM business_favorite
                        JOIN user ON business_favorite.user_id = user.id
                    WHERE business_favorite.business_id = ?
                    ORDER BY business_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [businessId], (err, result) => {
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

Router.get("/:business_id/timetable/weekday/:weekday", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // let weekday = req.body.weekday;
        // let businessId = req.body.business_id;
        let weekday = req.params.weekday;
        let businessId = req.params.business_id;

        const sql = `SELECT *
                    FROM timetable
                    WHERE business_id = ? AND weekday_id = ?
                    ORDER BY open_at_hour ASC`;
        db.query(sql, [businessId, weekday], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // console.log(result);
            // console.log(result[0]);
            res.json(result);
            // res.json(result[0]);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.put("/:business_id/timetable", checkBusinessAuth, checkBusiness, async (req, res) => {
    try {
        // console.log('req.body 00');
        // console.log(req.body);
        // console.log('req.body[0] 00');
        // console.log(req.body[0]);

        let c1 = 0;
        for (let i = 0; i < req.body.length; i++) {
            for (let j = 0; j < req.body.length; j++) {
                if (req.body[i].weekday_id === req.body[j].weekday_id) {
                    let closeAt0 = new Date();
                    let openAt0 = new Date();
                    let closeAt1 = new Date();
                    let openAt1 = new Date();
                    // console.log('openAt0');
                    // console.log(openAt0);
                    // console.log('closeAt0');
                    // console.log(closeAt0);

                    // console.log(req.body[i])
                    // console.log(req.body[i].open_at_hour)
                    // console.log(req.body[i].open_at_minute)
                    // console.log(req.body[i].close_at_hour)
                    // console.log(req.body[i].close_at_minute)
                    // console.log(req.body[j])
                    // console.log(req.body[j].open_at_hour)
                    // console.log(req.body[j].open_at_minute)
                    // console.log(req.body[j].close_at_hour)
                    // console.log(req.body[j].close_at_minute)

                    openAt0.setUTCMinutes(req.body[i].open_at_minute)
                    openAt0.setUTCHours(req.body[i].open_at_hour)
                    closeAt0.setUTCMinutes(req.body[i].close_at_minute)
                    closeAt0.setUTCHours(req.body[i].close_at_hour)
                    openAt1.setUTCMinutes(req.body[j].open_at_minute)
                    openAt1.setUTCHours(req.body[j].open_at_hour)
                    closeAt1.setUTCMinutes(req.body[j].close_at_minute)
                    closeAt1.setUTCHours(req.body[j].close_at_hour)

                    if (closeAt0 < openAt0) {
                        closeAt0.setUTCHours(closeAt0.getHours() + 24)
                    }
                    if (closeAt1 < openAt1) {
                        closeAt1.setUTCHours(closeAt1.getHours() + 24)
                    }

                    console.log('openAt0');
                    console.log(openAt0);
                    console.log('closeAt0');
                    console.log(closeAt0);
                    console.log('openAt1');
                    console.log(openAt1);
                    console.log('closeAt1');
                    console.log(closeAt1);

                    if ((closeAt0 < closeAt1 && openAt1 < closeAt0) || (openAt0 < closeAt1 && openAt1 < openAt0)) {
                        c1++;
                        console.log(c1)
                        // break;
                        return res.status(466).send('Alcuni orari si incastrano');
                    }

                    console.log();
                }
            }
        }
        console.log('c1000')
        console.log(c1)

        let sql0 = `DELETE FROM timetable WHERE business_id = ?`;
        await db.promise().query(sql0, [req.body[0].business_id]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            for (let i = 0; i < req.body.length; i++) {
                let weekdayId = req.body[i].weekday_id;
                let timetableId = req.body[i].id;
                let businessId = req.body[i].business_id;
                let openAtHour = req.body[i].open_at_hour;
                let openAtMinute = req.body[i].open_at_minute;
                let closeAtHour = req.body[i].close_at_hour;
                let closeAtMinute = req.body[i].close_at_minute;
                let id = uuidv4();

                // if(req.body[i].is_new) {
                const sql = `INSERT INTO timetable(id, business_id, weekday_id, open_at_hour, open_at_minute, close_at_hour, close_at_minute)
                 VALUES(?, ?, ?, ?, ?, ?, ?)`;
                await db.promise().query(sql, [id, businessId, weekdayId, openAtHour, openAtMinute, closeAtHour, closeAtMinute]).then((result, err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    // console.log('result');
                    // console.log(result);
                });
                // }
                // else {
                //     const sql1 = `UPDATE timetable SET weekday_id = ?, open_at_hour = ?, open_at_minute = ?, close_at_hour = ?, close_at_minute = ?
                //           WHERE id = ?`;
                //     await db.promise().query(sql1, [weekdayId, openAtHour, openAtMinute, closeAtHour, closeAtMinute, timetableId]).then((result, err) => {
                //         if (err) {
                //             console.log(err)
                //             return res.status(500).send(err);
                //         }
                //
                //         console.log('result');
                //         console.log(result);
                //     });
                // }
            }

            // return res.status(200).send(req.body);
        });

        let sql4 = `SELECT * FROM timetable WHERE business_id = ?`;
        db.promise().query(sql4, [req.body[0].business_id]).then((result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // console.log('result555');
            // console.log(result[0]);
            return res.status(200).send(result[0]);
            // return res.status(200).send(req.body);
        });

        // return res.status(200).send(req.body);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:business_id/timetable", checkBusinessAuth, checkBusiness, async (req, res) => {
    try {
        console.log('req.body delete');
        console.log(req.body);

        let sql0 = `DELETE FROM timetable WHERE business_id = ?`;
        db.query(sql0, [req.body.business_id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            return res.status(200).send(req.body);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/timetable", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        const appVersionName = req.headers['x-app-version-name'];
        const appVersionNumber = req.headers['x-app-version-number'];
        console.log('appVersionNamedfggggggded')
        console.log(appVersionName)
        console.log('appVersionNumberfdbccbcbcbcbb5')
        console.log(appVersionNumber)
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        const sql = `SELECT *
                 FROM weekday
                    JOIN timetable ON weekday.id = timetable.weekday_id
                 WHERE business_id = ?
                 ORDER BY weekday_id ASC`;
        db.query(sql, [businessId], (err, result) => {
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

Router.post("/:business_id/post/:post_id/comment", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let postId = req.params.post_id;
        let businessId = req.params.business_id;
        let text = req.body.text;
        //console.log(userId);
        //console.log(postId);
        let postCommentId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        //console.log(postCommentId);

        // let query = `INSERT INTO booking_post_comment(id, user_id, booking_post_id, text, created_at)
        //         VALUES(?, ?, ?, ?, ?)`;
        let query = `INSERT INTO business_post_comment(id, business_post_id, text, is_admin, created_at) 
                VALUES(?, ?, ?, ?, ?)`;
        db.query(query, [postCommentId, postId, text, 1, new Date(Date.now()).toISOString()], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/post/user/:user_id/comment", (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;
        // let postId = req.params.post_id;

        // console.log('postId')
        // console.log(postId)

        const sql = `SELECT DISTINCT business_post_comment.id, business_post_comment.created_at, 
            business_post_comment.text, business_post_comment.is_visible, business_post_comment.is_admin,

            business_post.id AS post_id, business_post.image_url AS post_image_url,
            business_post.description AS post_description, business_post.created_at AS post_created_at,
        
            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
            business.name AS business_name, business.id AS business_id, business.address AS business_address,
            /*business.email_notification AS business_email_notification,*/
            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
        
            category.id AS category_id, category.name AS category_name, category.image AS category_image,

            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
            prestazione.created_at AS prestazione_created_at,
            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
            prestazione.image AS prestazione_image, prestazione.title AS prestazione_title, prestazione.is_valid AS prestazione_is_valid,

            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
            user.username AS user_username,
            user.phone AS user_phone, user.name AS user_name, user.description AS user_description

            FROM business_post_comment
                LEFT JOIN business_post ON business_post.id = business_post_comment.business_post_id
                LEFT JOIN user ON user.id = business_post_comment.user_id
                LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                LEFT JOIN business ON business.id = prestazione.business_id
                LEFT JOIN category ON category.id = business.category_id
            WHERE (business_post.user_id = ? AND business.is_visible = 1 AND user.is_deleted = 0 AND business_post_comment.is_admin = 0)
                OR (business_post.user_id = ? AND business.is_visible = 1 AND business_post_comment.is_admin = 1)
            ORDER BY business_post_comment.created_at DESC;`;
        db.query(sql, [userId, userId, ], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log(result.length);
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/post/user/:user_id/like", (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let postId = req.params.post_id;
        let userId = req.params.user_id;

        let sql = `SELECT DISTINCT business_post_like.created_at, 
        
                    business_post.id AS post_id, business_post.image_url AS post_image_url,
                    business_post.description AS post_description, business_post.created_at AS post_created_at,

                    user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                    user.username AS user_username,
                    user.phone AS user_phone, user.name AS user_name, user.description AS user_description,
                    
                    prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                    prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                    prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                    prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                    prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image,
    
                    business.max_contemporary_appointments, business.category_id AS business_category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.profile_image AS business_profile_image, business.description AS business_description,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id

                FROM business_post_like
                    LEFT JOIN business_post ON business_post.id = business_post_like.business_post_id
                    LEFT JOIN prestazione ON business_post.prestazione_id = prestazione.id
                    LEFT JOIN business ON prestazione.business_id = business.id
                    LEFT JOIN user ON business_post_like.user_id = user.id
                    LEFT JOIN category ON category.id = business.category_id
                    
                WHERE business_post.user_id = ? AND business.is_visible = 1 AND user.is_deleted = 0
                ORDER BY business_post_like.created_at DESC`;
        db.query(sql, [userId], (err, result) => {
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

Router.get("/:business_id/post/:post_id/comment", (req, res) => {
    try {
        // let userId = req.body.user_id;
        let businessId = req.params.business_id;
        let postId = req.params.post_id;

        console.log('postId')
        console.log(postId)

        // const sql = `SELECT *
        //                 FROM booking_post_comment
        //                     JOIN user ON user.id = booking_post_comment.user_id
        //                 WHERE booking_post_id = ?`;
        // const sql = `SELECT *
        //                 FROM business_post_comment
        //                     JOIN user ON user.id = business_post_comment.user_id
        //                 WHERE business_post_id = ?`;
        const sql = `SELECT DISTINCT business_post_comment.id, business_post_comment.created_at, 
            business_post_comment.text, business_post_comment.is_visible, business_post_comment.is_admin,

            business_post.id AS post_id, business_post.image_url AS post_image_url,
            business_post.description AS post_description, business_post.created_at AS post_created_at,
        
            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
            business.name AS business_name, business.id AS business_id, business.address AS business_address,
            /*business.email_notification AS business_email_notification,*/
            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
        
            category.id AS category_id, category.name AS category_name, category.image AS category_image,

            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
            prestazione.created_at AS prestazione_created_at,
            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
            prestazione.image AS prestazione_image, prestazione.title AS prestazione_title, prestazione.is_valid AS prestazione_is_valid,

            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
            user.username AS user_username,
            user.phone AS user_phone, user.name AS user_name, user.description AS user_description

            FROM business_post_comment
                LEFT JOIN user ON user.id = business_post_comment.user_id
                LEFT JOIN business_post ON business_post.id = business_post_comment.business_post_id
                LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                LEFT JOIN business ON business.id = prestazione.business_id
                LEFT JOIN category ON category.id = business.category_id
            WHERE (business_post.id = ? AND business.is_visible = 1 AND user.is_deleted = 0 AND business_post_comment.is_admin = 0)
                OR (business_post.id = ? AND business.is_visible = 1 AND business_post_comment.is_admin = 1)
            ORDER BY business_post_comment.created_at DESC;`;
        db.query(sql, [postId, postId,], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log(result.length);
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/post/comment", (req, res) => {
    try {
        // let userId = req.body.user_id;
        let businessId = req.params.business_id;
        let postId = req.params.post_id;

        console.log('postId')
        console.log(postId)

        // const sql = `SELECT *
        //                 FROM booking_post_comment
        //                     JOIN user ON user.id = booking_post_comment.user_id
        //                 WHERE booking_post_id = ?`;
        // const sql = `SELECT *
        //                 FROM business_post_comment
        //                     JOIN user ON user.id = business_post_comment.user_id
        //                 WHERE business_post_id = ?`;
        const sql = `SELECT DISTINCT business_post_comment.id, business_post_comment.created_at, 
            business_post_comment.text, business_post_comment.is_visible, business_post_comment.is_admin,

            business_post.id AS post_id, business_post.image_url AS post_image_url,
            business_post.description AS post_description, business_post.created_at AS post_created_at,
        
            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
            business.name AS business_name, business.id AS business_id, business.address AS business_address,
            /*business.email_notification AS business_email_notification,*/
            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
        
            category.id AS category_id, category.name AS category_name, category.image AS category_image,

            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
            prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
            prestazione.created_at AS prestazione_created_at,
            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
            prestazione.image AS prestazione_image, prestazione.title AS prestazione_title, prestazione.is_valid AS prestazione_is_valid,

            user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
            user.username AS user_username,
            user.phone AS user_phone, user.name AS user_name, user.description AS user_description

            FROM business_post_comment
                LEFT JOIN user ON user.id = business_post_comment.user_id
                LEFT JOIN business_post ON business_post.id = business_post_comment.business_post_id
                LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                LEFT JOIN business ON business.id = prestazione.business_id
                LEFT JOIN category ON category.id = business.category_id
            WHERE (business.id = ? AND business.is_visible = 1 AND user.is_deleted = 0 AND business_post_comment.is_admin = 0)
                OR (business.id = ? AND business.is_visible = 1 AND business_post_comment.is_admin = 1)
            ORDER BY business_post_comment.created_at DESC;`;
        db.query(sql, [businessId, businessId,], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log(result.length);
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/post/:post_id/like", (req, res) => {
    try {
        // let userId = req.body.user_id;
        let postId = req.params.post_id;
        let businessId = req.params.business_id;

        let sql = `SELECT DISTINCT business_post_like.created_at, 
        
                    business_post.id AS post_id, business_post.image_url AS post_image_url,
                    business_post.description AS post_description, business_post.created_at AS post_created_at,

                    user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                    user.username AS user_username,
                    user.phone AS user_phone, user.name AS user_name, user.description AS user_description,
                    
                    prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                    prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                    prestazione.created_at AS prestazione_created_at, prestazione.is_valid AS prestazione_is_valid,
                    prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                    prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, prestazione.title AS prestazione_title,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image,
    
                    business.max_contemporary_appointments, business.category_id AS business_category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.profile_image AS business_profile_image, business.description AS business_description,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id

                FROM business_post_like
                    LEFT JOIN business_post ON business_post.id = business_post_like.business_post_id
                    LEFT JOIN prestazione ON business_post.prestazione_id = prestazione.id
                   
                    LEFT JOIN business ON prestazione.business_id = business.id
                    LEFT JOIN user ON business_post_like.user_id = user.id
                    LEFT JOIN category ON category.id = business.category_id
                    
                WHERE business_post_like.business_post_id = ? AND business.is_visible = 1 AND user.is_deleted = 0
                ORDER BY business_post_like.created_at DESC`;
        // let sql = `SELECT DISTINCT booking_post_like.booking_post_id, booking_post_like.user_id, business_post.id AS post_id,
        //             business_post.image_url AS post_image_url,
        //             business_post.description AS post_description, business_post.created_at AS post_created_at
        //
        //             FROM booking_post_like
        //                 JOIN business_post ON business_post.id = booking_post_like.booking_post_id
        //             WHERE booking_post_like.booking_post_id = ?
        //             ORDER BY business_post.created_at DESC`;
        db.query(sql, [postId], (err, result) => {
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

Router.get("/:business_id/prestazione/bestsellers", (req, res) => {
    let businessId = req.params.business_id;

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
                        prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, 
                        prestazione.title AS prestazione_title

                 FROM prestazione
                          LEFT JOIN business ON prestazione.business_id = business.id
                          LEFT JOIN business_room ON business.id = business_room.business_id
                          LEFT JOIN category ON business.category_id = category.id
                 WHERE prestazione.is_valid = 1 AND prestazione.image != '' AND business.id = ? AND business.is_visible = ?
                 ORDER BY RAND()
                 LIMIT 10`;
        db.query(sql, [businessId, 1], (err, result) => {
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

Router.get("/prestazione/bestsellers", /*async*/ (req, res) => {
    let businessId = req.params.business_id;
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
                 WHERE prestazione.is_valid = 1 AND prestazione.image != '' AND business.is_visible = ?
                 ORDER BY RAND()
                 /*LIMIT 10*/`;
        db.query(sql, [1], (err, result) => {
        // await db.promise().query(sql, [1]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // console.log(result)

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
                res.status(510).send(err);
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/session", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let ipAddr = req.body.ip_addr;
        let businessDeviceId = req.body.business_device_id;
        let latitude = req.body.latitude;
        let longitude = req.body.longitude;
        let zipCode = req.body.zip;
        let beginAt = req.body.begin_at;
        // console.log(req.body);

        const decoded = JWT.verify(req.headers.authorization, process.env.JWT_KEY)
        // const decoded = JWT.verify(req.headers.authorization, global.JWT_KEY)
        console.log('decoded0000')
        console.log(decoded)

        let id = uuidv4();
        const sql = `INSERT INTO business_session(id, business_authentication_id, latitude, longitude, ip_addr, zip_code, begin_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [id, decoded.id, latitude, longitude, ipAddr, zipCode, beginAt], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            res.json(id);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:business_id/session/:session_id/close", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        // let sessionId = req.body.session_id;
        let sessionId = req.params.session_id;
        let endAt = req.body.end_at;

        // console.log('endAtcc5c')
        // console.log(endAt)

        const sql = `UPDATE business_session SET end_at = ?/*UTC_TIMESTAMP()*/
                    WHERE id = ?`;
        db.query(sql, [endAt, sessionId,], (err, result) => {
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

Router.get("/notification/booking", /*checkDev,*/ (req, res) => {
    try {
        // let action = req.body.action;
        // //console.log(req.body);

        // if(action === 'GET') {
        const sql = "SELECT * FROM booking_notification";
        db.query(sql, (err, rows) => {
            // //console.log(rows);
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(rows);
        })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/notification/booking/:id", /*checkDev,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM booking_notification WHERE id = ?`;
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

Router.delete("/:business_id/notification/booking", checkBusinessAuth, checkBusiness, (req, res) => {
    try {
        let businessId = req.body.business_id;
        // //console.log(eventBusinessId);

        const sql = `SELECT user_business_notification.id AS notification_id, user_business_notification.business_id, user_business_notification.type,
                        user_business_notification.booking_id, user_business_notification.sent_at, user_business_notification.user_id,

                booking.id AS booking_id, booking.created_at, booking.begin_at, booking.note, booking.is_canceled, booking.is_shared,

                user_order.user_id,

                user.profile_image AS user_profile_image, user.email AS user_email, user.username AS user_username,
                user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                prestazione.is_price_range AS prestazione_is_price_range,  prestazione.description AS prestazione_description,
                prestazione.business_id, prestazione.id AS prestazione_id, prestazione.is_valid AS prestazione_is_valid,

                business.profile_image AS business_profile_image, business.description AS business_description,
                business.max_contemporary_appointments, business.category_id AS business_category_id,
                business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id

                    FROM user_business_notification
                    JOIN booking ON user_business_notification.booking_id = booking.id
                    JOIN user ON user.id = user_business_notification.user_id
                    JOIN user_order ON user_order.id = booking.user_order_id
                    JOIN prestazione ON prestazione.id = booking.prestazione_id
                    JOIN business ON business.id = prestazione.business_id
                    WHERE user_business_notification.business_id = ?
                    ORDER BY user_business_notification.sent_at DESC`;
        db.query(sql, [businessId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                console.log('result.length from user_business_notification')
                console.log(result.length)
                let sql = `DELETE FROM user_business_notification WHERE business_id = ?`;
                db.query(sql, [businessId], (err, result1) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }
                    // console.log(`Notifiche non lette eliminate dal db: ${result.length}`)
                    console.log(`Notifiche non lette eliminate dal db: ${result1}`)
                    // let messaggio = "ciccio";
                    // res.json(result.affectedRows);
                });
            }
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/info_request", registerLimiter, async (req, res) => {
    try {

        console.log('req.body1111111111111111')
        console.log(req.body)

        let mailOptions = {
            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
            from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
            to: "metauros95@gmail.com, no-reply@nurebo.com",
            // to: "bar@example.com, baz@example.com", // list of receivers
            subject: 'Richiesta info',
            // subject: 'Hello ✔ Nodemailer - Test',
            // text: `${req.body.email}`,
            text: `${req.query.email}`,
            // html: `Richiesta informazioni da ${req.body.email}`,
        };

        // Step 3
        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
                console.log('Error occurs', err);
                // return;
            }
            // console.log(otp);
            console.log('Email sent!!!');
        });

        res.json({});
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:business_id/form", async (req, res) => {
    try {
        let businessId = req.params.business_id;
        // let path = req.params.path;
        let path = req.query.path;

        // console.log(req)

        const sql = `SELECT *
                            FROM business
                            LEFT JOIN business_form ON business.id = business_form.business_id
                            LEFT JOIN business_form_path ON business_form.id = business_form_path.business_form_id
                            WHERE business.id = ? AND business_form_path.name = ?`;
        await db.promise().query(sql, [businessId, path, ]).then(async (result, err) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log('result55555555555');
            console.log(result[0][0].image_url);

            const params = {
                Bucket: process.env.AWS_BUCKET_NAME, // Nome del bucket S3
                // Key: req.query.path,
                Key: result[0][0].image_url,
                Expires: 3600, // Durata in secondi per cui l'URL sarà valido
            };

            // const data = await s3.getObject(params).promise();
            // // const contentType = data.ContentType || 'application/octet-stream';
            // const contentType = data.ContentType || 'image/jpeg';
            // // res.set('Content-Type', contentType); // Imposta l'header del tipo di contenuto
            // // res.set('Content-Type', 'image/jpeg'); // Imposta l'header del tipo di contenuto
            // res.setHeader('Content-Type', 'image/jpeg');
            // console.log(data)
            // res.send(data.Body);
            // // res.status(200).json(result);
            const signedUrl = await s3.getSignedUrlPromise('getObject', params);
            console.log('Signed URL:', signedUrl);

            res.json(signedUrl);  // Restituisci il link firmato
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.get("/:business_id/timetable", async (req, res) => {
    try {
        let businessId = req.params.business_id;

        console.log(req.params)


        // const sql = `SELECT *
        //                     FROM business_timetable
        //                     JOIN business ON business.id = business_timetable.business_id
        //                     WHERE business.id = ?`;
        const sql = `SELECT *
                            FROM timetable
                            JOIN business ON business.id = timetable.business_id
                            WHERE business.id = ?`;
        db.query(sql, [businessId, ], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log(result);

            res.status(200).json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.get("/:business_id/timetable/:weekday_id", async (req, res) => {
    try {
        let businessId = req.params.business_id;
        let weekdayId = req.params.weekday_id;


        console.log(req.params)

        const sql = `SELECT *
                            FROM timetable
                            JOIN business ON business.id = timetable.business_id
                            WHERE business.id = ? AND timetable.weekday_id = ?`;
        db.query(sql, [businessId, weekdayId, ], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log(result);

            if (result.length === 0) {
                return res.status(404).json({ message: "No timetable" });
            }

            res.status(200).json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.get("/:business_id/debt", async (req, res) => {
    try {
        let businessId = req.params.business_id;
        let startDate = req.query.start_date;

        console.log('req.session');
        console.log(req.session);
        console.log(req.session.id);
        req.session.visited = true;
        req.sessionStore.get(req.session.id, (err, sessionData) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log(sessionData)
        });

        // console.log(req.params)

        // const sql = `SELECT business.*,
        //                            COUNT(reservation.id) /** 2*/ AS valid_reservation
        //                     FROM business
        //                     JOIN reservation ON business.id = reservation.business_id
        //                     WHERE business.id = ?
        //                       AND reservation.created_at >= ?/*"2024-12-09"*/
        //                       AND reservation.reservation_datetime_id IS NOT NULL
        //                     GROUP BY business.id;`;

        // const sql = `SELECT business.*, COUNT(reservation.id) AS valid_reservation, COUNT(reservation.id) * 2 AS                             month_price
        //
        //                     FROM reservation_proposal_confirm
        //                     JOIN reservation_proposal ON reservation_proposal.id = reservation_proposal_confirm.reservation_proposal_id
        //                     JOIN reservation ON reservation.id = reservation_proposal.reservation_id
        //                     JOIN business ON reservation.business_id = business.id
        //                     WHERE business.id = ?/* "osteria-serafina-milano" */ AND reservation.created_at >= ?/*"2024-12-09"*/
        //                     AND reservation.reservation_datetime_id IS NOT NULL
        //                     GROUP BY business.id;`;
        // const sql = `SELECT */*business.*, COUNT(reservation.id) AS valid_reservation, COUNT(reservation.id) * 2 AS                             month_price*/
        //                     FROM reservation_proposal_confirm
        //                     JOIN reservation_proposal ON reservation_proposal.id = reservation_proposal_confirm.reservation_proposal_id
        //                     JOIN reservation ON reservation.id = reservation_proposal.reservation_id
        //                     JOIN business ON reservation.business_id = business.id
        //                     WHERE business.id = "osteria-serafina-milano" AND reservation.created_at >= "2024-12-09"
        //                     AND reservation.reservation_datetime_id IS NOT NULL
        //                     ORDER BY reservation.created_at DESC
        //                     /*GROUP BY business.id*/;`;
        const sql = `SELECT 
                                reservation.*, 
                                business.*, 
                                reservation.id AS reservation_id,
                                reservation.created_at AS reservation_created_at,
                                reservation.reservation_datetime_id,
                                MIN(reservation_proposal_confirm.created_at) AS proposal_confirm_created_at/*,
                                MIN(reservation_proposal.id) AS proposal_id, 
                                MIN(reservation_proposal_confirm.id) AS proposal_confirm_id*/
                            FROM 
                                reservation
                            LEFT JOIN 
                                business ON reservation.business_id = business.id
                            LEFT JOIN 
                                reservation_proposal ON reservation.id = reservation_proposal.reservation_id
                            LEFT JOIN 
                                reservation_proposal_confirm ON reservation_proposal.id = reservation_proposal_confirm.reservation_proposal_id
                            WHERE 
                                business.id = ?/* "crosta-d-oro-corsico"  */
                                AND reservation.created_at >= ?/* "2024-12-09" */
                                /*AND reservation.reservation_datetime_id IS NOT NULL*/
                                AND reservation_proposal_confirm.user_type_id = 1
                            GROUP BY 
                                reservation.id
                            ORDER BY 
                                reservation.created_at DESC;`;
        db.query(sql, [businessId, startDate, ], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            // console.log(result);
            // if (result.length === 0) {
            //     return res.status(404).json({ message: "No timetable" });
            // }

            res.cookie("merda", new Date(Date.now()).toISOString(), {
                maxAge: 60000 * 60 * 2,
            })
            res.cookie("reeesa", "new Date(Date.now()).toISOString()", {
                maxAge: 60000 * 60 * 2,
                signed: true
            })
            res.status(200).json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.get("/debt", async (req, res) => {
    try {
        // let businessId = req.params.business_id;
        let startDate = req.query.start_date;

        console.log('req.session');
        console.log(req.session);
        console.log(req.session.id);
        req.session.visited = true;
        req.sessionStore.get(req.session.id, (err, sessionData) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log(sessionData)
        });

        // console.log(req.params)


        const sql = `WITH reservation_details AS (
                                SELECT 
                                    reservation.id AS reservation_id, -- Rinomina 'id' di reservation
                                    reservation.created_at AS reservation_created_at,
                                    reservation.reservation_datetime_id,
                                    business.id AS business_id, -- Rinomina 'id' di business
                                    business.name AS business_name,
                                    MIN(reservation_proposal_confirm.created_at) AS proposal_confirm_created_at
                                FROM 
                                    reservation
                                LEFT JOIN 
                                    business ON reservation.business_id = business.id
                                LEFT JOIN 
                                    reservation_proposal ON reservation.id = reservation_proposal.reservation_id
                                LEFT JOIN 
                                    reservation_proposal_confirm ON reservation_proposal.id = reservation_proposal_confirm.reservation_proposal_id
                                WHERE 
                                    reservation.created_at >= ?/* "2024-12-09" */
                                    AND reservation_proposal_confirm.user_type_id = 1
                                GROUP BY 
                                    reservation.id
                            )
                            SELECT 
                                business_id,
                                business_name,
                                COUNT(reservation_id) AS reservation_count
                            FROM 
                                reservation_details
                            GROUP BY 
                                business_id, business_name
                            ORDER BY 
                                reservation_count DESC;`;
        db.query(sql, [startDate, ], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            // console.log(result);
            // if (result.length === 0) {
            //     return res.status(404).json({ message: "No timetable" });
            // }

            res.cookie("merda", new Date(Date.now()).toISOString(), {
                maxAge: 60000 * 60 * 2,
            })
            res.cookie("reeesa", "new Date(Date.now()).toISOString()", {
                maxAge: 60000 * 60 * 2,
                signed: true
            })
            res.status(200).json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

// Endpoint per ottenere il valore di count dal cookie
Router.get('/api/count', (req, res) => {
    // const count = req.cookies.count ? parseInt(req.cookies.count, 10) : 0;
    const count = parseInt(req.cookies.count);
    res.json({count});
});

// Endpoint per aggiornare il valore di count e impostare il cookie
Router.post('/api/count', (req, res) => {
    const {newCount} = req.body;
    if (typeof newCount === 'number') {
        res.cookie('count', newCount, {
            httpOnly: true,
            // secure: false,
            // signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // Persistente per 7 giorni
        });
        res.json({success: true, count: newCount});
    } else {
        res.status(400).json({success: false, message: 'Invalid count value'});
    }
});

Router.get("/:business_id/reservation", /*registerLimiter,*/ async (req, res) => {
    try {
        // let reservationId = req.params.reservation_id;
        let businessId = req.params.business_id;
        // let datetime = new Date(req.body.reservation_datetime);

        // console.log('req.query')
        // console.log(req.query)
        // console.log('req.params')
        // console.log(req.params)

        const sql088 = `SELECT DISTINCT
                            reservation.id AS reservation_id,
                            reservation.name AS reservation_name,
                            reservation.user_url AS reservation_user_url,
                            reservation.business_url AS reservation_business_url,
                            reservation.email AS reservation_email,
                            reservation.phone AS reservation_phone,
                            reservation.quantity AS reservation_quantity,
                            reservation.created_at AS reservation_created_at,
                            business.id AS business_id,
                            business.name AS business_name,
                            business.cell AS business_cell,
                            business.info AS business_info,
                            business.image_url AS business_image_url,
                            business.phone AS business_phone,
                            business.email AS business_email,
                            business.address AS business_address,
                            business.city AS business_city,
                            business.province AS business_province,
                            business.postal_code AS business_postal_code,
                            business.region AS business_region,
                            business.address_number AS business_address_number,
                            business.created_at AS business_created_at,
                            business_form.id AS business_form_id,
                            business_form_color.id AS business_form_color_id,
                            business_form.created_at AS business_form_created_at,
                            business_form_color.background AS business_form_color_background,
                            business_form_color.active AS business_form_color_active,
                            reservation_datetime.id AS reservation_datetime_id,
                            reservation_datetime.datetime AS reservation_datetime_datetime,
                            reservation_datetime.created_at AS reservation_datetime_created_at,
                            reservation_proposal.id AS reservation_proposal_id,
                            reservation_validation.created_at AS reservation_validation_created_at,
                            reservation_proposal.user_type_id AS reservation_proposal_user_type_id,
                            reservation_proposal.created_at AS reservation_proposal_created_at,
                            reservation_cancel.user_type_id AS reservation_cancel_user_type_id,
                            reservation_cancel.created_at AS reservation_cancel_created_at,
                            CASE
                                WHEN reservation_proposal.id IS NOT NULL THEN GREATEST(
                                    COALESCE(reservation_proposal.created_at, '1970-01-01'),
                                    COALESCE(reservation_cancel.created_at, '1970-01-01'),
                                    COALESCE(reservation_validation.created_at, '1970-01-01')  
                                )
                                WHEN reservation_datetime.id IS NOT NULL THEN GREATEST(
                                    COALESCE(reservation_datetime.created_at, '1970-01-01'),
                                    COALESCE(reservation_cancel.created_at, '1970-01-01'),
                                    COALESCE(reservation_validation.created_at, '1970-01-01')
                                )
                                ELSE GREATEST(
                                    COALESCE(reservation.created_at, '1970-01-01'),
                                    COALESCE(reservation_cancel.created_at, '1970-01-01'),
                                    COALESCE(reservation_validation.created_at, '1970-01-01')
                                )
                            END AS sort_timestamp
                        FROM reservation
                        LEFT JOIN reservation_datetime ON reservation_datetime.id = reservation.reservation_datetime_id
                        LEFT JOIN reservation_proposal ON reservation_proposal.id = reservation.reservation_proposal_id
                        LEFT JOIN reservation_cancel ON reservation_cancel.reservation_id = reservation.id
                        LEFT JOIN reservation_validation ON reservation_validation.reservation_id = reservation.id
                        LEFT JOIN business ON reservation.business_id = business.id
                        LEFT JOIN business_form ON business.id = business_form.business_id
                        LEFT JOIN business_form_color ON business_form_color.id = business_form.business_form_color_id
                        WHERE business.id = ?
                        ORDER BY sort_timestamp DESC;`;
        await db.promise().query(sql088, [businessId,]).then(async (result889, err) => {
            // db.query(sql0, [reservationUrl, reservationUrl, /*1,*//* 0,*/], async (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // console.log('result.....000')
            // console.log(result889[0][0])

            // if(result889[0][0] === undefined) {
            //     res.status(404).json({
            //         message: "La prenotazione non esiste"
            //     });
            // }
            // else {
                res.status(207).json(result889[0]);
            // }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

function makeid(length) {
    try {
        var result = '';
        var characters = '0123456789';
        // var characters       = '123456789';//problema con lo 0 da risolvere perchè lo vede come intero a un certo punto (forse regexp)
        // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    } catch (error) {
        console.error(error);
    }
}

module.exports = Router;