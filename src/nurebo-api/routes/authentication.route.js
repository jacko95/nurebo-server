//import { v4 as uuidv4 } from 'uuid';
const { v4: uuidv4 } = require('uuid');
const rateLimiter = require("express-rate-limit");
require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const tok = require("../index");
const socket = require('../index'); //import socket  from app.js
const JWT = require('jsonwebtoken')
const checkAuth = require("../middleware/checkUserAuth");
const checkUserAuth = require("../middleware/checkUser");
const checkBusinessAuth = require("../middleware/checkBusinessAuth");
const checkBusiness = require("../middleware/checkBusiness");
const checkDev = require("../middleware/checkDev");


// var loginId;
// var sentOtp;
// var userId;

// var startingSeconds = 60;
// setInterval(upbookingCountdown, 1000);

// function upbookingCountdown(){
//     // var seconds = startingSeconds;
//     // seconds--;
//     startingSeconds--;
//
//     // //console.log(seconds);
//     //console.log(startingSeconds);
//     // seconds = seconds1 < 0 ? 0 : seconds1;
// }

const registerLimiter = rateLimiter({
    windowMs: 3600000, //1 ora
    max: 10, //5 requests
    message: {
        code: 429, //HTTP code per too many requests
        message: "Troppe richieste di login, amico mio... Riprova dopo, magari sarai più fortunato! :)"
    }
});

// Router.get('/', /*registerLimiter,*/ checkDev, (req, res) => {
//     //console.log(req.body);
//     var date1 = new Date("4 july 2021 21:06:41");
//     var date2 = new Date("08/07/2021");
//     //console.log(booking1);
//     //console.log(booking2);
//     var startingSeconds = 4;
//
//     var differenceInMilliseconds = date2.getTime() - date1.getTime();
//     var differenceInSeconds = differenceInMilliseconds / (1000);
//     var differenceInMinutes = differenceInMilliseconds / (60 * 1000);
//     var differenceInHours = differenceInMilliseconds / (60 * 60 * 1000);
//     var differenceInDays = differenceInMilliseconds / (24 * 60 * 60 * 1000);
//
//     //console.log(differenceInMilliseconds);
//     //console.log(differenceInSeconds);
//     //console.log(differenceInMinutes);
//     //console.log(differenceInHours);
//     //console.log(differenceInDays)
//
//     var interval = setInterval(updateCountdown, 1000);
//
//     function updateCountdown(){
//         if(startingSeconds === 0){
//             const sql = "SELECT * FROM authentication";
//             db.query(sql, (err, rows) => {
//                 // //console.log(rows);
//                 if (err) console.log(err);
//                 res.json(rows);
//             })
//             clearInterval(interval);
//         }
//         //console.log(startingSeconds);
//         startingSeconds--;
//         // startingSeconds = startingSeconds < 0 ? 0 : startingSeconds;
//     }
//
//     // const sql = "SELECT * FROM login";
//     // db.query(sql, (err, rows) => {
//     //     // //console.log(rows);
//     //     if (err) console.log(err);
//     //     res.json(rows);
//     // })
// });

