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


// Router.get('/', (req, res) => {
// Router.get('/event/ticket', /*checkDev,*/ (req, res) => {
Router.get('/event/reservation', /*checkDev,*/ (req, res) => {
    const sql = "SELECT * FROM event_reservation";
    db.query(sql, (err, rows) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        res.json(rows);
    })
});

// Router.post("/", checkUserAuth, checkUser, async (req, res) => {
Router.post("/event/:id/ticket/:category/reservation", checkUserAuth, checkUser, async (req, res) => {
    let userId = req.body.user_id;
    let singleEventTicketCategoryId = req.body.event_ticket_id;
    let userOrderId = req.body.user_order_id;
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
                dark:"#2196F3",
                light:"#FFFFFF"
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

            let query = `INSERT INTO event_reservation(id, user_id, event_ticket_id, user_order_id, qr_code, created_at)
                            VALUES(?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
            db.query(query, [id, userId, singleEventTicketCategoryId, userOrderId, data['Location']], async (err, result) => {
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
});

Router.post("/new_ticket", (req, res) => {
    let userId = req.body.user_id;
    let singleEventTicketCategoryId = req.body.event_ticket_id;
    // let singleEventId = req.body.event_id;
    // let fullPrice = req.body.full_price;
    let quantity = req.body.quantity;
    let url = 'http://192.168.1.252/kadingira-server';
    // var qrDataURL;

    // //console.log(userId);
    // //console.log(singleEventTicketCategoryId);
    // //console.log(exhibitionId);
    // //console.log(fullPrice);
    // //console.log(quantity);

    for(let i = 0; i < quantity; i++) {
        let singleEventTicketId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        //console.log(singleEventTicketId);

        //creo il qrcode

        qr.toFile('qr_codes/' + singleEventTicketId + '.png', /*Date().toString()*/singleEventTicketId, {
            // qr.toFile(Date().toString() + '.png', Date().toString(), {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.3,
            margin: 5,
            color: {
                // dark:"#010599FF",
                dark:"#2196F3",
                light:"#FFFFFF"
                // light:"#FFBF60FF"
            }
        }, function (err) {
            if (err) {
                console.log(err);
                console.log(err)
            }
            //console.log('qr code png image created');
            let query = `INSERT INTO event_reservation(id, user_id, event_ticket_id, created_at, qr_code)
            VALUES('${singleEventTicketId}', '${userId}', ${singleEventTicketCategoryId}, UTC_TIMESTAMP(), '${url + '/qr_codes/' + singleEventTicketId + '.png'}')`;
            db.query(query, (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                res.result;
            });
        })

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
    }
});

// Router.post("/images", (req, res) => {
//     let userId = req.body.id;
//     // //console.log(userId);
//
//     const sql = `SELECT * FROM user_image WHERE user_id = ?`;
//     db.query(sql, [userId], (err, result) => {
//         if (err) {
//             //console.log(err)
//             return res.status(500).send(err);
//         }
//         if (result != null) {
//             //console.log(result);
//             // res.redirect('/category');
//             res.json(result);
//         }
//     });
//
// });

// Router.post("/user", (req, res) => {
// Router.get("/user/:user_id/ticket", checkUserAuth, checkUser, (req, res) => {
Router.get("/user/:user_id/reservation", checkUserAuth, checkUser, (req, res) => {
    // let userId = req.body.user_id;
    let userId = req.params.user_id;

    const sql = `SELECT DISTINCT event.title AS event_title, 
                    event.id AS event_id, event.description AS event_description,
                    event.begin_at AS event_begin_at, event.end_at AS event_end_at, 
                    event.is_valid AS event_is_valid, event.image AS event_image,
                    event.created_at AS event_created_at,
                
                    event_reservation.id,
                    event_reservation.qr_code, event_reservation.created_at,
                    event_reservation.is_validated, event_reservation.is_canceled,
                    event_reservation.is_validated_at, event.begin_at, event.end_at,

                    event_ticket.id AS event_ticket_id,
                    event_ticket.title AS event_ticket_title,
                    event_ticket.price AS event_ticket_price,
                    event_ticket.additional AS event_ticket_additional,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image,

                    business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id

                    FROM event_reservation
                    JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
                    JOIN event ON event_ticket.event_id = event.id
                    JOIN business ON business.id = event.business_id
                    JOIN user ON user.id = event_reservation.user_id
                    JOIN category ON business.category_id = category.id
                    WHERE event_reservation.user_id = ?
                    ORDER BY event_reservation.created_at DESC`;
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        // console.log(result)
        res.json(result);
    });
});

// Router.post("/user/only_event", (req, res) => {
// Router.get("/user/:user_id/ticket/event", checkUserAuth, checkUser, (req, res) => {
Router.get("/user/:user_id/reservation/event", (req, res) => {
    // let userId = req.body.user_id;
    let userId = req.params.user_id;

    const sql = `SELECT DISTINCT event.id AS event_id, event.title AS event_title,
                    event.image, event.description,
                    event.begin_at, event.end_at, business.profile_image AS business_profile_image,
            business.name AS business_name, business.id AS business_id, business.address AS business_address,
            business.is_date_business
                    FROM event_reservation
                    JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
                    JOIN event ON event_ticket.event_id = event.id
                    JOIN business ON business.id = event.business_id
                    JOIN user ON user.id = event_reservation.user_id
                    WHERE user_id = ?
                    ORDER BY created_at DESC`;
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// Router.post("/user/event", (req, res) => {
//     let userId = req.body.user_id;
//     // //console.log(eventBusinessId);
//
//     const sql = `SELECT DISTINCT event.id, event.title,
//             event.image, event.description, event_reservation.id AS event_reservation_id,
//             event_reservation.created_at,
//             event.begin_at, event.end_at, business.profile_image AS business_profile_image,
//             business.name AS business_name, business.id AS business_id, business.address AS business_address,
//             business.is_date_business
//                     FROM event_reservation
//                     JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
//                     JOIN event ON event_ticket.event_id = event.id
//                     JOIN business ON business.id = event.business_id
//                     JOIN user ON user.id = event_reservation.user_id
//                     WHERE user_id = ?
//                     ORDER BY created_at DESC`;
//     db.query(sql, [userId], (err, result) => {
//         if (err) {
//             //console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

// Router.post("/buyers", (req, res) => {
// Router.get("/event/user/is_shared", (req, res) => {
Router.get("/event/:event_id/reservation/user", (req, res) => {
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
});

// Router.get("/buyers1", (req, res, next) => {
//     let singleEventId = req.params.singleEventId;
//     let singleEventId1 = req.query.singleEventId;
//     // let singleEventId2 = req.param('singleEventId');
//     //console.log(singleEventId);
//     //console.log(singleEventId1);
//     // //console.log(singleEventId2);
//
//     const sql = `SELECT DISTINCT user.id, is_shared, user.username, user.name, user.phone_number, user.email, user.profile_image,
//                     user.description
//                     FROM event_reservation
//                     JOIN event_ticket ON event_ticket_id = event_ticket.id
//                     JOIN event ON event.id = event_ticket.event_id
//                     JOIN user ON event_reservation.user_id = user.id
//                     WHERE event_reservation.is_shared = 1 AND event.id = ?
//                     ORDER BY event_reservation.created_at DESC`;
//
//     db.query(sql, [singleEventId1], (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

Router.post("/validate", (req, res) => {
// Router.post("/event/validate", /*checkDev,*/ (req, res) => {
// Router.post("/event/:eventId/reservation/:reservationId/validate", /*checkDev,*/ (req, res) => {
    // let userId = req.body.user_id;
    let eventTicketId = req.body.event_reservation_id;
    let businessId = req.body.business_id;
    console.log(businessId);
    console.log(eventTicketId);
    let array = [];
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
    db.query(sql, [eventTicketId, businessId], (err, result) => {
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
            res.status(404).json(result.length);
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
                db.query(sql0, [new Date(Date.now()).toISOString(), eventTicketId, ], (err, result456) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    // res.redirect('/category');
                    // res.json(result);
                    console.log('result[0].user_iddfgdg');
                    console.log(result[0].user_id);

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
                    res.status(200).json(result);
                });
                // res.status(200).json(result);
            }
            else if(result[0].is_validated === 1) {
                console.log('Biglietto già convalidato');
                res.status(428).json(result);
            }
            else if(result[0].is_validated === 0 && /*result[0].is_expired === 1*/
                new Date(result[0].begin_at) < new Date(Date.now())) {
                console.log('Biglietto scaduto');
                res.status(434).json(result);
            }
            else {
                console.log('errore1');
                res.status(540).json(result);
            }
            // res.json(result);
        }
        else {
            console.log('errore2');
            res.status(520).json(result);
        }
    });
});

module.exports = Router;