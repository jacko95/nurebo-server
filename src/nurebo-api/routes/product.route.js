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
const {format, add} = require("date-fns");
const {it} = require("date-fns/locale");
const { EventBridgeClient, PutRuleCommand, PutTargetsCommand } = require("@aws-sdk/client-eventbridge");
const { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } = require("@aws-sdk/client-scheduler");


/*const registerLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 100, //5 requests
    handler: (req, res) => {
        const resetTime = req.rateLimit.resetTime; // Tempo di reset del limite
        const now = Date.now();
        const timeLeft = Math.ceil((resetTime - now) / 1000); // Tempo rimanente in secondi
        // console.log('req11111111')
        // console.log(req)

        res.status(429).json({
            message: `Troppe richieste. Riprova tra ${timeLeft} secondi.`,
            retryAfter: timeLeft, // Tempo rimanente in secondi
        });
    },
    message: {
        code: 429, //HTTP code per too many requests
        message: "Troppe richieste di login, amico mio... Riprova dopo, magari sarai più fortunato! :)"
    }
});*/
const registerLimiter = rateLimiter({
    // windowMs: (req) => {
    //     // const windowMs = parseInt(req.body.windowMs);
    //     // const windowMs = parseInt(req.body.windowMs);
    //     console.log('req.body.user_type_id0000000000')
    //     console.log(req.body.user_type_id)
    //     // let userType = parseInt(req.body.user_type_id)
    //
    //     // return !isNaN(windowMs) && windowMs > 0 ? windowMs : 15 * 60 * 1000;
    //     return req.body.user_type_id === 1 ? 15 * 60 * 1000 : req.body.user_type_id === 2 ? 5 * 60 * 1000 : 0;
    // },
    windowMs: 5 * 60 * 1000,
    max: (req) => {
        console.log('req.body.user_type_id000022222200')
        console.log(req.body.user_type_id)
        // const maxRequests = parseInt(req.body.maxRequests);
        // return !isNaN(maxRequests) && maxRequests > 0 ? maxRequests : 100;
        return req.body.user_type_id === 1 ? 50 : req.body.user_type_id === 2 ? 10 : 0;
    },
    message: 'Troppe richieste, riprova più tardi.',
    handler: (req, res) => {
        const resetTime = req.rateLimit.resetTime;
        const now = Date.now();
        const timeLeft = Math.ceil((resetTime - now) / 1000);

        res.status(429).json({
            message: `Troppe richieste. Riprova tra ${timeLeft} secondi.`,
            retryAfter: timeLeft,
        });
    },
});

// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_KEY,
//     region: 'eu-central-1',
//     signatureVersion: 'v4',
// });

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'eu-central-1',
    // signatureVersion: 'v4',
});

const s3 = new AWS.S3();
const sns = new AWS.SNS();