Router.post("/user", /*registerLimiter,*//*checkDev,*/ (req, res) => {
    try {
        //console.log(req.body);

        const sql = `SELECT * FROM user WHERE user.username = ?`;
        db.query(sql, [req.body.username], (err, rows) => {
            // //console.log(rows);
            // //console.log(rows[0]);
            // var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
            // //console.log(resultArray[0]);

            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(rows);
            // res.end(resultArray);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/email', /*registerLimiter,*/ /*checkDev,*/ (req, res) => {
//     let email = req.body.email;
//     // let email = req.params.email;
//
//     const sql = `SELECT * FROM user WHERE user.email = ?`;
//     db.query(sql, [email], (err, rows) => {
//         // //console.log(rows);
//         // //console.log(rows[0]);
//         // var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
//         // //console.log(resultArray[0]);
//
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         res.json(rows);
//         // res.end(resultArray);
//     })
// });

Router.post("/send_sms", checkDev, (req, res) => {
    try {
        let user_id = req.body.user_id;
        let sent_otp = req.body.sent_otp;
        //console.log("user_id");
        //console.log(user_id);
        //console.log("sent_otp");
        //console.log(sent_otp);

        // let query = "INSERT INTO `login` (sent_otp) VALUES ('" + sent_otp + "')";

        let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        // //console.log(id);

        let now = new Date(Date.now());
        console.log(now.toUTCString());
        console.log(now.toISOString());
        console.log(now.toString());
        // //console.log(now.getTime());

        // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
        let query = `INSERT INTO user_authentication (id, auth_type, user_id, sent_otp, sent_otp_at, is_success, is_logout) 
    VALUES (?, 'SMS', ?, ?, ?, 0, 0)`;
        db.query(query, [id, user_id, sent_otp, new Date(Date.now()).toISOString()], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(new Date(Date.now()));

            sentOtp = sent_otp;
            userId = user_id;
            loginId = id;
            // //console.log(sentOtp);
            // //console.log(userId);
            // //console.log(loginId);

            // res.json(id);
            res.json({
                id,
                'auth_type': 'SMS',
                user_id,
                sent_otp,
                'sent_otp_at': now.toISOString(),
                'is_success': 0
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

// function randomString(length) {
//     var result           = '';
//     var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     var charactersLength = characters.length;
//     for ( var i = 0; i < length; i++ ) {
//         result += characters.charAt(Math.floor(Math.random() *
//             charactersLength));
//     }
//     return result;
// }

// Router.post("/send_email", (req, res) => {
Router.post("/send_email", /*registerLimiter,*/ (req, res) => {
    try {
        let userId = req.body.user_id;
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

        let query = `INSERT INTO user_authentication (id, auth_type, user_id, sent_otp, sent_otp_at, postal_code, ip_address, is_success, is_logout) 
        VALUES (?, "EMAIL", ?, ?, ?, ?, ?, 0, 0)`;
        db.query(query, [loginId, userId, otp, new Date(Date.now()).toISOString(), postalCode, ipAddress], (err, result) => {
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

                return;
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

// Router.post("/verify", (req, res) => {
Router.post("/verify", /*registerLimiter,*/ (req, res) => {
    try {
        let id = req.body.id;
        let insertedOtp = req.body.inserted_otp;
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

        const sql1 = `UPDATE user_authentication SET inserted_otp = ?, inserted_otp_at = ? WHERE id = ?`;
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
            } else {
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

Router.put("/:user_id/device", checkAuth, checkUserAuth, /*checkDev,*/ (req, res) => {
    try {
        // let fcmToken = req.body.fcm_token;
        let userId = req.params.user_id;
        let manufacturer = req.body.manufacturer;
        let model = req.body.model;
        // let sdkVersion = req.body.sdk_version;
        // let releaseVersion = req.body.release_version;
        // console.log(req.body);

        const decoded = JWT.verify(req.headers.authorization, process.env.JWT_KEY)
        // const decoded = JWT.verify(req.headers.authorization, global.JWT_KEY)
        console.log('decoded00fdfddg0')
        console.log(decoded)

        let sql1 = `SELECT *
                FROM user_device
                WHERE user_id = ? AND manufacturer = ? AND model = ?`;
        db.query(sql1, [userId, manufacturer, model,], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            console.log('decoddfokdfokded')
            console.log(decoded.id)
            console.log(result[0].id)

            let sql2 = `UPDATE user_authentication SET user_device_id = ?
                        WHERE id = ?`;
            db.query(sql2, [result[0].id, decoded.id,], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                console.log('resuld5xc5c5ct');
                console.log(result);
                // res.end(result);
                // res.result;
                //     res.json(id);
                //     res.json(result);

                // res.json(result);
                // res.json(id);
            });

            res.status(200).json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/logout", checkAuth, checkUserAuth, (req, res) => {
    try {
        let authId = req.body.auth_id;

        const sql = `UPDATE user_authentication SET is_logout = ?, logout_at = ?
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

Router.post('/business/email', /*registerLimiter,*/ /*checkDev,*/ (req, res) => {
    try {
        //console.log(req.body);

        // const sql = `SELECT * FROM business WHERE name = '${req.body.username}'`;
        const sql = `SELECT * FROM business WHERE email = ?`;
        db.query(sql, [req.body.email], (err, rows) => {
            // //console.log(rows);
            // //console.log(rows[0]);
            // var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
            // //console.log(resultArray[0]);

            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            res.json(rows);
            // res.end(resultArray);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/business/send_sms", /*registerLimiter,*/ checkDev, (req, res) => {
    try {
        let businessId = req.body.business_id;
        let sent_otp = req.body.sent_otp;
        //console.log("user_id");
        //console.log(businessId);
        //console.log("sent_otp");
        //console.log(sent_otp);

        // let query = "INSERT INTO `login` (sent_otp) VALUES ('" + sent_otp + "')";

        let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        // //console.log(id);

        let now = new Date(Date.now());
        // //console.log(now);
        // //console.log(now.getTime());

        // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
        let query = `INSERT INTO business_authentication (id, auth_type, business_id, sent_otp, sent_otp_at, is_success) 
            VALUES ('${id}', 'SMS', '${businessId}', '${sent_otp}', ?, 0)`;
        db.query(query, [new Date(Date.now()).toISOString()], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(new Date(Date.now()));
            // res.json(id);
            res.json({
                id,
                'auth_type': 'SMS',
                businessId,
                sent_otp,
                'sent_otp_at': now.toISOString(),
                'is_success': 0
            });
        });
        // res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/business/send_email", /*registerLimiter,*/ (req, res) => {
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

Router.post("/business/verify", /*registerLimiter,*/ (req, res) => {
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

Router.post("/business/verify_old", checkDev, (req, res) => {
    try {
        let id = req.body.id;
        let insertedOtp = req.body.inserted_otp;
        //console.log("req.body");
        //console.log(req.body);

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

        const quer = `SELECT sent_otp FROM business_authentication WHERE id = ?`;
        db.query(quer, [id], (err, rows) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            //console.log(rows[0].sent_otp);
            var success;
            if (insertedOtp === rows[0].sent_otp) {
                success = 1;
            } else {
                success = 0;
            }
            //console.log("success");
            //console.log(success);

            const sql2 = `UPDATE business_authentication SET is_success = ? WHERE id = ?`;
            db.query(sql2, [success, id], (err, rows) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
            });
            // res.json({success});
            res.json(success);
            // //console.log("res.success");
            // //console.log(res.json(success));
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/business/:business_id/logout", checkBusinessAuth, checkBusiness, (req, res) => {
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

module.exports = Router;