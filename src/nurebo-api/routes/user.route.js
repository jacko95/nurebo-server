const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const firebase = require("../firebase/firebase");
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
const https = require('https');


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

const upload1 = multer();


Router.get("/:user_id", /*checkUserAuth, checkUser,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.user_id;
        // console.log(id)

        // const sql = "SELECT * from user WHERE id = " + id;
        const sql = `SELECT * FROM user WHERE id = ?`;
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

Router.put("/:user_id/location", checkUserAuth, checkUser, (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.user_id;
        let latitude = req.body.latitude;
        let longitude = req.body.longitude;
        // console.log(id)

        let sql = `UPDATE user SET user.latitude = ?, user.longitude = ?, user.last_position_at = ?
                        WHERE id = ?`;
        db.query(sql, [latitude, longitude, new Date(Date.now()).toISOString(), id], (err, result) => {
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

// Router.post("/username", (req, res) => {
Router.get("/:username", (req, res) => {
    try {// let username = req.body.username;
        let username = req.params.username;

        const sql = `SELECT * FROM user WHERE username = ? AND is_deleted = ?`;
        db.query(sql, [username, 0], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                // //console.log(result);
                // //console.log('coglio');
                // res.redirect('/category');
                // res.json(result);
                res.send(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/send_email", (req, res) => {
// Router.post("/user/:user_id/send_email", checkAuth, checkUser, (req, res) => {
//     let userId = req.body.user_id;
//     let email = req.body.email;
//     let ipAddress = req.body.ip_address;
//     let postalCode = req.body.postal_code;
//
//     console.log("req.body");
//     console.log(req.body);
//     console.log("userId");
//     console.log(userId);
//     //console.log("email");
//     //console.log(email);
//
//     // Step 1
//     let transporter = nodemailer.createTransport({
//         // service: 'gmail',
//         // service: 'iCloud',
//         // host: 'authsmtp.securemail.pro',
//         host: 'email-smtp.eu-central-1.amazonaws.com',
//         port: 465,
//         // port: 587,
//         secure: true, // true for 465, false for other ports
//         // secure: false,
//         auth: {
//             // user: process.env.EMAIL_USER,
//             user: process.env.AWS_SMTP_USER,
//             // pass: process.env.EMAIL_PASSWORD
//             pass: process.env.AWS_SMTP_PASSWORD
//         },
//         //TODO: da testare
//         tls: {
//             rejectUnauthorized: false
//         }
//     });
//
//     // Step 2
//     let mailOptions = {
//         // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
//         from: `"Nexyra" ${process.env.EMAIL_USER}`, // sender address
//         to: email,
//         // to: "bar@example.com, baz@example.com", // list of receivers
//         subject: 'Codice di autenticazione per il tentativo di accesso',
//         // subject: 'Hello ✔ Nodemailer - Test',
//         // text: 'Wooohooo it works!!',
//         html: `<h1>Il tuo è ${email}</h1>`,
//     };
//
//     // Step 3
//     transporter.sendMail(mailOptions, (err, data) => {
//         if (err) {
//             console.log('Error occurs', err);
//             return log('Error occurs', err);
//         }
//         return log('Email sent!!!');
//         // console.log(otp);
//         // console.log('Email sent!!!');
//     });
//
//     res.json(email);
//     // res.json(result);
// });

// Router.post("/profile_image", upload/*.single('image')*/, (req, res) => {
//     // console.log(req.file)
//     // console.log(req.headers)
//     // let imageVideo = req.body.image_video;
//     let userId = req.body.user_id;
//     // let id = uuidv4();
//     let url = 'http://192.168.1.225/kadingira-server/posts/';
//     // let postPath = req.file.destination.substring(1);
//     let filename = req.file.originalname;
//     // console.log('ciao')
//
//     // const sql = `INSERT INTO user(id, booking_experience_id, image_video, created_at)
//     //              VALUES('${id}', '${userId}', "${url}${filename}", UTC_TIMESTAMP())`;
//     const sql = `UPDATE user SET profile_image = ? WHERE id = ?`;
//
//     db.query(sql, [url+filename, userId], (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//         // res.json({id});
//     });
// });

// Router.post("/register/send_email", (req, res) => {
//     let username = req.body.username;
//     let email = req.body.email;
//     let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
//     var otp = makeid(6);
//     let authenticationId = uuidv4();
//
//     //console.log("username");
//     //console.log(username);
//     //console.log("email");
//     //console.log(email);
//     //console.log("otp");
//     //console.log(otp);
//
//     // //console.log(id);
//     // let sent_otp = req.body.sent_otp;
//     // //console.log(user_id);
//     // //console.log(sent_otp);
//
//     //chiedere di inserire l'username ed inviare l'email (o sms) all'email dell'utente con quell'username.
//     //verficando prima che quell'utente esiste
//
//     // const sql = `SELECT email FROM user WHERE id = ${user_id}`;
//     // db.query(sql, (err, rows) => {
//     //     //console.log(rows);
//     //     if (err) console.log(err);
//     //     //console.log("rows[0]");
//     //     //console.log(rows[0]);
//     //     // res.json(rows);
//     // });
//
//     // Step 1
//     let transporter = nodemailer.createTransport({
//         // service: 'gmail',
//         // service: 'iCloud',
//         // host: 'authsmtp.securemail.pro',
//         host: 'email-smtp.eu-central-1.amazonaws.com',
//         port: 465,
//         // port: 587,
//         secure: true, // true for 465, false for other ports
//         // secure: false,
//         auth: {
//             // user: process.env.EMAIL_USER,
//             user: process.env.AWS_SMTP_USER,
//             // pass: process.env.EMAIL_PASSWORD
//             pass: process.env.AWS_SMTP_PASSWORD
//         },
//         //TODO: da testare
//         tls: {
//             rejectUnauthorized: false
//         }
//     });
//
//     // Step 2
//     let mailOptions = {
//         from: `"Nexyra" ${process.env.EMAIL_USER}`, // sender address
//         to: email,
//         // to: ["bar@example.com", "baz@example.com"], // list of receivers
//         // cc: 'dragon@gmail.com',
//         subject: 'Codice di autenticazione per il tentativo di accesso',
//         // subject: 'Hello ✔ Nodemailer - Test',
//         // text: 'Wooohooo it works!!',
//         html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
//     };
//
//     // Step 3
//     transporter.sendMail(mailOptions, (err, data) => {
//         if (err) {
//             console.log('Error occurs', err);
//             return res.status(500).end(err);
//         }
//         // return log('Email sent!!!');
//         console.log(otp);
//         console.log('Email sent!!!');
//     });
//
//     let now = new Date(Date.now());
//     // //console.log(now);
//     // //console.log(now.getTime());
//
//     // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
//     let query2 = `INSERT INTO authentication(id, auth_type, sent_otp, sent_otp_at, /*postal_code, ip_address,*/ is_success, is_logout)
//                  VALUES (?, "EMAIL", ?, UTC_TIMESTAMP(), /*?, ?,*/ 0, 0)`;
//     db.query(query2, [authenticationId, otp, /*postalCode, ipAddress*/], (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         // //console.log(new Date(Date.now()));
//
//     });
//     // res.json(result);
// });
Router.post("/register/send_email", /*registerLimiter,*/ (req, res) => {
    try {
        let userId = req.body.user_id;
        let email = req.body.email;
        // let email = req.params.email;
        let ipAddress = req.body.ip_address;
        let postalCode = req.body.postal_code;
        let authenticationId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        var otp = makeid(6, true);

        //console.log("userId");
        //console.log(userId);
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

        let query = `INSERT INTO user_authentication (id, auth_type, sent_otp, sent_otp_at, postal_code, ip_address, is_success, is_logout) 
        VALUES (?, "EMAIL", ?, ?, ?, ?, 0, 0)`;
        db.query(query, [authenticationId, otp, new Date(Date.now()).toISOString(), postalCode, ipAddress], (err, result) => {
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
                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                to: email,
                // to: "bar@example.com, baz@example.com", // list of receivers
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
                // console.log(otp);
                console.log('Email sent!!!');
            });

            res.json({
                // id
                'id': authenticationId
            });
        });
        // res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/register/verify", /*registerLimiter,*/ (req, res) => {
    try {
        let authId = req.body.auth_id;
        let insertedOtp = req.body.inserted_otp;
        let username = req.body.username;
        let name = req.body.name;
        let fcmToken = req.body.fcm_token;
        let email = req.body.email;
        let userId = uuidv4();
        console.log("req.d54vd5454v55dd5");
        console.log(req.body);
        // console.log('tok.key')
        // console.log(tok.key)
        // console.log('JWT_key')
        // console.log(JWT_key)
        //
        // global.JWT_key = randomString(60);
        //
        // console.log('JWT_key')
        // console.log(JWT_key)
        // console.log('process.env.JWT_KEY')
        // console.log(process.env.JWT_KEY)

        const sql1 = `UPDATE user_authentication SET inserted_otp = ?, inserted_otp_at = ? WHERE id = ?`;
        db.query(sql1, [insertedOtp, new Date(Date.now()).toISOString(), authId], (err, rows) => {
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

        const quer = `SELECT sent_otp, sent_otp_at FROM user_authentication WHERE id = ?`;
        db.query(quer, [authId], (err, rows) => {
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
                // console.log('global.JWT_key');
                // console.log(global.JWT_key);
                const token = JWT.sign(
                    {id: authId},
                    // "dioinfimo",
                    // JWT_key,
                    process.env.JWT_KEY,
                    // global.JWT_key,
                    // {expiresIn: 360000}
                );
                const sql2 = `UPDATE user_authentication 
                        SET is_success = ?, login_at = ?
                        WHERE id = ?`;
                db.query(sql2, [success, new Date(Date.now()).toISOString(), authId], (err, rows) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    //todo:inserito ora
                    let sql10 = `INSERT INTO user(id, email, name, username, fcm_token) VALUES(?, ?, ?, ?, ?)`;
                    db.query(sql10, [userId, email, name, username, /*phone_number*/fcmToken,], (err, result) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }

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
                            // from: `'Registrazione Nurebo' ${process.env.EMAIL_USER}`, // sender address
                            from: `'Nurebo' ${process.env.EMAIL_USER}`, // sender address
                            // from: 'Registrazione Kalixira', // sender address
                            to: email, // TODO: email receiver
                            // to: "bar@example.com, baz@example.com", // list of receivers
                            // subject: username + ', ti diamo il benvenuto su Nurebo',
                            subject: name + ', ti diamo il benvenuto su Nurebo',
                            // subject: 'Hello ✔ Nodemailer - Test',
                            // text: 'Wooohooo it works!!',
                            // html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
                            // html: welcome_email.toString(),
                            //LOCAL
                            html: fs.readFileSync("./src/template/email/welcome_email.html").toString(),
                            // REMOTE
                            // html: fs.readFileSync("./template/email/welcome_email.html").toString(),
                            // html: new XMLSerializer().serializeToString(welcome_email),
                        };

                        // Step 3
                        transporter.sendMail(mailOptions, (err, data) => {
                            if (err) {
                                console.log('Error occurs', err);
                                res.status(500);
                                return;
                            }
                            // return log('Email sent!!!');
                            console.log('Email sent!!!');
                        });

                        // //console.log('result');
                        // //console.log(result);
                        // res.end(result);
                        // res.result;

                        const sql10 = `UPDATE user_authentication 
                                    SET user_id = ?
                                    WHERE id = ?`;
                        db.query(sql10, [userId, authId], (err, result) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            }

                            res.status(200).end(JSON.stringify({id: authId}));
                        });

                        // res.status(200).json({id, token});
                        // res.status(200).end(JSON.stringify({id, token}));
                        // res.status(200).end(JSON.stringify({id}));
                    });
                });
                res.json({
                    success,
                    token,
                    user_id: userId,
                    user_username: username,
                    user_name: name,
                    user_email: email,
                    fcm_token: fcmToken
                });
            }
            else {
                success = 0;
                const sql2 = `UPDATE user_authentication SET is_success = ? WHERE id = ?`;
                db.query(sql2, [success, authId], (err, rows) => {
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

Router.post("/register", async (req, res) => {
    try {
        // let name = req.body.name;
        let username = req.body.username;
        // let name = req.body.name;
        let email = req.body.email;
        let authId = req.body.auth_id;
        // let phone_number = req.body.phone_number;
        // //console.log(name);
        // //console.log(username);
        // //console.log(email);
        // //console.log(phone_number);
        let id = uuidv4();

        console.log('req.bodyddvdvdv');
        console.log(req.body);

        // console.log('JWT_key')
        // console.log(JWT_key)
        //
        // global.JWT_key = randomString(20);
        //
        // console.log('JWT_key')
        // console.log(JWT_key)
        // console.log('process.env.JWT_KEY')
        // console.log(process.env.JWT_KEY)

        let query = `SELECT * 
                    FROM user 
                    WHERE username = ? AND is_deleted = ?`;
        await db.promise().query(query, [username, 0]).then(async (result, err) => {
            if (result.length === 0) {
                const token = JWT.sign(
                    {id},
                    // "dioinfimo",
                    // JWT_key,
                    process.env.JWT_KEY,
                    // {expiresIn: 360000}
                );

                //todo: inserire row in autenticazione table (da qui ho l'user id)


                // let sql1 = `INSERT INTO user(name, email, username, phone_number) VALUES('${name}', '${email}', '${username}', '${phone_number}')`;
                let sql1 = `INSERT INTO user(id, email, username/*, phone*/) VALUES(?, ?, ?/*, ?*/)`;
                await db.promise().query(sql1, [id, email, username/*, phone_number*/]).then(async (result, err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }

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
                        from: `'Registrazione Nurebo' ${process.env.EMAIL_USER}`, // sender address
                        // from: 'Registrazione Kalixira', // sender address
                        to: email, // TODO: email receiver
                        // to: "bar@example.com, baz@example.com", // list of receivers
                        subject: username + ', ti diamo il benvenuto su Nurebo',
                        // subject: 'Hello ✔ Nodemailer - Test',
                        // text: 'Wooohooo it works!!',
                        // html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
                        // html: welcome_email.toString(),
                        //LOCAL
                        // html: fs.readFileSync("./src/template/email/welcome_email.html").toString(),
                        //REMOTE
                        html: fs.readFileSync("./template/email/welcome_email.html").toString(),
                        // html: new XMLSerializer().serializeToString(welcome_email),
                    };

                    // Step 3
                    transporter.sendMail(mailOptions, (err, data) => {
                        if (err) {
                            console.log('Error occurs', err);
                            res.status(500);
                            return;
                        }
                        // return log('Email sent!!!');
                        console.log('Email sent!!!');
                    });

                    // //console.log('result');
                    // //console.log(result);
                    // res.end(result);
                    // res.result;

                    const sql10 = `UPDATE user_authentication 
                    SET user_id = ?
                    WHERE id = ?`;
                    db.promise().query(sql10, [id, authId]).then(async (result, err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }

                        res.status(200).end(JSON.stringify({id}));
                    });

                    // res.status(200).json({id, token});
                    // res.status(200).end(JSON.stringify({id, token}));
                    // res.status(200).end(JSON.stringify({id}));
                });
            } else {
                res.status(500);
            }
            // if (err) {
            //     // return res.status(500).send(err);
            //     let sql1 = `INSERT INTO user(name, email, username, phone_number)
            //     VALUES (${name}, ${email}, ${username}, ${phone_number})`;
            //     db.query(sql1, (err, result) => {
            //         if (err) {
            //             // return res.status(500).send(err);
            //         }
            //         //console.log(result);
            //         res.end(result);
            //     });
            //
            // }
            // //console.log(result);
            // res.end(result);
        });
        // res.render('addCategory');
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:user_id/business/:business_id/room/:room_id/message", checkUserAuth, checkUser, async (req, res) => {
    // let chatId = req.body.chat_id;
    // let userId = req.body.user_id;
    // let businessId = req.params.business_id;
    let text = req.body.business_room_message_text;
    let sentAt = req.body.business_room_message_sent_at;
    let businessRoomMessageId = uuidv4();
    let businessRoomId = req.params.room_id;
    let businessId = req.params.business_id;
    let userId = req.params.user_id;
    let array = [];

    console.log('req.bodyf65f6bf5f');
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

    let query = `INSERT INTO business_room_message(id, business_room_id, user_id, text, sent_at)
                    VALUES (?, ?, ?, ?, ?)`;
    await db.promise().query(query, [businessRoomMessageId, businessRoomId, userId, text, sentAt]).then(async (result, err) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        const sql56 = `SELECT business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                            business.name AS business_name, business.id AS business_id, business.address AS business_address,
                            /*business.email_notification AS business_email_notification,*/
                            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                            business_setting.email_notification, business_setting.chat_notification,
                            
                            category.id AS category_id, category.name AS category_name, category.image AS category_image
                            
                        FROM business
                            LEFT JOIN category ON category.id = business.category_id
                            LEFT JOIN business_setting ON business.id = business_setting.business_id
                    WHERE business.id = ?`;
        await db.promise().query(sql56, [businessId]).then(async (result56, err) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            // console.log('result565454555');
            console.log(result56);
            console.log(result56[0][0].chat_notification);

            if(result56[0][0].chat_notification === 1) {

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
                // console.log('cv5g5gfgf5gf5')

                // var sockets = await socket.ioObject.of('/').adapter.sockets;
                // var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
                // console.log(`socket.ioObject.of('/').adapter.sockets`);
                // console.log(sockets);
                //
                // var sids = await socket.ioObject.of('/').adapter.sids;
                // console.log(`socket.ioObject.of('/').adapter.sids`);
                // console.log(sids);
                //
                var rooms1 = await socket.ioObject.of('/').adapter.rooms;
                // console.log(`socket.ioObject.of('/').adapter.rooms`);
                console.log(rooms1);

                // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
                if (rooms.has(businessRoomId)) {
                    // socket.ioObject.sockets./*in(businessRoomId)*/to(businessRoomId)/*sockets.broadcast*/.emit(
                    //     // 'send_user-business_room_message',
                    //     // "receive_business-business_room_message",
                    //     "receive-business_room_message",
                    //     {
                    //         // "booking_id": req.body.booking_id,
                    //         // "begin_at": req.body.begin_at,
                    //         // "user_id": userId,
                    //         // "username": req.body.username,
                    //         // "is_deleted": 0,
                    //         // "text": text,
                    //         // "sent_at": sentAt,
                    //         // "business_id": req.params.business_id,
                    //         "business_room_id": businessRoomId,
                    //         "business_room_message_id": businessRoomMessageId,
                    //         // "prestazione_image": `${req.body.prestazione_image}`,
                    //         ...req.body
                    //     }
                    // );
                }

                const sql = `SELECT fcm_token 
                         FROM business_device
                         WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND business_id = ?
                         ORDER BY RAND()
                         LIMIT 1000`;
                // await db.promise().query(sql, [businessId]).then(async (result6, err) => {
                await db.promise().query(sql, [businessId]).then(async (result6, err) => {
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
                                        // "title": 'string6r5555555f5f5',
                                        "title": `${req.body.user_name}`,
                                        // "body": string,
                                        "body": `${req.body.business_room_message_text}`,
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

                        // firebase.getNureboAdminAccessToken().then(function(accessToken) {
                        //     const options = {
                        //         // hostname: HOST,
                        //         hostname: 'fcm.googleapis.com',
                        //         // path: PATH,
                        //         path: '/v1/projects/' + process.env.FIREBASE_NUREBO_ADMIN_PROJECT_ID + '/messages:send',
                        //         method: 'POST',
                        //         // [START use_access_token]
                        //         headers: {
                        //             'Authorization': 'Bearer ' + accessToken
                        //         }
                        //         // [END use_access_token]
                        //     };
                        //
                        //     const request = https.request(options, function(resp) {
                        //         resp.setEncoding('utf8');
                        //         resp.on('data', function(data) {
                        //             console.log('Message sent to Firebase for delivery, response:');
                        //             console.log(data);
                        //         });
                        //     });
                        //
                        //     request.on('error', function(err) {
                        //         console.log('Unable to send message to Firebase');
                        //         console.log(err);
                        //     });
                        //
                        //     request.write(JSON.stringify(message));
                        //     request.end();
                        // });

                        // await axios({
                        //     method: 'POST',
                        //     url: 'https://fcm.googleapis.com/fcm/send',
                        //     headers: {
                        //         'Content-Type': 'application/json',
                        //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                        //     },
                        //     data: {
                        //         "notification": {
                        //             "title": `${req.body.user_name}`,
                        //             // "title": `Nuovo Messaggio`,
                        //             // "subtitle": /*`${}`*/"Cancellazione",
                        //             "body": `${req.body.business_room_message_text}`,
                        //             // "body": `Volevo un'informazione: sarebbe possibile capire se la prestazione potrebbe essere svolta di Sabato?`,
                        //             "channel_id": "fcm_nurebo_admin_channel",
                        //             // "android_channel_id": "fcm_nurebo_channel",
                        //             // "image": `${req.body.prestazione_image}`,
                        //             "icon": "splash",
                        //             "vibrate": true
                        //         },
                        //         "direct_boot_ok": true,
                        //         "data": {
                        //             "keyname": "Messaggio",
                        //             // "prestazione_image": `${req.body.prestazione_image}`,
                        //             // "prestazione_image": `https://i.ytimg.com/vi/8GX9krUThE8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAePWH4j0Y1GoGZxmtpwB3veL30_Q`
                        //             // "booking_id": req.body.booking_id,
                        //             // "begin_at": req.body.begin_at,
                        //             // "user_id": req.body.user_id,
                        //             // "username": req.body.username,
                        //             // "user_profile_image": req.body.user_profile_image,
                        //             // "prestazione_title": req.body.prestazione_title,
                        //             // "business_id": req.body.business_id,
                        //         },
                        //         "android": {
                        //             "notification": {
                        //                 // "image": `${req.body.prestazione_image}`,
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
                        //         // "registration_ids": [`${result0[0].fcm_token}`, ],
                        //         "registration_ids": array,
                        //         // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                        //     }
                        // }).then(function (response) {
                        //     console.log(response.status);
                        //     console.log(response.data);
                        //     console.log(response.data.success);
                        // }).catch(function (error) {
                        //     console.log(error);
                        // });

                    }

                });
            }
        });

        // console.log('resultfdgg5g54');
        // console.log(result[0]);
        // console.log(result[0].affectedRows);

        if (result[0].affectedRows === 1) {
            res.status(200).json(result[0]);
        } else {
            res.status(512).send(result[0].info);
        }

        // schedule.cancelJob('mmm')
    });
    // });
});