const rekognition = new AWS.Rekognition({
    region: 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

const eventBridgeClient = new EventBridgeClient({
    region: 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    signatureVersion: 'v4',
});

const schedulerClient = new SchedulerClient({
    region: 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    signatureVersion: 'v4',
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

const upload1 = multer();
const charsetLength = 62; // La lunghezza del set di caratteri
// const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const charset = '0123456789abcdefghijklmnopqrstuvwxyz';


Router.get("/", async (req, res) => {
    try {

        const sql = `SELECT *
                            FROM reservation`;
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

Router.get("/:product_id", /*registerLimiter,*/ async (req, res) => {
    try {
        let reservationUrl = req.params.reservation_url;
        let validate = req.query.validate;
        // let datetime = new Date(req.body.reservation_datetime);
        let isSuccess;

        // console.log('req.query')
        // console.log(req.query)
        // console.log('req.params')
        // console.log(req.params)
        console.log('req.cookies')
        // console.log(req.cookies)
        // console.log(req.cookies.authId)
        // console.log(req.cookies[reservationUrl])
        // console.log(req.headers.cookie)

        //todo: 1. controllare if(req.cookies.authId) e verifica che il id preso da req.cookies.authId sia per quella reservation e che sia is_success = 1 (e che sia prima della data di quella prenotazione?)
        //todo: 2. se è valido, questo endpoint restituisce la prenotazione. altrimenti CANCELLA AUTHID E restituisce 404
        //todo: 3. il client fa una richiesta a sendotp che invia al suo numero di cell il codice otp da inserire (da limitare con ratelimiter) e invia al client l id del authorization per il quale deve inserire l otp
        //todo: 4. il client invia richista a veryfyotp con il codice otp al api
        //todo: 5. se il codice otp inserito è corretto veryfyotp salva il cookie in endpoint verify_otp e il client richiama questo endpoint. se non è corretto digli che lo deve reinserire

        // if(req.cookies.authId) {
        if (req.cookies[reservationUrl]) {
            // try {
            // const decoded = JWT.verify(req.cookies.authId, process.env.JWT_KEY)
            const decoded = JWT.verify(req.cookies[reservationUrl], process.env.JWT_KEY)
            // const decoded = JWT.verify(req.headers.authorization, global.JWT_KEY)
            console.log('decoded')
            console.log(decoded)
            console.log(decoded.authId)
            console.log(decoded[reservationUrl])

            const sql03 = `SELECT /* DISTINCT */
                                      reservation_authentication.id AS reservation_authentication_id,
                                      reservation.id AS reservation_id,
                                      reservation_authentication.auth_type AS reservation_authentication_auth_type,
                                      reservation_authentication.sent_otp AS reservation_authentication_sent_otp,
                                      reservation_authentication.inserted_otp AS reservation_authentication_inserted_otp,
                                      reservation_authentication.is_success AS reservation_authentication_is_success,
                                      reservation_authentication.sent_otp_at AS reservation_authentication_sent_otp_at,
                                      reservation_authentication.inserted_otp_at AS reservation_authentication_inserted_otp_at,
                                      reservation_authentication.reservation_action_id AS reservation_authentication_reservation_action_id,
                                      reservation_authentication.user_type_id AS reservation_authentication_user_type_id,
                                      reservation_datetime.id AS reservation_datetime_id,
                                      reservation_datetime.datetime AS reservation_datetime_datetime,
                                      reservation_datetime.created_at AS reservation_datetime_created_at,
                                      reservation_proposal.id AS reservation_proposal_id,
                                      reservation_proposal.user_type_id AS reservation_proposal_user_type_id,
                                      reservation_proposal.created_at AS reservation_proposal_created_at
                                    FROM reservation_authentication
                                    JOIN reservation ON reservation.id = reservation_authentication.reservation_id
                                    LEFT JOIN reservation_datetime ON reservation_datetime.id = reservation.reservation_datetime_id
                                    LEFT JOIN reservation_proposal ON reservation_proposal.id = reservation.reservation_proposal_id
                                    /* LEFT JOIN reservation_datetime ON reservation_datetime.reservation_proposal_id = reservation_proposal.id */
                                    WHERE reservation_authentication.id = ?;`;
            await db.promise().query(sql03, [/*decoded[reservationUrl],*/decoded.authId,]).then(async (result77, err) => {
                // db.query(sql03, [decoded.authId, ], async (err, result77) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }

                console.log('result77');
                console.log(result77);
                let now = new Date(Date.now());
                let reservationDatetime = new Date(result77[0].reservation_datetime_datetime);
                console.log('result77[0].reservation_authentication_is_success')
                // console.log(result77.reservation_authentication_is_success)
                console.log(result77[0][0].reservation_authentication_is_success)
                isSuccess = result77[0][0].reservation_authentication_is_success;

                if (isSuccess === 1) {
                    const sql0 = `SELECT DISTINCT
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
                            business_form_color.id AS business_form_color_id,
                            business_form_color.background AS business_form_color_background,
                            business_form_color.active AS business_form_color_active,
                            reservation_datetime.id AS reservation_datetime_id,
                            reservation_datetime.datetime AS reservation_datetime_datetime,
                            reservation_datetime.created_at AS reservation_datetime_created_at,
                            reservation_proposal.id AS reservation_proposal_id,
                            reservation_proposal.user_type_id AS reservation_proposal_user_type_id,
                            reservation_proposal.created_at AS reservation_proposal_created_at,
                            /*reservation_validation.id AS reservation_validation_id,*/
                            reservation_validation.created_at AS reservation_validation_created_at,
                            /*reservation_cancel.id AS reservation_cancel_id,*/
                            reservation_cancel.user_type_id AS reservation_cancel_user_type_id,
                            reservation_cancel.created_at AS reservation_cancel_created_at
                                                  
                        FROM reservation
                        LEFT JOIN reservation_datetime ON reservation_datetime.id = reservation.reservation_datetime_id
                        LEFT JOIN reservation_proposal ON reservation_proposal.id = reservation.reservation_proposal_id
                        LEFT JOIN reservation_validation ON reservation_validation.reservation_id = reservation.id
                        LEFT JOIN reservation_cancel ON reservation_cancel.reservation_id = reservation.id
                        LEFT JOIN business ON reservation.business_id = business.id
                        LEFT JOIN business_form ON business.id = business_form.business_id
                        LEFT JOIN business_form_color ON business_form_color.id = business_form.business_form_color_id
                        WHERE (BINARY reservation.user_url = ? || BINARY reservation.business_url = ?) AND reservation_cancel.created_at IS NULL /*AND UTC_TIMESTAMP() < reservation_datetime.datetime*/`;
                    await db.promise().query(sql0, [reservationUrl, reservationUrl,]).then(async (result, err) => {
                        // db.query(sql0, [reservationUrl, reservationUrl, /*1,*//* 0,*/], async (err, result) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }

                        // console.log('result.000000000');
                        // console.log(result);
                        // console.log(result[0]);
                        // console.log(result[0].reservation_user_url === req.params.reservation_url);
                        // console.log(result[0].reservation_business_url === req.params.reservation_url);
                        // console.log('result.777777777');
                        // console.log(result[0]);
                        // console.log(sql0);
                        console.log('result.length5555555555555');
                        // console.log(result.length);
                        console.log(result[0].length);
                        console.log(result[0]);
                        // result = result[0];
                        console.log('result.length4444458888888888');
                        console.log(result[0].reservation_proposal_id);
                        // console.log(result[0][0].reservation_proposal_id);
                        // console.log(result.length);

                        // let cristo = result[0][0];
                        //non funziona se non ci sono proposte
                        if (result[0].length === 1 /*&& result[0].reservation_proposal_id*/) {
                            // // result = result[0];
                            // console.log('result.000000000');
                            // // console.log(result);
                            // // console.log(result[0]);
                            // // console.log(result[0].reservation_user_url === req.params.reservation_url && !result[0].reservation_validation_id);
                            // console.log(result[0].reservation_user_url === req.params.reservation_url && !result[0].reservation_validation_created_at);
                            // // console.log(result[0].reservation_business_url === req.params.reservation_url);
                            //
                            // // if(result[0].reservation_user_url === req.params.reservation_url && !result[0].reservation_validation_id) {
                            // if(result[0].reservation_user_url === req.params.reservation_url && !result[0].reservation_validation_created_at) {
                            //     const sql1 = `INSERT INTO reservation_validation (/*id,*/ reservation_id, created_at) VALUES (?, ?)`;
                            //     await db.promise().query(sql1, [/*uuidv4(),*/ result[0].reservation_id, new Date(Date.now()).toISOString(),]).then(async (result1, err) => {
                            //         if (err) {
                            //             console.log(err);
                            //             return res.status(500).send(err);
                            //         }
                            //         console.log('result1');
                            //         console.log(result1);
                            //
                            //         let mailOptions1 = {
                            //             // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                            //             from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                            //             to: `${result[0].business_email}`,
                            //             // to: "bar@example.com, baz@example.com", // list of receivers
                            //             subject: 'Richiesta Prenotazione',
                            //             // subject: 'Hello ✔ Nodemailer - Test',
                            //             // text: 'Wooohooo it works!!',
                            //             // html: `<p>Ciao ${reservationName}, per convalidare la tua prenotazione da ${restaurantName} per ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime}. Clicca qui: <a href="nurebo.com/${reservationId}?validate=true">nurebo.com/${reservationId}</a>. Ricorda che da questo link potrai anche modificare o annullare la tua prenotazione. Mi raccomando non perdere questo messaggio!</p>`,
                            //             // html: `<h1>Ciao ${reservationName}, per convalidare la tua prenotazione da ${businessName} devi inserire questo codice: <a href="#">${otp}</a> a questo link: <a href="nurebo.com/${userUrl}">nurebo.com/${userUrl}</a> dalla quale potrai anche modificare o annullare la tua prenotazione. Mi raccomando non perdere questo messaggio!</h1>`,
                            //             html: `<h1>Ciao ${result[0].business_name}, hai ricevuto una nuova richiesta di prenotazione. Per convalidarla accedi a questo link <a href="www.nurebo.com/${result[0].reservation_business_url}">www.nurebo.com/${result[0].reservation_business_url}</a></h1>`,
                            //         };
                            //
                            //         transporter.sendMail(mailOptions1, (err, data) => {
                            //             if (err) {
                            //                 console.log('Error occurs', err);
                            //                 // return;
                            //             }
                            //             // console.log(otp);
                            //             console.log('Email sent!!!');
                            //         });
                            //
                            //         // const params = {
                            //         //     // Message: 'Questo è un messaggio di prova inviato 8564 gli ottomani 84668852 tramite AWS SNS 3552126666',
                            //         //     Message: `Ciao ${result[0].business_name}, hai ricevuto una nuova richiesta di prenotazione! Per convalidarla accedi a questo link: www.nurebo.com/${result[0].reservation_business_url}.`,
                            //         //     // PhoneNumber: '+393792216112',
                            //         //     // PhoneNumber: '+393701315819',
                            //         //     PhoneNumber: `+39${result[0].business_cell}`,
                            //         //     MessageAttributes: {
                            //         //         'AWS.SNS.SMS.SenderID': {
                            //         //             DataType: 'String',
                            //         //             // BinaryValue: Buffer.from('...') || 'STRING_VALUE' /* Strings will be Base-64 encoded on your behalf */,
                            //         //             StringValue: 'Nurebo'
                            //         //         },
                            //         //         // 'AWS.SNS.SMS.MaxPrice': {
                            //         //         //     DataType: 'Number',
                            //         //         //     StringValue: '0.10' // Costo massimo per SMS in USD
                            //         //         // },
                            //         //         'AWS.SNS.SMS.SMSType': {
                            //         //             DataType: 'String',
                            //         //             // StringValue: 'Promotional',
                            //         //             StringValue: 'Transactional',
                            //         //         },
                            //         //         // 'AWS.SNS.SMS.OriginationIdentity': {
                            //         //         //     DataType: 'String',
                            //         //         //     StringValue: 'Mycompaguagli'
                            //         //         // },
                            //         //     },
                            //         //     // MessageDeduplicationId: 'STRING_VALUE',
                            //         //     // MessageGroupId: 'STRING_VALUE',
                            //         //     // MessageStructure: 'STRING_VALUE',
                            //         //     // Subject: 'subject otp',
                            //         //     // TargetArn: 'STRING_VALUE',
                            //         //     // TopicArn: 'STRING_VALUE'
                            //         // };
                            //         //
                            //         // sns.publish(params, (err, data) => {
                            //         //     if (err) {
                            //         //         console.error("Errore nell'invio dell'SMS:");
                            //         //         console.error(err);
                            //         //     } else {
                            //         //         console.log("SMS inviato con successo! ID messaggio:");
                            //         //         console.log(data);
                            //         //     }
                            //         // });
                            //
                            //     });
                            // }

                            const sql = `SELECT DISTINCT
                                    reservation.id AS reservation_id,
                                    
                                    reservation_proposal.id AS reservation_proposal_id,
                                    reservation_proposal.user_type_id AS reservation_proposal_user_type_id,
                                    reservation_proposal.created_at AS reservation_proposal_created_at,
                                    
                                    reservation_datetime.id AS reservation_datetime_id,
                                    /*reservation_datetime.reservation_id AS reservation_id,*/
                                    reservation_proposal.reservation_id AS reservation_id,
                                    reservation_datetime.datetime AS reservation_datetime_datetime,
                                    reservation_datetime.priority AS reservation_datetime_priority,
                                    reservation_datetime.created_at AS reservation_datetime_created_at

                                FROM reservation_datetime
                                LEFT JOIN reservation_proposal ON reservation_datetime.reservation_proposal_id = reservation_proposal.id
                                LEFT JOIN reservation ON reservation.reservation_datetime_id = reservation_datetime.id
                                WHERE reservation_datetime.reservation_proposal_id = ? /* OR reservation.id = ? */ ;`;
                            await db.promise().query(sql, [result[0][0].reservation_proposal_id, /*result[0][0].reservation_id,*/]).then(async (result0, err) => {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send(err);
                                }

                                console.log('resultiiiiiiiiiii')
                                // console.log(result0)
                                console.log(result0[0])
                                console.log(result[0].reservation_proposal)
                                console.log(result[0][0].reservation_proposal)

                                result[0][0].reservation_proposal = result0[0];

                                // console.log('result8888888888')
                                // console.log(result[0])

                                const params = {
                                    Bucket: process.env.AWS_BUCKET_NAME, // Nome del bucket S3
                                    // Key: req.query.path,
                                    Key: result[0][0].business_image_url,
                                    Expires: 3600, // Durata in secondi per cui l'URL sarà valido
                                };
                                // result[0].image_url = await s3.getSignedUrlPromise('getObject', params);
                                result[0][0].business_image_url = await s3.getSignedUrlPromise('getObject', params);

                                // console.log('result11111111111111111112222222')
                                // console.log(result[0][0])
                                // console.log(result[0][0].business_image_url)

                                // res.status(200).json(result);
                                // res.status(200).json(result[0]);

                                // cristo = result[0][0];
                                console.log('result[0][0]444')
                                console.log(result[0][0])

                                res.json(result[0][0]);
                            });
                        }
                        // else if (result[0].length === 1 && result[0].reservation_proposal_id === undefined) {
                        //     console.log('mecia')
                        //     console.log(result[0])
                        //     res.json(result[0]);
                        // }
                        // console.log('cristo')
                        // console.log(cristo)
                        // res.json(cristo);
                    })
                }
                else {
                    res.status(405).json({
                        message: "Token scaduto"
                    });
                }
            })

        }
        /*catch (e) {

        }*/
        else {
            // res.status(404).json({
            //     message: "Non sei autenticato"
            // });

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
                            business_form_color.id AS business_form_color_id,
                            business_form_color.background AS business_form_color_background,
                            business_form_color.active AS business_form_color_active,
                            /*reservation_datetime.id AS reservation_datetime_id,
                            reservation_datetime.datetime AS reservation_datetime_datetime,
                            reservation_datetime.created_at AS reservation_datetime_created_at,
                            reservation_proposal.id AS reservation_proposal_id,
                            reservation_proposal.user_type_id AS reservation_proposal_user_type_id,
                            reservation_proposal.created_at AS reservation_proposal_created_at,*/
                            /*reservation_validation.id AS reservation_validation_id,*/
                            reservation_validation.created_at AS reservation_validation_created_at,
                            /*reservation_cancel.id AS reservation_cancel_id,*/
                            reservation_cancel.user_type_id AS reservation_cancel_user_type_id,
                            reservation_cancel.created_at AS reservation_cancel_created_at
                                                  
                        FROM reservation
                        /*LEFT JOIN reservation_datetime ON reservation_datetime.id = reservation.reservation_datetime_id
                        LEFT JOIN reservation_proposal ON reservation_proposal.id = reservation.reservation_proposal_id*/
                        LEFT JOIN reservation_validation ON reservation_validation.reservation_id = reservation.id
                        LEFT JOIN reservation_cancel ON reservation_cancel.reservation_id = reservation.id
                        LEFT JOIN business ON reservation.business_id = business.id
                        LEFT JOIN business_form ON business.id = business_form.business_id
                        LEFT JOIN business_form_color ON business_form_color.id = business_form.business_form_color_id
                        WHERE (BINARY reservation.user_url = ? || BINARY reservation.business_url = ?) AND reservation_cancel.created_at IS NULL /*AND UTC_TIMESTAMP() < reservation_datetime.datetime*/`;
            await db.promise().query(sql088, [reservationUrl, reservationUrl,]).then(async (result889, err) => {
                // db.query(sql0, [reservationUrl, reservationUrl, /*1,*//* 0,*/], async (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                console.log('result.....000')
                console.log(result889[0][0])

                if(result889[0][0] === undefined) {
                    res.status(404).json({
                        message: "La prenotazione non esiste"
                    });
                }
                else {
                    res.status(207).json({
                        message: "Non sei autenticato",
                        ...result889[0][0]
                    });
                }
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.put("/:product_id", async (req, res) => {
    try {
        let reservationId = req.params.reservation_id;
        // let validate = req.query.validate;
        // let changedBy = req.query.user_type;
        let changedBy = req.body.user_type;
        // let datetime = new Date(req.body.reservation_datetime);
        let businessId = req.body.business_id;
        // let email = req.body.email === '' ? null : req.body.email;
        let reservation_email = req.body.reservation_email || null;
        // let email = req.params.email;
        let reservationName = req.body.reservation_name;
        let businessName = req.body.business_name;
        // let datetime = req.body.datetime;
        const datetime = new Date(req.body.reservation_datetime);
        let quantity = req.body.quantity;
        let phone = req.body.phone;
        let newReservationId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        // let reservationActionId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        let userUrl = req.body.reservation_user_url;
        let businessUrl = req.body.reservation_business_url;
        let userType = req.body.user_type_id;

        console.log('req.query')
        console.log(req.query)
        console.log('req.body')
        console.log(req.body)


        let query = `INSERT INTO reservation (id, business_id, user_url, business_url, datetime, name, email, phone, quantity, is_valid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.promise().query(query, [newReservationId, businessId, userUrl, businessUrl, datetime, reservationName, reservation_email, phone, quantity, 1, new Date(Date.now()).toISOString()]).then(async (result, err) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // console.log('result');
            // console.log(result);

            // const sql = `UPDATE reservation
            //                     SET reservation.is_canceled = ?
            //                     WHERE reservation.id = ?`;
            // await db.promise().query(sql, [1, reservationId, ]).then(async (result0, err) => {
            const sql12 = `INSERT INTO reservation_cancel (/*id,*/ reservation_id, user_type_id, created_at) VALUES (?, ?, ?)`;
            await db.promise().query(sql12, [/*uuidv4(), */reservationId, userType, new Date(Date.now()).toISOString()]).then(async (result0, err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                // console.log(result0);

                if (result0[0].affectedRows === 1) {
                    // let query56 = `INSERT INTO reservation_log (id, action_id, reservation_id, precedent_id, user_type_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
                    // await db.promise().query(query56, [uuidv4(), 1, reservationId, newReservationId, changedBy, new Date(Date.now()).toISOString()]).then((result1, err) => {

                        // console.log('result1000000000')
                        // console.log(result1)

                        console.log('datetime')
                        console.log(datetime)

                        const optionsDate = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
                        const optionsTime = {hour: '2-digit', minute: '2-digit', hour12: false};
                        const formattedDate = datetime.toLocaleDateString('it-IT', optionsDate);
                        const formattedTime = datetime.toLocaleTimeString('it-IT', optionsTime);
                        let dayName = formattedDate.split(' ')[0];
                        let dayNumber = formattedDate.split(' ')[1];
                        let monthName = formattedDate.split(' ')[2];
                        // let yearNumber = formattedDate.split(' ')[3];

                        //todo: email di conferma
                        //todo: email di prenotazione modificata


                        // Step 2
                        let mailOptions = {
                            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                            from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                            to: changedBy === 1 ? req.body.reservation_email : req.body.business_email,
                            // to: "bar@example.com, baz@example.com", // list of receivers
                            subject: 'Prenotazione Modificata',
                            // subject: 'Hello ✔ Nodemailer - Test',
                            // text: 'Wooohooo it works!!',
                            html: changedBy === 1 ? `<p>La prenotazione <a href="www.nurebo.com/${req.body.reservation_user_url}">www.nurebo.com/${req.body.reservation_user_url}</a> da ${req.body.business_name} per ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime} è stata modificata</p>` : `<p>La prenotazione <a href="nurebo.com/${req.body.reservation_business_url}">nurebo.com/${req.body.reservation_business_url}</a> da parte di ${req.body.reservation_name} per ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime} è stata modificata</p>`,
                        };

                        // Step 3
                        transporter.sendMail(mailOptions, (err, data) => {
                            if (err) {
                                console.log('Error occurs', err);
                                return;
                            }
                            // console.log(otp);
                            console.log('Email sent!!!');
                        });

                        //invio dell sms / email a cliente di conferma
                        res.status(200).json(result);
                    // })
                }
                else {
                    res.status(422).json({
                        message: "Problem"
                    });
                }
            })
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.delete("/:product_id", registerLimiter, async (req, res) => {
    try {
        let reservationId = req.params.reservation_id;
        const timezoneOffset = parseInt(req.headers['timezone-offset'], 10) || 0;
        // const datetime = new Date(req.body.reservation_datetime_datetime);
        const datetime = new Date(new Date(req.body.reservation_datetime_datetime).setHours(new Date(req.body.reservation_datetime_datetime).getHours() + timezoneOffset));
        const userType = req.body.user_type_id;
        let array = [];

        console.log('req.body')
        console.log(req.body)

        // const sql = `DELETE FROM reservation
        //                     WHERE reservation.id = ?`;
        // db.query(sql, [reservationId, ], (err, result) => {
        const sql = `UPDATE reservation
                            SET reservation.reservation_datetime_id = ?
                            WHERE reservation.id = ?`;
        db.query(sql, [null, reservationId, ], async (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log(result);

            if(result.affectedRows >= 1) {

                const sql12 = `INSERT INTO reservation_cancel (/*id,*/ reservation_id, user_type_id, created_at) VALUES (?, ?, ?)`;
                db.query(sql12, [/*uuidv4(),*/ reservationId, userType, new Date(Date.now()).toISOString()], async (err, result10) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }

                    const optionsDate = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
                    const optionsTime = {hour: '2-digit', minute: '2-digit', hour12: false};
                    const formattedDate = datetime.toLocaleDateString('it-IT', optionsDate);
                    const formattedTime = datetime.toLocaleTimeString('it-IT', optionsTime);
                    let dayName = formattedDate.split(' ')[0];
                    let dayNumber = formattedDate.split(' ')[1];
                    let monthName = formattedDate.split(' ')[2];
                    // let yearNumber = formattedDate.split(' ')[3];

                    if (userType === 1 && req.body.reservation_email) {
                        let mailOptions = {
                            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                            from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                            to: req.body.reservation_email,
                            // to: "bar@example.com, baz@example.com", // list of receivers
                            subject: 'Cancellazione Prenotazione',
                            // subject: 'Hello ✔ Nodemailer - Test',
                            // text: 'Wooohooo it works!!',
                            html: `<p>La prenotazione <a href="www.nurebo.com/${req.body.reservation_user_url}">www.nurebo.com/${req.body.reservation_user_url}</a> da ${req.body.business_name} per ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime} è stata annullata</p>`,
                        };

                        transporter.sendMail(mailOptions, (err, data) => {
                            if (err) {
                                console.log('Error occurs', err);
                                return;
                            }
                            // console.log(otp);
                            console.log('Email sent!!!');
                        });
                    }
                    else if (userType === 2 && req.body.business_email) {
                        let mailOptions = {
                            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                            from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                            to: req.body.business_email,
                            // to: "bar@example.com, baz@example.com", // list of receivers
                            subject: 'Cancellazione Prenotazione',
                            // subject: 'Hello ✔ Nodemailer - Test',
                            // text: 'Wooohooo it works!!',
                            html: `<p>La prenotazione <a href="www.nurebo.com/${req.body.reservation_business_url}">www.nurebo.com/${req.body.reservation_business_url}</a> da ${req.body.reservation_name} per ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime} è stata annullata</p>`,
                        };

                        transporter.sendMail(mailOptions, (err, data) => {
                            if (err) {
                                console.log('Error occurs', err);
                                return;
                            }
                            // console.log(otp);
                            console.log('Email sent!!!');
                        });

                        socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
                            'update-business_reservations',
                            {

                            }
                        );

                        const sql = `SELECT fcm_token 
                                         FROM business_device
                                         WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND business_id = ?
                                         ORDER BY RAND()
                                         LIMIT 1000`;
                        // await db.promise().query(sql, [businessId]).then(async (result6, err) => {
                        await db.promise().query(sql, [req.body.business_id]).then(async (result6, err) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }
                            console.log('result6');
                            console.log(result6[0]);

                            for (let i = 0; i < result6[0].length; i++) {
                                console.log(result6[0][i].fcm_token);
                                // if(result[i].fcm_token !== null){
                                array.push(result6[0][i].fcm_token);
                                // }

                                const message = {
                                    message: {
                                        // "name": "Nometring",
                                        "data": {
                                            "mass": "1.3kg",
                                            "count": "3",
                                            // count23: '36652',

                                        },
                                        "notification": {
                                            // title: 'Hello World',
                                            // body: 'This is a Firebase Cloud Messaging notification',
                                            // image: 'https://images.pexels.com/photos/8448578/pexels-photo-8448578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
                                        },
                                        "android": {
                                            // "collapse_key": string,
                                            "priority": "HIGH",
                                            // "priority": "NORMAL",
                                            // "ttl": '153s',
                                            // "restricted_package_name": string,
                                            "data": {
                                                "keyname": "Messaggio",
                                            },
                                            "notification": {
                                                "title": 'Nuova richiesta di annullamento',
                                                // "title": `${req.body.user_name}`,
                                                // "body": "string",
                                                "body": `Cancellazione per ${req.body.reservation_quantity} persone da ${req.body.reservation_name}`,
                                                "channel_id": "fcm_nurebo_admin_channel",
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
                                            "fcm_options": {
                                                // object (AndroidFcmOptions)
                                            },
                                            "direct_boot_ok": true
                                        },
                                        "webpush": {
                                            // object (WebpushConfig)
                                        },
                                        "apns": {
                                            "payload": {
                                                // "sound": 65,
                                                // "blimblo": 'fffdgdg',
                                                // "blimbl44o": "vdgvdgvdgg",
                                            }
                                        },
                                        "fcm_options": {
                                            // object (FcmOptions)
                                        },
                                        // token:"efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
                                        // "token":"dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
                                        // token:"cGicYG7eSD2s-CWTfp2F-m:APA91bGrb5WJAsjpSMg5sW31hIlx2TQbvYopDc4Zn8OgkhroZKHY9JgLelZl0AGiSHk83_PWsXKztV2lztsE9b8a84OXrl8iju1-kdVpd7cZ_ZLD_a_E-bzLdJ1MS6ZvblHW4boAi-Bw",
                                        token: result6[0][i].fcm_token,
                                        // "topic": 'string2g2gg2g2',
                                        // "condition": string
                                    },
                                };
                                firebase.getNureboAdminAccessToken().then(async function (accessToken) {
                                    await axios.post(
                                        // `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
                                        `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_NUREBO_ADMIN_PROJECT_ID}/messages:send`,
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
                                        // if (error.response) {
                                        // La richiesta è stata fatta e il server ha risposto con uno status code
                                        // che cade fuori del range dei 2xx
                                        console.log('Response data:', error.response.data);
                                        // console.log('Response status:', error.response.status);
                                        // console.log('Response headers:', error.response.headers);
                                        // } else if (error.request) {
                                        //     // La richiesta è stata fatta ma nessuna risposta è stata ricevuta
                                        //     // `error.request` è un'istanza di XMLHttpRequest nel browser e un'istanza di
                                        //     // http.ClientRequest in node.js
                                        //     console.log('Request data:', error.request);
                                        // } else {
                                        //     // Qualcosa è successo durante l'impostazione della richiesta che ha innescato un errore
                                        //     console.log('Error message:', error.message);
                                        // }
                                        // console.log('Error config:', error.config);
                                    });
                                });
                            }
                        })
                    }

                    // const params = {
                    //     // Message: 'Questo è un messaggio di prova inviato 8564 gli ottomani 84668852 tramite AWS SNS 3552126666',
                    //     Message: userType === 2 ? `La prenotazione www.nurebo.com/${req.body.reservation_business_url} da ${req.body.reservation_name} per ${format(add(datetime, {hours: timezone}), "eeee, d MMMM", {locale: it})} alle ore ${format(add(datetime, {hours: timezone}), "HH:mm", {locale: it})} è stata annullata` : `La prenotazione www.nurebo.com/${req.body.reservation_user_url} da ${req.body.business_name} per ${format(add(datetime, {hours: timezone}), "eeee, d MMMM", {locale: it})} alle ore ${format(add(datetime, {hours: timezone}), "HH:mm", {locale: it})} è stata annullata`,
                    //     // PhoneNumber: '+393792216112',
                    //     // PhoneNumber: '+393701315819',
                    //     // PhoneNumber: `+39${result[0].business_cell}`,
                    //     PhoneNumber: userType === 2 ? `+39${req.body.business_cell}` : `+39${req.body.reservation_phone}`,
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

                    res.status(200).json(result10);
                });
            }
            else {
                res.status(404).json({
                    message: "Reservation not found"
                });
            }
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('');
    }
});

Router.post("/", /*registerLimiter,*/ (req, res) => {
    try {
        let businessId = req.body.business_id;
        // let email = req.body.email === '' ? null : req.body.email;
        let reservation_email = req.body.reservation_email || null;
        // let email = req.params.email;
        let reservationName = req.body.reservation_name;
        let businessName = req.body.business_name;
        // let userTypeId = req.body.user_type_id;
        // let datetime = req.body.datetime;
        const datetime = new Date(req.body.datetime);
        let quantity = req.body.quantity;
        let phone = req.body.phone;
        let reservationId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        let reservationDatetimeId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        let reservationProposalId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        let userUrl;
        let businessUrl;
        // let reservationId;// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        // let otp = makeid(6, true);
        // let otp = makeid(6);
        // let now = new Date(Date.now());

        console.log('req.bodyyyyyyyyyyyyy')
        console.log(req.body)

        console.log("datetime");
        console.log(datetime);

        // //console.log(now);
        // //console.log(now.getTime());
        let query0 = `SELECT user_url, business_url
                             FROM reservation
                             ORDER BY created_at DESC
                             LIMIT 1`;
        db.query(query0, [], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            console.log('result[0]')
            console.log(result[0])
            userUrl = generateNextValidNumberFromBase62(result[0].user_url)
            businessUrl = generateNextValidNumberFromBase62(result[0].business_url)
            console.log('reservationId')
            console.log(reservationId)


            // let query12 = `INSERT INTO reservation (id, business_id, reservation_datetime_id, user_url, business_url, name, email, phone, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            // db.query(query12, [reservationId, businessId, null, userUrl, businessUrl, reservationName, reservation_email, phone, quantity, new Date(Date.now()).toISOString()], (err, result) => {
            let query12 = `INSERT INTO reservation (id, business_id, user_url, business_url, name, email, phone, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(query12, [reservationId, businessId, userUrl, businessUrl, reservationName, reservation_email, phone, quantity, new Date(Date.now()).toISOString()], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }

                let query0 = `INSERT INTO reservation_proposal (id, reservation_id, user_type_id, created_at) VALUES (?, ?, ?, ?)`;
                db.query(query0, [reservationProposalId, reservationId, 2, new Date(Date.now()).toISOString(), ], (err, result122) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }

                    let query = `INSERT INTO reservation_datetime (id, reservation_proposal_id, datetime, created_at) VALUES (?, ?, ?, ?)`;
                    db.query(query, [reservationDatetimeId,/* reservationId,*/ reservationProposalId, datetime, new Date(Date.now()).toISOString()], (err, result0) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }
                        // //console.log(new Date(Date.now()));

                        // let query = `INSERT INTO reservation_authentication (id, reservation_id, auth_type, sent_otp, inserted_otp, sent_otp_at, inserted_otp_at, is_success) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                        // db.query(query, [reservationAuthId, reservationId, 'EMAIL', otp, null, new Date(Date.now()).toISOString(), new Date(Date.now()).toISOString(), 0, ], (err, result) => {
                        //     if (err) {
                        //         console.log(err);
                        //         return res.status(500).send(err);
                        //     }

                        // const sql100 = `UPDATE reservation
                        //         SET reservation.reservation_datetime_id = ?
                        //         WHERE reservation.id = ?`;
                        // db.query(sql100, [reservationDatetimeId, reservationId,], (err, result1) => {
                        const sql100 = `UPDATE reservation
                                SET reservation.reservation_proposal_id = ?
                                WHERE reservation.id = ?`;
                        db.query(sql100, [reservationProposalId, reservationId,], (err, result16) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            }

                            const optionsDate = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
                            const optionsTime = {hour: '2-digit', minute: '2-digit', hour12: false};
                            const formattedDate = datetime.toLocaleDateString('it-IT', optionsDate);
                            const formattedTime = datetime.toLocaleTimeString('it-IT', optionsTime);
                            let dayName = formattedDate.split(' ')[0];
                            let dayNumber = formattedDate.split(' ')[1];
                            let monthName = formattedDate.split(' ')[2];
                            // let yearNumber = formattedDate.split(' ')[3];

                            // const options = {
                            //   weekday: 'long', // giorno della settimana (lunga forma)
                            //   day: '2-digit', // giorno del mese (due cifre)
                            //   month: 'long', // mese (lunga forma)
                            //   year: 'numeric', // anno numerico
                            //   hour: '2-digit', // ore (due cifre)
                            //   minute: '2-digit', // minuti (due cifre)
                            //   hour12: false // formato 24 ore
                            // };
                            //
                            // // Usa Intl.DateTimeFormat per ottenere la data formattata
                            // const formattedDate = new Intl.DateTimeFormat('it-IT', options).format(datetime);
                            // const formattedDateTime = formattedDate.replace(/(\d{2}):(\d{2})$/, 'alle ore $1:$2')

                            // let mailOptions = {
                            //     // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                            //     from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                            //     to: reservation_email,
                            //     // to: "bar@example.com, baz@example.com", // list of receivers
                            //     subject: 'Conferma Prenotazione',
                            //     // subject: 'Hello ✔ Nodemailer - Test',
                            //     // text: 'Wooohooo it works!!',
                            //     // html: `<p>Ciao ${reservationName}, per convalidare la tua prenotazione da ${restaurantName} per ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime}. Clicca qui: <a href="nurebo.com/${reservationId}?validate=true">nurebo.com/${reservationId}</a>. Ricorda che da questo link potrai anche modificare o annullare la tua prenotazione. Mi raccomando non perdere questo messaggio!</p>`,
                            //     // html: `<h1>Ciao ${reservationName}, per convalidare la tua prenotazione da ${businessName} devi inserire questo codice: <a href="#">${otp}</a> a questo link: <a href="nurebo.com/${userUrl}">nurebo.com/${userUrl}</a> dalla quale potrai anche modificare o annullare la tua prenotazione. Mi raccomando non perdere questo messaggio!</h1>`,
                            //     html: `<h1>Ciao ${reservationName}, per convalidare la tua prenotazione da ${businessName} accedere a questo link <a href="www.nurebo.com/${userUrl}">www.nurebo.com/${userUrl}</a> dalla quale potrai anche modificare o annullare la tua prenotazione.</h1>`,
                            // };
                            //
                            // Step 3
                            // transporter.sendMail(mailOptions, (err, data) => {
                            //     if (err) {
                            //         console.log('Error occurs', err);
                            //         // return;
                            //     }
                            //     // console.log(otp);
                            //     console.log('Email sent!!!');
                            // });

                            // const params = {
                            //     // Message: 'Questo è un messaggio di prova inviato 8564 gli ottomani 84668852 tramite AWS SNS 3552126666',
                            //     Message: `Ciao ${reservationName}, per convalidare la tua prenotazione da ${businessName} accedere a questo link www.nurebo.com/${userUrl} dalla quale potrai anche modificare o annullare la tua prenotazione.`,
                            //     // PhoneNumber: '+393792216112',
                            //     // PhoneNumber: '+393701315819',
                            //     // PhoneNumber: `+39${result[0].business_cell}`,
                            //     PhoneNumber: `+39${req.body.reservation_phone}`,
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

                            // res.json({
                            //     // id
                            //     'id': restaurantId
                            // });

                            // res.json(result);
                            res.json({reservationId});
                            // res.json(userUrl);
                        });
                    })
                });
            });
        });

        // res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
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