Router.get("/:user_id/friend/waiting", /*checkUserAuth, checkUser,*/ async (req, res) => {
    try {
        let userId = req.params.user_id;
        console.log('userIdggg6g6');
        console.log(userId);

        let sql1 = `SELECT user_friendship.created_at, user_friendship.recipient_id, user_friendship.user_id, 
                           user_friendship.status, user_friendship.created_at,
                           user.profile_image AS user_profile_image, user.email AS user_email, user.username AS user_username,
                           user.name AS user_name, user.description AS user_description
    
                    FROM user_friendship
                        JOIN user ON user.id = user_friendship.user_id
                    WHERE user_friendship.recipient_id = ? AND user_friendship.status = ?
                    ORDER BY user_friendship.created_at DESC`;
        await db.promise().query(sql1, [userId, 0]).then(async (result, err) => {
        // db.query(sql1, [userId, 0], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log('result');
            console.log(result);
            res.json(result[0]);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:user_id/booking", checkUserAuth, checkUser, async (req, res) => {
    try {
        const appVersionName = req.headers['x-app-version-name'];
        const appVersionNumber = req.headers['x-app-version-number'];
        // console.log('appVersionNamedf654ffd')
        // console.log(appVersionName)
        // console.log('appVersionNumberfd6bbffb5')
        // console.log(appVersionNumber)
        let userId = req.body.user_id;
        let isShared = req.body.is_shared;
        let businessId = req.body.business_id;
        let prestazioneId = req.body.prestazione_id;
        let prestazionePrice = req.body.prestazione_price;
        let note = req.body.note;
        let bookingBeginAt = req.body.begin_at;
        var newDateBeginAt = new Date(bookingBeginAt);
        let id = uuidv4();
        var duration;
        let array = [];
        let dbBookings = [];

        //TODO: SE LA DIFFERENZA TRA BEGINAT E NOW (O IL VALORE CHE GLI INVIAMO DA CLIENT)
        //è MAGGIORE DI 24 ORE RETURN RES.JSON
        var nowDate = Date.now();

        // var timeDifference = Math.abs(newDateBeginAt.getTime() - nowDate.getTime());
        // //console.log(timeDifference);
        //
        // var differentInHours = Math.ceil(timeDifference / (1000 * 3600));
        // //console.log(differentInHours);

        const diffInMs = /*Math.abs(*/newDateBeginAt - nowDate/*)*/;
        let differentInHours1 = diffInMs / (1000 * 60 * 60);
        console.log('differentInHours1');
        console.log(differentInHours1);

        if (differentInHours1 <= 0/*24*/) {
            // return res.status(419).send("Prenotare un appuntamento con almeno 24 ore di anticipo")
            return res.status(419).send("Prenotare un appuntamento nel futuro")
            // return res.json("Prenotare un appuntamento con almeno 24 ore di anticipo")
        }
        const sql0 = `SELECT *
                     FROM prestazione
                     WHERE id = ?`;
        await db.promise().query(sql0, [prestazioneId]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            console.log('uallaaaua')
            console.log(result[0])
            console.log(result[0][0].id)
            // // res.json(result);
            // //console.log('result')
            // //console.log(result)
            // //console.log('result[0].duration')
            // //console.log(result[0].duration)
            // // duration = result[0].duration;
            // //console.log('bookingBeginAt')
            // //console.log(bookingBeginAt)

            // //console.log('Date.parse(bookingBeginAt)')
            // //console.log(Date.parse(bookingBeginAt)/*.getMinutes()*/)

            // var newDateBeginAt = new Date(bookingBeginAt);
            var newDateEndAt = new Date(newDateBeginAt);
            // booking = Date.parse(bookingBeginAt);
            // //console.log(bookingEndAt.getDate());
            // //console.log(bookingEndAt.getMinutes());

            newDateEndAt.setUTCMinutes(newDateBeginAt.getMinutes() + result[0][0].duration);
            // //console.log('bookingEndAt');
            // //console.log(bookingEndAt);
            // //console.log('newDateBeginAt');
            // //console.log(newDateBeginAt);

            // SELECT *
            // FROM occupied_booking
            // WHERE DAY("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = DAY(occupied_from) AND
            // WHERE MONTH("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = MONTH(occupied_from) AND
            // WHERE YEAR("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = YEAR(occupied_from)
            // ORDER BY created_at DESC
            const sql1 = `SELECT *
                 FROM booking_occupied
                 WHERE business_id = ?
                 ORDER BY occupied_from ASC`;
            await db.promise().query(sql1, [businessId]).then(async (result, err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                // res.json(result);
                // console.log('occupied_booking')
                // console.log(result)
                // //console.log(result[0].occupied_from)

                var c = 0;
                //console.log(c);
                //console.log(result.length)
                for (let i = 0; i < result[0].length - 1; i++) {
                    // if((newDateBeginAt < result[i].occupied_until && bookingEndAt > result[i+1].occupied_from) ||
                    //     (newDateBeginAt === result[i].occupied_from && bookingEndAt > result[i+1].occupied_from)
                    /*|| (newDateBeginAt > result[i].occupied_from && bookingEndAt < result[i].occupied_until)
                    || newDateBeginAt < result[0].occupied_from || bookingEndAt > result[result.length-1].occupied_until*/
                    // ){
                    // console.log('newDateBeginAt');
                    // console.log(newDateBeginAt);
                    // console.log('newDateEndAt');
                    // console.log(newDateEndAt);
                    var occupiedFrom = new Date(result[0][i].occupied_from);
                    var occupiedUntil = new Date(result[0][i].occupied_until);
                    // console.log('occupiedFrom')
                    // console.log(occupiedFrom)
                    // console.log('occupiedUntil')
                    // console.log(occupiedUntil)
                    // console.log('\n')
                    // if ((occupiedUntil.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedUntil.getTime()) ||
                    //     (occupiedFrom.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedFrom.getTime()) ||
                    //     /*(occupiedUntil.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === occupiedFrom.getTime()) ||*/
                    //     (occupiedFrom.getTime() === newDateBeginAt.getTime()) || (occupiedUntil.getTime() === newDateEndAt.getTime())) {
                    if ((occupiedUntil.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedUntil.getTime()) ||
                        (occupiedFrom.getTime() > newDateBeginAt.getTime() && occupiedFrom.getTime() < newDateEndAt.getTime()) ||
                        (occupiedFrom.getTime() < newDateBeginAt.getTime() && occupiedUntil.getTime() > newDateEndAt.getTime()) ||
                        occupiedFrom.getTime() === newDateBeginAt.getTime() || occupiedUntil.getTime() === newDateEndAt.getTime()) {
                        console.log('newDateBeginAt');
                        console.log(newDateBeginAt);
                        console.log('newDateEndAt');
                        console.log(newDateEndAt);
                        console.log('occupiedFrom')
                        console.log(occupiedFrom)
                        console.log('occupiedUntil')
                        console.log(occupiedUntil)
                        c++
                    }
                    // if(newDateBeginAt.toString() === result[i].occupied_from.toString()) {
                    //     c++;
                    // }
                }
                console.log('c');
                console.log(c);

                if (c >= 1) {
                    return res.status(419).send("Lo slot è già occupato")
                    // res.json("Lo slot è già occupato");
                } else if (c === 0) {
                    const sql2 = `SELECT *
                             FROM business
                             JOIN prestazione ON prestazione.business_id = business.id
                             WHERE prestazione.id = ?`;
                    await db.promise().query(sql2, [prestazioneId]).then(async (result, err) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }
                        // res.json(result);
                        // //console.log(result[0].business_id);

                        var day;
                        if (newDateBeginAt.getDay() === 0)
                            day = 7;
                        else
                            day = newDateBeginAt.getDay();

                        const sql3 = `SELECT *
                                     FROM timetable
                                     WHERE business_id = ? AND weekday_id = ?
                                     ORDER BY open_at_hour ASC`;
                        await db.promise().query(sql3, [result[0][0].business_id, day]).then(async (result25, err) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }

                            console.log('result25[0]');
                            console.log(result25[0]);

                            var c1 = 0;
                            for (let j = 0; j < result25[0].length; j++) {
                                //console.log('rrrrr');
                                //creo il bookingtime di tutti i giorni e vedo se end booking è maggiore

                                //todo: openAt e closeAt spesso sbagliati
                                var closeAt = new Date(newDateBeginAt);
                                var openAt = new Date(newDateBeginAt);
                                console.log('openAt0');
                                console.log(openAt);
                                console.log('closeAt0');
                                console.log(closeAt);

                                console.log(result25[0][j].open_at_hour)
                                console.log(result25[0][j].open_at_minute)
                                console.log(result25[0][j].close_at_hour)
                                console.log(result25[0][j].close_at_minute)

                                // booking = Date.parse(bookingBeginAt);
                                // openAt.setMinutes(result25[0][j].open_at_minute)
                                // openAt.setHours(result25[0][j].open_at_hour)
                                // closeAt.setMinutes(result25[0][j].close_at_minute)
                                // closeAt.setHours(result25[0][j].close_at_hour)
                                openAt.setUTCMinutes(result25[0][j].open_at_minute)
                                openAt.setUTCHours(result25[0][j].open_at_hour)
                                closeAt.setUTCMinutes(result25[0][j].close_at_minute)
                                closeAt.setUTCHours(result25[0][j].close_at_hour)
                                console.log('openAt1');
                                console.log(openAt);
                                console.log('closeAt1');
                                console.log(closeAt);

                                console.log('newDateBeginAt');
                                console.log(newDateBeginAt);
                                console.log('newDateEndAt');
                                console.log(newDateEndAt);
                                if ((closeAt < newDateEndAt && newDateBeginAt < closeAt) || (openAt < newDateEndAt && newDateBeginAt < openAt)
                                    /*|| (newDateBeginAt > closeAt && newDateEndAt < openAt)*/ /*|| (newDateBeginAt > closeAt) || (newDateEndAt < openAt)*/
                                    //todo: non va bene perchè apre due volte nello stesso giorno ed esce fuori da uno degli orari di apertura di quel giorno,
                                    // comunque va bene questo controllo, ma va aggiunto il fatto che deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
                                    /*|| (newDateBeginAt < openAt && newDateEndAt < openAt) || (newDateBeginAt > closeAt && newDateEndAt > closeAt)*/) {
                                    c1++;
                                    // break;
                                }
                                console.log('c1')
                                console.log(c1)
                            }

                            //todo: deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
                            if (c1 >= 1) {
                                return res.status(419).send("L'appuntamento si incastra con gli orari di apertura e di chiusura o non è compreso tra gli orari di apertura e chiusura")
                                // res.json("L'appuntamento si incastra con gli orari di apertura e di chiusura");
                            } else if (c1 === 0) {
                                // const sql12 = `SELECT *
                                //                FROM booking
                                //                  JOIN prestazione ON prestazione.id = booking.prestazione_id
                                //                  JOIN business ON business.id = prestazione.business_id
                                //                WHERE is_canceled = 0 AND booking.user_id = ?
                                //                ORDER BY booking.created_at DESC`;
                                const sql12 = `SELECT *
                                           FROM booking
                                             JOIN prestazione ON prestazione.id = booking.prestazione_id
                                             JOIN business ON business.id = prestazione.business_id
                                             JOIN user_order ON user_order.id = booking.user_order_id
                                           WHERE is_canceled = 0 AND user_order.user_id = ?
                                           ORDER BY booking.created_at DESC`;
                                await db.promise().query(sql12, [userId]).then(async (result, err) => {
                                    if (err) {
                                        console.log(err)
                                        return res.status(500).send(err);
                                    }

                                    var c5 = 0;
                                    for (var i = 0; i < result[0].length; i++) {
                                        var tempDateBeginAt = new Date(result[0][i].begin_at);
                                        // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)

                                        var tempDateEndAt = new Date(result[0][i].begin_at);
                                        tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + result[0][i].duration)

                                        if ((tempDateEndAt.getDate() === newDateEndAt.getDate() && tempDateBeginAt.getDate() === newDateBeginAt.getDate()) &&
                                            (tempDateEndAt.getMonth() === newDateEndAt.getMonth() && tempDateBeginAt.getMonth() === newDateBeginAt.getMonth()) &&
                                            (tempDateEndAt.getFullYear() === newDateEndAt.getFullYear() && tempDateBeginAt.getFullYear() === newDateBeginAt.getFullYear()) &&
                                            result[0][i].prestazione_id === prestazioneId) {
                                            c5++;
                                            //console.log('tempDateBeginAt');
                                            //console.log(tempDateBeginAt);
                                            // break;
                                        }
                                    }
                                    console.log('c5')
                                    console.log(c5)

                                    // //console.log(result);

                                    // //console.log('result[0].max_contemporary_appointments');
                                    // //console.log(result[0].max_contemporary_appointments);
                                    //console.log('maxContemporaryAppointments');
                                    //console.log(maxContemporaryAppointments);
                                    // //console.log(result.max_contemporary_appointments);

                                    // if(c2 >= /*3*/result[0].max_contemporary_appointments){
                                    if (c5/*0*/ >= 1) {
                                        // return res.status(419).send("L'appuntamento da inserire avviene nello stesso giorno di un altro appuntamento dello stesso utente")
                                        return res.status(419).send("Non si possono effettuare più prestazioni uguali nello stesso giorno")
                                        // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
                                    } else /*if(c === 0)*/{
                                        // //console.log('businessId')
                                        // //console.log(businessId)
                                        const sql4 = `SELECT max_contemporary_appointments
                                                  FROM business
                                                  WHERE id = ?`;
                                        await db.promise().query(sql4, [businessId]).then(async (result, err) => {
                                            if (err) {
                                                console.log(err)
                                                return res.status(500).send(err);
                                            }

                                            var maxContemporaryAppointments = result[0][0].max_contemporary_appointments;

                                            //todo: perchè prendo tutti gli appuntamenti
                                            // invece di prendere solo quelli di quel business?
                                            const sql5 = `SELECT *
                                                      FROM booking
                                                           JOIN prestazione ON prestazione.id = booking.prestazione_id
                                                           JOIN business ON business.id = prestazione.business_id
                                                      WHERE is_canceled = 0 AND business.id = ?
                                                      ORDER BY booking.created_at DESC`;
                                            await db.promise().query(sql5, [businessId]).then(async (result, err) => {
                                                if (err) {
                                                    console.log(err)
                                                    return res.status(500).send(err);
                                                }
                                                // res.json(result);
                                                // //console.log(result);
                                                //console.log('ooooooo');

                                                dbBookings.push(...result[0]);
                                                console.log('dbBookings.length0');
                                                console.log(dbBookings.length);
                                                // console.log(dbBookings);

                                                const sql51 = `SELECT guest_booking.id AS booking_id, guest_booking.begin_at, 
                                                    guest_booking.created_at, guest_booking.is_canceled, guest_booking.name, guest_booking.phone,
                                                    guest_booking.email, guest_booking.note,
                                    
                                                    prestazione.duration, prestazione.title,
                                                    prestazione.image, prestazione.price, prestazione.description,
                                                    prestazione.id, prestazione.business_id
                                                    
                                                FROM guest_booking
                                                    JOIN prestazione ON prestazione_id = prestazione.id
                                
                                                WHERE business_id = ? AND is_canceled = 0`;
                                                await db.promise().query(sql51, [businessId]).then(async (result, err) => {
                                                    if (err) {
                                                        console.log(err)
                                                        return res.status(500).send(err);
                                                    }

                                                    dbBookings.push(...result[0]);
                                                    console.log('dbBookings.length1');
                                                    console.log(dbBookings.length);
                                                    // console.log(dbBookings);

                                                    let c2 = 0;
                                                    for (let i = 0; i < dbBookings.length; i++) {
                                                        let tempDateBeginAt = new Date(dbBookings[i].begin_at);
                                                        // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)

                                                        let tempDateEndAt = new Date(dbBookings[i].begin_at);
                                                        tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + dbBookings[i].duration)

                                                        // console.log('tempDateBeginAt')
                                                        // console.log(tempDateBeginAt)
                                                        // console.log('tempDateEndAt')
                                                        // console.log(tempDateEndAt)

                                                        // var eee = new Date(bookingBeginAt);

                                                        // if((tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateEndAt.getTime()) ||
                                                        //     (tempDateBeginAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
                                                        //     (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
                                                        //     (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())){
                                                        if ((tempDateEndAt.getTime() < newDateEndAt.getTime() && tempDateEndAt.getTime() > newDateBeginAt.getTime()) ||
                                                            (tempDateBeginAt.getTime() > newDateBeginAt.getTime() && tempDateBeginAt.getTime() < newDateEndAt.getTime()) ||
                                                            (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
                                                            (tempDateEndAt.getTime() > newDateEndAt.getTime() && newDateBeginAt.getTime() > tempDateBeginAt.getTime()) ||
                                                            (tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
                                                            (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())) {
                                                            c2++;
                                                            //console.log('tempDateBeginAt');
                                                            //console.log(tempDateBeginAt);
                                                            // break;
                                                        }
                                                    }
                                                    console.log('c2')
                                                    console.log(c2)

                                                    // //console.log(result);

                                                    // //console.log('result[0].max_contemporary_appointments');
                                                    // //console.log(result[0].max_contemporary_appointments);
                                                    //console.log('maxContemporaryAppointments');
                                                    //console.log(maxContemporaryAppointments);
                                                    // //console.log(result.max_contemporary_appointments);

                                                    // if(c2 >= /*3*/result[0].max_contemporary_appointments){
                                                    if (c2 >= /*3*/maxContemporaryAppointments) {
                                                        return res.status(419).send("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotati")
                                                        // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
                                                    } else /*if(c === 0)*/{
                                                        // let id = uuidv4();
                                                        // //console.log('eeeeeeeeee')
                                                        // //console.log(eee)
                                                        // var rrr = new Date(bookingBeginAt);
                                                        // //console.log('rrr')
                                                        // //console.log(rrr)

                                                        const sql6 = `INSERT INTO booking(id, prestazione_id, user_id, begin_at, user_order_id, is_shared, note, created_at)
                                                                  VALUES (?, ?, ?, ?, ?, ?, ?, "${new Date(Date.now()).toISOString()}")`;
                                                        await db.promise().query(sql6, [id, prestazioneId, userId, bookingBeginAt, req.body.user_order_id, isShared, note]).then(async (result, err) => {
                                                            if (err) {
                                                                console.log(err)
                                                                return res.status(500).send(err);
                                                            }

                                                            // // const rooms = await socket.ioObject.of('/').adapter.allRooms();
                                                            // var rooms = await socket.ioObject.of('/').adapter.allRooms();
                                                            // console.log(`socket.ioObject.of('/').adapter.allRooms()`);
                                                            // console.log(rooms);
                                                            //
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
                                                            //
                                                            // //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
                                                            // // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
                                                            // if (!rooms.has(req.body.business_id)) {
                                                            //     let notification_id = uuidv4();
                                                            //     let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
                                                            //                 VALUES (?, 0, ?, ?, ?, /*NOW*/UTC_TIMESTAMP())`;
                                                            //     await db.promise().query(sql1, [notification_id, businessId, userId, id]).then((result, err) => {
                                                            //         if (err) {
                                                            //             console.log(err);
                                                            //             return res.status(500).send(err);
                                                            //         }
                                                            //         //console.log('result');
                                                            //         //console.log(result);
                                                            //         // res.end(result);
                                                            //         // res.result;
                                                            //         //     res.json(id);
                                                            //         //     res.json(result);
                                                            //     });
                                                            // }
                                                            // else {
                                                            //     console.log('req.body.begin_at')
                                                            //     console.log(req.body.begin_at)
                                                            //     // socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
                                                            //     socket.ioObject./*sockets.in(req.body.business_id)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
                                                            //         'update_booking_business_appointments',
                                                            //         // "iiiiiiiiiii",
                                                            //         {
                                                            //             "booking_id": id,
                                                            //             "prestazione_id": req.body.prestazione_id,
                                                            //             "note": req.body.note,
                                                            //             "begin_at": req.body.begin_at,
                                                            //             'prestazione_duration': req.body.prestazione_duration,
                                                            //             'prestazione_image': req.body.prestazione_image,
                                                            //             'prestazione_description': req.body.prestazione_description,
                                                            //             'prestazione_title': req.body.prestazione_title,
                                                            //             'prestazione_price': req.body.prestazione_price,
                                                            //             'presale_price': req.body.presale_price,
                                                            //             'user_id': req.body.user_id,
                                                            //             'user_username': req.body.user_username,
                                                            //             'user_name': req.body.user_name,
                                                            //             'user_profile_image': req.body.user_profile_image,
                                                            //             'user_phone_number': req.body.user_phone_number,
                                                            //             'user_email': req.body.user_email,
                                                            //             // 'price': req.body.prestazione_price,
                                                            //             'business_id': req.body.business_id,
                                                            //             'business_name': req.body.business_name,
                                                            //             'business_type_id': req.body.business_type_id,
                                                            //             'business_profile_image': req.body.profile_image,
                                                            //             'business_description': req.body.description,
                                                            //             'business_address': req.body.address,
                                                            //             'business_phone_number': req.body.phone_number,
                                                            //             'max_contemporary_appointments': req.body.max_contemporary_appointments,
                                                            //             'is_canceled': 0,
                                                            //             'created_at': new Date(Date.now()).toISOString(),
                                                            //         }
                                                            //     );
                                                            // }

                                                            const sql7 = `SELECT *
                                                                      FROM user
                                                                      WHERE id = ?`;
                                                            await db.promise().query(sql7, [userId]).then(async (result0, err) => {
                                                                if (err) {
                                                                    console.log(err)
                                                                    return res.status(500).send(err);
                                                                }

                                                                const sql8 = `SELECT *
                                                                          FROM business
                                                                          WHERE id = ?`;
                                                                await db.promise().query(sql8, [businessId]).then(async (result1, err) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                        return res.status(500).send(err);
                                                                    }

                                                                    const sql9 = `SELECT *
                                                                              FROM booking
                                                                              JOIN prestazione ON prestazione.id = booking.prestazione_id
                                                                              WHERE booking.id = ?`;
                                                                    await db.promise().query(sql9, [id]).then(async (result2, err) => {
                                                                        if (err) {
                                                                            console.log(err)
                                                                            return res.status(500).send(err);
                                                                        }

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
                                                                        // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
                                                                        if (!rooms.has(req.body.business_id)) {
                                                                            let notification_id = uuidv4();
                                                                            let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
                                                                            VALUES (?, 0, ?, ?, ?, /*NOW*//*UTC_TIMESTAMP()*/?)`;
                                                                            await db.promise().query(sql1, [notification_id, businessId, userId, id, (new Date()).toISOString()]).then((result, err) => {
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
                                                                            console.log('req.bodyvv6df5dfdf')
                                                                            console.log(req.body)
                                                                            // socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
                                                                            socket.ioObject./*sockets.in(req.body.business_id)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
                                                                                'update_booking_business_appointments',
                                                                                // "iiiiiiiiiii",
                                                                                {
                                                                                    "booking_id": id,
                                                                                    "prestazione_id": req.body.prestazione_id,
                                                                                    "note": req.body.note,
                                                                                    "begin_at": req.body.begin_at,
                                                                                    'prestazione_duration': req.body.prestazione_duration,
                                                                                    'prestazione_image': `${req.body.prestazione_image}`,
                                                                                    'prestazione_description': req.body.prestazione_description,
                                                                                    'prestazione_title': req.body.prestazione_title,
                                                                                    'prestazione_price': req.body.prestazione_price,
                                                                                    'presale_price': req.body.presale_price,
                                                                                    'user_id': req.body.user_id,
                                                                                    'user_username': req.body.user_username,
                                                                                    'user_name': req.body.user_name,
                                                                                    'user_profile_image': `${req.body.user_profile_image}`,
                                                                                    'user_phone': req.body.user_phone,
                                                                                    'user_email': req.body.user_email,
                                                                                    // 'price': req.body.prestazione_price,
                                                                                    'business_id': req.body.business_id,
                                                                                    'business_name': req.body.business_name,
                                                                                    'business_type_id': result1[0].business_type_id,
                                                                                    'business_profile_image': `${result1[0].profile_image}`,
                                                                                    'business_description': result1[0].description,
                                                                                    'business_address': result1[0].address,
                                                                                    'business_phone': result1[0].phone,
                                                                                    'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                                                                                    'is_canceled': 0,
                                                                                    'created_at': new Date(Date.now()).toISOString(),
                                                                                }
                                                                            );
                                                                        }

                                                                        console.log('result2')
                                                                        console.log(result2[0][0])
                                                                        console.log('result1')
                                                                        console.log(result1[0][0])
                                                                        console.log('result0')
                                                                        console.log(result0[0][0])

                                                                        var bookingDate = new Date(result2[0][0].begin_at);
                                                                        const clientTimezone = req.headers['timezone-offset'];
                                                                        const offset = bookingDate.getTimezoneOffset();
                                                                        // var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getMinutes() /*- offset*/ + 120));
                                                                        // var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getUTCMinutes() /*- offset*/ + 120));
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
                                                                        // let localeBookingString = localBookingDate.toISOString();

                                                                        console.log('clientTimezone');
                                                                        console.log(parseInt(clientTimezone));
                                                                        console.log('result2[0].begin_at');
                                                                        console.log(result2[0][0].begin_at);
                                                                        console.log('bookingDate.toISOString()');
                                                                        console.log(bookingDate.toISOString());
                                                                        console.log('offset');
                                                                        console.log(offset);
                                                                        // console.log('newDateBeginAt.toString()');
                                                                        // console.log(newDateBeginAt.toString());
                                                                        // console.log('newDateBeginAt.toISOString()');
                                                                        // console.log(newDateBeginAt.toISOString());
                                                                        console.log('localBookingDate.toString()');
                                                                        console.log(localBookingDate.toString());
                                                                        console.log('localBookingDate.toISOString()');
                                                                        console.log(localBookingDate.toISOString());
                                                                        console.log('localBookingDate.toLocaleString()');
                                                                        console.log(
                                                                            localBookingDate.toLocaleString(
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
                                                                            })
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

                                                                        console.log('result0[0].email_notification');
                                                                        console.log(result0[0][0].email_notification);
                                                                        console.log('result1[0].email_notification');
                                                                        console.log(result1[0][0].email_notification);

                                                                        if (result1[0][0].email_notification === 1) {
                                                                            //email a business
                                                                            let mailOptions = {
                                                                                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                                                                from: `"${result0[0][0].name !== null && result0[0][0].name !== '' ? result0[0][0].name : result0[0][0].username}" support@nurebo.com`, // sender address
                                                                                to: result1[0][0].email,
                                                                                // to: "bar@example.com, baz@example.com", // list of receivers
                                                                                subject: `Prenotazione di ${req.body.prestazione_title} da ${result0[0][0].name !== null && result0[0][0].name !== '' ? result0[0][0].name : result0[0][0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                                                // subject: 'Hello ✔ Nodemailer - Test',
                                                                                // text: 'Wooohooo it works!!',
                                                                                html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${result0[0][0].name !== null && result0[0][0].name !== '' ? result0[0][0].name : result0[0][0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
                                                                               <h1>Grazie.</h1>
                                                                               <h1>A presto!</h1>`,
                                                                            };

                                                                            // Step 3
                                                                            await transporter.sendMail(mailOptions, (err, data) => {
                                                                                if (err) {
                                                                                    console.log('Error occurs', err);
                                                                                    // return;
                                                                                }
                                                                                // console.log(otp);
                                                                                console.log('Email sent!!! 2112');
                                                                            });
                                                                        }
                                                                        if (result0[0][0].email_notification === 1) {
                                                                            //email a user
                                                                            let mailOptions1 = {
                                                                                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                                                                from: `"${result1[0][0].name}" support@nurebo.com`, // sender address
                                                                                to: result0[0][0].email,
                                                                                // to: "bar@example.com, baz@example.com", // list of receivers
                                                                                subject: `Prenotazione di ${req.body.prestazione_title} da ${req.body.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                                                // subject: 'Hello ✔ Nodemailer - Test',
                                                                                // text: 'Wooohooo it works!!',
                                                                                html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${req.body.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
                                                                               <h1>Grazie.</h1>
                                                                               <h1>A presto!</h1>`,
                                                                            };

                                                                            // Step 3
                                                                            await transporter.sendMail(mailOptions1, (err, data) => {
                                                                                if (err) {
                                                                                    console.log('Error occurs', err);
                                                                                    // return log('Error occurs', err);
                                                                                    // return;
                                                                                }
                                                                                // return;
                                                                                // console.log(otp);
                                                                                console.log('Email sent!!!65665');
                                                                            });
                                                                        }

                                                                        const sql15 = `SELECT fcm_token 
                                                                                     FROM business_device
                                                                                     WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND business_id = ?
                                                                                     ORDER BY RAND()
                                                                                     LIMIT 1000`;
                                                                        await db.promise().query(sql15, [businessId]).then(async (result6, err) => {
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
                                                                                                // "title": 'string6r5555555f5f5',
                                                                                                "title": `${req.body.prestazione_title}`,
                                                                                                "body": `Prenotazione da ${/*req.body.user_name*/req.body.user_name !== null && req.body.user_name !== '' ? req.body.user_name : req.body.user_username} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                                                                // "body": string,
                                                                                                "channel_id": "fcm_nurebo_admin_channel",
                                                                                                "icon": 'android12splash',
                                                                                                // "icon": 'splash',
                                                                                                // "icon": 'calendar',
                                                                                                // "icon": 'calendar_1',
                                                                                                // "icon": 'ic_launcher',
                                                                                                // "color": '#0020FF',
                                                                                                "sound": 'piece_of_cake_611',
                                                                                                // "tag": 'stringbbbb',
                                                                                                // "click_action": string,
                                                                                                // "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                                                                                // "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43],
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
                                                                                firebase.getNureboAdminAccessToken().then(async function(accessToken) {
                                                                                    await axios.post(
                                                                                        `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_NUREBO_ADMIN_PROJECT_ID}/messages:send`,
                                                                                        message,
                                                                                        {
                                                                                            headers: {
                                                                                                'Authorization': `Bearer ${accessToken}`,
                                                                                                'Content-Type': 'application/json'
                                                                                            }
                                                                                        }
                                                                                    ).then(function (response) {
                                                                                        console.log('response.status2');
                                                                                        console.log(response.status);
                                                                                        // console.log(response.data);
                                                                                        // console.log(response.data.success);
                                                                                    }).catch(function (error) {
                                                                                        // console.log(error);
                                                                                        console.log('Response data:', error.response.data);
                                                                                        console.log('Error message:', error.message);
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
                                                                            //         // "to": "cDdRQ4IPR6qpRREaeV0KNp:APA91bFsj7Vreyql4ZGXWJqAYiXkJBlZr-TkyvL7OvGnz672VroVtTyElxIRNRdIyxU1ghHLtOJ5Q2QcXqbpT5MFbdkbgQawSInR6sEdYRM-NdvAKMHrhBTX0jNpSqQ5Vx-2PcVGteJ-",
                                                                            //         "to": "cPD5QfLPQfSmNXtArooBQp:APA91bE5UePiJLxhCUdvLMrLHLI3jBcJFRWxX0OMAS4k5YptHkj3rCkCFIziAwOcvC9xIDmmNKM3ywqE0GWNMW_6022xR_vC1stS-TmkUQQXd-3I2GdY-7BzouyOyDNELKaX8zhE4C4C",
                                                                            //         // "to": req.body.user_token,
                                                                            //         "direct_boot_ok" : true,
                                                                            //         "badge": 1,
                                                                            //         "notification": {
                                                                            //             "title": "Check this Mobile (title)",
                                                                            //             "subtitle": "Norris (subtitle)",
                                                                            //             "body": "Rich Notification testing (body)",
                                                                            //             // "mutable_content": true,
                                                                            //             "link": "https://www.google.com",
                                                                            //             // "vibrate": "true",
                                                                            //             "sound": "default",
                                                                            //             "image": "https://kadingira-s3.s3.eu-central-1.amazonaws.com/image/prestazione/0e3c9167-1d17-40f4-a2a5-edeaa341e1a2.jpg",
                                                                            //             "click_action": "MAIN_ACTIVITY",
                                                                            //             // "click_action": "MAIN",
                                                                            //             // "click_action": "LAUNCHER",
                                                                            //             // "requireInteraction": "true",
                                                                            //             // "ttl": 2
                                                                            //         },
                                                                            //         "android": {
                                                                            //             "ttl": 3,
                                                                            //             "sound": "default",
                                                                            //             "subtitle": "Android specific",
                                                                            //             "vibrate": true,
                                                                            //             "link": "https://www.google.com",
                                                                            //             "priority": "high",
                                                                            //             "notification": {
                                                                            //                 "image": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
                                                                            //             }
                                                                            //         },
                                                                            //         "apns":{
                                                                            //             "headers": {
                                                                            //                 "apns-priority": "5",
                                                                            //                 "apns-expiration":"1604750400"
                                                                            //             },
                                                                            //             "payload":{
                                                                            //                 "aps":{
                                                                            //                     "mutable-content": 1
                                                                            //                 }
                                                                            //             },
                                                                            //             "fcm_options": {
                                                                            //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
                                                                            //             }
                                                                            //         },
                                                                            //         "webpush":{
                                                                            //             "headers":{
                                                                            //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
                                                                            //                 "TTL":"86400",
                                                                            //                 "Urgency": "high"
                                                                            //             }
                                                                            //         },
                                                                            //         "data": {
                                                                            //             "url": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
                                                                            //             "dl": "<deeplink action on tap of notification>"
                                                                            //         }
                                                                            //     }
                                                                            // }).then(function (response) {
                                                                            //     console.log(response.status);
                                                                            //     console.log(response.data);
                                                                            //     console.log(response.data.success);
                                                                            //     // res.status(200).send(response.data);
                                                                            // }).catch(function (error) {
                                                                            //     console.log(error);
                                                                            //     // res.status(500).send(error);
                                                                            // });

                                                                            // await axios({
                                                                            //     method: 'POST',
                                                                            //     url: 'https://fcm.googleapis.com/fcm/send',
                                                                            //     headers: {
                                                                            //         'Content-Type': 'application/json',
                                                                            //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                                                                            //     },
                                                                            //     data: {
                                                                            //         "notification": {
                                                                            //             "title": `${req.body.prestazione_title}`,
                                                                            //             "subtitle": /*`${}`*/"Prenotazione",
                                                                            //             "body": `Prenotazione da ${/*req.body.user_name*/req.body.user_name !== null && req.body.user_name !== '' ? req.body.user_name : req.body.user_username} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                                            //             // "channel_id": "fcm_nurebo_admin_channel",
                                                                            //             "android_channel_id": "fcm_nurebo_admin_channel",
                                                                            //             // "image": `${req.body.prestazione_image}`,
                                                                            //             "vibrate": true,
                                                                            //             "icon": "calendar"
                                                                            //         },
                                                                            //         "direct_boot_ok": true,
                                                                            //         "data": {
                                                                            //             "keyname": "any value",
                                                                            //             "booking_id": id,
                                                                            //             "prestazione_id": `${req.body.prestazione_id}`,
                                                                            //             "note": req.body.note,
                                                                            //             "begin_at": req.body.begin_at,
                                                                            //             'prestazione_duration': req.body.prestazione_duration,
                                                                            //             "prestazione_image": `${req.body.prestazione_image}`,
                                                                            //             'prestazione_description': req.body.prestazione_description,
                                                                            //             'prestazione_title': req.body.prestazione_title,
                                                                            //             'prestazione_price': req.body.prestazione_price,
                                                                            //             'presale_price': req.body.presale_price,
                                                                            //             'user_id': req.body.user_id,
                                                                            //             'user_username': req.body.user_username,
                                                                            //             'user_name': req.body.user_name,
                                                                            //             'user_profile_image': `${req.body.user_profile_image}`,
                                                                            //             'user_phone_number': req.body.user_phone_number,
                                                                            //             'user_email': req.body.user_email,
                                                                            //             // 'price': req.body.prestazione_price,
                                                                            //             'business_id': req.body.business_id,
                                                                            //             'business_name': req.body.business_name,
                                                                            //             'business_type_id': result1[0].business_type_id,
                                                                            //             'business_profile_image': `${result1[0].profile_image}`,
                                                                            //             'business_description': result1[0].description,
                                                                            //             'business_address': result1[0].address,
                                                                            //             'business_phone_number': result1[0].phone_number,
                                                                            //             'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                                                                            //             'is_canceled': 0,
                                                                            //             'created_at': new Date(Date.now()).toISOString(),
                                                                            //         },
                                                                            //         "android": {
                                                                            //             "notification": {
                                                                            //                 "image": `${req.body.prestazione_image}`,
                                                                            //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                                                            //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
                                                                            //             },
                                                                            //             "direct_boot_ok": true
                                                                            //         },
                                                                            //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                                                                            //         "registration_ids": array,
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

                                                            // res.json(result);
                                                        });

                                                        // res.json(result);
                                                        res.json(id);
                                                    }
                                                });
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
        // await //console.log('duration')
        // //console.log(duration)
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/compress-image", upload1.single("imagerr"), async (req, res) => {
//     try {
//         let bucketName = '76jvtbcz739esaa3czg2bmxfbxg7t7972chwu3c8';
//         // let imageName = makeid(20) + '.png';
//         let imageName = `${makeid(20)}.png`;
//         // let resizedObjectKey = 'temp/' + imageName;
//         let resizedObjectKey = `temp/${imageName}`;
//         const { buffer, originalname } = req.file;
//
//         const form = new formData();
//         form.append('imagerr', buffer, { filename: originalname });
//
//         const response = await axios.post('http://localhost:7979/compress-image', form, {
//             headers: form.getHeaders(),
//             responseType: 'arraybuffer'
//         });
//
//         // Elabora la risposta
//         const modifiedImage = response.data;
//
//         const params = {
//             Image: {
//                 // Bytes: req.file.buffer,
//                 // Bytes: Buffer.from(req.file.buffer),
//                 Bytes: /*data1*/modifiedImage,
//                 // Bytes: resizedImage,
//             },
//             MinConfidence: 90, // Imposta la soglia di confidenza desiderata
//         };
//
//         let detectLabels = await rekognition.detectModerationLabels(params).promise();
//
//         console.log(detectLabels)
//
//         const moderationLabels = detectLabels.ModerationLabels;
//
//         if (moderationLabels.length > 0) {
//             console.log('L\'immagine contiene contenuti pornografici.');
//             console.log('Etichette rilevate:', moderationLabels);
//             await res.status(400).json({error: 'L\'immagine contiene contenuti non adatti.'});
//             return;
//         }
//         else {
//             console.log('L\'immagine è accettabile.');
//             // res.json({ message: 'L\'immagine è accettabile.' });
//             // Procedi con il salvataggio dell'immagine su S3
//         }
//
//         const putObjectParams = {
//             Bucket: bucketName,
//             Key: resizedObjectKey,
//             // Body: resizedImage,
//             Body: /*data1*/modifiedImage,
//             // ACL: 'private', // Imposta l'ACL su "private" per limitare l'accesso all'immagine ridimensionata
//         };
//
//         await s3.putObject(putObjectParams).promise();
//
//         // console.log(req.file)
//         // res.send('Immagine elaborata con successo');
//         res.set('Content-Type', req.file.mimetype);
//         res.status(234)
//         res/*.status(226)*/.send(modifiedImage/*Buffer.from(req.file.buffer)*/);
//     } catch (error) {
//         console.error('Errore durante l\'invio dell\'immagine:', error);
//         res.status(500).send('Errore durante l\'invio dell\'immagine');
//     }
// });

// Router.post("/profile_image", checkAuth,/* checkUser,*/ upload.single('image'), (req, res) => {
Router.post("/:user_id/profile_image", checkUserAuth,/* checkUser,*/ /*upload*//*.single('image')*/upload1.single("image"), async (req, res) => {
    try {
        let userId = req.body.user_id;
        console.log(req.file)
        console.log(req.body)
        // let myFile = req.file.originalname.split(".")
        // const fileType = myFile[myFile.length - 1]
        // let id = uuidv4();

        const sql = `SELECT user_id FROM user_authentication WHERE id = ?`;
        db.query(sql, [req.decoded.id], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkUser in upload profile image')
            console.log(result[0].user_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            if (result[0].user_id !== req.body.user_id) {
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

        // const params = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     // Key: `${uuid()}.${fileType}`,
        //     Key: `image/user/${userId}/${uuidv4()}.${fileType}`,
        //     Body: req.file.buffer
        // }
        //
        // const rekognitionParams = {
        //     Image: {
        //         // Bytes: req.file.buffer,
        //         Bytes: Buffer.from(req.file.buffer),
        //         // Bytes: resizedImage,
        //     },
        //     MinConfidence: 90, // Imposta la soglia di confidenza desiderata
        // };
        //
        // let detectLabels = await rekognition.detectModerationLabels(rekognitionParams).promise();
        //
        // console.log(detectLabels)
        //
        // const moderationLabels = detectLabels.ModerationLabels;
        //
        // if (moderationLabels.length > 0) {
        //     console.log('L\'immagine contiene contenuti pornografici.');
        //     console.log('Etichette rilevate:', moderationLabels);
        //     return res.status(400).send('L\'immagine contiene contenuti pornografici.');
        // }
        // else {
        //     console.log('L\'immagine è accettabile.');
        //     // res.json({ message: 'L\'immagine è accettabile.' });
        //     // Procedi con il salvataggio dell'immagine su S3
        // }
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
                await res.status(400).json({error: "L'immagine contiene contenuti non adatti."});
                return;
            }
            else {
                console.log('L\'immagine è accettabile.');
                // res.json({ message: 'L\'immagine è accettabile.' });
                // Procedi con il salvataggio dell'immagine su S3
            }

            console.log(req.file)
            let myFile = req.file.originalname.split(".")
            const fileType = myFile[myFile.length - 1]
            let s3Path = `image/user/${userId}/${uuidv4()}.${fileType}`;

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

                    const sql0 = `UPDATE user SET profile_image = ? WHERE id = ?`;
                    db.query(sql0, [/*data['Location']*/s3Path, userId], (err, result) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }

                        res.status(200).send(data)
                        // res.status(200).send(
                        //     JSON.stringify({
                        //         'id': userId,
                        //         'image': data['Location'],
                        //         'business_id': businessId,
                        //         'description': description,
                        //         'price': parseFloat(price),
                        //         'duration': parseInt(duration),
                        //         'title': title,
                        //         'is_valid': 1,
                        //         'previous': ''
                        //     })
                        // );
                    });
                }
            );

            // console.log(req.file)
            // res.send('Immagine elaborata con successo');
            // res.set('Content-Type', req.file.mimetype);
            // res.status(234)
            // res/*.status(226)*/.send(modifiedImage/*Buffer.from(req.file.buffer)*/);
        }
        // else if (req.file.mimetype === "image/webp") {
        //     res.status(520).send("Immagine con formato non supportato");
        // }
        else {
            res.status(521).send("Immagine con formato non supportato");
        }
    }
    catch (error) {
        console.error('Errore durante l\'invio dell\'immagine:', error);
        res.status(500).send('Errore durante l\'invio dell\'immagine');
    }
});

// Router.get('/', (req, res) => {
Router.get("/", /*checkDev,*/ (req, res) => {
    try {
        const sql = `SELECT user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, 
                    user.username AS user_username, user.phone AS user_phone, user.name AS user_name, 
                    user.description AS user_description 
                FROM user`;
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

function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Router.delete("/", checkAuth, checkUser, (req, res) => {
Router.delete("/:user_id", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;
        // let deletedAt = req.body.deleted_at;

        const sql1 = `UPDATE user 
                        SET is_deleted = ?, deleted_at = ?
                        WHERE id = ?`;
        db.query(sql1, [1, /*deletedAt*/new Date(Date.now()).toISOString(), userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            res.send(result);
        });
        // res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:email/account/delete", /*checkUserAuth, checkUser,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let email = req.body.email;
        let email = req.params.email;
        let loginId = uuidv4();

        console.log('d5d5dd5d5d55')
        console.log(req.body)

        const sql = `SELECT * 
                 FROM user 
                 WHERE email = ? AND is_deleted = ?`;
        db.query(sql, [email, 0], async (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length === 1) {
                // console.log('df5d5dd5d5dd5d56gf');
                // console.log(result);
                let codice = makeid(6, true);
                const token = JWT.sign(
                    {
                        auth_id: loginId,
                        user_id: result[0].id
                    },
                    // JWT_key,
                    process.env.JWT_KEY,
                    // global.JWT_key,
                    // {expiresIn: 360000}
                );

                let query = `INSERT INTO user_authentication (id, auth_type, user_id, sent_otp, sent_otp_at, postal_code, ip_address, is_success, is_logout) 
                            VALUES (?, "WEB", ?, ?, ?, ?, ?, 0, 0)`;
                db.query(query, [loginId, result[0].id, codice, new Date(Date.now()).toISOString(), /*postalCode*/'', /*ipAddress*/''], async (err, result0) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    // console.log('result0')
                    // console.log(result0)

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
                        // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                        from: `support@nurebo.com`, // sender address
                        to: email,
                        // to: "bar@example.com, baz@example.com", // list of receivers
                        subject: `Cancellazione Account`,
                        // subject: 'Hello ✔ Nodemailer - Test',
                        // text: 'Wooohooo it works!!',
                        html: `<h1>Il tuo codice di verifica è ${codice}</h1>`,
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

                    // res.status(200).send(result);
                    // res./*status(204).*/json({"result": result, code: codice, random_hash: makeid(24, false)});
                    res./*status(204).*/json({/*"auth_id": loginId,*/ /*"user_id": result[0].id,*/ /*code: codice,*/ /*random_hash: makeid(24, false),*/
                        token
                    });
                });
            } else {
                res.status(454).send(/*result*/'errorissimus ggfd erdf');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:email/account/delete", /*checkUserAuth, checkUser,*/ (req, res) => {
    try {
        // let authId = req.body.auth_id;
        // let userId = req.body.user_id;
        // let randomHash = req.body.random_hash;
        let token = req.body.token;
        let codice = req.body.code;

        // console.log('d5d5dd5d5d55')
        // console.log(req.body)

        // const decoded = JWT.verify(req.headers.authorization, process.env.JWT_KEY)
        // const decoded = JWT.verify(req.headers.authorization, global.JWT_KEY)
        const decoded = JWT.verify(token, process.env.JWT_KEY)
        // console.log('decoded')
        // console.log(decoded)
        // console.log(decoded.auth_id)
        // console.log(decoded.user_id)

        let authId = decoded.auth_id;
        let userId = decoded.user_id;

        const sql1 = `UPDATE user_authentication SET inserted_otp = ?, inserted_otp_at = ? WHERE id = ?`;
        db.query(sql1, [codice, new Date(Date.now()).toISOString(), authId], (err, rows) => {
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

            const quer = `SELECT sent_otp, sent_otp_at FROM user_authentication WHERE id = ?`;
            db.query(quer, [authId], (err, rows) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }

                let now = new Date(Date.now());
                let sent_otp_at = new Date(rows[0].sent_otp_at);
                // console.log(now)
                // console.log(rows[0].sent_otp_at)
                // console.log(sent_otp_at)
                console.log(now.getSeconds() - sent_otp_at.getSeconds())

                //console.log(rows[0].sent_otp);
                let success;
                if (codice === rows[0].sent_otp && now.getSeconds() - sent_otp_at.getSeconds() <= 300) {
                    success = 1;
                    // console.log('global.JWT_key');
                    // console.log(global.JWT_key);

                    // const token = JWT.sign(
                    //     {authId},
                    //     // JWT_key,
                    //     process.env.JWT_KEY,
                    //     // global.JWT_key,
                    //     // {expiresIn: 360000}
                    // );
                    const sql2 = `UPDATE user_authentication 
                        SET is_success = ?, login_at = ?
                        WHERE id = ?`;
                    db.query(sql2, [success, new Date(Date.now()).toISOString(), authId], (err, rows) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }

                        const sql10 = `UPDATE user
                                    SET is_deleted = ?, deleted_at = ?
                                    WHERE id = ?`;
                        db.query(sql10, [1, new Date(Date.now()).toISOString(), userId], (err, result) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            }

                            // res.send(result);
                            res.json({
                                success,
                                // token
                            });
                        });
                    });
                    // res.json({
                    //     success,
                    //     token
                    // });
                } else {
                    success = 0;
                    const sql2 = `UPDATE user_authentication SET is_success = ? WHERE id = ?`;
                    db.query(sql2, [success, authId], (err, rows) => {
                        if (err) {
                            console.log(err);
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
        });

        // res./*status(204).*/json({"ciccio": 888888888888, random_hash: "dsf2vf12fd1b"});
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/campaign", /*checkDev,*/ async (req, res) => {
    try {
        //TODO: INVIARE A CLIENTI CHE SONO GIà STATI IN QUEL LOCALE
        let title = req.body.title;
        let body = req.body.body;
        let image = req.body.image;
        let array = [];

        const sql = `SELECT fcm_token FROM user
                 WHERE fcm_token IS NOT NULL AND fcm_token <> ''
                 ORDER BY RAND()
                 LIMIT 1000`;
        db.query(sql, [], async (err, result) => {
            if (err) {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
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
                    Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                },
                data: {
                    "notification": {
                        "title": `${title}`,
                        // "subtitle": /*`${}`*/"Promozione",
                        "body": `${body}`,
                        // "channel_id": "fcm_nurebo_admin_channel",
                        "android_channel_id": "fcm_nurebo_channel",
                        // "image": `${image}`,
                        "icon": "calendar",
                        "vibrate": true,

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

        const sql = `SELECT fcm_token FROM user_device
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
                    Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                },
                data: {
                    "notification": {
                        "title": `${title}`,
                        // "subtitle": /*`${}`*/"Promozione",
                        "body": `${body}`,
                        // "channel_id": "fcm_nurebo_admin_channel",
                        "android_channel_id": "fcm_nurebo_channel",
                        // "image": `${image}`,
                        "icon": "calendar",
                        "vibrate": true,

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

// Router.post("/fcm_token", (req, res) => {
Router.put("/:user_id/fcm_token", checkUserAuth, checkUser, (req, res) => {
    try {
        let fcmToken = req.body.fcm_token;
        let userId = req.body.user_id;
        //console.log(id);

        const sql = `UPDATE user 
                    SET fcm_token = ?
                    WHERE id = ?`;
        db.query(sql, [fcmToken, userId], (err, result) => {
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

Router.get("/:user_id/device", checkUserAuth, checkUser, checkDev, (req, res) => {
    try {
        // let fcmToken = req.body.fcm_token;
        let userId = req.params.user_id;
        let manufacturer = req.query.manufacturer;
        let model = req.query.model;
        // let sdkVersion = req.body.sdk_version;
        // let releaseVersion = req.body.release_version;
        // console.log(req.body);

        // const decoded = JWT.verify(req.headers.authorization, process.env.JWT_KEY)
        // // const decoded = JWT.verify(req.headers.authorization, global.JWT_KEY)
        // console.log('decoded00fdfddg0')
        // console.log(decoded)

        let sql1 = `SELECT *
                FROM user_device
                WHERE user_id = ? AND manufacturer = ? AND model = ?`;
        db.query(sql1, [userId, manufacturer, model,], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            // console.log('decoddfokdfokded')
            // console.log(decoded.id)
            // console.log(result[0].id)
            //
            // let sql2 = `UPDATE authentication SET user_device_id = ?
            //                 WHERE id = ?`;
            // db.query(sql2, [result[0].id, decoded.id, ],(err, result) => {
            //     if (err) {
            //         console.log(err);
            //         return res.status(500).send(err);
            //     }
            //     console.log('resuld5xc5c5ct');
            //     console.log(result);
            //     // res.end(result);
            //     // res.result;
            //     //     res.json(id);
            //     //     res.json(result);
            //
            //     // res.json(result);
            //     // res.json(id);
            // });

            res.status(200).json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/device", (req, res) => {
Router.put("/:user_id/device", checkUserAuth, checkUser, (req, res) => {
    try {
        let fcmToken = req.body.fcm_token;
        let userId = req.body.user_id;
        let manufacturer = req.body.manufacturer;
        let model = req.body.model;
        let sdkVersion = req.body.sdk_version;
        let releaseVersion = req.body.release_version;
        // console.log(req.body);

        let sql1 = `SELECT *
                FROM user_device
                WHERE user_id = ? AND manufacturer = ? AND model = ?`;
        db.query(sql1, [userId, manufacturer, model,], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            console.log('result.length55555');
            // console.log(result.length);
            console.log(result);
            // console.log(result[0].id);

            try {
                const decoded = JWT.verify(req.headers.authorization, process.env.JWT_KEY)
                // const decoded = JWT.verify(req.headers.authorization, global.JWT_KEY)
                console.log('decoded0055555fdfddg0')
                console.log(decoded)
                console.log(decoded.id)
                // console.log(result[0].id)

                if (result.length > 0) {
                    // for(let i = 0; i < result.length; i++) {
                    // id = uuidv4();

                    let sql2 = `UPDATE user_device SET fcm_token = ?, created_at = ?
                            WHERE user_id = ? AND manufacturer = ? AND model = ?`;
                    db.query(sql2, [fcmToken, new Date(Date.now()).toISOString(), userId, manufacturer, model,], (err, result95) => {
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

                        let sql1 = `SELECT *
                                FROM user_device
                                WHERE user_id = ? AND manufacturer = ? AND model = ?`;
                        db.query(sql1, [userId, manufacturer, model,], (err, result2) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            }

                            let sql52 = `UPDATE user_authentication SET user_device_id = ?
                                     WHERE id = ?`;
                            db.query(sql52, [result2[0].id, decoded.id,], (err, result15) => {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send(err);
                                }
                                console.log('resuld5xc5c5ct');
                                console.log(result2);
                                // res.end(result);
                                // res.result;
                                //     res.json(id);
                                //     res.json(result);

                                // res.json(result);
                                // res.json(id);
                            });

                            res.json(result2);

                        });
                        // res.json(id);
                    });
                } else {
                    let id = uuidv4();
                    const sql = `INSERT INTO user_device(id, manufacturer, model, user_id, fcm_token, sdk_version, release_version, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    db.query(sql, [id, manufacturer, model, userId, fcmToken, sdkVersion, releaseVersion, new Date(Date.now()).toISOString()], (err, result4) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }

                        let sql52 = `UPDATE user_authentication SET user_device_id = ?
                                     WHERE id = ?`;
                        db.query(sql52, [id, decoded.id,], (err, result5) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            }
                            console.log('resuld5xc5c5ct');
                            console.log(result5);
                            // res.end(result);
                            // res.result;
                            //     res.json(id);
                            //     res.json(result);

                            // res.json(result);
                            // res.json(id);
                        });

                        res.json([{id}]);
                        // res.json(id);
                    });
                }
            } catch (e) {
                console.log(e);
                return res.status(500).send(err);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:user_id/session", checkUserAuth, checkUser, (req, res) => {
    try {
        let ipAddr = req.body.ip_addr;
        let userDeviceId = req.body.user_device_id;
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
        const sql = `INSERT INTO user_session(id, user_authentication_id, latitude, longitude, ip_addr, zip_code, begin_at)
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

Router.delete("/:user_id/session", checkUserAuth, checkUser, (req, res) => {
    try {
        let sessionId = req.body.session_id;
        let endAt = req.body.end_at;

        // console.log('endAtcc5c')
        // console.log(endAt)

        const sql = `UPDATE user_session SET end_at = ?/*UTC_TIMESTAMP()*/
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

// Router.post("/email", (req, res) => {
Router.post("/email", /*checkDev,*/ (req, res) => {
    try {
        let email = req.body.email;

        const sql = `SELECT * 
                 FROM user 
                 WHERE email = ? AND is_deleted = ?`;
        db.query(sql, [email, 0], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                // //console.log(result);
                // //console.log('coglio');
                // res.redirect('/category');
                // res.json(result);
                res.status(200).send(result);
            } else {
                res.status(454).send(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.patch("/email_notification", checkAuth, checkUser, (req, res) => {
Router.patch("/:user_id/email_notification", checkUserAuth, checkUser, (req, res) => {
    try {
        let emailNotification = req.body.email_notification;
        let userId = req.body.user_id;
        // //console.log("req.body");
        // //console.log(req.body);

        const sql1 = `UPDATE user 
                    SET email_notification = ?
                    WHERE id = ?`;
        db.query(sql1, [emailNotification, userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.patch("/:user_id/booking/:booking_id/is_shared", checkUserAuth, checkUser, (req, res) => {
    try {
        let shared = req.body.is_shared;
        let bookingId = req.params.booking_id;
        let userId = req.params.user_id;
        // //console.log("req.body");
        // //console.log(req.body);

        const sql1 = `UPDATE booking 
                    SET is_shared = ?
                    WHERE id = ?`;
        db.query(sql1, [shared, bookingId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.patch("/username", checkAuth, checkUser, (req, res) => {
Router.patch("/:user_id/username", checkUserAuth, checkUser, (req, res) => {
    try {
        let username = req.body.username;
        let userId = req.body.user_id;
        // //console.log("req.body");
        // //console.log(req.body);
        //
        // const sql = `SELECT * FROM user WHERE id = "${id}"`;
        //
        // db.query(sql, (err, result) => {
        //     if (err) {
        //         return res.status(500).send(err);
        //     }
        //     if (result.length === 0) {
        //         //console.log(result);
        //         // res.redirect('/category');
        //         // res.json(result);
        //         res.send(result);
        //     }
        //     else if (result.length === 1) {
        const sql1 = `UPDATE user 
                    SET username = ?
                    WHERE id = ?`;
        db.query(sql1, [username, userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
        // res.send(result);
        //     }
        // });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.patch("/description", checkAuth, checkUser, (req, res) => {
Router.patch("/:user_id/description", checkUserAuth, checkUser, (req, res) => {
    try {
        let description = req.body.description;
        let userId = req.body.user_id;
        // //console.log("req.body");
        // //console.log(req.body);
        //
        // const sql = `SELECT * FROM user WHERE id = "${id}"`;
        //
        // db.query(sql, (err, result) => {
        //     if (err) {
        //         return res.status(500).send(err);
        //     }
        //     if (result.length === 0) {
        //         //console.log(result);
        //         // res.redirect('/category');
        //         // res.json(result);
        //         res.send(result);
        //     }
        //     else if (result.length === 1) {
        const sql1 = `UPDATE user 
                    SET description = ?
                    WHERE id = ?`;
        db.query(sql1, [description, userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
        // res.send(result);
        //     }
        // });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.patch("/name", checkAuth, checkUser, (req, res) => {
Router.patch("/:user_id/name", checkUserAuth, checkUser, (req, res) => {
    try {
        let name = req.body.name;
        let userId = req.body.user_id;
        // //console.log("req.body");
        // //console.log(req.body);
        //
        // const sql = `SELECT * FROM user WHERE id = "${id}"`;
        //
        // db.query(sql, (err, result) => {
        //     if (err) {
        //         return res.status(500).send(err);
        //     }
        //     if (result.length === 0) {
        //         //console.log(result);
        //         // res.redirect('/category');
        //         // res.json(result);
        //         res.send(result);
        //     }
        //     else if (result.length === 1) {
        const sql1 = `UPDATE user 
                    SET name = ?
                    WHERE id = ?`;
        db.query(sql1, [name, userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
        // res.send(result);
        //     }
        // });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.patch("/phone_number", checkAuth, checkUser, (req, res) => {
Router.patch("/:user_id/phone", checkUserAuth, checkUser, (req, res) => {
    try {
        let phoneNumber = req.body.phone;
        let userId = req.body.user_id;
        // //console.log("req.body");
        // //console.log(req.body);
        //
        // const sql = `SELECT * FROM user WHERE id = "${id}"`;
        //
        // db.query(sql, (err, result) => {
        //     if (err) {
        //         return res.status(500).send(err);
        //     }
        //     if (result.length === 0) {
        //         //console.log(result);
        //         // res.redirect('/category');
        //         // res.json(result);
        //         res.send(result);
        //     }
        //     else if (result.length === 1) {
        const sql1 = `UPDATE user 
                    SET phone = ?
                    WHERE id = ?`;
        db.query(sql1, [phoneNumber, userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
        // res.send(result);
        //     }
        // });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.patch("/email", checkAuth, checkUser, (req, res) => {
Router.patch("/:user_id/email", checkUserAuth, checkUser, (req, res) => {
    try {
        let email = req.body.email;
        let userId = req.body.user_id;
        // //console.log("req.body");
        // //console.log(req.body);
        //
        // const sql = `SELECT * FROM user WHERE id = "${id}"`;
        //
        // db.query(sql, (err, result) => {
        //     if (err) {
        //         return res.status(500).send(err);
        //     }
        //     if (result.length === 0) {
        //         //console.log(result);
        //         // res.redirect('/category');
        //         // res.json(result);
        //         res.send(result);
        //     }
        //     else if (result.length === 1) {
        const sql1 = `UPDATE user 
                    SET email = ?
                    WHERE id = ?`;
        db.query(sql1, [email, userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
        // res.send(result);
        //     }
        // });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/phone_number", (req, res) => {
Router.get("/:phone", /*checkDev,*/ (req, res) => {
    try {
        // let phoneNumber = req.body.phone_number;
        let phoneNumber = req.params.phone;

        const sql = `SELECT * FROM user WHERE phone = ?`;
        db.query(sql, [phoneNumber], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                // //console.log(result);
                // res.redirect('/category');
                // res.json(result);
                res.send(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/search/username", (req, res) => {
Router.post("/search/username", /*checkDev,*/ (req, res) => {
    try {
        let username = req.body.username;

        const sql = `SELECT * 
                    FROM user 
                    WHERE username LIKE '%?%' AND user.is_deleted = 0`;
        db.query(sql, [username], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (result != null) {
                // //console.log(result);
                // res.redirect('/category');
                res.json(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/images", (req, res) => {
Router.get("/:user_id/images", /*checkDev,*/ (req, res) => {
    try {
        // let userId = req.body.id;
        let userId = req.params.user_id;

        const sql = `SELECT * FROM user_image WHERE user_id = ?`;
        db.query(sql, [userId], (err, result) => {
            if (err) {
                //console.log(err)
                return res.status(500).send(err);
            }
            if (result != null) {
                // //console.log(result);
                // res.redirect('/category');
                res.json(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/follow', (req, res) => {
Router.post("/:user_id/follow", /*checkDev,*/ (req, res) => {
    try {
        let userId = req.body.user_id;
        let followerId = req.body.follower_id;
        // //console.log(userId);
        // //console.log(followerId);

        let sql1 = `SELECT *
                FROM user_follow
                WHERE user_id = ? AND follower_id = ?`;
        db.query(sql1, [userId, followerId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                // //console.log(result);
                // res.redirect('/category');
                res.json(result);
            } else /*if (result.length === 0)*/{
                // //console.log(result);
                let sql = `INSERT INTO user_follow(user_id, follower_id, created_at) 
                VALUES(?, ?, ?)`;
                db.query(sql, [userId, followerId, new Date(Date.now()).toISOString()], (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    // //console.log(result);
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

// Router.post('/unfollow',(req, res) => {
Router.post("/:user_id/unfollow", /*checkDev,*/ (req, res) => {
    try {
        let userId = req.body.user_id;
        let followerId = req.body.follower_id;
        // //console.log(userId);
        // //console.log(followerId);

        let sql = `DELETE FROM user_follow 
               WHERE user_id = ? AND follower_id = ?`;
        db.query(sql, [userId, followerId], (err, result) => {
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

// Router.post('/verify_follow',(req, res) => {
Router.post("/:user_id/verify_follow", /*checkDev,*/ (req, res) => {
    try {
        let userId = req.body.user_id;
        let followerId = req.body.follower_id;
        // //console.log(userId);
        // //console.log(followerId);

        let sql = `SELECT * FROM user_follow 
                WHERE user_id = '${userId}' AND follower_id = '${followerId}'`;
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                res.json(result.length);
            } else {
                res.json(result.length);
            }
            //console.log(result.length)
            // res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/follows/count',(req, res) => {
Router.get("/:user_id/follow/count", /*checkDev,*/ (req, res) => {
    try {
        // let followerId = req.body.follower_id;
        let followerId = req.params.follower_id;

        let sql = `SELECT COUNT(*) 
                FROM user_follow 
                WHERE follower_id = ${followerId}`;
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(result)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/followers/count',(req, res) => {
Router.get("/:user_id/follower/count", /*checkDev,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        let sql = `SELECT COUNT(*) 
                FROM user_follow 
                WHERE user_id = '${userId}'`;
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(result)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/followers',(req, res) => {
Router.get("/:user_id/follower", /*checkDev,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        let sql = `SELECT DISTINCT *
                FROM user_follow 
                JOIN user ON user.id = user_follow.follower_id
                WHERE user_id = ?`;
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(result)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/follows',(req, res) => {
Router.get("/:user_id/follow", /*checkDev,*/ (req, res) => {
    try {
        // let followerId = req.body.follower_id;
        let followerId = req.params.follower_id;

        let sql = `SELECT DISTINCT *
                FROM user_follow 
                JOIN user ON user.id = user_follow.user_id
                WHERE follower_id = ?`;
        db.query(sql, [followerId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(result)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/events',(req, res) => {
// Router.get('/user/:user_id/event', checkAuth, checkUser, (req, res) => {
//     // let userId = req.body.user_id;
//     let userId = req.params.user_id;
//
//     let sql = `SELECT DISTINCT event_reservation.user_id, event.id AS event_id, event.title AS event_title, event.image, event.description, business.name AS business_name, business.id AS business_id
//                     FROM event_reservation
//                     JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
//                     JOIN event ON event_ticket.event_id = event.id
//                     JOIN business ON business.id = event.business_id
//                     WHERE user_id = ?`;
//     db.query(sql, [userId], (err, result) => {
//         if(err) {
//             console.log(err);
//             console.log(err);
//         }
//         // //console.log(result)
//         res.json(result);
//     });
// });

// Router.post('/events/count',(req, res) => {
Router.get('/:user_id/event/count', checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;
        //console.log(userId);

        let sql = `SELECT COUNT(*) FROM 
                (SELECT DISTINCT event_reservation.user_id, event.id AS event_id, event.title AS event_title, event.image, event.description
                    FROM event_reservation
                    JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
                    JOIN event ON event_ticket.event_id = event.id
                    WHERE user_id = ?) AS sub;`;
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            //console.log(result)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/booking", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        const sql = `SELECT booking.id AS booking_id, 
        
    prestazione.id AS prestazione_id, prestazione.duration AS prestazione_duration,
    prestazione.title AS prestazione_title, prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
    prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max,
    prestazione.is_price_range AS prestazione_is_price_range,
            
    prestazione.description AS prestazione_description, prestazione.business_id AS prestazione_business_id, 
    prestazione.is_valid AS prestazione_is_valid,
    booking.created_at, booking.begin_at, booking.note, booking.is_canceled, booking.is_shared,

    category.id AS category_id, category.name AS category_name, category.image AS category_image,

    business.max_contemporary_appointments, business.category_id AS business_category_id, business.longitude AS business_longitude,
    business.latitude AS business_latitude, business.profile_image AS business_profile_image, business.description AS business_description,
    business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id

                 FROM booking
                 JOIN prestazione ON prestazione.id = booking.prestazione_id
                 JOIN business ON business.id = prestazione.business_id
                 JOIN category ON category.id = business.category_id
                 WHERE user_id = ?
                 ORDER BY booking.created_at DESC`;

        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // console.log('result5998');
            // console.log(result);

            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/booking/business/:business_id", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let businessId = req.body.business_id;
        let userId = req.params.user_id;
        let businessId = req.params.business_id;

        const sql = `SELECT booking.id AS booking_id, prestazione.id AS prestazione_id, prestazione.duration AS prestazione_duration, 
    prestazione.title AS prestazione_title, prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
    prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
    prestazione.is_price_range AS prestazione_is_price_range,  
    prestazione.description AS prestazione_description, prestazione.business_id AS prestazione_business_id, 
    prestazione.is_valid AS prestazione_is_valid,
    
    booking.created_at, booking.begin_at, booking.note, booking.is_canceled, booking.is_shared,
    
    category.id AS category_id, category.name AS category_name, category.image AS category_image,
    
    business.max_contemporary_appointments, business.category_id AS business_category_id, business.longitude AS business_longitude,
    business.latitude AS business_latitude, business.profile_image AS business_profile_image, business.description AS business_description,
    business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id
    
                 FROM booking
                     JOIN prestazione ON prestazione.id = booking.prestazione_id
                     JOIN business ON business.id = prestazione.business_id
                     JOIN category ON category.id = business.category_id
                 WHERE user_id = ? AND prestazione.business_id = ?
                 ORDER BY booking.created_at DESC`;
        db.query(sql, [userId, businessId], (err, result) => {
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

Router.get("/:user_id/business/post/like/user", (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let postId = req.params.post_id;
        let likeUserId = req.params.user_id;
        let postUserId = req.query.user_id;

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
                WHERE business_post_like.user_id = ? AND business_post.user_id = ? 
                    AND business.is_visible = 1 AND user.is_deleted = 0
                ORDER BY business_post_like.created_at DESC`;
        db.query(sql, [likeUserId, postUserId], (err, result) => {
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

Router.get("/:user_id/booking/shared", /*checkUserAuth,*/ /*checkUser,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;
        console.log('userId');
        console.log(userId);

        const sql = `SELECT DISTINCT booking.id AS booking_id, booking.is_canceled,
                
                    max_contemporary_appointments, business.profile_image AS business_profile_image, 
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, 
                    business.type_id AS business_type_id, 
                    business.description AS business_description, business.email AS business_email,
                    
                    business_room.id AS business_room_id,

                    prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                    prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                    prestazione.is_valid AS prestazione_is_valid,
                    prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                    prestazione.created_at AS prestazione_created_at, booking.is_canceled AS booking_is_canceled, 
                    prestazione.image AS prestazione_image, prestazione.id AS prestazione_id, booking.note AS booking_note,
                    prestazione.title AS prestazione_title,

                    category.id AS category_id, category.name AS category_name, category.image AS category_image,

                    user.profile_image AS user_profile_image, user.email AS user_email, user.username,
                    user.phone AS user_phone, user.name AS user_name, user.description AS user_description

                 FROM booking
                     JOIN prestazione ON prestazione.id = booking.prestazione_id
                     JOIN business ON business.id = prestazione.business_id
                     LEFT JOIN business_room ON business.id = business_room.business_id
                     JOIN category ON category.id = business.category_id
                     /*JOIN user ON user.id = booking.user_id*/
                     JOIN user_order ON user_order.id = booking.user_order_id
                     JOIN user ON user.id = user_order.user_id
                 WHERE user.id = ? AND booking.is_canceled = 0 AND booking.is_shared = 1
                 ORDER BY booking.created_at DESC`;
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // console.log('resultppp')
            // console.log(result)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/:user_id/booking", checkUserAuth, checkUser, async (req, res) => {
//     try {
//         let userId = req.body.user_id;
//         let businessId = req.body.business_id;
//         let prestazioneId = req.body.prestazione_id;
//         let prestazionePrice = req.body.prestazione_price;
//         let note = req.body.note;
//         let bookingBeginAt = req.body.begin_at;
//         var newDateBeginAt = new Date(bookingBeginAt);
//         let id = uuidv4();
//         var duration;
//         let array = [];
//         let dbBookings = [];
//
//         //TODO: SE LA DIFFERENZA TRA BEGINAT E NOW (O IL VALORE CHE GLI INVIAMO DA CLIENT)
//         //è MAGGIORE DI 24 ORE RETURN RES.JSON
//         var nowDate = Date.now();
//
//         // var timeDifference = Math.abs(newDateBeginAt.getTime() - nowDate.getTime());
//         // //console.log(timeDifference);
//         //
//         // var differentInHours = Math.ceil(timeDifference / (1000 * 3600));
//         // //console.log(differentInHours);
//
//         const diffInMs = Math.abs(newDateBeginAt - nowDate);
//         let differentInHours1 = diffInMs / (1000 * 60 * 60);
//         // //console.log('differentInHours1');
//         // //console.log(differentInHours1);
//
//         if (differentInHours1 <= 24)
//             return res.status(419).send("Prenotare un appuntamento con almeno 24 ore di anticipo")
//         // return res.json("Prenotare un appuntamento con almeno 24 ore di anticipo")
//
//         const sql0 = `SELECT *
//                      FROM prestazione
//                      WHERE id = ?`;
//         await db.promise().query(sql0, [prestazioneId]).then(async (result, err) => {
//             if (err) {
//                 console.log(err)
//                 return res.status(500).send(err);
//             }
//
//             console.log('uallaaaua')
//             console.log(result[0])
//             console.log(result[0][0].id)
//             // // res.json(result);
//             // //console.log('result')
//             // //console.log(result)
//             // //console.log('result[0].duration')
//             // //console.log(result[0].duration)
//             // // duration = result[0].duration;
//             // //console.log('bookingBeginAt')
//             // //console.log(bookingBeginAt)
//
//             // //console.log('Date.parse(bookingBeginAt)')
//             // //console.log(Date.parse(bookingBeginAt)/*.getMinutes()*/)
//
//             // var newDateBeginAt = new Date(bookingBeginAt);
//             var newDateEndAt = new Date(newDateBeginAt);
//             // booking = Date.parse(bookingBeginAt);
//             // //console.log(bookingEndAt.getDate());
//             // //console.log(bookingEndAt.getMinutes());
//
//             newDateEndAt.setUTCMinutes(newDateBeginAt.getMinutes() + result[0][0].duration);
//             // //console.log('bookingEndAt');
//             // //console.log(bookingEndAt);
//             // //console.log('newDateBeginAt');
//             // //console.log(newDateBeginAt);
//
//             // SELECT *
//             // FROM occupied_booking
//             // WHERE DAY("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = DAY(occupied_from) AND
//             // WHERE MONTH("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = MONTH(occupied_from) AND
//             // WHERE YEAR("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = YEAR(occupied_from)
//             // ORDER BY created_at DESC
//             const sql1 = `SELECT *
//                  FROM occupied_booking
//                  WHERE business_id = ?
//                  ORDER BY occupied_from ASC`;
//             await db.promise().query(sql1, [businessId]).then(async (result, err) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//                 // res.json(result);
//                 // console.log('occupied_booking')
//                 // console.log(result)
//                 // //console.log(result[0].occupied_from)
//
//                 var c = 0;
//                 //console.log(c);
//                 //console.log(result.length)
//                 for (var i = 0; i < result[0].length - 1; i++) {
//                     // if((newDateBeginAt < result[i].occupied_until && bookingEndAt > result[i+1].occupied_from) ||
//                     //     (newDateBeginAt === result[i].occupied_from && bookingEndAt > result[i+1].occupied_from)
//                     /*|| (newDateBeginAt > result[i].occupied_from && bookingEndAt < result[i].occupied_until)
//                     || newDateBeginAt < result[0].occupied_from || bookingEndAt > result[result.length-1].occupied_until*/
//                     // ){
//                     // console.log('newDateBeginAt');
//                     // console.log(newDateBeginAt);
//                     // console.log('newDateEndAt');
//                     // console.log(newDateEndAt);
//                     var occupiedFrom = new Date(result[0][i].occupied_from);
//                     var occupiedUntil = new Date(result[0][i].occupied_until);
//                     console.log('occupiedFrom')
//                     console.log(occupiedFrom)
//                     console.log('occupiedUntil')
//                     console.log(occupiedUntil)
//                     // console.log('\n')
//                     if ((occupiedUntil.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedUntil.getTime()) ||
//                         (occupiedFrom.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedFrom.getTime()) ||
//                         /*(occupiedUntil.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === occupiedFrom.getTime()) ||*/
//                         (occupiedFrom.getTime() === newDateBeginAt.getTime()) || (occupiedUntil.getTime() === newDateEndAt.getTime())) {
//                         c++
//                     }
//                     // if(newDateBeginAt.toString() === result[i].occupied_from.toString()) {
//                     //     c++;
//                     // }
//                 }
//                 console.log('c');
//                 console.log(c);
//
//                 if (c >= 1) {
//                     return res.status(419).send("Lo slot è già occupato")
//                     // res.json("Lo slot è già occupato");
//                 } else if (c === 0) {
//                     const sql2 = `SELECT *
//                              FROM business
//                              JOIN prestazione ON prestazione.business_id = business.id
//                              WHERE prestazione.id = ?`;
//                     await db.promise().query(sql2, [prestazioneId]).then(async (result, err) => {
//                         if (err) {
//                             console.log(err)
//                             return res.status(500).send(err);
//                         }
//                         // res.json(result);
//                         // //console.log(result[0].business_id);
//
//                         var day;
//                         if (newDateBeginAt.getDay() === 0)
//                             day = 7;
//                         else
//                             day = newDateBeginAt.getDay();
//                         const sql3 = `SELECT *
//                                  FROM timetable
//                                  WHERE business_id = ?
//                                  AND weekday_id = ?`;
//                         await db.promise().query(sql3, [result[0][0].business_id, day]).then(async (result, err) => {
//                             if (err) {
//                                 console.log(err)
//                                 return res.status(500).send(err);
//                             }
//
//                             //console.log(result);
//                             var c1 = 0;
//                             for (var j = 0; j < result[0].length; j++) {
//                                 //console.log('rrrrr');
//                                 //creo il bookingtime di tutti i giorni e vedo se end booking è maggiore
//                                 var closeAt = new Date(newDateBeginAt);
//                                 var openAt = new Date(newDateBeginAt);
//                                 // booking = Date.parse(bookingBeginAt);
//                                 openAt.setUTCMinutes(result[0][j].open_at_minute)
//                                 openAt.setUTCHours(result[0][j].open_at_hour)
//                                 closeAt.setUTCMinutes(result[0][j].close_at_minute)
//                                 closeAt.setUTCHours(result[0][j].close_at_hour)
//                                 console.log('openAt');
//                                 console.log(openAt);
//                                 console.log('closeAt');
//                                 console.log(closeAt);
//                                 console.log('newDateBeginAt');
//                                 console.log(newDateBeginAt);
//                                 console.log('newDateEndAt');
//                                 console.log(newDateEndAt);
//                                 if ((closeAt < newDateEndAt && newDateBeginAt < closeAt) || (openAt < newDateEndAt && newDateBeginAt < openAt)
//                                     /*|| (newDateBeginAt > closeAt && newDateEndAt < openAt)*/ /*|| (newDateBeginAt > closeAt) || (newDateEndAt < openAt)*/
//                                     //todo: non va bene perchè apre due volte nello stesso giorno ed esce fuori da uno degli orari di apertura di quel giorno,
//                                     // comunque va bene questo controllo, ma va aggiunto il fatto che deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
//                                     /*|| (newDateBeginAt < openAt && newDateEndAt < openAt) || (newDateBeginAt > closeAt && newDateEndAt > closeAt)*/) {
//                                     c1++;
//                                     // break;
//                                 }
//                                 console.log('c1')
//                                 console.log(c1)
//                             }
//
//                             //todo: deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
//                             if (c1 >= 1) {
//                                 return res.status(419).send("L'appuntamento si incastra con gli orari di apertura e di chiusura o non è compreso tra gli orari di apertura e chiusura")
//                                 // res.json("L'appuntamento si incastra con gli orari di apertura e di chiusura");
//                             } else if (c1 === 0) {
//                                 // const sql12 = `SELECT *
//                                 //                FROM booking
//                                 //                  JOIN prestazione ON prestazione.id = booking.prestazione_id
//                                 //                  JOIN business ON business.id = prestazione.business_id
//                                 //                WHERE is_canceled = 0 AND booking.user_id = ?
//                                 //                ORDER BY booking.created_at DESC`;
//                                 const sql12 = `SELECT *
//                                            FROM booking
//                                              JOIN prestazione ON prestazione.id = booking.prestazione_id
//                                              JOIN business ON business.id = prestazione.business_id
//                                              JOIN user_order ON user_order.id = booking.user_order_id
//                                            WHERE is_canceled = 0 AND user_order.user_id = ?
//                                            ORDER BY booking.created_at DESC`;
//                                 await db.promise().query(sql12, [userId]).then(async (result, err) => {
//                                     if (err) {
//                                         console.log(err)
//                                         return res.status(500).send(err);
//                                     }
//
//                                     var c5 = 0;
//                                     for (var i = 0; i < result[0].length; i++) {
//                                         var tempDateBeginAt = new Date(result[0][i].begin_at);
//                                         // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)
//
//                                         var tempDateEndAt = new Date(result[0][i].begin_at);
//                                         tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + result[0][i].duration)
//
//                                         if ((tempDateEndAt.getDate() === newDateEndAt.getDate() && tempDateBeginAt.getDate() === newDateBeginAt.getDate()) &&
//                                             (tempDateEndAt.getMonth() === newDateEndAt.getMonth() && tempDateBeginAt.getMonth() === newDateBeginAt.getMonth()) &&
//                                             (tempDateEndAt.getFullYear() === newDateEndAt.getFullYear() && tempDateBeginAt.getFullYear() === newDateBeginAt.getFullYear()) &&
//                                             result[0][i].prestazione_id === prestazioneId) {
//                                             c5++;
//                                             //console.log('tempDateBeginAt');
//                                             //console.log(tempDateBeginAt);
//                                             // break;
//                                         }
//                                     }
//                                     console.log('c5')
//                                     console.log(c5)
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
//                                     if (c5/*0*/ >= 1) {
//                                         // return res.status(419).send("L'appuntamento da inserire avviene nello stesso giorno di un altro appuntamento dello stesso utente")
//                                         return res.status(419).send("Non si possono effettuare più prestazioni uguali nello stesso giorno")
//                                         // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
//                                     } else /*if(c === 0)*/{
//                                         // //console.log('businessId')
//                                         // //console.log(businessId)
//                                         const sql4 = `SELECT max_contemporary_appointments
//                                                   FROM business
//                                                   WHERE id = ?`;
//                                         await db.promise().query(sql4, [businessId]).then(async (result, err) => {
//                                             if (err) {
//                                                 console.log(err)
//                                                 return res.status(500).send(err);
//                                             }
//
//                                             var maxContemporaryAppointments = result[0][0].max_contemporary_appointments;
//
//                                             //todo: perchè prendo tutti gli appuntamenti
//                                             // invece di prendere solo quelli di quel business?
//                                             const sql5 = `SELECT *
//                                                       FROM booking
//                                                            JOIN prestazione ON prestazione.id = booking.prestazione_id
//                                                            JOIN business ON business.id = prestazione.business_id
//                                                       WHERE is_canceled = 0 AND business.id = ?
//                                                       ORDER BY booking.created_at DESC`;
//                                             await db.promise().query(sql5, [businessId]).then(async (result, err) => {
//                                                 if (err) {
//                                                     console.log(err)
//                                                     return res.status(500).send(err);
//                                                 }
//                                                 // res.json(result);
//                                                 // //console.log(result);
//                                                 //console.log('ooooooo');
//
//                                                 dbBookings.push(...result[0]);
//                                                 console.log('dbBookings.length0');
//                                                 console.log(dbBookings.length);
//                                                 // console.log(dbBookings);
//
//                                                 const sql51 = `SELECT guest_booking.id AS booking_id, guest_booking.begin_at,
//                                                     guest_booking.created_at, guest_booking.is_canceled, guest_booking.name, guest_booking.phone,
//                                                     guest_booking.email, guest_booking.note,
//
//                                                     prestazione.duration, prestazione.title,
//                                                     prestazione.image, prestazione.price, prestazione.description,
//                                                     prestazione.id, prestazione.business_id
//
//                                                 FROM guest_booking
//                                                     JOIN prestazione ON prestazione_id = prestazione.id
//
//                                                 WHERE business_id = ? AND is_canceled = 0`;
//                                                 await db.promise().query(sql51, [businessId]).then(async (result, err) => {
//                                                     if (err) {
//                                                         console.log(err)
//                                                         return res.status(500).send(err);
//                                                     }
//
//                                                     dbBookings.push(...result[0]);
//                                                     console.log('dbBookings.length1');
//                                                     console.log(dbBookings.length);
//                                                     // console.log(dbBookings);
//
//                                                     let c2 = 0;
//                                                     for (let i = 0; i < dbBookings.length; i++) {
//                                                         let tempDateBeginAt = new Date(dbBookings[i].begin_at);
//                                                         // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)
//
//                                                         let tempDateEndAt = new Date(dbBookings[i].begin_at);
//                                                         tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + dbBookings[i].duration)
//
//                                                         console.log('tempDateBeginAt')
//                                                         console.log(tempDateBeginAt)
//                                                         console.log('tempDateEndAt')
//                                                         console.log(tempDateEndAt)
//
//                                                         // var eee = new Date(bookingBeginAt);
//
//                                                         // if((tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateEndAt.getTime()) ||
//                                                         //     (tempDateBeginAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
//                                                         //     (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
//                                                         //     (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())){
//                                                         if ((tempDateEndAt.getTime() < newDateEndAt.getTime() && tempDateEndAt.getTime() > newDateBeginAt.getTime()) ||
//                                                             (tempDateBeginAt.getTime() > newDateBeginAt.getTime() && tempDateBeginAt.getTime() < newDateEndAt.getTime()) ||
//                                                             (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
//                                                             (tempDateEndAt.getTime() > newDateEndAt.getTime() && newDateBeginAt.getTime() > tempDateBeginAt.getTime()) ||
//                                                             (tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
//                                                             (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())) {
//                                                             c2++;
//                                                             //console.log('tempDateBeginAt');
//                                                             //console.log(tempDateBeginAt);
//                                                             // break;
//                                                         }
//                                                     }
//                                                     console.log('c2')
//                                                     console.log(c2)
//
//                                                     // //console.log(result);
//
//                                                     // //console.log('result[0].max_contemporary_appointments');
//                                                     // //console.log(result[0].max_contemporary_appointments);
//                                                     //console.log('maxContemporaryAppointments');
//                                                     //console.log(maxContemporaryAppointments);
//                                                     // //console.log(result.max_contemporary_appointments);
//
//                                                     // if(c2 >= /*3*/result[0].max_contemporary_appointments){
//                                                     if (c2 >= /*3*/maxContemporaryAppointments) {
//                                                         return res.status(419).send("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotati")
//                                                         // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
//                                                     } else /*if(c === 0)*/{
//                                                         // let id = uuidv4();
//                                                         // //console.log('eeeeeeeeee')
//                                                         // //console.log(eee)
//                                                         // var rrr = new Date(bookingBeginAt);
//                                                         // //console.log('rrr')
//                                                         // //console.log(rrr)
//
//                                                         const sql6 = `INSERT INTO booking(id, prestazione_id, user_id, begin_at,
//                                                                                       user_order_id, note, created_at)
//                                                                   VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`;
//                                                         await db.promise().query(sql6, [id, prestazioneId, userId, bookingBeginAt, req.body.user_order_id, note]).then(async (result, err) => {
//                                                             if (err) {
//                                                                 console.log(err)
//                                                                 return res.status(500).send(err);
//                                                             }
//
//                                                             const sql7 = `SELECT *
//                                                                       FROM user
//                                                                       WHERE id = ?`;
//                                                             db.query(sql7, [userId], async (err, result0) => {
//                                                                 if (err) {
//                                                                     console.log(err)
//                                                                     return res.status(500).send(err);
//                                                                 }
//
//                                                                 const sql8 = `SELECT *
//                                                                           FROM business
//                                                                           WHERE id = ?`;
//                                                                 db.query(sql8, [businessId], async (err, result1) => {
//                                                                     if (err) {
//                                                                         console.log(err)
//                                                                         return res.status(500).send(err);
//                                                                     }
//
//                                                                     const sql9 = `SELECT booking.id AS booking_id, booking.created_at AS booking_created_at, booking.begin_at,
//                                                                     booking.note, booking.is_canceled,
//                                                                     prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
//                                                                     prestazione.image AS prestazione_image, prestazione.price AS prestazione_price,
//                                                                     prestazione.description AS prestazione_description,
//                                                                     prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id
//
//                                                                             FROM booking
//                                                                             JOIN prestazione ON prestazione.id = booking.prestazione_id
//                                                                             WHERE booking.id = ?`;
//                                                                     db.query(sql9, [id], async (err, result2) => {
//                                                                         if (err) {
//                                                                             console.log(err)
//                                                                             return res.status(500).send(err);
//                                                                         }
//
//                                                                         console.log('result2')
//                                                                         console.log(result2)
//                                                                         console.log('result1')
//                                                                         console.log(result1)
//                                                                         console.log('result0')
//                                                                         console.log(result0)
//
//                                                                         // const rooms = await socket.ioObject.of('/').adapter.allRooms();
//                                                                         var rooms = await socket.ioObject.of('/').adapter.allRooms();
//                                                                         console.log(`socket.ioObject.of('/').adapter.allRooms()`);
//                                                                         console.log(rooms);
//
//                                                                         var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
//                                                                         console.log(`socket.ioObject.of('/').adapter.sockets`);
//                                                                         console.log(sockets);
//
//                                                                         var sids = await socket.ioObject.of('/').adapter.sids;
//                                                                         console.log(`socket.ioObject.of('/').adapter.sids`);
//                                                                         console.log(sids);
//
//                                                                         var rooms1 = await socket.ioObject.of('/').adapter.rooms;
//                                                                         console.log(`socket.ioObject.of('/').adapter.rooms`);
//                                                                         console.log(rooms1);
//
//                                                                         //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
//                                                                         // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
//                                                                         if (!rooms.has(req.body.business_id)) {
//                                                                             let notification_id = uuidv4();
//                                                                             let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
//                                                                         VALUES (?, 0, ?, ?, ?, /*NOW*/UTC_TIMESTAMP())`;
//                                                                             await db.promise().query(sql1, [notification_id, businessId, userId, id]).then((result, err) => {
//                                                                                 if (err) {
//                                                                                     console.log(err);
//                                                                                     return res.status(500).send(err);
//                                                                                 }
//                                                                                 //console.log('result');
//                                                                                 //console.log(result);
//                                                                                 // res.end(result);
//                                                                                 // res.result;
//                                                                                 //     res.json(id);
//                                                                                 //     res.json(result);
//                                                                             });
//                                                                         } else {
//                                                                             console.log('req.body.begin_at')
//                                                                             console.log(req.body.begin_at)
//                                                                             // socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
//                                                                             socket.ioObject./*sockets.in(req.body.business_id)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
//                                                                                 'update_booking_business_appointments',
//                                                                                 // "iiiiiiiiiii",
//                                                                                 // {
//                                                                                 //     "booking_id": id,
//                                                                                 //     "prestazione_id": req.body.prestazione_id,
//                                                                                 //     "note": req.body.note,
//                                                                                 //     "begin_at": req.body.begin_at,
//                                                                                 //     'prestazione_duration': req.body.prestazione_duration,
//                                                                                 //     'prestazione_image': req.body.prestazione_image,
//                                                                                 //     'prestazione_description': req.body.prestazione_description,
//                                                                                 //     'prestazione_title': req.body.prestazione_title,
//                                                                                 //     'prestazione_price': req.body.prestazione_price,
//                                                                                 //     'presale_price': req.body.presale_price,
//                                                                                 //     'user_id': req.body.user_id,
//                                                                                 //     'user_username': req.body.user_username,
//                                                                                 //     'user_name': req.body.user_name,
//                                                                                 //     'user_profile_image': req.body.user_profile_image,
//                                                                                 //     'user_phone_number': req.body.user_phone_number,
//                                                                                 //     'user_email': req.body.user_email,
//                                                                                 //     // 'price': req.body.prestazione_price,
//                                                                                 //     'business_id': req.body.business_id,
//                                                                                 //     'business_name': req.body.business_name,
//                                                                                 //     'business_type_id': req.body.business_type_id,
//                                                                                 //     'business_profile_image': req.body.profile_image,
//                                                                                 //     'business_description': req.body.description,
//                                                                                 //     'business_address': req.body.address,
//                                                                                 //     'business_phone_number': req.body.phone_number,
//                                                                                 //     'max_contemporary_appointments': req.body.max_contemporary_appointments,
//                                                                                 //     'is_canceled': 0,
//                                                                                 //     'created_at': new Date(Date.now()).toISOString(),
//                                                                                 // }
//                                                                                 {
//                                                                                     "keyname": "any value",
//                                                                                     "booking_id": id,
//                                                                                     "prestazione_id": `${req.body.prestazione_id}`,
//                                                                                     "note": req.body.note,
//                                                                                     "begin_at": req.body.begin_at,
//                                                                                     'prestazione_duration': req.body.prestazione_duration,
//                                                                                     "prestazione_image": `${result2[0].prestazione_image}`,
//                                                                                     'prestazione_description': result2[0].prestazione_description,
//                                                                                     'prestazione_title': result2[0].prestazione_title,
//                                                                                     'prestazione_price': result2[0].prestazione_price,
//                                                                                     // 'presale_price': req.body.presale_price,
//                                                                                     'user_id': req.body.user_id,
//                                                                                     'user_username': result0[0].username,
//                                                                                     'user_name': result0[0].name,
//                                                                                     "user_profile_image": `${result0[0].profile_image}`,
//                                                                                     'user_phone_number': result0[0].phone_number,
//                                                                                     'user_email': result0[0].email,
//                                                                                     // 'price': req.body.prestazione_price,
//                                                                                     'business_id': req.body.business_id,
//                                                                                     'business_name': req.body.business_name,
//                                                                                     'business_type_id': req.body.business_type_id,
//                                                                                     'business_profile_image': `${req.body.profile_image}`,
//                                                                                     'business_description': req.body.description,
//                                                                                     'business_address': req.body.address,
//                                                                                     'business_phone_number': req.body.phone_number,
//                                                                                     'max_contemporary_appointments': req.body.max_contemporary_appointments,
//                                                                                     'is_canceled': 0,
//                                                                                     'created_at': new Date(Date.now()).toISOString(),
//                                                                                 },
//                                                                             );
//                                                                         }
//
//                                                                         var bookingDate = new Date(result2[0].begin_at);
//                                                                         const offset = bookingDate.getTimezoneOffset();
//                                                                         var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getMinutes() /*- offset*/ + 120));
//                                                                         let localeBookingString = localBookingDate.toLocaleString(
//                                                                             'it-IT',
//                                                                             {
//                                                                                 year: 'numeric',
//                                                                                 month: '2-digit',
//                                                                                 day: '2-digit',
//                                                                                 weekday: "long",
//                                                                                 hour: '2-digit',
//                                                                                 hour12: false,
//                                                                                 minute: '2-digit',
//                                                                                 second: '2-digit'
//                                                                             }
//                                                                         );
//
//                                                                         console.log('bookingDate.toISOString()');
//                                                                         console.log(bookingDate.toISOString());
//                                                                         console.log('offset');
//                                                                         console.log(offset);
//                                                                         console.log('localBookingDate.toISOString()');
//                                                                         console.log(localBookingDate.toISOString());
//
//                                                                         // Step 1
//                                                                         let transporter = nodemailer.createTransport({
//                                                                             // service: 'gmail',
//                                                                             // service: 'iCloud',
//                                                                             // host: 'authsmtp.securemail.pro',
//                                                                             host: 'email-smtp.eu-central-1.amazonaws.com',
//                                                                             port: 465,
//                                                                             // port: 587,
//                                                                             secure: true, // true for 465, false for other ports
//                                                                             // secure: false,
//                                                                             auth: {
//                                                                                 // user: process.env.EMAIL_USER,
//                                                                                 user: process.env.AWS_SMTP_USER,
//                                                                                 // pass: process.env.EMAIL_PASSWORD
//                                                                                 pass: process.env.AWS_SMTP_PASSWORD
//                                                                             },
//                                                                             //TODO: da testare
//                                                                             tls: {
//                                                                                 rejectUnauthorized: false
//                                                                             }
//                                                                         });
//
//                                                                         if (result1[0].email_notification === 1) {
//                                                                             //email a business
//                                                                             let mailOptions = {
//                                                                                 // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
//                                                                                 from: `"${result0[0].name !== null && result0[0].name !== '' ? result0[0].name : result0[0].username}" support@nurebo.com`, // sender address
//                                                                                 to: result1[0].email,
//                                                                                 // to: "bar@example.com, baz@example.com", // list of receivers
//                                                                                 subject: `Prenotazione di ${req.body.prestazione_title} da ${/*req.body.user_name*/result0[0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                                                                 // subject: 'Hello ✔ Nodemailer - Test',
//                                                                                 // text: 'Wooohooo it works!!',
//                                                                                 html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${/*req.body.user_name*/result0[0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
//                                                                                <h1>Grazie.</h1>
//                                                                                <h1>A presto!</h1>`,
//                                                                             };
//
//                                                                             // Step 3
//                                                                             await transporter.sendMail(mailOptions, (err, data) => {
//                                                                                 if (err) {
//                                                                                     console.log('Error occurs', err);
//                                                                                     return;
//                                                                                 }
//                                                                                 return;
//                                                                                 // console.log(otp);
//                                                                                 // console.log('Email sent!!!');
//                                                                             });
//                                                                         }
//                                                                         if (result0[0].email_notification === 1) {
//                                                                             //email a user
//                                                                             let mailOptions1 = {
//                                                                                 // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
//                                                                                 from: `"${result1[0].name}" support@nurebo.com`, // sender address
//                                                                                 to: result0[0].email,
//                                                                                 // to: "bar@example.com, baz@example.com", // list of receivers
//                                                                                 subject: `Prenotazione di ${req.body.prestazione_title} da ${req.body.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                                                                 // subject: 'Hello ✔ Nodemailer - Test',
//                                                                                 // text: 'Wooohooo it works!!',
//                                                                                 html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${req.body.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
//                                                                                <h1>Grazie.</h1>
//                                                                                <h1>A presto!</h1>`,
//                                                                             };
//
//                                                                             // Step 3
//                                                                             await transporter.sendMail(mailOptions1, (err, data) => {
//                                                                                 if (err) {
//                                                                                     console.log('Error occurs', err);
//                                                                                     return;
//                                                                                 }
//                                                                                 return;
//                                                                                 // console.log(otp);
//                                                                                 // console.log('Email sent!!!');
//                                                                             });
//                                                                         }
//
//                                                                         const sql15 = `SELECT fcm_token
//                                                                                      FROM business_device
//                                                                                      WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND business_id = ?
//                                                                                      ORDER BY RAND()
//                                                                                      LIMIT 1000`;
//                                                                         db.query(sql15, [businessId], async (err, result6) => {
//                                                                             if (err) {
//                                                                                 console.log(err)
//                                                                                 return res.status(500).send(err);
//                                                                             }
//                                                                             console.log('result6');
//                                                                             console.log(result6);
//
//                                                                             for (let i = 0; i < result6.length; i++) {
//                                                                                 console.log(result6[i].fcm_token);
//                                                                                 // if(result[i].fcm_token !== null){
//                                                                                 array.push(result6[i].fcm_token);
//                                                                                 // }
//                                                                             }
//
//                                                                             // await axios({
//                                                                             //     method: 'POST',
//                                                                             //     url: 'https://fcm.googleapis.com/fcm/send',
//                                                                             //     headers: {
//                                                                             //         'Content-Type': 'application/json',
//                                                                             //         Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
//                                                                             //     },
//                                                                             //     data: {
//                                                                             //         // "to": "cDdRQ4IPR6qpRREaeV0KNp:APA91bFsj7Vreyql4ZGXWJqAYiXkJBlZr-TkyvL7OvGnz672VroVtTyElxIRNRdIyxU1ghHLtOJ5Q2QcXqbpT5MFbdkbgQawSInR6sEdYRM-NdvAKMHrhBTX0jNpSqQ5Vx-2PcVGteJ-",
//                                                                             //         "to": "cPD5QfLPQfSmNXtArooBQp:APA91bE5UePiJLxhCUdvLMrLHLI3jBcJFRWxX0OMAS4k5YptHkj3rCkCFIziAwOcvC9xIDmmNKM3ywqE0GWNMW_6022xR_vC1stS-TmkUQQXd-3I2GdY-7BzouyOyDNELKaX8zhE4C4C",
//                                                                             //         // "to": req.body.user_token,
//                                                                             //         "direct_boot_ok" : true,
//                                                                             //         "badge": 1,
//                                                                             //         "notification": {
//                                                                             //             "title": "Check this Mobile (title)",
//                                                                             //             "subtitle": "Norris (subtitle)",
//                                                                             //             "body": "Rich Notification testing (body)",
//                                                                             //             // "mutable_content": true,
//                                                                             //             "link": "https://www.google.com",
//                                                                             //             // "vibrate": "true",
//                                                                             //             "sound": "default",
//                                                                             //             "image": "https://kadingira-s3.s3.eu-central-1.amazonaws.com/image/prestazione/0e3c9167-1d17-40f4-a2a5-edeaa341e1a2.jpg",
//                                                                             //             "click_action": "MAIN_ACTIVITY",
//                                                                             //             // "click_action": "MAIN",
//                                                                             //             // "click_action": "LAUNCHER",
//                                                                             //             // "requireInteraction": "true",
//                                                                             //             // "ttl": 2
//                                                                             //         },
//                                                                             //         "android": {
//                                                                             //             "ttl": 3,
//                                                                             //             "sound": "default",
//                                                                             //             "subtitle": "Android specific",
//                                                                             //             "vibrate": true,
//                                                                             //             "link": "https://www.google.com",
//                                                                             //             "priority": "high",
//                                                                             //             "notification": {
//                                                                             //                 "image": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
//                                                                             //             }
//                                                                             //         },
//                                                                             //         "apns":{
//                                                                             //             "headers": {
//                                                                             //                 "apns-priority": "5",
//                                                                             //                 "apns-expiration":"1604750400"
//                                                                             //             },
//                                                                             //             "payload":{
//                                                                             //                 "aps":{
//                                                                             //                     "mutable-content": 1
//                                                                             //                 }
//                                                                             //             },
//                                                                             //             "fcm_options": {
//                                                                             //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
//                                                                             //             }
//                                                                             //         },
//                                                                             //         "webpush":{
//                                                                             //             "headers":{
//                                                                             //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
//                                                                             //                 "TTL":"86400",
//                                                                             //                 "Urgency": "high"
//                                                                             //             }
//                                                                             //         },
//                                                                             //         "data": {
//                                                                             //             "url": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
//                                                                             //             "dl": "<deeplink action on tap of notification>"
//                                                                             //         }
//                                                                             //     }
//                                                                             // }).then(function (response) {
//                                                                             //     console.log(response.status);
//                                                                             //     console.log(response.data);
//                                                                             //     console.log(response.data.success);
//                                                                             //     // res.status(200).send(response.data);
//                                                                             // }).catch(function (error) {
//                                                                             //     console.log(error);
//                                                                             //     // res.status(500).send(error);
//                                                                             // });
//                                                                             await axios({
//                                                                                 method: 'POST',
//                                                                                 url: 'https://fcm.googleapis.com/fcm/send',
//                                                                                 headers: {
//                                                                                     'Content-Type': 'application/json',
//                                                                                     Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
//                                                                                 },
//                                                                                 data: {
//                                                                                     "notification": {
//                                                                                         "title": `${req.body.prestazione_title}`,
//                                                                                         "subtitle": /*`${}`*/"Prenotazione",
//                                                                                         "body": `Prenotazione da ${/*req.body.user_name*/req.body.user_name !== null && req.body.user_name !== '' ? req.body.user_name : req.body.user_username} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
//                                                                                         // "channel_id": "fcm_nurebo_admin_channel",
//                                                                                         "android_channel_id": "fcm_nurebo_admin_channel",
//                                                                                         // "image": `${req.body.prestazione_image}`,
//                                                                                         "vibrate": true,
//                                                                                         "icon": "calendar"
//                                                                                     },
//                                                                                     "direct_boot_ok": true,
//                                                                                     "data": {
//                                                                                         "keyname": "any value",
//                                                                                         "booking_id": id,
//                                                                                         "prestazione_id": `${req.body.prestazione_id}`,
//                                                                                         "note": req.body.note,
//                                                                                         "begin_at": req.body.begin_at,
//                                                                                         'prestazione_duration': req.body.prestazione_duration,
//                                                                                         // "prestazione_image": `${result2[0].prestazione_image}`,
//                                                                                         "prestazione_image": `${req.body.prestazione_image}`,
//                                                                                         'prestazione_description': result2[0].prestazione_description,
//                                                                                         'prestazione_title': result2[0].prestazione_title,
//                                                                                         'prestazione_price': result2[0].prestazione_price,
//                                                                                         // 'presale_price': req.body.presale_price,
//                                                                                         'user_id': req.body.user_id,
//                                                                                         'user_username': result0[0].username,
//                                                                                         'user_name': result0[0].name,
//                                                                                         "user_profile_image": `${result0[0].profile_image}`,
//                                                                                         'user_phone_number': result0[0].phone_number,
//                                                                                         'user_email': result0[0].email,
//                                                                                         // 'price': req.body.prestazione_price,
//                                                                                         'business_id': req.body.business_id,
//                                                                                         'business_name': req.body.business_name,
//                                                                                         'business_type_id': req.body.business_type_id,
//                                                                                         'business_profile_image': `${req.body.profile_image}`,
//                                                                                         'business_description': req.body.description,
//                                                                                         'business_address': req.body.address,
//                                                                                         'business_phone_number': req.body.phone_number,
//                                                                                         'max_contemporary_appointments': req.body.max_contemporary_appointments,
//                                                                                         'is_canceled': 0,
//                                                                                         'created_at': new Date(Date.now()).toISOString(),
//                                                                                     },
//                                                                                     "android": {
//                                                                                         "notification": {
//                                                                                             "image": `${req.body.prestazione_image}`,
//                                                                                             "bodyLocKey": "STOCK_NOTIFICATION_BODY",
//                                                                                             "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
//                                                                                         },
//                                                                                         "direct_boot_ok": true
//                                                                                     },
//                                                                                     // "registration_ids": [`${result1[0].fcm_token}`, ],
//                                                                                     "registration_ids": array,
//                                                                                     // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
//                                                                                 }
//                                                                             }).then(function (response) {
//                                                                                 console.log(response.status);
//                                                                                 console.log(response.data);
//                                                                                 console.log(response.data.success);
//                                                                             }).catch(function (error) {
//                                                                                 console.log(error);
//                                                                             });
//
//                                                                         });
//
//                                                                     });
//                                                                 });
//                                                             });
//
//                                                             // res.json(result);
//                                                         });
//
//                                                         // res.json(result);
//                                                         res.json(id);
//                                                     }
//                                                 });
//                                             });
//                                         });
//                                     }
//                                 });
//                             }
//                         });
//                     });
//                 }
//             });
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("");
//     }
//     // await //console.log('duration')
//     // //console.log(duration)
// });

Router.post("/:user_id/authentication/:authentication_id/logout", checkUserAuth, checkUser, (req, res) => {
    try {
        let authId = req.body.auth_id;

        const sql = `UPDATE user_authentication SET is_logout = ?, logout_at = /*UTC_TIMESTAMP()*/?
                    WHERE id = ?`;
        db.query(sql, [1, new Date(Date.now()).toISOString(), authId], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            let rooms = await socket.ioObject.of('/').adapter.allRooms();
            console.log(rooms);

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

Router.post("/:user_id/authentication/send_email", /*registerLimiter,*/ (req, res) => {
    try {
        let businessId = req.body.business_id;
        let userId = req.params.user_id;
        let email = req.body.email;
        // let email = req.params.email;
        let ipAddress = req.body.ip_address;
        let postalCode = req.body.postal_code;
        let loginId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        var otp = makeid(6);

        //console.log("userId");
        //console.log(userId);
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

        let query = `INSERT INTO user_authentication (id, auth_type, user_id, business_id, sent_otp, sent_otp_at, postal_code, ip_address, is_success, is_logout) 
        VALUES (?, "EMAIL", ?, ?, ?, ?, ?, ?, 0, 0)`;
        db.query(query, [loginId, userId, businessId === '' ? null : businessId, otp, new Date(Date.now()).toISOString(), postalCode, ipAddress], (err, result) => {
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
                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                from: `"Nurebo" ${process.env.EMAIL_USER}`, // sender address
                to: email,
                // to: "bar@example.com, baz@example.com", // list of receivers
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

                res.json(loginId);

                // return;
                // console.log(otp);
                // console.log('Email sent!!!');
            });

            // res.json(loginId);
        });
        // res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:user_id/authentication/:authentication_id/verify", /*registerLimiter,*/ (req, res) => {
    try {
        let id = req.body.id;
        let insertedOtp = req.body.inserted_otp;
        let businessId = req.body.business_id;
        //console.log("req.body");
        //console.log(req.body);
        // console.log('tok.key')
        // console.log(tok.key)
        // console.log('JWT_key')
        // console.log(JWT_key)
        //
        // global.JWT_key = randomString(60);
        //
        // console.log('JWT_key')
        // console.log(JWT_key)
        // console.log('process.env.JWT_KEY')
        // console.log(process.env.JWT_KEY)

        const sql1 = `UPDATE user_authentication 
                      SET inserted_otp = ?, inserted_otp_at = ?
                      WHERE id = ?`;
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

        const quer = `SELECT sent_otp, sent_otp_at FROM user_authentication WHERE id = ?`;
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
            let success;
            if (insertedOtp === rows[0].sent_otp && now.getSeconds() - sent_otp_at.getSeconds() <= 300) {
                success = 1;
                // console.log('global.JWT_key');
                // console.log(global.JWT_key);
                const token = JWT.sign(
                    {id},
                    // "dioinfimo",
                    // JWT_key,
                    process.env.JWT_KEY,
                    // global.JWT_key,
                    // {expiresIn: 360000}
                );
                const sql2 = `UPDATE user_authentication 
                        SET is_success = ?, login_at = ?
                        WHERE id = ?`;
                db.query(sql2, [success, new Date(Date.now()).toISOString(), id], (err, rows) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                });
                res.json({
                    success,
                    token
                });
            }
            else {
                success = 0;
                const sql2 = `UPDATE user_authentication SET is_success = ? WHERE id = ?`;
                db.query(sql2, [success, id], (err, rows) => {
                    if (err) {
                        console.log(err);
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

Router.delete("/:user_id/booking/:booking_id", checkUserAuth, checkUser, (req, res) => {
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
        db.query(sql, [bookingId], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // console.log(result);

            const sql3 = `SELECT * FROM user WHERE id = ?`;
            db.query(sql3, [userId], async (err, result0) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }

                const sql4 = `SELECT * FROM business WHERE id = ?`;
                db.query(sql4, [businessId], async (err, result1) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    const sql5 = `SELECT booking.id AS booking_id, booking.created_at AS booking_created_at, booking.begin_at, 
                        booking.note, booking.is_canceled, booking.is_shared,
                        
                        prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
                        prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                        prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                        prestazione.is_price_range AS prestazione_is_price_range,  
                        prestazione.description AS prestazione_description, prestazione.is_valid AS prestazione_is_valid,
                        prestazione.id AS prestazione_id, prestazione.business_id AS prestazione_business_id
                        
                                FROM booking 
                                JOIN prestazione ON prestazione.id = booking.prestazione_id
                                WHERE booking.id = ?`;
                    db.query(sql5, [bookingId], async (err, result2) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }

                        console.log('result2')
                        console.log(result2)
                        console.log('result1')
                        console.log(result1)
                        console.log('result0')
                        console.log(result0)

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
                        if (!rooms.has(req.body.business_id)) {
                            let id = uuidv4();
                            let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
                            VALUES(?, '1', ?, ?, ?, /*UTC_TIMESTAMP()*/?)`;
                            db.query(sql1, [id, req.body.business_id, req.body.user_id, req.body.booking_id, (new Date()).toISOString()], (err, result) => {
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
                            socket.ioObject./*sockets.in(chatId)*/sockets.to(req.body.business_id)/*sockets.broadcast*/.emit(
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
                                    "prestazione_id": result2[0].prestazione_id,
                                    "note": result2[0].note,
                                    "begin_at": result2[0].begin_at,
                                    'prestazione_duration': result2[0].prestazione_duration,
                                    'prestazione_image': result2[0].prestazione_image,
                                    'prestazione_description': result2[0].prestazione_description,
                                    'prestazione_title': result2[0].prestazione_title,
                                    'prestazione_price': result2[0].prestazione_price,
                                    'presale_price': result2[0].presale_price,
                                    'user_id': req.body.user_id,
                                    'user_username': result0[0].username,
                                    'user_name': result0[0].name,
                                    'user_profile_image': `${result0[0].profile_image}`,
                                    'user_phone': result0[0].user_phone,
                                    'user_email': result0[0].email,
                                    // 'price': req.body.prestazione_price,
                                    'business_id': req.body.business_id,
                                    'business_name': result1[0].name,
                                    'business_type_id': result1[0].business_type_id,
                                    'business_profile_image': `${result1[0].profile_image}`,
                                    'business_description': result1[0].description,
                                    'business_address': result1[0].address,
                                    'business_phone': result1[0].phone,
                                    'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                                    'is_canceled': 1,
                                    'created_at': new Date(Date.now()).toISOString(),
                                }
                            );
                        }

                        var bookingDate = new Date(result2[0].begin_at);
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

                        if (result1[0].email_notification === 1) {
                            // Step 2
                            let mailOptions = {
                                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                from: `"${result0[0].name}" support@nurebo.com`, // sender address
                                to: result1[0].email,
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
                        if (result0[0].email_notification === 1) {
                            // Step 2
                            let mailOptions1 = {
                                // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                from: `"${result1[0].name}" support@nurebo.com`, // sender address
                                to: result0[0].email,
                                // to: "bar@example.com, baz@example.com", // list of receivers
                                subject: `Cancellazione prenotazione di ${req.body.prestazione_title} da ${result1[0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                // subject: 'Hello ✔ Nodemailer - Test',
                                // text: 'Wooohooo it works!!',
                                html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${result1[0].name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stato cancellata.</h1>
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
                                         FROM business_device
                                         WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND business_id = ?
                                         ORDER BY RAND()
                                         LIMIT 1000`;
                        db.query(sql, [businessId], async (err, result6) => {
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
                                            // "data": {
                                            //     "booking_id": req.body.booking_id,
                                            //     "prestazione_id": result2[0].prestazione_id,
                                            //     "note": result2[0].note,
                                            //     "begin_at": result2[0].begin_at,
                                            //     'prestazione_duration': result2[0].prestazione_duration/*.toString()*/,
                                            //     'prestazione_image': result2[0].prestazione_image,
                                            //     'prestazione_description': result2[0].prestazione_description,
                                            //     'prestazione_title': result2[0].prestazione_title,
                                            //     'prestazione_price': result2[0].prestazione_price/*.toString()*/,
                                            //     'presale_price': result2[0].presale_price/*.toString()*/,
                                            //     'user_id': req.body.user_id,
                                            //     'user_username': result0[0].username,
                                            //     'user_name': result0[0].name,
                                            //     'user_profile_image': `${result0[0].profile_image}`,
                                            //     'user_phone_number': result0[0].user_phone_number,
                                            //     'user_email': result0[0].email,
                                            //     // 'price': req.body.prestazione_price,
                                            //     'business_id': req.body.business_id,
                                            //     'business_name': result1[0].name,
                                            //     'business_type_id': result1[0].business_type_id,
                                            //     'business_profile_image': `${result1[0].profile_image}`,
                                            //     'business_description': result1[0].description,
                                            //     'business_address': result1[0].address,
                                            //     'business_phone_number': result1[0].phone_number,
                                            //     'max_contemporary_appointments': result1[0].max_contemporary_appointments/*.toString()*/,
                                            //     'is_canceled': '1',
                                            //     'created_at': new Date(Date.now()).toISOString(),
                                            // }.toString(),
                                            "notification": {
                                                "title": `${req.body.prestazione_title}`,
                                                "body": `Cancellazione da ${req.body.user_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
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

                                            }
                                        },
                                        "fcm_options": {
                                            // object (FcmOptions)
                                        },
                                        // token:"efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
                                        // "token":"dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
                                        // token:"cGicYG7eSD2s-CWTfp2F-m:APA91bGrb5WJAsjpSMg5sW31hIlx2TQbvYopDc4Zn8OgkhroZKHY9JgLelZl0AGiSHk83_PWsXKztV2lztsE9b8a84OXrl8iju1-kdVpd7cZ_ZLD_a_E-bzLdJ1MS6ZvblHW4boAi-Bw",
                                        token: result6[i].fcm_token,
                                        // "topic": 'string2g2gg2g2',
                                        // "condition": string
                                    },
                                };
                                firebase.getNureboAdminAccessToken().then(async function(accessToken) {
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
                                        if (error.response) {
                                            // La richiesta è stata fatta e il server ha risposto con uno status code
                                            // che cade fuori del range dei 2xx
                                            console.log('Response data:', error.response.data);
                                            console.log('Response status:', error.response.status);
                                            console.log('Response headers:', error.response.headers);
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
                            //         Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                            //     },
                            //     data: {
                            //         "notification": {
                            //             "title": `${req.body.prestazione_title}`,
                            //             "subtitle": /*`${}`*/"Cancellazione",
                            //             "body": `Cancellazione da ${req.body.user_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                            //             // "channel_id": "fcm_nurebo_admin_channel",
                            //             "android_channel_id": "fcm_nurebo_admin_channel",
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
                            //         "data": {
                            //             "booking_id": req.body.booking_id,
                            //             "prestazione_id": result2[0].prestazione_id,
                            //             "note": result2[0].note,
                            //             "begin_at": result2[0].begin_at,
                            //             'prestazione_duration': result2[0].prestazione_duration,
                            //             'prestazione_image': result2[0].prestazione_image,
                            //             'prestazione_description': result2[0].prestazione_description,
                            //             'prestazione_title': result2[0].prestazione_title,
                            //             'prestazione_price': result2[0].prestazione_price,
                            //             'presale_price': result2[0].presale_price,
                            //             'user_id': req.body.user_id,
                            //             'user_username': result0[0].username,
                            //             'user_name': result0[0].name,
                            //             'user_profile_image': `${result0[0].profile_image}`,
                            //             'user_phone_number': result0[0].user_phone_number,
                            //             'user_email': result0[0].email,
                            //             // 'price': req.body.prestazione_price,
                            //             'business_id': req.body.business_id,
                            //             'business_name': result1[0].name,
                            //             'business_type_id': result1[0].business_type_id,
                            //             'business_profile_image': `${result1[0].profile_image}`,
                            //             'business_description': result1[0].description,
                            //             'business_address': result1[0].address,
                            //             'business_phone_number': result1[0].phone_number,
                            //             'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                            //             'is_canceled': 1,
                            //             'created_at': new Date(Date.now()).toISOString(),
                            //         },
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

Router.get("/:user_id/post", /*checkDev,*/ (req, res) => {
    try {
        let userId = req.params.user_id;
        console.log(userId);

        const sql = `SELECT business_post.id AS post_id, business_post.description AS post_description,
                        business_post.image_url AS post_image_url, business_post.is_visible AS post_is_visible,
                        business_post.created_at AS post_created_at,

                        user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
                        user.phone AS user_phone, user.name AS user_name, user.description AS user_description,
                        
                        business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        /*business.email_notification AS business_email_notification,*/
                        business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                        business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,

                        category.id AS category_id, category.name AS category_name, category.image AS category_image,

                        prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title, 
                        prestazione.is_valid AS prestazione_is_valid,
                        prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
                        prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
                        prestazione.is_price_range AS prestazione_is_price_range,  prestazione.description AS prestazione_description,
                        prestazione.business_id, prestazione.id AS prestazione_id

                     FROM business_post
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id 
                        LEFT JOIN business ON business.id = prestazione.business_id
                        LEFT JOIN category ON business.category_id = category.id
                        LEFT JOIN user ON user.id = business_post.user_id
                     WHERE business_post.user_id = ? AND business_post.is_visible = 1 /*AND prestazione.business_id = ?*/
                     AND user.is_deleted = 0
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
        //                 prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  prestazione.description AS prestazione_description,
        //                 prestazione.business_id, prestazione.id AS prestazione_id
        //
        //              FROM booking_post
        //                 LEFT JOIN booking ON booking.id = booking_post.booking_id
        //                 LEFT JOIN user_order ON user_order.id = booking.user_order_id
        //                 LEFT JOIN user ON user.id = user_order.user_id
        //                 LEFT JOIN prestazione ON prestazione.id = booking.prestazione_id
        //                 LEFT JOIN business ON business.id = prestazione.business_id
        //                 LEFT JOIN category ON business.category_id = category.id
        //              WHERE user.id = ? AND booking_post.is_visible = ?
        //              ORDER BY post_created_at DESC`;
        db.query(sql, [userId, 1], (err, result) => {
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

Router.get("/:user_id/booking/post", checkUserAuth, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

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
                    FROM booking_post 
                    WHERE user_id = ? AND is_visible = ?
                    ORDER BY created_at DESC`;
        db.query(sql, [userId, 1], (err, result) => {
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

Router.post("/:user_id/booking/post", checkUserAuth, /*checkBusiness,*/ upload, (req, res, next) => {
    try {
        let userId = req.body.user_id;
        let bookingId = req.body.booking_id;
        let vote = req.body.vote;
        let imageUrl = req.body.image_url;
        let review = req.body.review;
        let id = uuidv4();

        // checkBusiness(req, res, next);
        const sql6 = `SELECT user_id FROM user_authentication WHERE id = ?`;
        db.query(sql6, [req.decoded.id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('checkUser')
            console.log(result[0].user_id)
            // console.log(result[0]['categoryId'])
            // res.send(result);

            if (result[0].user_id !== req.body.user_id) {
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

        const sql = `INSERT INTO booking_post(id, user_id, booking_id, review, vote)
             VALUES(?, ?, ?, ?, ?)`;
        db.query(sql, [id, userId, bookingId, review, vote], async (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            if (req.file === undefined) {
                // res.status(200).send(data)
                res.status(200).send(
                    JSON.stringify({
                        'id': id,
                        'image_url': '',
                        'user_id': userId,
                        'review': review,
                        'vote': parseFloat(vote),
                        'booking_id': bookingId,
                        'is_visible': 1
                    })
                );
            } else {
                const rekognitionParams = {
                    Image: {
                        // Bytes: req.file.buffer,
                        Bytes: Buffer.from(req.file.buffer),
                        // Bytes: resizedImage,
                    },
                    MinConfidence: 90, // Imposta la soglia di confidenza desiderata
                };

                let detectLabels = await rekognition.detectModerationLabels(rekognitionParams).promise();

                console.log(detectLabels)

                const moderationLabels = detectLabels.ModerationLabels;

                if (moderationLabels.length > 0) {
                    console.log('L\'immagine contiene contenuti pornografici.');
                    console.log('Etichette rilevate:', moderationLabels);
                    // return res.status(400).send('L\'immagine contiene contenuti pornografici.');
                } else {
                    console.log('L\'immagine è accettabile.');
                    // res.json({ message: 'L\'immagine è accettabile.' });
                    // Procedi con il salvataggio dell'immagine su S3
                }

                console.log(req.file)
                let myFile = req.file.originalname.split(".")
                const fileType = myFile[myFile.length - 1]

                // res.send({
                //     message: "Hello World!"
                // })

                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    // Key: `${uuid()}.${fileType}`,
                    Key: `images/booking_post/${id}/${uuidv4()}.${fileType}`,
                    Body: req.file.buffer
                }

                s3.upload(
                    params,
                    (error, data) => {
                        if (error || moderationLabels.length > 0) {
                            console.log(error)

                            const sql2 = `DELETE FROM booking_post WHERE id = ?`;
                            db.query(sql2, [id], (err, result) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).send(err);
                                }
                                // res.status(500);
                                if (error) {
                                    return res.status(500).send(error)
                                } else if (moderationLabels.length > 0) {
                                    return res.status(400).send('L\'immagine contiene contenuti sensibili.');
                                }
                            });

                            return res.status(500).send(error)
                        }
                        console.log(data);

                        const sql0 = `UPDATE booking_post SET image_url = ?
                                    WHERE id = ?`;
                        db.query(sql0, [data['Location'], id], (err, result0) => {
                            if (err) {
                                console.log(err)
                                return res.status(500).send(err);
                            }

                            // res.status(200).send(data)
                            res.status(200).send(
                                JSON.stringify({
                                    'id': id,
                                    'image_url': data['Location'],
                                    'user_id': userId,
                                    'review': review,
                                    'vote': parseFloat(vote),
                                    'booking_id': bookingId,
                                    'is_visible': 1
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

Router.get("/:user_id/follow/business/post", /*checkAuth,*/ (req, res) => {
    try {
        let userId = req.body.user_id;

        const sql = `SELECT booking_post.id
                 FROM booking_post_comment 
                    JOIN booking_post ON booking_post.id = booking_post_comment.booking_post_id 
                    JOIN user ON user.id = booking_post.user_id 
                    JOIN business_subscription ON business_subscription.business_id = business.id
                 WHERE business_subscription.user_id = ?
                 ORDER BY booking_post.created_at DESC`;
        db.query(sql, [userId], (err, result) => {
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

Router.get("/:user_id/event/like", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        let sql = `SELECT DISTINCT event_favorite.id AS id, event_favorite.created_at, event_favorite.user_id,
    
            event.title AS event_title,
            event.image AS event_image, event.description AS event_description,
            event.id AS event_id, event.created_at AS event_created_at,
            event.begin_at AS event_begin_at, event.end_at AS event_end_at,
            event.is_valid AS event_is_valid,
            
            category.id AS category_id, category.name AS category_name, category.image AS category_image,
            
            business.profile_image AS business_profile_image, business.description AS business_description, business.email AS business_email,
            /*business.email_notification AS business_email_notification,*/
            business.max_contemporary_appointments, business.category_id AS business_category_id, business.phone AS business_phone,
            business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id,
            business.longitude AS business_longitude, business.latitude AS business_latitude
    
                FROM event_favorite
                JOIN event ON event.id = event_favorite.event_id
                JOIN business ON business.id = event.business_id
                JOIN category ON business.category_id = category.id
                WHERE event_favorite.user_id = ? AND business.is_visible = 1
                ORDER BY event_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [userId], (err, result) => {
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

Router.get("/:user_id/event/:event_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let prestazioneId = req.body.event_id;
        let userId = req.params.user_id;
        let prestazioneId = req.params.event_id;

        let sql = `SELECT DISTINCT *
               FROM event_favorite
               /*JOIN prestazione ON prestazione.id = event_favorite.event_id*/
               WHERE event_favorite.user_id = ? AND event_favorite.event_id = ?
               ORDER BY event_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [userId, prestazioneId], (err, result) => {
            if (err) {
                console.log(err)
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

Router.get("/:user_id/reservation", /*checkUserAuth,*/ /*checkUser,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        const sql = `SELECT DISTINCT event.title AS event_title, 
                    event.id AS event_id, event.description AS event_description,
                    event.begin_at AS event_begin_at, event.end_at AS event_end_at, 
                    event.is_valid AS event_is_valid, event.image AS event_image,
                    event.created_at AS event_created_at, event.begin_at, event.end_at,
                
                    event_reservation.id, event_reservation.is_shared,
                    event_reservation.qr_code, event_reservation.created_at,
                    event_reservation.is_validated, event_reservation.is_canceled,
                    event_reservation.is_validated_at, 
                    
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
                    WHERE event_reservation.user_id = ? AND event_reservation.is_shared = 1
                    ORDER BY event_reservation.created_at DESC`;
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // console.log(result)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/reservation/event", (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        const sql = `SELECT DISTINCT event.id AS event_id, event.title AS event_title,
                        event.image, event.description,
                        event.begin_at, event.end_at, business.profile_image AS business_profile_image,
                        business.name AS business_name, business.id AS business_id, business.address AS business_address,
                        business.type_id AS business_type_id
                    FROM event_reservation
                        JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
                        JOIN event ON event_ticket.event_id = event.id
                        JOIN business ON business.id = event.business_id
                        JOIN user ON user.id = event_reservation.user_id
                    WHERE user_id = ?
                    ORDER BY event_reservation.created_at DESC`;
        db.query(sql, [userId], (err, result) => {
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

Router.get("/:user_id/booking/post/comment", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        const sql = `SELECT * 
                    FROM booking_post_comment
                    JOIN user ON user.id = booking_post_comment.user_id 
                    WHERE user_id = ? AND user.is_deleted = 0`;
        db.query(sql, [userId], (err, result) => {
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

// Router.get("/:user_id/business/:business_id/post/:post_id/comment", /*checkUserAuth, checkUser,*/ (req, res) => {
//     try {
//         // let userId = req.body.user_id;
//         let userId = req.params.user_id;
//         let postId = req.params.post_id;
//         let businessId = req.params.business_id;
//
//         // const sql = `SELECT booking_post_comment.id, booking_post_comment.booking_post_id,
//         //     booking_post_comment.text, booking_post_comment.is_visible, booking_post_comment.created_at,
//         //
//         //     booking_post.id AS post_id, booking_post.image_url,
//         //     booking_post.description AS post_description, booking_post.created_at AS post_created_at,
//         //
//         //     /*business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//         //     business.name AS business_name, business.id AS business_id, business.address AS business_address,
//         //     /*business.email_notification AS business_email_notification,*/
//         //     business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//         //     business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,*/
//         //
//         //     user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
//         //     user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description
//         //
//         //     FROM booking_post_comment
//         //         LEFT JOIN user ON user.id = booking_post_comment.user_id
//         //         LEFT JOIN booking_post ON booking_post.id = booking_post_comment.booking_post_id
//         //         /*JOIN business ON business.id = booking_post_comment.business_id*/
//         //     WHERE booking_post.id = ?
//         //     ORDER BY booking_post_comment.created_at DESC;`;
//         const sql = `SELECT business_post_comment.id, business_post_comment.created_at,
//             business_post_comment.text, business_post_comment.is_visible,
//
//             business_post.id AS post_id, business_post.post_image_url,
//             business_post.description AS post_description, business_post.created_at AS post_created_at,
//
//             business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
//             business.name AS business_name, business.id AS business_id, business.address AS business_address,
//             /*business.email_notification AS business_email_notification,*/
//             business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//             business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
//
//             user.profile_image AS user_profile_image, user.id AS user_id, user.email AS user_email, user.username AS user_username,
//             user.phone_number AS user_phone_number, user.name AS user_name, user.description AS user_description
//
//             FROM business_post_comment
//                 LEFT JOIN user ON user.id = business_post_comment.user_id
//                 LEFT JOIN business_post ON business_post.id = business_post_comment.business_post_id
//                 LEFT JOIN business ON business.id = prestazione.business_id
//             WHERE business_post.id = ?
//             ORDER BY business_post_comment.created_at DESC;`;
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

Router.post("/:user_id/business/:business_id/post/:post_id/comment", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let postId = req.params.post_id;
        let businessId = req.params.business_id;
        let text = req.body.text;
        //console.log(userId);
        //console.log(postId);
        let postCommentId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        //console.log(postCommentId);

        // let query = `INSERT INTO booking_post_comment(id, user_id, booking_post_id, text, created_at)
        //         VALUES(?, ?, ?, ?, ?)`;
        let query = `INSERT INTO business_post_comment(id, user_id, business_post_id, text, created_at) 
                VALUES(?, ?, ?, ?, ?)`;
        db.query(query, [postCommentId, userId, postId, text, new Date(Date.now()).toISOString()], (err, result) => {
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

Router.delete("/:user_id/business/:business_id/post/:post_id/comment/:comment_id", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let postId = req.params.post_id;
        let businessId = req.params.business_id;
        let commentId = req.params.comment_id;
        //console.log(userId);
        //console.log(postId);
        //console.log(postCommentId);

        let query = `DELETE FROM business_post_comment
                        WHERE id = ?`;
        db.query(query, [commentId], (err, result) => {
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

Router.get("/:user_id/booking/post/like", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        // let postId = req.body.post_id;
        //console.log(userId);
        // //console.log(postId);
        // SELECT *
        // FROM post_like
        // JOIN post ON post.id = post_like.post_id
        // WHERE post_like.user_id = ${userId}
        let sql = `SELECT DISTINCT booking_post.id AS post_id, booking_post.image_url AS post_image_url,
                               booking_post.description AS post_description, booking_post.created_at AS post_created_at, 
                
                    user.username, 
                    user.email, user.first_name, user.name AS user_name, user.profile_image AS user_profile_image, 
                    user.description AS user_description, user.id AS user_id, user.status, 
                    
                    business.profile_image AS business_profile_image,
                    business.name AS business_name, business.id AS business_id, business.indirizzo AS business_indirizzo,
                    business.is_date_business, business.max_contemporary_appointments

                FROM booking_post_like
                    JOIN booking_post ON booking_post.id = booking_post_like.booking_post_id
                    JOIN business_subscription ON booking_post.business_id = business_subscription.business_id
                    /*JOIN business ON booking_post.business_id = business.id
                    JOIN user ON business_subscription.user_id = user.id*/
                WHERE booking_post_like.user_id = ?
                ORDER BY booking_post.created_at DESC`;
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

Router.get("/:user_id/business/:business_id/post/like", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;
        let businessId = req.params.business_id;

        let sql = `SELECT  
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

                     FROM business_post_like
                        LEFT JOIN business_post ON business_post_like.business_post_id = business_post.id
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN user ON user.id = business_post_like.user_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON category.id = business.category_id
                    WHERE business_post.is_visible = 1 AND user.id = ? AND business.id = ? AND user.is_deleted = 0
                    ORDER BY business_post_like.created_at DESC`;
        db.query(sql, [userId, businessId], (err, result) => {
            if (err) {
                console.log(err);
                throw err;
            }
            // //console.log(result.length)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/business/post/user/like/comment", (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let postId = req.params.post_id;
        let userId = req.params.user_id;

        let sql = `SELECT DISTINCT 
                        bpl_user.created_at, 
                        
                        bpc_all.id AS business_post_comment_id, 
                        bpc_all.created_at AS business_post_comment_created_at, 
                        bpc_all.text AS business_post_comment_text, 
                        bpc_all.is_visible AS business_post_comment_is_visible, 
                        bpc_all.is_admin AS business_post_comment_is_admin,
                        
                        bp.id AS post_id, 
                        bp.image_url AS post_image_url, 
                        bp.description AS post_description, 
                        bp.created_at AS post_created_at,
                        
                        u.profile_image AS user_profile_image, 
                        u.id AS user_id, 
                        u.email AS user_email, 
                        u.username AS user_username,
                        u.phone AS user_phone, 
                        u.name AS user_name, 
                        u.description AS user_description,
                        
                        p.price AS prestazione_price, 
                        p.created_at AS prestazione_created_at,
                        p.duration AS prestazione_duration, 
                        p.description AS prestazione_description,
                        p.image AS prestazione_image, 
                        p.id AS prestazione_id, 
                        p.title AS prestazione_title,
                        p.is_valid AS prestazione_is_valid,
                        
                        c.id AS category_id, 
                        c.name AS category_name, 
                        c.image AS category_image,
                        
                        b.max_contemporary_appointments, 
                        b.category_id AS business_category_id, 
                        b.longitude AS business_longitude,
                        b.latitude AS business_latitude, 
                        b.profile_image AS business_profile_image, 
                        b.description AS business_description,
                        b.name AS business_name, 
                        b.id AS business_id, 
                        b.address AS business_address, 
                        b.type_id AS business_type_id
                    
                    FROM business_post_like bpl_user
                        INNER JOIN 
                            business_post bp ON bp.id = bpl_user.business_post_id
                        INNER JOIN 
                            business_post_comment bpc_all ON bpc_all.business_post_id = bp.id
                        LEFT JOIN 
                            prestazione p ON bp.prestazione_id = p.id
                        LEFT JOIN 
                            business b ON p.business_id = b.id
                        LEFT JOIN 
                            user u ON bpc_all.user_id = u.id
                        LEFT JOIN 
                            category c ON c.id = b.category_id
                    WHERE 
                        /*bpl_user.user_id = ? AND b.is_visible = 1 AND u.is_deleted = 0*/
                        (bpl_user.user_id = ? AND b.is_visible = 1 AND u.is_deleted = 0 AND bpc_all.is_admin = 0) OR
                        (bpl_user.user_id = ? AND b.is_visible = 1 AND bpc_all.is_admin = 1)
                    ORDER BY 
                        bpc_all.created_at DESC;`;
        db.query(sql, [userId, userId, userId,], (err, result) => {
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


Router.get("/:user_id/follow/business/post/is_visible", /*checkDev,*/ async (req, res) => {
    try {
        let userId = req.params.user_id;
        // let action = req.body.action;
        //console.log(req.body);

        const sql = `SELECT DISTINCT business_post.id AS post_id, 
                       business_post.description AS post_description,
                       business_post.image_url AS post_image_url, 
                       business_post.is_visible AS post_is_visible,
                       business_post.created_at AS post_created_at,
                
                       user.profile_image AS user_profile_image, 
                       user.id AS user_id, 
                       user.email AS user_email, 
                       user.username AS user_username, 
                       user.phone AS user_phone, 
                       user.name AS user_name, 
                       user.description AS user_description,
                
                       business.max_contemporary_appointments, 
                       business.email AS business_email, 
                       business.profile_image AS business_profile_image,
                       business.name AS business_name, 
                       business.id AS business_id, 
                       business.address AS business_address,
                       business.phone AS business_phone, 
                       business.category_id, 
                       business.longitude AS business_longitude,
                       business.latitude AS business_latitude, 
                       business.description AS business_description, 
                       business.type_id AS business_type_id,
                
                       category.id AS category_id, 
                       category.name AS category_name, 
                       category.image AS category_image,
                
                       prestazione.duration AS prestazione_duration, 
                       prestazione.title AS prestazione_title,
                       prestazione.image AS prestazione_image, 
                       prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                       prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                       prestazione.description AS prestazione_description,
                       prestazione.business_id, 
                       prestazione.is_valid AS prestazione_is_valid,
                       prestazione.id AS prestazione_id
       
                    FROM business_post
                        JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN business_favorite ON business.id = business_favorite.business_id
                        JOIN user ON user.id = business_favorite.user_id
                        JOIN category ON business.category_id = category.id
                    WHERE business_post.is_visible = 1 AND user.is_deleted = 0 AND business.is_visible = 1 
                        AND business_favorite.user_id = ?
                    ORDER BY post_created_at DESC;`;
        await db.promise().query(sql, [userId, ]).then(async (result, err) => {
            //console.log(rows);
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            // console.log('result88899g9gg6');
            // console.log(result[0]);

            res.json(result[0]);
        })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/friend/business/post/is_visible", /*checkDev,*/ async (req, res) => {
    try {
        let userId = req.params.user_id;
        // let action = req.body.action;
        //console.log(req.body);

        const sql = `SELECT DISTINCT 
                        business_post.id AS post_id, 
                        business_post.description AS post_description,
                        business_post.image_url AS post_image_url, 
                        business_post.is_visible AS post_is_visible,
                        business_post.created_at AS post_created_at,
                    
                        user.profile_image AS user_profile_image, 
                        user.id AS user_id, 
                        user.email AS user_email, 
                        user.username AS user_username, 
                        user.phone AS user_phone, 
                        user.name AS user_name, 
                        user.description AS user_description,
                    
                        business.max_contemporary_appointments, 
                        business.email AS business_email, 
                        business.profile_image AS business_profile_image,
                        business.name AS business_name, 
                        business.id AS business_id, 
                        business.address AS business_address,
                        business.phone AS business_phone, 
                        business.category_id, 
                        business.longitude AS business_longitude,
                        business.latitude AS business_latitude, 
                        business.description AS business_description, 
                        business.type_id AS business_type_id,
                    
                        category.id AS category_id, 
                        category.name AS category_name, 
                        category.image AS category_image,
                    
                        prestazione.duration AS prestazione_duration, 
                        prestazione.title AS prestazione_title,
                        prestazione.image AS prestazione_image, 
                        prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                        prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                        prestazione.description AS prestazione_description,
                        prestazione.business_id, 
                        prestazione.is_valid AS prestazione_is_valid,
                        prestazione.id AS prestazione_id
                    
                    FROM business_post
                        JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON business.category_id = category.id
                        JOIN user ON user.id = business_post.user_id
                        LEFT JOIN user_friendship uf1 ON business_post.user_id = uf1.user_id AND uf1.recipient_id = ? AND uf1.status = 1
                        LEFT JOIN user_friendship uf2 ON business_post.user_id = uf2.recipient_id AND uf2.user_id = ? AND uf2.status = 1
                    WHERE business_post.is_visible = 1 AND user.is_deleted = 0 AND business.is_visible = 1 
                        AND (uf1.user_id IS NOT NULL OR uf2.recipient_id IS NOT NULL)
                    ORDER BY post_created_at DESC;`;
        await db.promise().query(sql, [userId, userId, ]).then(async (result, err) => {
            //console.log(rows);
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            // console.log('result88899g9gg6');
            // console.log(result[0]);

            res.json(result[0]);
        })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/feed/business/post/is_visible", /*checkDev,*/ async (req, res) => {
    try {
        let userId = req.params.user_id;
        // let action = req.body.action;
        //console.log(req.body);

        const sql = `SELECT DISTINCT 
                        business_post.id AS post_id, 
                        business_post.description AS post_description,
                        business_post.image_url AS post_image_url, 
                        business_post.is_visible AS post_is_visible,
                        business_post.created_at AS post_created_at,
                    
                        user.profile_image AS user_profile_image, 
                        user.id AS user_id, 
                        user.email AS user_email, 
                        user.username AS user_username, 
                        user.phone AS user_phone, 
                        user.name AS user_name, 
                        user.description AS user_description,
                    
                        business.max_contemporary_appointments, 
                        business.email AS business_email, 
                        business.profile_image AS business_profile_image,
                        business.name AS business_name, 
                        business.id AS business_id, 
                        business.address AS business_address,
                        business.phone AS business_phone, 
                        business.category_id, 
                        business.longitude AS business_longitude,
                        business.latitude AS business_latitude, 
                        business.description AS business_description, 
                        business.type_id AS business_type_id,
                    
                        category.id AS category_id, 
                        category.name AS category_name, 
                        category.image AS category_image,
                    
                        prestazione.duration AS prestazione_duration, 
                        prestazione.title AS prestazione_title,
                        prestazione.image AS prestazione_image, 
                        prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, 
                        prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                        prestazione.description AS prestazione_description,
                        prestazione.business_id, 
                        prestazione.is_valid AS prestazione_is_valid,
                        prestazione.id AS prestazione_id
                    
                    FROM business_post
                        JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON business.category_id = category.id
                        JOIN user ON user.id = business_post.user_id
                        LEFT JOIN business_favorite ON business.id = business_favorite.business_id AND business_favorite.user_id = ?
                        LEFT JOIN user_friendship uf1 ON business_post.user_id = uf1.user_id AND uf1.recipient_id = ? AND uf1.status = 1
                        LEFT JOIN user_friendship uf2 ON business_post.user_id = uf2.recipient_id AND uf2.user_id = ? AND uf2.status = 1
                    WHERE business_post.is_visible = 1 
                        AND user.is_deleted = 0
                        AND business.is_visible = 1 
                        AND (business_favorite.user_id IS NOT NULL OR uf1.user_id IS NOT NULL OR uf2.recipient_id IS NOT NULL)
                    ORDER BY post_created_at DESC;`;
        await db.promise().query(sql, [userId, userId, userId, ]).then(async (result, err) => {
            //console.log(rows);
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            console.log('cff5f6ff6f55');
            // console.log(sql);
            // console.log(result);
            console.log(result[0]);

            res.json(result[0]);
        })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/business/post/user/like", (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let postId = req.params.post_id;
        let userId = req.params.user_id;

        let sql = `SELECT DISTINCT 
                        bpl_all.created_at, 
                        
                        bp.id AS post_id, 
                        bp.image_url AS post_image_url, 
                        bp.description AS post_description, 
                        bp.created_at AS post_created_at,
                        
                        u.profile_image AS user_profile_image, 
                        u.id AS user_id, 
                        u.email AS user_email, 
                        u.username AS user_username,
                        u.phone AS user_phone, 
                        u.name AS user_name, 
                        u.description AS user_description,
                        
                        p.price AS prestazione_price, 
                        p.created_at AS prestazione_created_at,
                        p.duration AS prestazione_duration, 
                        p.description AS prestazione_description,
                        p.image AS prestazione_image, 
                        p.id AS prestazione_id, 
                        p.is_valid AS prestazione_is_valid,
                        p.title AS prestazione_title,
                        
                        c.id AS category_id, 
                        c.name AS category_name, 
                        c.image AS category_image,
                        
                        b.max_contemporary_appointments, 
                        b.category_id AS business_category_id, 
                        b.longitude AS business_longitude,
                        b.latitude AS business_latitude, 
                        b.profile_image AS business_profile_image, 
                        b.description AS business_description,
                        b.name AS business_name, 
                        b.id AS business_id, 
                        b.address AS business_address, 
                        b.type_id AS business_type_id
                    
                    FROM business_post_like bpl_user
                        INNER JOIN 
                            business_post bp ON bp.id = bpl_user.business_post_id
                        INNER JOIN 
                            business_post_like bpl_all ON bpl_all.business_post_id = bp.id
                        LEFT JOIN 
                            prestazione p ON bp.prestazione_id = p.id
                        LEFT JOIN 
                            business b ON p.business_id = b.id
                        LEFT JOIN 
                            user u ON bpl_all.user_id = u.id
                        LEFT JOIN 
                            category c ON c.id = b.category_id
                    WHERE 
                        bpl_user.user_id = ? 
                        AND b.is_visible = 1 
                        AND u.is_deleted = 0
                    ORDER BY 
                        bpl_all.created_at DESC;`;
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

Router.get("/:user_id/business/post/like", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;
        // let businessId = req.params.business_id;

        let sql = `SELECT   business_post_like.created_at,
        
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

                     FROM business_post_like
                        LEFT JOIN business_post ON business_post_like.business_post_id = business_post.id
                        LEFT JOIN prestazione ON prestazione.id = business_post.prestazione_id
                        LEFT JOIN user ON user.id = business_post_like.user_id
                        JOIN business ON business.id = prestazione.business_id
                        JOIN category ON category.id = business.category_id
                    WHERE business_post.is_visible = 1 AND user.id = ? AND user.is_deleted = 0
                    ORDER BY business_post_like.created_at DESC`;
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.log(err);
                throw err;
            }
            // //console.log(result.length)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/notification/business", /*checkDev,*/ (req, res) => {
    try {
        // let action = req.body.action;
        // //console.log(req.body);

        const sql = "SELECT * FROM business_user_notification";
        db.query(sql, (err, rows) => {
            // //console.log(rows);
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

Router.get("/notification/:id", /*checkDev,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM business_user_notification WHERE id = ?`;
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

Router.delete("/:user_id/notification/business", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;

        const sql = `SELECT business_user_notification.id AS notification_id, business_user_notification.user_id, business_user_notification.type,
            business_user_notification.booking_id, business_user_notification.sent_at, business_user_notification.business_id,
            
            booking.id AS booking_id, booking.created_at, booking.begin_at, booking.note, booking.is_canceled, booking.is_shared,
            
            user_order.user_id,
            
            user.profile_image AS user_profile_image, user.email AS user_email, user.username, 
            user.phone AS user_phone, user.name AS user_name, user.description AS user_description,
            
            prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
            prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
            prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
            prestazione.is_price_range AS prestazione_is_price_range, prestazione.description AS prestazione_description,
            prestazione.business_id, prestazione.id AS prestazione_id, prestazione.is_valid AS prestazione_is_valid,
            
            business.profile_image AS business_profile_image, business.description AS business_description,
            business.max_contemporary_appointments, business.category_id AS business_category_id,
            business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id
    
                    FROM business_user_notification
                    JOIN booking ON business_user_notification.booking_id = booking.id
                    JOIN user ON user.id = business_user_notification.user_id
                    JOIN business ON business.id = business_user_notification.business_id
                    JOIN user_order ON user_order.id = booking.user_order_id
                    JOIN prestazione ON prestazione.id = booking.prestazione_id
                    WHERE business_user_notification.user_id = ?
                    ORDER BY business_user_notification.sent_at DESC`;
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                console.log('result.length from booking_notification')
                console.log(result.length)
                let sql = `DELETE FROM business_user_notification WHERE user_id = ?`;
                db.query(sql, [userId], (err, result1) => {
                    if (err) {
                        console.log(err);
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

Router.get("/:user_id/prestazione/like", /*checkUserAuth, checkUser,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        let sql = `SELECT DISTINCT prestazione_favorite.id AS id, prestazione_favorite.created_at, prestazione_favorite.user_id,
    
            prestazione.duration AS prestazione_duration, prestazione.title AS prestazione_title,
            prestazione.image AS prestazione_image, prestazione.price AS prestazione_price, 
            prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, 
            prestazione.is_price_range AS prestazione_is_price_range,  prestazione.description AS prestazione_description,
            prestazione.id AS prestazione_id, prestazione.created_at AS prestazione_created_at, 
            prestazione.is_valid AS prestazione_is_valid,
            
            category.id AS category_id, category.name AS category_name, category.image AS category_image,
            
            business.profile_image AS business_profile_image, business.description AS business_description, business.email AS business_email,
            /*business.email_notification AS business_email_notification,*/
            business.max_contemporary_appointments, business.category_id AS business_category_id, business.phone AS business_phone,
            business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id,
            business.longitude AS business_longitude, business.latitude AS business_latitude
    
                FROM prestazione_favorite
                JOIN prestazione ON prestazione.id = prestazione_favorite.prestazione_id
                JOIN business ON business.id = prestazione.business_id
                JOIN category ON business.category_id = category.id
                WHERE prestazione_favorite.user_id = ? AND prestazione.is_valid = 1
                ORDER BY prestazione_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
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

Router.get("/:user_id/prestazione/:prestazione_id", checkUserAuth, checkUser, (req, res) => {
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

Router.post("/:user_id/save/business/:business_id", checkUserAuth, checkUserAuth, (req, res) => {
    try {
        let userId = req.body.user_id;
        let businessId = req.body.business_id;
        // let userId = req.params.user_id;
        // let businessId = req.params.business_id;
        let id = uuidv4();

        let sql1 = `SELECT *
                FROM business_favorite
                WHERE user_id = ? AND business_id = ?`;
        db.query(sql1, [userId, businessId], (err, result) => {
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
                let sql = `INSERT INTO business_favorite(id, user_id, business_id, created_at) 
                VALUES(?, ?, ?, UTC_TIMESTAMP())`;

                db.query(sql, [id, userId, businessId], (err, result) => {
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

Router.delete("/:user_id/save/business/:business_id", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let businessId = req.body.business_id;
        let userId = req.params.user_id;
        let businessId = req.params.business_id;

        let sql = `DELETE FROM business_favorite 
                WHERE user_id = ? AND business_id = ?`;
        db.query(sql, [userId, businessId], (err, result) => {
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

Router.get("/:user_id/business/save", /*checkUserAuth, checkUser,*/ (req, res) => {
    try {
        // let userId = req.body.user_id;
        let userId = req.params.user_id;

        let sql = `SELECT DISTINCT business_favorite.id AS id, business_favorite.created_at, business_favorite.user_id,
    
            category.id AS category_id, category.name AS category_name, category.image AS category_image,
            
            business_room.id AS business_room_id,
            
            business.profile_image AS business_profile_image, business.description AS business_description, business.email AS business_email,
            /*business.email_notification AS business_email_notification,*/
            business.max_contemporary_appointments, business.category_id AS business_category_id, business.phone AS business_phone,
            business.name AS business_name, business.id AS business_id, business.address AS business_address, business.type_id AS business_type_id,
            business.longitude AS business_longitude, business.latitude AS business_latitude, business.is_visible
    
                FROM business_favorite
                    JOIN business ON business.id = business_favorite.business_id
                    LEFT JOIN business_room ON business.id = business_room.business_id
                    JOIN category ON business.category_id = category.id
                WHERE business_favorite.user_id = ? AND business.is_visible = 1 AND category.is_valid = 1
                ORDER BY business_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
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

Router.get("/:user_id/save/business/:business_id", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.user_id;
        // let businessId = req.body.business_id;
        let userId = req.params.user_id;
        let businessId = req.params.business_id;


        // let postId = req.body.post_id;
        //console.log(userId);
        // //console.log(postId);
        // SELECT *
        // FROM post_like
        // JOIN post ON post.id = post_like.post_id
        // WHERE post_like.user_id = ${userId}
        let sql = `SELECT DISTINCT *
                FROM business_favorite
                /*JOIN prestazione ON prestazione.id = prestazione_favorite.prestazione_id*/
                WHERE business_favorite.user_id = ? AND business_favorite.business_id = ?
                ORDER BY business_favorite.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [userId, businessId], (err, result) => {
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

Router.get("/friend", /*checkDev,*/ (req, res) => {
    try {
        const sql = "SELECT * FROM user_friendship";
        db.query(sql, (err, rows) => {
            // //console.log(rows);
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

// Router.get("/:user_id/friend/request/:recipient_id", checkUserAuth, /*checkUser,*/ (req, res) => {
Router.get("/:user_id/friend/:recipient_id", checkUserAuth, /*checkUser,*/ (req, res) => {
    try {
        // let userId = req.query.recipient_id;
        let recipientId = req.params.recipient_id;
        // let applicantId = req.query.user_id;
        let userId = req.params.user_id;
        console.log(userId);
        console.log(recipientId);

        let sql1 = `SELECT *
                    FROM user_friendship
                    WHERE user_id = ? AND recipient_id = ?
                    ORDER BY created_at DESC
                    /*LIMIT 1*/;`;
        db.query(sql1, [userId, recipientId,], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log('result');
            console.log(result);
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});


Router.get("/:user_id/friend", /*checkUserAuth,*/ /*checkUser,*/ async (req, res) => {
    try {
        // let userId = req.query.recipient_id;
        // let recipientId = req.params.recipient_id;
        // let applicantId = req.query.user_id;
        let userId = req.params.user_id;
        console.log(userId);
        // console.log(recipientId);

        // let sql1 = `SELECT
        //                 uf.*,
        //                 recipient.id AS user_id,
        //                 recipient.username AS user_username,
        //                 recipient.phone_number AS user_phone_number,
        //                 recipient.email AS user_email,
        //                 recipient.name AS user_name,
        //                 recipient.profile_image AS user_profile_image,
        //                 recipient.description AS user_description
        //             FROM user_friendship uf
        //                 JOIN user AS recipient ON uf.recipient_id = recipient.id
        //             WHERE uf.user_id = ? AND uf.status = 1
        //
        //             UNION
        //
        //             SELECT
        //                 uf.*,
        //                 user.id AS user_id,
        //                 user.username AS user_username,
        //                 user.phone_number AS user_phone_number,
        //                 user.email AS user_email,
        //                 user.name AS user_name,
        //                 user.profile_image AS user_profile_image,
        //                 user.description AS user_description
        //             FROM user_friendship uf
        //                 JOIN user ON uf.user_id = user.id
        //             WHERE uf.recipient_id = ? AND uf.status = 1
        //             ORDER BY created_at DESC;`;
        let sql1 = `SELECT 
                        uf.*,
                        u.id AS user_id,
                        u.username AS user_username,
                        u.phone AS user_phone,
                        u.email AS user_email,
                        u.name AS user_name,
                        u.profile_image AS user_profile_image,
                        u.description AS user_description
                    FROM user_friendship uf
                    JOIN user u ON 
                        (uf.user_id = ? AND u.id = uf.recipient_id) OR
                        (uf.recipient_id = ? AND u.id = uf.user_id)
                    WHERE uf.status = 1
                    ORDER BY uf.created_at DESC;`;
        await db.promise().query(sql1, [userId, userId, ]).then(async (result, err) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            console.log('fd65gdg56gh6h65h65');
            console.log(result[0]);
            res.json(result[0]);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:user_id/friend/accept", checkUserAuth, checkUser, (req, res) => {
// Router.post("/:user_id/friend/request/:id/accept", checkUserAuth, checkUser, (req, res) => {
    try {
        // let recipientId = req.body.recipient_id;
        // let userId = req.body.user_id;
        let recipientId = req.params.user_id;
        let userId = req.query.user_id;

        const sql = `UPDATE user_friendship SET status = ?, created_at = ? WHERE user_id = ? AND recipient_id = ?`;
        db.query(sql, [1, new Date(Date.now()).toISOString(), userId, recipientId], (err, result) => {
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

Router.post("/:user_id/friend/decline", checkUserAuth, checkUser, (req, res) => {
// Router.post("/:user_id/friend/request/:id/decline", checkUserAuth, checkUser, (req, res) => {
    try {
        // let recipientId = req.body.recipient_id;
        // let userId = req.body.user_id;
        let recipientId = req.params.user_id;
        let userId = req.query.user_id;
        // console.log(req.body);

        // const sql = `UPDATE user_friendship SET status = ?, created_at = ? WHERE user_id = ? AND recipient_id = ?;`;
        let sql = `DELETE FROM user_friendship WHERE user_id = ? AND recipient_id = ?;`;
        // db.query(sql, [2, new Date(Date.now()).toISOString(), userId, recipientId], (err, result) => {
        db.query(sql, [userId, recipientId], (err, result) => {
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

// Router.post("/:user_id/friend/:recipient_id", checkUserAuth, checkUser, (req, res) => {
Router.post("/:user_id/friend/request", checkUserAuth, checkUser, (req, res) => {
    try {
        // let recipientId = req.body.user_id;
        let userId = req.params.user_id;
        let applicantImage = req.body.user_image;
        let applicantName = req.body.user_name;
        let applicantUsername = req.body.user_username;
        let recipientId = req.query.user_id;
        // let requestId = uuidv4();
        let array = []
        console.log('vhjghvghgv');
        console.log(userId);
        console.log(recipientId);

        let sql1 = `INSERT INTO user_friendship(user_id, recipient_id, status)
                VALUES(?, ?, ?)`;
        db.query(sql1, [userId, recipientId, 0], async (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            const sql = `SELECT fcm_token
                     FROM user_device
                     WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND user_id = ?
                     ORDER BY RAND()
                     LIMIT 1000`;
            db.query(sql, [recipientId], async (err, result6) => {
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
                                    "title": `Richiesta di amicizia`,
                                    "body": `${applicantName} vorrebbe diventare tuo amico!`,
                                    "channel_id": "fcm_nurebo_channel",
                                    // "icon": 'android12splash',
                                    "icon": 'splash',
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
                            token: result6/*[0]*/[i].fcm_token,
                            // "topic": 'string2g2gg2g2',
                            // "condition": string
                        },
                    };
                    firebase.getNureboAccessToken().then(async function (accessToken) {
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

                // await axios({
                //     method: 'POST',
                //     url: 'https://fcm.googleapis.com/fcm/send',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                //     },
                //     data: {
                //         "notification": {
                //             "title": `Richiesta di amicizia`,
                //             // "subtitle": /*`${}`*/"Richiesta di amicizia",
                //             "body": `${applicantName} vorrebbe diventare tuo amico!`,
                //             // "channel_id": "fcm_nurebo_channel",
                //             "android_channel_id": "fcm_nurebo_channel",
                //             // "image": `${req.body.prestazione_image}`,
                //             // "icon": "calendar",
                //             "icon": "splash",
                //             "vibrate": true
                //         },
                //         "direct_boot_ok": true,
                //         "data": {
                //             "keyname": "any value"
                //         },
                //         "android": {
                //             "notification": {
                //                 "image": applicantImage,
                //                 "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                //                 "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
                //             },
                //             "direct_boot_ok": true
                //         },
                //         // "registration_ids": [`${result1[0].fcm_token}`, ],
                //         "registration_ids": array,
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

            console.log('result');
            console.log(result);
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.delete("/:user_id/friend/:recipient_id", checkUserAuth, /*checkUser,*/ (req, res) => {
// Router.delete("/:user_id/friend/request/:id", checkUserAuth, checkUser, (req, res) => {
    try {
        let recipientId = req.params.recipient_id;
        let userId = req.params.user_id;
        console.log('gfb45ghdgh54gh54gh54')
        console.log(userId)
        console.log(recipientId)

        let sql = `DELETE FROM user_friendship 
                   WHERE (user_id = ? AND recipient_id = ?) OR (recipient_id = ? AND user_id = ?);`;
        // let sql = `DELETE FROM user_friendship WHERE id = ?`;
        db.query(sql, [userId, recipientId, userId, recipientId], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            console.log(result)
            if (result.affectedRows >= 1) {
                res.status(200).json(result.affectedRows);
            } else {
                res.status(412).send(result.info);
            }
            // res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/:user_id/notification/booking", checkUserAuth, checkUser, (req, res) => {
    try {
        // let name = req.body.name;
        let bookingId = req.body.booking_id;
        let receiverId = req.body.receiver_id;
        //console.log(email);
        //console.log(phone_number);
        var id;
        let userId = req.body.user_id;
        // let followerId = req.body.follower_id;
        // //console.log(userId);
        // //console.log(followerId);

        let sql1 = `SELECT *
                FROM user_follow
                WHERE user_id = ?
                ORDER BY created_at ASC`;

        db.query(sql1, [userId], (err, result) => {
            if (result.length > 0) {
                // console.log('result[0]')
                // console.log(result[0])
                // console.log('result[0].follower_id')
                // console.log(result[0].follower_id)

                for (var i = 0; i < result.length; i++) {
                    id = uuidv4();
                    let sql1 = `INSERT INTO booking_notification(id, sender_id, receiver_id, booking_id)
                            VALUES(?, ?, ?, ?)`;
                    db.query(sql1, [id, userId, result[i].follower_id, bookingId], (err, result) => {
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
            }
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/:user_id/event", checkUserAuth, checkUser, (req, res) => {
    try {
        // let userId = req.body.id;
        let userId = req.params.user_id;

        const sql = `SELECT DISTINCT business.profile_image AS business_profile_image,
            business.name AS business_name, business.id AS business_id, business.address AS business_address,
            business.phone AS business_phone,
            
                event.title AS event_title, event.id AS event_id, event.description AS event_description,
            event.begin_at AS event_begin_at, event.end_at AS event_end_at, 
            event.is_valid AS event_is_valid, event.image AS event_image
                FROM event_reservation
                JOIN event_ticket ON event_reservation.event_ticket_id = event_ticket.id
                JOIN event ON event_ticket.event_id = event.id
                JOIN business ON event.business_id = business.id
                WHERE user_id = ? /*AND is_visible = 1*/
                ORDER BY event_reservation.created_at DESC`;
        db.query(sql, [userId], (err, result) => {
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

/*async function fetchData(req) {
    await axios({
        // method: 'POST',
        method: 'GET',
        // url: `http://localhost:5000/user/${userId}/booking`,
        // url: `http://192.168.1.10:5000/business/post`,
        url: `http://localhost:5000/business/post`,
        // headers: {
        //     'Content-Type': 'application/json',
        // },
        headers: req.headers,
        // data: {
        // }
        // data: item
    }).then(function (response) {
        console.log('response.status');
        console.log(response.status);
        console.log('response.data');
        console.log(response.data);
        console.log('response.data.success');
        console.log(response.data.success);
        // return res.status(200).send('response')
        // return res.status(200).send(response.data)

        // array.push(req.body[i])
        // array.push(response.data)

        //     console.log('item54665665');
        //     console.log(item);
    }).catch(function (error) {
        console.log(error);
    });
}
Router.post('/:user_id/order', checkUserAuth, checkUser, async (req, res) => {
    try {
        let userId = req.body.user_id;
        let userSessionId = req.body.user_session_id;
        // let now = new Date(Date.now());

        // console.log('req.bodyfddffd56dd5g5');
        // console.log(req.body);
        // console.log(req.body.items[1]);
        let resStatus = [];

        let orderId = uuidv4();

        const sql = `INSERT INTO user_order (id, user_session_id, user_id) VALUES (?, ?, ?);`;

        // new Promise((resolve, reject) => {
        //     /!*await*!/ db/!*.promise()*!/.query(sql, [id, userId], /!*async*!/ (err, result) => {
        //         if (err) {
        //             console.log(err)
        //             reject(err);
        //             return res.status(500).send(err);
        //             // return res.status(500).end(err);
        //         }
        //         console.log(result)
        //
        //         // res.send(result);
        //         // res.status(200).json({
        //         //     id,
        //         //     'user_id': userId,
        //         //     // 'created_at': now.toISOString(),
        //         // });
        //
        //         res.status(200).send(
        //             JSON.stringify({
        //                 id,
        //                 'user_id': userId,
        //             })
        //         );
        //         resolve(result);
        //     });
        //     // db.query(sql, (err, result) => {
        //     //     if(err){
        //     //         reject(new Error());
        //     //     }
        //     //     else{
        //     //         resolve(result);
        //     //     }
        //     // });
        // });

        // (async () => {
        //     try {
        //         await db/!*.promise()*!/.query(sql, [id, userId], async (err, result) => {
        //             if (err) {
        //                 console.log(err)
        //                 return res.status(500).send(err);
        //                 // return res.status(500).end(err);
        //             }
        //             console.log(result)
        //
        //             // res.send(result);
        //             // res.status(200).json({
        //             //     id,
        //             //     'user_id': userId,
        //             //     // 'created_at': now.toISOString(),
        //             // });
        //         });
        //     } catch (e) {
        //         console.log(e)
        //     }
        // })().then((rows) => {
        //     console.log("Response: ", rows);
        //     res.status(200).json({
        //         id,
        //         'user_id': userId,
        //         // 'created_at': now.toISOString(),
        //     });
        // }).catch(error => {
        //     console.log(err)or;
        // });

        await db.promise().query(sql, [orderId, userSessionId, userId]).then(async (result, err) => {
            if (err) {
                console.log(err)
                // return res.status(500).end(err);
                return res.status(500).send(err);
            }
            // console.log(result)

            try {
                // for (let item in req.body.items) {
                for (let i = 0; i < req.body.items.length; i++) {
                    // await axios({
                    //     // method: 'POST',
                    //     method: 'GET',
                    //     // url: `http://localhost:5000/user/${userId}/booking`,
                    //     url: `http://192.168.1.10:5000/business/post`,
                    //     // headers: {
                    //     //     'Content-Type': 'application/json',
                    //     // },
                    //     headers: req.headers,
                    //     // data: {
                    //     // }
                    //     // data: item
                    // }).then(function (response) {
                    //     console.log('response.status');
                    //     console.log(response.status);
                    //     console.log('response.data');
                    //     console.log(response.data);
                    //     console.log('response.data.success');
                    //     console.log(response.data.success);
                    //     // return res.status(200).send('response')
                    //     // return res.status(200).send(response.data)
                    //
                    //     // array.push(req.body[i])
                    //     // array.push(response.data)
                    //
                    //     // if (req.body.items.hasOwnProperty(item)) {
                    //     //     console.log('item54665665');
                    //     //     console.log(item);
                    //     // }
                    // }).catch(function (error) {
                    //     console.log(error);
                    // });
                    fetchData(req);
                 //    let userId = req.body.items[i].user_id;
                 //    let businessId = req.body.items[i].business_id;
                 //    let prestazioneId = req.body.items[i].prestazione_id;
                 //    let prestazionePrice = req.body.items[i].prestazione_price;
                 //    let note = req.body.items[i].note;
                 //    let bookingBeginAt = req.body.items[i].begin_at;
                 //    let newDateBeginAt = new Date(bookingBeginAt);
                 //    let id = uuidv4();
                 //    var duration;
                 //    let array = [];
                 //    let dbBookings = [];
                 //
                 //    //TODO: SE LA DIFFERENZA TRA BEGINAT E NOW (O IL VALORE CHE GLI INVIAMO DA CLIENT)
                 //    //è MAGGIORE DI 24 ORE RETURN RES.JSON
                 //    var nowDate = Date.now();
                 //
                 //    // var timeDifference = Math.abs(newDateBeginAt.getTime() - nowDate.getTime());
                 //    // //console.log(timeDifference);
                 //    //
                 //    // var differentInHours = Math.ceil(timeDifference / (1000 * 3600));
                 //    // //console.log(differentInHours);
                 //
                 //    const diffInMs = Math.abs(newDateBeginAt - nowDate);
                 //    let differentInHours1 = diffInMs / (1000 * 60 * 60);
                 //    // //console.log('differentInHours1');
                 //    // //console.log(differentInHours1);
                 //
                 //    if (differentInHours1 <= 24) {
                 //        // return res.status(419).send("Prenotare un appuntamento con almeno 24 ore di anticipo")
                 //        // return res.json("Prenotare un appuntamento con almeno 24 ore di anticipo")
                 //        req.body.items[i].status = {
                 //            status_code: 419,
                 //            status_message: "Prenotare un appuntamento con almeno 24 ore di anticipo"
                 //        }
                 //        resStatus.push(
                 //            req.body.items[i]
                 //        );
                 //        continue
                 //    }
                 //    const sql0 = `SELECT *
                 //     FROM prestazione
                 //     WHERE id = ?`;
                 //    await db.promise().query(sql0, [prestazioneId]).then(async (result, err) => {
                 //        if (err) {
                 //            console.log(err)
                 //            // return res.status(500).send(err);
                 //            req.body.items[i].status = {
                 //                status_code: 500,
                 //                status_message: err
                 //            }
                 //            resStatus.push(
                 //                req.body.items[i]
                 //            );
                 //            continue;
                 //        }
                 //
                 //        console.log('uallaaaua')
                 //        console.log(result[0])
                 //        console.log(result[0][0].id)
                 //        // // res.json(result);
                 //        // //console.log('result')
                 //        // //console.log(result)
                 //        // //console.log('result[0].duration')
                 //        // //console.log(result[0].duration)
                 //        // // duration = result[0].duration;
                 //        // //console.log('bookingBeginAt')
                 //        // //console.log(bookingBeginAt)
                 //
                 //        // //console.log('Date.parse(bookingBeginAt)')
                 //        // //console.log(Date.parse(bookingBeginAt)/!*.getMinutes()*!/)
                 //
                 //        // var newDateBeginAt = new Date(bookingBeginAt);
                 //        var newDateEndAt = new Date(newDateBeginAt);
                 //        // booking = Date.parse(bookingBeginAt);
                 //        // //console.log(bookingEndAt.getDate());
                 //        // //console.log(bookingEndAt.getMinutes());
                 //
                 //        newDateEndAt.setUTCMinutes(newDateBeginAt.getMinutes() + result[0][0].duration);
                 //        // //console.log('bookingEndAt');
                 //        // //console.log(bookingEndAt);
                 //        // //console.log('newDateBeginAt');
                 //        // //console.log(newDateBeginAt);
                 //
                 //        // SELECT *
                 //        // FROM occupied_booking
                 //        // WHERE DAY("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = DAY(occupied_from) AND
                 //        // WHERE MONTH("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = MONTH(occupied_from) AND
                 //        // WHERE YEAR("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = YEAR(occupied_from)
                 //        // ORDER BY created_at DESC
                 //        const sql1 = `SELECT *
                 // FROM occupied_booking
                 // WHERE business_id = ?
                 // ORDER BY occupied_from ASC`;
                 //        await db.promise().query(sql1, [businessId]).then(async (result, err) => {
                 //            if (err) {
                 //                console.log(err)
                 //                // return res.status(500).send(err);
                 //                req.body.items[i].status = {
                 //                    status_code: 500,
                 //                    status_message: err
                 //                }
                 //                resStatus.push(
                 //                    req.body.items[i]
                 //                );
                 //                i++;
                 //            }
                 //            // res.json(result);
                 //            // console.log('occupied_booking')
                 //            // console.log(result)
                 //            // //console.log(result[0].occupied_from)
                 //
                 //            var c = 0;
                 //            //console.log(c);
                 //            //console.log(result.length)
                 //            for (var i = 0; i < result[0].length - 1; i++) {
                 //                // if((newDateBeginAt < result[i].occupied_until && bookingEndAt > result[i+1].occupied_from) ||
                 //                //     (newDateBeginAt === result[i].occupied_from && bookingEndAt > result[i+1].occupied_from)
                 //                /!*|| (newDateBeginAt > result[i].occupied_from && bookingEndAt < result[i].occupied_until)
                 //                || newDateBeginAt < result[0].occupied_from || bookingEndAt > result[result.length-1].occupied_until*!/
                 //                // ){
                 //                // console.log('newDateBeginAt');
                 //                // console.log(newDateBeginAt);
                 //                // console.log('newDateEndAt');
                 //                // console.log(newDateEndAt);
                 //                var occupiedFrom = new Date(result[0][i].occupied_from);
                 //                var occupiedUntil = new Date(result[0][i].occupied_until);
                 //                console.log('occupiedFrom')
                 //                console.log(occupiedFrom)
                 //                console.log('occupiedUntil')
                 //                console.log(occupiedUntil)
                 //                // console.log('\n')
                 //                if ((occupiedUntil.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedUntil.getTime()) ||
                 //                    (occupiedFrom.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedFrom.getTime()) ||
                 //                    /!*(occupiedUntil.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === occupiedFrom.getTime()) ||*!/
                 //                    (occupiedFrom.getTime() === newDateBeginAt.getTime()) || (occupiedUntil.getTime() === newDateEndAt.getTime())) {
                 //                    c++
                 //                }
                 //                // if(newDateBeginAt.toString() === result[i].occupied_from.toString()) {
                 //                //     c++;
                 //                // }
                 //            }
                 //            console.log('c');
                 //            console.log(c);
                 //
                 //            if (c >= 1) {
                 //                // return res.status(419).send("Lo slot è già occupato")
                 //                // res.json("Lo slot è già occupato");
                 //                req.body.items[i].status = {
                 //                    status_code: 419,
                 //                    status_message: "Lo slot è già occupato"
                 //                }
                 //                resStatus.push(
                 //                    req.body.items[i]
                 //                );
                 //                i++;
                 //            } else if (c === 0) {
                 //                const sql2 = `SELECT *
                 //             FROM business
                 //             JOIN prestazione ON prestazione.business_id = business.id
                 //             WHERE prestazione.id = ?`;
                 //                await db.promise().query(sql2, [prestazioneId]).then(async (result, err) => {
                 //                    if (err) {
                 //                        console.log(err)
                 //                        // return res.status(500).send(err);
                 //                        req.body.items[i].status = {
                 //                            status_code: 500,
                 //                            status_message: err
                 //                        }
                 //                        resStatus.push(
                 //                            req.body.items[i]
                 //                        );
                 //                        continue;
                 //                    }
                 //                    // res.json(result);
                 //                    // //console.log(result[0].business_id);
                 //
                 //                    var day;
                 //                    if (newDateBeginAt.getDay() === 0)
                 //                        day = 7;
                 //                    else
                 //                        day = newDateBeginAt.getDay();
                 //
                 //                    const sql3 = `SELECT *
                 //                     FROM timetable
                 //                     WHERE business_id = ? AND weekday_id = ?
                 //                     ORDER BY open_at_hour ASC`;
                 //                    await db.promise().query(sql3, [result[0][0].business_id, day]).then(async (result25, err) => {
                 //                        if (err) {
                 //                            console.log(err)
                 //                            // return res.status(500).send(err);
                 //                            req.body.items[i].status = {
                 //                                status_code: 500,
                 //                                status_message: err
                 //                            }
                 //                            resStatus.push(
                 //                                req.body.items[i]
                 //                            );
                 //                        }
                 //
                 //                        console.log('result25[0]');
                 //                        console.log(result25[0]);
                 //
                 //                        var c1 = 0;
                 //                        for (let j = 0; j < result25[0].length; j++) {
                 //                            //console.log('rrrrr');
                 //                            //creo il bookingtime di tutti i giorni e vedo se end booking è maggiore
                 //
                 //                            //todo: openAt e closeAt spesso sbagliati
                 //                            var closeAt = new Date(newDateBeginAt);
                 //                            var openAt = new Date(newDateBeginAt);
                 //                            console.log('openAt0');
                 //                            console.log(openAt);
                 //                            console.log('closeAt0');
                 //                            console.log(closeAt);
                 //
                 //                            console.log(result25[0][j].open_at_hour)
                 //                            console.log(result25[0][j].open_at_minute)
                 //                            console.log(result25[0][j].close_at_hour)
                 //                            console.log(result25[0][j].close_at_minute)
                 //
                 //                            // booking = Date.parse(bookingBeginAt);
                 //                            // openAt.setMinutes(result25[0][j].open_at_minute)
                 //                            // openAt.setHours(result25[0][j].open_at_hour)
                 //                            // closeAt.setMinutes(result25[0][j].close_at_minute)
                 //                            // closeAt.setHours(result25[0][j].close_at_hour)
                 //                            openAt.setUTCMinutes(result25[0][j].open_at_minute)
                 //                            openAt.setUTCHours(result25[0][j].open_at_hour)
                 //                            closeAt.setUTCMinutes(result25[0][j].close_at_minute)
                 //                            closeAt.setUTCHours(result25[0][j].close_at_hour)
                 //                            console.log('openAt1');
                 //                            console.log(openAt);
                 //                            console.log('closeAt1');
                 //                            console.log(closeAt);
                 //
                 //                            console.log('newDateBeginAt');
                 //                            console.log(newDateBeginAt);
                 //                            console.log('newDateEndAt');
                 //                            console.log(newDateEndAt);
                 //                            if ((closeAt < newDateEndAt && newDateBeginAt < closeAt) || (openAt < newDateEndAt && newDateBeginAt < openAt)
                 //                                /!*|| (newDateBeginAt > closeAt && newDateEndAt < openAt)*!/ /!*|| (newDateBeginAt > closeAt) || (newDateEndAt < openAt)*!/
                 //                                //todo: non va bene perchè apre due volte nello stesso giorno ed esce fuori da uno degli orari di apertura di quel giorno,
                 //                                // comunque va bene questo controllo, ma va aggiunto il fatto che deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
                 //                                /!*|| (newDateBeginAt < openAt && newDateEndAt < openAt) || (newDateBeginAt > closeAt && newDateEndAt > closeAt)*!/) {
                 //                                c1++;
                 //                                // break;
                 //                            }
                 //                            console.log('c1')
                 //                            console.log(c1)
                 //                        }
                 //
                 //                        //todo: deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
                 //                        if (c1 >= 1) {
                 //                            // return res.status(419).send("L'appuntamento si incastra con gli orari di apertura e di chiusura o non è compreso tra gli orari di apertura e chiusura")
                 //                            req.body.items[i].status = {
                 //                                status_code: 419,
                 //                                status_message: "L'appuntamento si incastra con gli orari di apertura e di chiusura o non è compreso tra gli orari di apertura e chiusura"
                 //                            }
                 //                            resStatus.push(
                 //                                req.body.items[i]
                 //                            );
                 //                            // res.json("L'appuntamento si incastra con gli orari di apertura e di chiusura");
                 //                        } else if (c1 === 0) {
                 //                            // const sql12 = `SELECT *
                 //                            //                FROM booking
                 //                            //                  JOIN prestazione ON prestazione.id = booking.prestazione_id
                 //                            //                  JOIN business ON business.id = prestazione.business_id
                 //                            //                WHERE is_canceled = 0 AND booking.user_id = ?
                 //                            //                ORDER BY booking.created_at DESC`;
                 //                            const sql12 = `SELECT *
                 //                           FROM booking
                 //                             JOIN prestazione ON prestazione.id = booking.prestazione_id
                 //                             JOIN business ON business.id = prestazione.business_id
                 //                             JOIN user_order ON user_order.id = booking.user_order_id
                 //                           WHERE is_canceled = 0 AND user_order.user_id = ?
                 //                           ORDER BY booking.created_at DESC`;
                 //                            await db.promise().query(sql12, [userId]).then(async (result, err) => {
                 //                                if (err) {
                 //                                    console.log(err)
                 //                                    // return res.status(500).send(err);
                 //                                    req.body.items[i].status = {
                 //                                        status_code: 500,
                 //                                        status_message: err
                 //                                    }
                 //                                    resStatus.push(
                 //                                        req.body.items[i]
                 //                                    );
                 //                                }
                 //
                 //                                var c5 = 0;
                 //                                for (var i = 0; i < result[0].length; i++) {
                 //                                    var tempDateBeginAt = new Date(result[0][i].begin_at);
                 //                                    // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)
                 //
                 //                                    var tempDateEndAt = new Date(result[0][i].begin_at);
                 //                                    tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + result[0][i].duration)
                 //
                 //                                    if ((tempDateEndAt.getDate() === newDateEndAt.getDate() && tempDateBeginAt.getDate() === newDateBeginAt.getDate()) &&
                 //                                        (tempDateEndAt.getMonth() === newDateEndAt.getMonth() && tempDateBeginAt.getMonth() === newDateBeginAt.getMonth()) &&
                 //                                        (tempDateEndAt.getFullYear() === newDateEndAt.getFullYear() && tempDateBeginAt.getFullYear() === newDateBeginAt.getFullYear()) &&
                 //                                        result[0][i].prestazione_id === prestazioneId) {
                 //                                        c5++;
                 //                                        //console.log('tempDateBeginAt');
                 //                                        //console.log(tempDateBeginAt);
                 //                                        // break;
                 //                                    }
                 //                                }
                 //                                console.log('c5')
                 //                                console.log(c5)
                 //
                 //                                // //console.log(result);
                 //
                 //                                // //console.log('result[0].max_contemporary_appointments');
                 //                                // //console.log(result[0].max_contemporary_appointments);
                 //                                //console.log('maxContemporaryAppointments');
                 //                                //console.log(maxContemporaryAppointments);
                 //                                // //console.log(result.max_contemporary_appointments);
                 //
                 //                                // if(c2 >= /!*3*!/result[0].max_contemporary_appointments){
                 //                                if (c5/!*0*!/ >= 1) {
                 //                                    // return res.status(419).send("L'appuntamento da inserire avviene nello stesso giorno di un altro appuntamento dello stesso utente")
                 //                                    // return res.status(419).send("Non si possono effettuare più prestazioni uguali nello stesso giorno")
                 //                                    req.body.items[i].status = {
                 //                                        status_code: 419,
                 //                                        status_message: "Non si possono effettuare più prestazioni uguali nello stesso giorno"
                 //                                    }
                 //                                    resStatus.push(
                 //                                        req.body.items[i]
                 //                                    );
                 //                                    // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
                 //                                } else /!*if(c === 0)*!/{
                 //                                    // //console.log('businessId')
                 //                                    // //console.log(businessId)
                 //                                    const sql4 = `SELECT max_contemporary_appointments
                 //                                  FROM business
                 //                                  WHERE id = ?`;
                 //                                    await db.promise().query(sql4, [businessId]).then(async (result, err) => {
                 //                                        if (err) {
                 //                                            console.log(err)
                 //                                            // return res.status(500).send(err);
                 //                                            req.body.items[i].status = {
                 //                                                status_code: 500,
                 //                                                status_message: err
                 //                                            }
                 //                                            resStatus.push(
                 //                                                req.body.items[i]
                 //                                            );
                 //                                        }
                 //
                 //                                        var maxContemporaryAppointments = result[0][0].max_contemporary_appointments;
                 //
                 //                                        //todo: perchè prendo tutti gli appuntamenti
                 //                                        // invece di prendere solo quelli di quel business?
                 //                                        const sql5 = `SELECT *
                 //                                      FROM booking
                 //                                           JOIN prestazione ON prestazione.id = booking.prestazione_id
                 //                                           JOIN business ON business.id = prestazione.business_id
                 //                                      WHERE is_canceled = 0 AND business.id = ?
                 //                                      ORDER BY booking.created_at DESC`;
                 //                                        await db.promise().query(sql5, [businessId]).then(async (result, err) => {
                 //                                            if (err) {
                 //                                                console.log(err)
                 //                                                // return res.status(500).send(err);
                 //                                                req.body.items[i].status = {
                 //                                                    status_code: 500,
                 //                                                    status_message: err
                 //                                                }
                 //                                                resStatus.push(
                 //                                                    req.body.items[i]
                 //                                                );
                 //                                            }
                 //                                            // res.json(result);
                 //                                            // //console.log(result);
                 //                                            //console.log('ooooooo');
                 //
                 //                                            dbBookings.push(...result[0]);
                 //                                            console.log('dbBookings.length0');
                 //                                            console.log(dbBookings.length);
                 //                                            // console.log(dbBookings);
                 //
                 //                                            const sql51 = `SELECT guest_booking.id AS booking_id, guest_booking.begin_at,
                 //                                    guest_booking.created_at, guest_booking.is_canceled, guest_booking.name, guest_booking.phone,
                 //                                    guest_booking.email, guest_booking.note,
                 //
                 //                                    prestazione.duration, prestazione.title,
                 //                                    prestazione.image, prestazione.price, prestazione.description,
                 //                                    prestazione.id, prestazione.business_id
                 //
                 //                                FROM guest_booking
                 //                                    JOIN prestazione ON prestazione_id = prestazione.id
                 //
                 //                                WHERE business_id = ? AND is_canceled = 0`;
                 //                                            await db.promise().query(sql51, [businessId]).then(async (result, err) => {
                 //                                                if (err) {
                 //                                                    console.log(err)
                 //                                                    // return res.status(500).send(err);
                 //                                                    req.body.items[i].status = {
                 //                                                        status_code: 500,
                 //                                                        status_message: err
                 //                                                    }
                 //                                                    resStatus.push(
                 //                                                        req.body.items[i]
                 //                                                    );
                 //                                                }
                 //
                 //                                                dbBookings.push(...result[0]);
                 //                                                console.log('dbBookings.length1');
                 //                                                console.log(dbBookings.length);
                 //                                                // console.log(dbBookings);
                 //
                 //                                                let c2 = 0;
                 //                                                for (let i = 0; i < dbBookings.length; i++) {
                 //                                                    let tempDateBeginAt = new Date(dbBookings[i].begin_at);
                 //                                                    // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)
                 //
                 //                                                    let tempDateEndAt = new Date(dbBookings[i].begin_at);
                 //                                                    tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + dbBookings[i].duration)
                 //
                 //                                                    // console.log('tempDateBeginAt')
                 //                                                    // console.log(tempDateBeginAt)
                 //                                                    // console.log('tempDateEndAt')
                 //                                                    // console.log(tempDateEndAt)
                 //
                 //                                                    // var eee = new Date(bookingBeginAt);
                 //
                 //                                                    // if((tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateEndAt.getTime()) ||
                 //                                                    //     (tempDateBeginAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
                 //                                                    //     (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
                 //                                                    //     (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())){
                 //                                                    if ((tempDateEndAt.getTime() < newDateEndAt.getTime() && tempDateEndAt.getTime() > newDateBeginAt.getTime()) ||
                 //                                                        (tempDateBeginAt.getTime() > newDateBeginAt.getTime() && tempDateBeginAt.getTime() < newDateEndAt.getTime()) ||
                 //                                                        (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
                 //                                                        (tempDateEndAt.getTime() > newDateEndAt.getTime() && newDateBeginAt.getTime() > tempDateBeginAt.getTime()) ||
                 //                                                        (tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
                 //                                                        (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())) {
                 //                                                        c2++;
                 //                                                        //console.log('tempDateBeginAt');
                 //                                                        //console.log(tempDateBeginAt);
                 //                                                        // break;
                 //                                                    }
                 //                                                }
                 //                                                console.log('c2')
                 //                                                console.log(c2)
                 //
                 //                                                // //console.log(result);
                 //
                 //                                                // //console.log('result[0].max_contemporary_appointments');
                 //                                                // //console.log(result[0].max_contemporary_appointments);
                 //                                                //console.log('maxContemporaryAppointments');
                 //                                                //console.log(maxContemporaryAppointments);
                 //                                                // //console.log(result.max_contemporary_appointments);
                 //
                 //                                                // if(c2 >= /!*3*!/result[0].max_contemporary_appointments){
                 //                                                if (c2 >= /!*3*!/maxContemporaryAppointments) {
                 //                                                    // return res.status(419).send("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotati")
                 //                                                    req.body.items[i].status = {
                 //                                                        status_code: 419,
                 //                                                        status_message: "L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotati"
                 //                                                    }
                 //                                                    resStatus.push(
                 //                                                        req.body.items[i]
                 //                                                    );
                 //                                                    // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
                 //                                                } else /!*if(c === 0)*!/{
                 //                                                    // let id = uuidv4();
                 //                                                    // //console.log('eeeeeeeeee')
                 //                                                    // //console.log(eee)
                 //                                                    // var rrr = new Date(bookingBeginAt);
                 //                                                    // //console.log('rrr')
                 //                                                    // //console.log(rrr)
                 //
                 //                                                    const sql6 = `INSERT INTO booking(id, prestazione_id, user_id, begin_at,
                 //                                                                      user_order_id, note, created_at)
                 //                                                  VALUES (?, ?, ?, ?, ?, ?, /!*UTC_TIMESTAMP()*!/"${new Date(Date.now()).toISOString()}")`;
                 //                                                    await db.promise().query(sql6, [id, prestazioneId, userId, bookingBeginAt, req.body.user_order_id, note]).then(async (result, err) => {
                 //                                                        if (err) {
                 //                                                            console.log(err)
                 //                                                            // return res.status(500).send(err);
                 //                                                            req.body.items[i].status = {
                 //                                                                status_code: 500,
                 //                                                                status_message: err
                 //                                                            }
                 //                                                            resStatus.push(
                 //                                                                req.body.items[i]
                 //                                                            );
                 //                                                        }
                 //
                 //                                                        // // const rooms = await socket.ioObject.of('/').adapter.allRooms();
                 //                                                        // var rooms = await socket.ioObject.of('/').adapter.allRooms();
                 //                                                        // console.log(`socket.ioObject.of('/').adapter.allRooms()`);
                 //                                                        // console.log(rooms);
                 //                                                        //
                 //                                                        // var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
                 //                                                        // console.log(`socket.ioObject.of('/').adapter.sockets`);
                 //                                                        // console.log(sockets);
                 //                                                        //
                 //                                                        // var sids = await socket.ioObject.of('/').adapter.sids;
                 //                                                        // console.log(`socket.ioObject.of('/').adapter.sids`);
                 //                                                        // console.log(sids);
                 //                                                        //
                 //                                                        // var rooms1 = await socket.ioObject.of('/').adapter.rooms;
                 //                                                        // console.log(`socket.ioObject.of('/').adapter.rooms`);
                 //                                                        // console.log(rooms1);
                 //                                                        //
                 //                                                        // //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
                 //                                                        // // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
                 //                                                        // if (!rooms.has(req.body.business_id)) {
                 //                                                        //     let notification_id = uuidv4();
                 //                                                        //     let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
                 //                                                        //                 VALUES (?, 0, ?, ?, ?, /!*NOW*!/UTC_TIMESTAMP())`;
                 //                                                        //     await db.promise().query(sql1, [notification_id, businessId, userId, id]).then((result, err) => {
                 //                                                        //         if (err) {
                 //                                                        //             console.log(err);
                 //                                                        //             return res.status(500).send(err);
                 //                                                        //         }
                 //                                                        //         //console.log('result');
                 //                                                        //         //console.log(result);
                 //                                                        //         // res.end(result);
                 //                                                        //         // res.result;
                 //                                                        //         //     res.json(id);
                 //                                                        //         //     res.json(result);
                 //                                                        //     });
                 //                                                        // }
                 //                                                        // else {
                 //                                                        //     console.log('req.body.begin_at')
                 //                                                        //     console.log(req.body.begin_at)
                 //                                                        //     // socket.ioObject./!*sockets.in(chatId)*!/sockets.to(req.body.business_id)/!*sockets.broadcast*!/.emit(
                 //                                                        //     socket.ioObject./!*sockets.in(req.body.business_id)*!/sockets.to(req.body.business_id)/!*sockets.broadcast*!/.emit(
                 //                                                        //         'update_booking_business_appointments',
                 //                                                        //         // "iiiiiiiiiii",
                 //                                                        //         {
                 //                                                        //             "booking_id": id,
                 //                                                        //             "prestazione_id": req.body.prestazione_id,
                 //                                                        //             "note": req.body.note,
                 //                                                        //             "begin_at": req.body.begin_at,
                 //                                                        //             'prestazione_duration': req.body.prestazione_duration,
                 //                                                        //             'prestazione_image': req.body.prestazione_image,
                 //                                                        //             'prestazione_description': req.body.prestazione_description,
                 //                                                        //             'prestazione_title': req.body.prestazione_title,
                 //                                                        //             'prestazione_price': req.body.prestazione_price,
                 //                                                        //             'presale_price': req.body.presale_price,
                 //                                                        //             'user_id': req.body.user_id,
                 //                                                        //             'user_username': req.body.user_username,
                 //                                                        //             'user_name': req.body.user_name,
                 //                                                        //             'user_profile_image': req.body.user_profile_image,
                 //                                                        //             'user_phone_number': req.body.user_phone_number,
                 //                                                        //             'user_email': req.body.user_email,
                 //                                                        //             // 'price': req.body.prestazione_price,
                 //                                                        //             'business_id': req.body.business_id,
                 //                                                        //             'business_name': req.body.business_name,
                 //                                                        //             'business_type_id': req.body.business_type_id,
                 //                                                        //             'business_profile_image': req.body.profile_image,
                 //                                                        //             'business_description': req.body.description,
                 //                                                        //             'business_address': req.body.address,
                 //                                                        //             'business_phone_number': req.body.phone_number,
                 //                                                        //             'max_contemporary_appointments': req.body.max_contemporary_appointments,
                 //                                                        //             'is_canceled': 0,
                 //                                                        //             'created_at': new Date(Date.now()).toISOString(),
                 //                                                        //         }
                 //                                                        //     );
                 //                                                        // }
                 //
                 //                                                        const sql7 = `SELECT *
                 //                                                      FROM user
                 //                                                      WHERE id = ?`;
                 //                                                        db.query(sql7, [userId], async (err, result0) => {
                 //                                                            if (err) {
                 //                                                                console.log(err)
                 //                                                                // return res.status(500).send(err);
                 //                                                                req.body.items[i].status = {
                 //                                                                    status_code: 500,
                 //                                                                    status_message: err
                 //                                                                }
                 //                                                                resStatus.push(
                 //                                                                    req.body.items[i]
                 //                                                                );
                 //                                                            }
                 //
                 //                                                            const sql8 = `SELECT *
                 //                                                          FROM business
                 //                                                          WHERE id = ?`;
                 //                                                            db.query(sql8, [businessId], async (err, result1) => {
                 //                                                                if (err) {
                 //                                                                    console.log(err)
                 //                                                                    // return res.status(500).send(err);
                 //                                                                    req.body.items[i].status = {
                 //                                                                        status_code: 500,
                 //                                                                        status_message: err
                 //                                                                    }
                 //                                                                    resStatus.push(
                 //                                                                        req.body.items[i]
                 //                                                                    );
                 //                                                                }
                 //
                 //                                                                const sql9 = `SELECT *
                 //                                                              FROM booking
                 //                                                              JOIN prestazione ON prestazione.id = booking.prestazione_id
                 //                                                              WHERE booking.id = ?`;
                 //                                                                db.query(sql9, [id], async (err, result2) => {
                 //                                                                    if (err) {
                 //                                                                        console.log(err)
                 //                                                                        // return res.status(500).send(err);
                 //                                                                        req.body.items[i].status = {
                 //                                                                            status_code: 500,
                 //                                                                            status_message: err
                 //                                                                        }
                 //                                                                        resStatus.push(
                 //                                                                            req.body.items[i]
                 //                                                                        );
                 //                                                                    }
                 //
                 //                                                                    // const rooms = await socket.ioObject.of('/').adapter.allRooms();
                 //                                                                    var rooms = await socket.ioObject.of('/').adapter.allRooms();
                 //                                                                    console.log(`socket.ioObject.of('/').adapter.allRooms()`);
                 //                                                                    console.log(rooms);
                 //
                 //                                                                    var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
                 //                                                                    console.log(`socket.ioObject.of('/').adapter.sockets`);
                 //                                                                    console.log(sockets);
                 //
                 //                                                                    var sids = await socket.ioObject.of('/').adapter.sids;
                 //                                                                    console.log(`socket.ioObject.of('/').adapter.sids`);
                 //                                                                    console.log(sids);
                 //
                 //                                                                    var rooms1 = await socket.ioObject.of('/').adapter.rooms;
                 //                                                                    console.log(`socket.ioObject.of('/').adapter.rooms`);
                 //                                                                    console.log(rooms1);
                 //
                 //                                                                    //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
                 //                                                                    // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
                 //                                                                    if (!rooms.has(req.body.business_id)) {
                 //                                                                        let notification_id = uuidv4();
                 //                                                                        let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
                 //                                                            VALUES (?, 0, ?, ?, ?, /!*NOW*!//!*UTC_TIMESTAMP()*!/?)`;
                 //                                                                        await db.promise().query(sql1, [notification_id, businessId, userId, id, (new Date()).toISOString()]).then((result, err) => {
                 //                                                                            if (err) {
                 //                                                                                console.log(err);
                 //                                                                                // return res.status(500).send(err);
                 //                                                                                req.body.items[i].status = {
                 //                                                                                    status_code: 500,
                 //                                                                                    status_message: err
                 //                                                                                }
                 //                                                                                resStatus.push(
                 //                                                                                    req.body.items[i]
                 //                                                                                );
                 //                                                                            }
                 //                                                                            //console.log('result');
                 //                                                                            //console.log(result);
                 //                                                                            // res.end(result);
                 //                                                                            // res.result;
                 //                                                                            //     res.json(id);
                 //                                                                            //     res.json(result);
                 //                                                                        });
                 //                                                                    } else {
                 //                                                                        console.log('req.body')
                 //                                                                        console.log(req.body)
                 //                                                                        // socket.ioObject./!*sockets.in(chatId)*!/sockets.to(req.body.business_id)/!*sockets.broadcast*!/.emit(
                 //                                                                        socket.ioObject./!*sockets.in(req.body.business_id)*!/sockets.to(req.body.business_id)/!*sockets.broadcast*!/.emit(
                 //                                                                            'update_booking_business_appointments',
                 //                                                                            // "iiiiiiiiiii",
                 //                                                                            {
                 //                                                                                "booking_id": id,
                 //                                                                                "prestazione_id": req.body.prestazione_id,
                 //                                                                                "note": req.body.note,
                 //                                                                                "begin_at": req.body.begin_at,
                 //                                                                                'prestazione_duration': req.body.prestazione_duration,
                 //                                                                                'prestazione_image': `${req.body.prestazione_image}`,
                 //                                                                                'prestazione_description': req.body.prestazione_description,
                 //                                                                                'prestazione_title': req.body.prestazione_title,
                 //                                                                                'prestazione_price': req.body.prestazione_price,
                 //                                                                                'presale_price': req.body.presale_price,
                 //                                                                                'user_id': req.body.user_id,
                 //                                                                                'user_username': req.body.user_username,
                 //                                                                                'user_name': req.body.user_name,
                 //                                                                                'user_profile_image': `${req.body.user_profile_image}`,
                 //                                                                                'user_phone_number': req.body.user_phone_number,
                 //                                                                                'user_email': req.body.user_email,
                 //                                                                                // 'price': req.body.prestazione_price,
                 //                                                                                'business_id': req.body.business_id,
                 //                                                                                'business_name': req.body.business_name,
                 //                                                                                'business_type_id': result1[0].business_type_id,
                 //                                                                                'business_profile_image': `${result1[0].profile_image}`,
                 //                                                                                'business_description': result1[0].description,
                 //                                                                                'business_address': result1[0].address,
                 //                                                                                'business_phone_number': result1[0].phone_number,
                 //                                                                                'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                 //                                                                                'is_canceled': 0,
                 //                                                                                'created_at': new Date(Date.now()).toISOString(),
                 //                                                                            }
                 //                                                                        );
                 //                                                                    }
                 //
                 //                                                                    console.log('result2')
                 //                                                                    console.log(result2)
                 //                                                                    console.log('result1')
                 //                                                                    console.log(result1)
                 //                                                                    console.log('result0')
                 //                                                                    console.log(result0)
                 //
                 //                                                                    var bookingDate = new Date(result2[0].begin_at);
                 //                                                                    const offset = bookingDate.getTimezoneOffset();
                 //                                                                    var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getMinutes() /!*- offset*!/ + 120));
                 //                                                                    let localeBookingString = localBookingDate.toLocaleString(
                 //                                                                        'it-IT',
                 //                                                                        {
                 //                                                                            year: 'numeric',
                 //                                                                            month: '2-digit',
                 //                                                                            day: '2-digit',
                 //                                                                            weekday: "long",
                 //                                                                            hour: '2-digit',
                 //                                                                            hour12: false,
                 //                                                                            minute: '2-digit',
                 //                                                                            second: '2-digit'
                 //                                                                        }
                 //                                                                    );
                 //
                 //                                                                    console.log('bookingDate.toISOString()');
                 //                                                                    console.log(bookingDate.toISOString());
                 //                                                                    console.log('offset');
                 //                                                                    console.log(offset);
                 //                                                                    console.log('localBookingDate.toISOString()');
                 //                                                                    console.log(localBookingDate.toISOString());
                 //
                 //                                                                    // Step 1
                 //                                                                    let transporter = nodemailer.createTransport({
                 //                                                                        // service: 'gmail',
                 //                                                                        // service: 'iCloud',
                 //                                                                        // host: 'authsmtp.securemail.pro',
                 //                                                                        host: 'email-smtp.eu-central-1.amazonaws.com',
                 //                                                                        port: 465,
                 //                                                                        // port: 587,
                 //                                                                        secure: true, // true for 465, false for other ports
                 //                                                                        // secure: false,
                 //                                                                        auth: {
                 //                                                                            // user: process.env.EMAIL_USER,
                 //                                                                            user: process.env.AWS_SMTP_USER,
                 //                                                                            // pass: process.env.EMAIL_PASSWORD
                 //                                                                            pass: process.env.AWS_SMTP_PASSWORD
                 //                                                                        },
                 //                                                                        //TODO: da testare
                 //                                                                        tls: {
                 //                                                                            rejectUnauthorized: false
                 //                                                                        }
                 //                                                                    });
                 //
                 //                                                                    if (result1[0].email_notification === 1) {
                 //                                                                        //email a business
                 //                                                                        let mailOptions = {
                 //                                                                            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                 //                                                                            from: `"${result0[0].name !== null && result0[0].name !== '' ? result0[0].name : result0[0].username}" support@nurebo.com`, // sender address
                 //                                                                            to: result1[0].email,
                 //                                                                            // to: "bar@example.com, baz@example.com", // list of receivers
                 //                                                                            subject: `Prenotazione di ${req.body.prestazione_title} da ${/!*req.body.user_name*!/result0[0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                 //                                                                            // subject: 'Hello ✔ Nodemailer - Test',
                 //                                                                            // text: 'Wooohooo it works!!',
                 //                                                                            html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${/!*req.body.user_name*!/result0[0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
                 //                                                               <h1>Grazie.</h1>
                 //                                                               <h1>A presto!</h1>`,
                 //                                                                        };
                 //
                 //                                                                        // Step 3
                 //                                                                        await transporter.sendMail(mailOptions, (err, data) => {
                 //                                                                            if (err) {
                 //                                                                                console.log('Error occurs', err);
                 //                                                                                return;
                 //                                                                            }
                 //                                                                            // console.log(otp);
                 //                                                                            console.log('Email sent!!!');
                 //                                                                        });
                 //                                                                    }
                 //                                                                    if (result0[0].email_notification === 1) {
                 //                                                                        //email a user
                 //                                                                        let mailOptions1 = {
                 //                                                                            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                 //                                                                            from: `"${result1[0].name}" support@nurebo.com`, // sender address
                 //                                                                            to: result0[0].email,
                 //                                                                            // to: "bar@example.com, baz@example.com", // list of receivers
                 //                                                                            subject: `Prenotazione di ${req.body.prestazione_title} da ${req.body.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                 //                                                                            // subject: 'Hello ✔ Nodemailer - Test',
                 //                                                                            // text: 'Wooohooo it works!!',
                 //                                                                            html: `<h1>La prenotazione di ${req.body.prestazione_title} da ${req.body.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
                 //                                                               <h1>Grazie.</h1>
                 //                                                               <h1>A presto!</h1>`,
                 //                                                                        };
                 //
                 //                                                                        // Step 3
                 //                                                                        await transporter.sendMail(mailOptions1, (err, data) => {
                 //                                                                            if (err) {
                 //                                                                                console.log('Error occurs', err);
                 //                                                                                // return log('Error occurs', err);
                 //                                                                                return;
                 //                                                                            }
                 //                                                                            return;
                 //                                                                            // console.log(otp);
                 //                                                                            // console.log('Email sent!!!');
                 //                                                                        });
                 //                                                                    }
                 //
                 //                                                                    const sql15 = `SELECT fcm_token
                 //                                                                     FROM business_device
                 //                                                                     WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND business_id = ?
                 //                                                                     ORDER BY RAND()
                 //                                                                     LIMIT 1000`;
                 //                                                                    db.query(sql15, [businessId], async (err, result6) => {
                 //                                                                        if (err) {
                 //                                                                            console.log(err)
                 //                                                                            // return res.status(500).send(err);
                 //                                                                            req.body.items[i].status = {
                 //                                                                                status_code: 500,
                 //                                                                                status_message: err
                 //                                                                            }
                 //                                                                            resStatus.push(
                 //                                                                                req.body.items[i]
                 //                                                                            );
                 //                                                                        }
                 //                                                                        console.log('result6');
                 //                                                                        console.log(result6);
                 //
                 //                                                                        for (let i = 0; i < result6.length; i++) {
                 //                                                                            console.log(result6[i].fcm_token);
                 //                                                                            // if(result[i].fcm_token !== null){
                 //                                                                            array.push(result6[i].fcm_token);
                 //                                                                            // }
                 //                                                                        }
                 //
                 //                                                                        // await axios({
                 //                                                                        //     method: 'POST',
                 //                                                                        //     url: 'https://fcm.googleapis.com/fcm/send',
                 //                                                                        //     headers: {
                 //                                                                        //         'Content-Type': 'application/json',
                 //                                                                        //         Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                 //                                                                        //     },
                 //                                                                        //     data: {
                 //                                                                        //         // "to": "cDdRQ4IPR6qpRREaeV0KNp:APA91bFsj7Vreyql4ZGXWJqAYiXkJBlZr-TkyvL7OvGnz672VroVtTyElxIRNRdIyxU1ghHLtOJ5Q2QcXqbpT5MFbdkbgQawSInR6sEdYRM-NdvAKMHrhBTX0jNpSqQ5Vx-2PcVGteJ-",
                 //                                                                        //         "to": "cPD5QfLPQfSmNXtArooBQp:APA91bE5UePiJLxhCUdvLMrLHLI3jBcJFRWxX0OMAS4k5YptHkj3rCkCFIziAwOcvC9xIDmmNKM3ywqE0GWNMW_6022xR_vC1stS-TmkUQQXd-3I2GdY-7BzouyOyDNELKaX8zhE4C4C",
                 //                                                                        //         // "to": req.body.user_token,
                 //                                                                        //         "direct_boot_ok" : true,
                 //                                                                        //         "badge": 1,
                 //                                                                        //         "notification": {
                 //                                                                        //             "title": "Check this Mobile (title)",
                 //                                                                        //             "subtitle": "Norris (subtitle)",
                 //                                                                        //             "body": "Rich Notification testing (body)",
                 //                                                                        //             // "mutable_content": true,
                 //                                                                        //             "link": "https://www.google.com",
                 //                                                                        //             // "vibrate": "true",
                 //                                                                        //             "sound": "default",
                 //                                                                        //             "image": "https://kadingira-s3.s3.eu-central-1.amazonaws.com/image/prestazione/0e3c9167-1d17-40f4-a2a5-edeaa341e1a2.jpg",
                 //                                                                        //             "click_action": "MAIN_ACTIVITY",
                 //                                                                        //             // "click_action": "MAIN",
                 //                                                                        //             // "click_action": "LAUNCHER",
                 //                                                                        //             // "requireInteraction": "true",
                 //                                                                        //             // "ttl": 2
                 //                                                                        //         },
                 //                                                                        //         "android": {
                 //                                                                        //             "ttl": 3,
                 //                                                                        //             "sound": "default",
                 //                                                                        //             "subtitle": "Android specific",
                 //                                                                        //             "vibrate": true,
                 //                                                                        //             "link": "https://www.google.com",
                 //                                                                        //             "priority": "high",
                 //                                                                        //             "notification": {
                 //                                                                        //                 "image": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
                 //                                                                        //             }
                 //                                                                        //         },
                 //                                                                        //         "apns":{
                 //                                                                        //             "headers": {
                 //                                                                        //                 "apns-priority": "5",
                 //                                                                        //                 "apns-expiration":"1604750400"
                 //                                                                        //             },
                 //                                                                        //             "payload":{
                 //                                                                        //                 "aps":{
                 //                                                                        //                     "mutable-content": 1
                 //                                                                        //                 }
                 //                                                                        //             },
                 //                                                                        //             "fcm_options": {
                 //                                                                        //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
                 //                                                                        //             }
                 //                                                                        //         },
                 //                                                                        //         "webpush":{
                 //                                                                        //             "headers":{
                 //                                                                        //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
                 //                                                                        //                 "TTL":"86400",
                 //                                                                        //                 "Urgency": "high"
                 //                                                                        //             }
                 //                                                                        //         },
                 //                                                                        //         "data": {
                 //                                                                        //             "url": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
                 //                                                                        //             "dl": "<deeplink action on tap of notification>"
                 //                                                                        //         }
                 //                                                                        //     }
                 //                                                                        // }).then(function (response) {
                 //                                                                        //     console.log(response.status);
                 //                                                                        //     console.log(response.data);
                 //                                                                        //     console.log(response.data.success);
                 //                                                                        //     // res.status(200).send(response.data);
                 //                                                                        // }).catch(function (error) {
                 //                                                                        //     console.log(error);
                 //                                                                        //     // res.status(500).send(error);
                 //                                                                        // });
                 //                                                                        await axios({
                 //                                                                            method: 'POST',
                 //                                                                            url: 'https://fcm.googleapis.com/fcm/send',
                 //                                                                            headers: {
                 //                                                                                'Content-Type': 'application/json',
                 //                                                                                Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                 //                                                                            },
                 //                                                                            data: {
                 //                                                                                "notification": {
                 //                                                                                    "title": `${req.body.prestazione_title}`,
                 //                                                                                    "subtitle": /!*`${}`*!/"Prenotazione",
                 //                                                                                    "body": `Prenotazione da ${/!*req.body.user_name*!/req.body.user_name !== null && req.body.user_name !== '' ? req.body.user_name : req.body.user_username} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                 //                                                                                    // "channel_id": "fcm_nurebo_admin_channel",
                 //                                                                                    "android_channel_id": "fcm_nurebo_admin_channel",
                 //                                                                                    // "image": `${req.body.prestazione_image}`,
                 //                                                                                    "vibrate": true,
                 //                                                                                    "icon": "calendar"
                 //                                                                                },
                 //                                                                                "direct_boot_ok": true,
                 //                                                                                "data": {
                 //                                                                                    "keyname": "any value",
                 //                                                                                    "booking_id": id,
                 //                                                                                    "prestazione_id": `${req.body.prestazione_id}`,
                 //                                                                                    "note": req.body.note,
                 //                                                                                    "begin_at": req.body.begin_at,
                 //                                                                                    'prestazione_duration': req.body.prestazione_duration,
                 //                                                                                    "prestazione_image": `${req.body.prestazione_image}`,
                 //                                                                                    'prestazione_description': req.body.prestazione_description,
                 //                                                                                    'prestazione_title': req.body.prestazione_title,
                 //                                                                                    'prestazione_price': req.body.prestazione_price,
                 //                                                                                    'presale_price': req.body.presale_price,
                 //                                                                                    'user_id': req.body.user_id,
                 //                                                                                    'user_username': req.body.user_username,
                 //                                                                                    'user_name': req.body.user_name,
                 //                                                                                    'user_profile_image': `${req.body.user_profile_image}`,
                 //                                                                                    'user_phone_number': req.body.user_phone_number,
                 //                                                                                    'user_email': req.body.user_email,
                 //                                                                                    // 'price': req.body.prestazione_price,
                 //                                                                                    'business_id': req.body.business_id,
                 //                                                                                    'business_name': req.body.business_name,
                 //                                                                                    'business_type_id': result1[0].business_type_id,
                 //                                                                                    'business_profile_image': `${result1[0].profile_image}`,
                 //                                                                                    'business_description': result1[0].description,
                 //                                                                                    'business_address': result1[0].address,
                 //                                                                                    'business_phone_number': result1[0].phone_number,
                 //                                                                                    'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                 //                                                                                    'is_canceled': 0,
                 //                                                                                    'created_at': new Date(Date.now()).toISOString(),
                 //                                                                                },
                 //                                                                                "android": {
                 //                                                                                    "notification": {
                 //                                                                                        "image": `${req.body.prestazione_image}`,
                 //                                                                                        "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                 //                                                                                        "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
                 //                                                                                    },
                 //                                                                                    "direct_boot_ok": true
                 //                                                                                },
                 //                                                                                // "registration_ids": [`${result1[0].fcm_token}`, ],
                 //                                                                                "registration_ids": array,
                 //                                                                                // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                 //                                                                            }
                 //                                                                        }).then(function (response) {
                 //                                                                            console.log(response.status);
                 //                                                                            console.log(response.data);
                 //                                                                            console.log(response.data.success);
                 //                                                                        }).catch(function (error) {
                 //                                                                            console.log(error);
                 //                                                                        });
                 //
                 //                                                                    });
                 //
                 //                                                                });
                 //                                                            });
                 //                                                        });
                 //
                 //                                                        // res.json(result);
                 //                                                    });
                 //
                 //                                                    // res.json(result);
                 //                                                    // res.json(id);
                 //                                                    req.body.items[i].status = {
                 //                                                        status_code: 200,
                 //                                                        status_message: 'Prenotazione effettuata correttamente'
                 //                                                    }
                 //                                                    resStatus.push(
                 //                                                        req.body.items[i]
                 //                                                    );
                 //                                                }
                 //                                            });
                 //                                        });
                 //                                    });
                 //                                }
                 //                            });
                 //                        }
                 //                    });
                 //                });
                 //            }
                 //        });
                 //    });
                }
            } catch (error) {
                console.error(error);
                res.status(500).send("");
            }

            console.log('resStatusddf54df54f');
            console.log(resStatus);

            // for (var itemfdf in req.body.items) {
            // for (let i = 0; i < req.body.items.length; i++) {
                // // console.log('itemfs4v');
                // // console.log(itemfdf);
                // let status = await userController.insertUserBooking(/!*req, res,*!/ req.body.items[i], orderId);
                // console.log('status65ggf65');
                // console.log(status);
            // }

            // res.send(result);
            // res.status(200).json({
            //     id,
            //     'user_id': userId,
            //     // 'created_at': now.toISOString(),
            // });
            res.status(200).send(
                JSON.stringify({
                    id: orderId,
                    'user_id': userSessionId,
                    // 'orders_status': []
                    'orders_status': resStatus
                })
            );

            // }).catch(console.log)
        }).catch(error => {
            console.log(error)
            // console.log(err)or;
            return res.status(500).send(error);
        });

        // /!*await*!/ db/!*.promise()*!/.query(sql, [id, userId], /!*async*!/ function(err, result) /!*=>*!/ {
        //     if (err) {
        //         console.log(err)
        //         return res.status(500).send(err);
        //         // return res.status(500).end(err);
        //     }
        //     console.log(result)
        //
        //     // res.send(result);
        //     // res.status(200).json({
        //     //     id,
        //     //     'user_id': userId,
        //     //     // 'created_at': now.toISOString(),
        //     // });
        //     res.status(200).send(
        //         JSON.stringify({
        //             id,
        //             'user_id': userId,
        //         })
        //     );
        // });

        // res.status(200).send(
        //     JSON.stringify({
        //         id,
        //         'user_id': userId,
        //     })
        // );
    } catch (error) {
        console.error(error);
        // res.status(500).send("");
    }
});*/

Router.post('/:user_id/order', checkUserAuth, checkUser, async (req, res) => {
    try {
        let userId = req.body.user_id;
        let userSessionId = req.body.user_session_id;
        // let now = new Date(Date.now());

        console.log('req.body');
        console.log(req.body);

        let id = uuidv4();

        const sql = `INSERT INTO user_order (id, user_session_id, user_id, created_at) VALUES (?, ?, ?, ?);`;

        // new Promise((resolve, reject) => {
        //     /*await*/ db/*.promise()*/.query(sql, [id, userId], /*async*/ (err, result) => {
        //         if (err) {
        //             console.log(err)
        //             reject(err);
        //             return res.status(500).send(err);
        //             // return res.status(500).end(err);
        //         }
        //         console.log(result)
        //
        //         // res.send(result);
        //         // res.status(200).json({
        //         //     id,
        //         //     'user_id': userId,
        //         //     // 'created_at': now.toISOString(),
        //         // });
        //
        //         res.status(200).send(
        //             JSON.stringify({
        //                 id,
        //                 'user_id': userId,
        //             })
        //         );
        //         resolve(result);
        //     });
        //     // db.query(sql, (err, result) => {
        //     //     if(err){
        //     //         reject(new Error());
        //     //     }
        //     //     else{
        //     //         resolve(result);
        //     //     }
        //     // });
        // });

        // (async () => {
        //     try {
        //         await db/*.promise()*/.query(sql, [id, userId], async (err, result) => {
        //             if (err) {
        //                 console.log(err)
        //                 return res.status(500).send(err);
        //                 // return res.status(500).end(err);
        //             }
        //             console.log(result)
        //
        //             // res.send(result);
        //             // res.status(200).json({
        //             //     id,
        //             //     'user_id': userId,
        //             //     // 'created_at': now.toISOString(),
        //             // });
        //         });
        //     } catch (e) {
        //         console.log(e)
        //     }
        // })().then((rows) => {
        //     console.log("Response: ", rows);
        //     res.status(200).json({
        //         id,
        //         'user_id': userId,
        //         // 'created_at': now.toISOString(),
        //     });
        // }).catch(error => {
        //     console.log(err)or;
        // });

        await db.promise().query(sql, [id, userSessionId, userId, new Date(Date.now()).toISOString()]).then((result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
                // return res.status(500).end(err);
            }
            // console.log(result)

            // res.send(result);
            // res.status(200).json({
            //     id,
            //     'user_id': userId,
            //     // 'created_at': now.toISOString(),
            // });
            res.status(200).send(
                JSON.stringify({
                    id,
                    'user_id': userSessionId,
                })
            );
            // }).catch(console.log)
        }).catch(error => {
            console.log(error)
            // console.log(err)or;
            return res.status(500).send(error);
        });

        // /*await*/ db/*.promise()*/.query(sql, [id, userId], /*async*/ function(err, result) /*=>*/ {
        //     if (err) {
        //         console.log(err)
        //         return res.status(500).send(err);
        //         // return res.status(500).end(err);
        //     }
        //     console.log(result)
        //
        //     // res.send(result);
        //     // res.status(200).json({
        //     //     id,
        //     //     'user_id': userId,
        //     //     // 'created_at': now.toISOString(),
        //     // });
        //     res.status(200).send(
        //         JSON.stringify({
        //             id,
        //             'user_id': userId,
        //         })
        //     );
        // });

        // res.status(200).send(
        //     JSON.stringify({
        //         id,
        //         'user_id': userId,
        //     })
        // );
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

function makeid(length, onlyNumbers) {
    let result = '';
    let characters = onlyNumbers === false ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' : '0123456789';
    // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for(let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = Router;