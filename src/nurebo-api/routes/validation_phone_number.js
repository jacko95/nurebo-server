//import { v4 as uuidv4 } from 'uuid';
const { v4: uuidv4 } = require('uuid');

// const rateLimiter = require("express-rate-limit");

require('dotenv').config();
const nodemailer = require('nodemailer');

const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");

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

// const registerLimiter = rateLimiter({
//     windowMs: 5000, //5 seconds
//     max: 5, //5 requests
//     message: {
//         code: 429, //HTTP code per too many requests
//         message: "Troppe richieste di login, amico mio... Riprova dopo, magari sarai più fortunato! :)"
//     }
// });

// ================================= SEND EMAIL ================================
function makeid(length) {
    var result           = '';
    var characters       = '0123456789';
    // var characters       = '123456789';//problema con lo 0 da risolvere perchè lo vede come intero a un certo punto (forse regexp)
    // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}

// ================================= GET ALL LOGINS ================================
Router.get('/', /*registerLimiter,*/ (req, res) => {
    //console.log(req.body);
    var date1 = new Date("4 july 2021 21:06:41");
    var date2 = new Date("08/07/2021");
    //console.log(booking1);
    //console.log(booking2);
    var startingSeconds = 4;

    var differenceInMilliseconds = date2.getTime() - date1.getTime();
    var differenceInSeconds = differenceInMilliseconds / (1000);
    var differenceInMinutes = differenceInMilliseconds / (60 * 1000);
    var differenceInHours = differenceInMilliseconds / (60 * 60 * 1000);
    var differenceInDays = differenceInMilliseconds / (24 * 60 * 60 * 1000);

    //console.log(differenceInMilliseconds);
    //console.log(differenceInSeconds);
    //console.log(differenceInMinutes);
    //console.log(differenceInHours);
    //console.log(differenceInDays)

    var interval = setInterval(updateCountdown, 1000);

    function updateCountdown(){
        if(startingSeconds === 0){
            const sql = "SELECT * FROM user_authentication";
            db.query(sql, (err, rows) => {
                // //console.log(rows);
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                res.json(rows);
            })
            clearInterval(interval);
        }
        //console.log(startingSeconds);
        startingSeconds--;
        // startingSeconds = startingSeconds < 0 ? 0 : startingSeconds;
    }

    // const sql = "SELECT * FROM login";
    // db.query(sql, (err, rows) => {
    //     // //console.log(rows);
    //     if (err) console.log(err);
    //     res.json(rows);
    // })
});

// ================================= VERIFY IF USER EXISTS AND GET IT ================================
Router.post('/user', /*registerLimiter,*/ (req, res) => {
    //console.log(req.body);

    const sql = `SELECT * FROM user WHERE user.username = '${req.body.username}'`;
    db.query(sql, (err, rows) => {
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
});

// ================================= SEND SMS ================================
Router.post("/send_sms", (req, res) => {

    let username = req.body.username;
    let sent_otp = req.body.sent_otp;
    //console.log("username");
    //console.log(username);
    //console.log("sent_otp");
    //console.log(sent_otp);

    // let query = "INSERT INTO `login` (sent_otp) VALUES ('" + sent_otp + "')";

    let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
    // //console.log(id);

    let now = new Date(Date.now());
    // //console.log(now);
    // //console.log(now.getTime());

    // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
    let query = `INSERT INTO validation_phone_number (id, username, sent_otp, sent_otp_at, is_success) 
    VALUES ('${id}', "${username}", "${sent_otp}", UTC_TIMESTAMP(), 0)`;
    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        // //console.log(new Date(Date.now()));

        // sentOtp = sent_otp;
        // userId = username;
        // loginId = id;
        // //console.log(sentOtp);
        // //console.log(userId);
        // //console.log(loginId);

        res.json(id);
    });
    // res.json(result);
});

// Router.post("/send_email", (req, res) => {
//
//     let userId = req.body.user_id;
//     let email = req.body.email;
//     let loginId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
//     var otp = makeid(6);
//
//     //console.log("userId");
//     //console.log(userId);
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
//         host: 'authsmtp.securemail.pro',
//         port: 465,
//         // port: 587,
//         secure: true, // true for 465, false for other ports
//         // secure: false,
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASSWORD
//         },
//         //TODO: da testare
//         tls: {
//             rejectUnauthorized: false
//         }
//     });
//
//     // Step 2
//     let mailOptions = {
//         from: process.env.EMAIL_USER, // sender address
//         to: email,
//         // to: "bar@example.com, baz@example.com", // list of receivers
//         subject: 'Codice di autenticazione per il tentativo di accesso su Kadingira',
//         // subject: 'Hello ✔ Nodemailer - Test',
//         // text: 'Wooohooo it works!!',
//         html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
//     };
//
//     // Step 3
//     transporter.sendMail(mailOptions, (err, data) => {
//         if (err) {
//             // return log('Error occurs', err);
//             //console.log('Error occurs', err);
//         }
//         // return log('Email sent!!!');
//         //console.log('Email sent!!!');
//     });
//
//     let now = new Date(Date.now());
//     // //console.log(now);
//     // //console.log(now.getTime());
//
//     // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
//     let query = `INSERT INTO authentication (id, auth_type, user_id, sent_otp, sent_otp_at, is_success)
//     VALUES ('${loginId}', 'EMAIL', ${userId}, ${otp}, UTC_TIMESTAMP(), 0)`;
//     db.query(query, (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         // //console.log(new Date(Date.now()));
//
//         res.json(loginId);
//     });
//     // res.json(result);
// });

// ================================= VERIFY OTP ================================
// Router.post("/verify", (req, res) => {
//
//     let username = req.body.username;
//     let insertedOtp = req.body.inserted_otp;
//     //console.log("req.body");
//     //console.log(req.body);
//
//     const sql1 = `UPDATE validation_phone_number
//                     SET inserted_otp = '${insertedOtp}', inserted_otp_at = UTC_TIMESTAMP()
//                     WHERE username = "${username}"`;
//     db.query(sql1, (err, rows) => {
//         if (err) console.log(err);
//         // //console.log('>> results: ', rows);
//         // var string = JSON.stringify(rows);
//         // //console.log('>> string: ', string);
//         // var json = JSON.parse(string);
//         // //console.log('>> json: ', json);
//         // //console.log('>> user.sent_otp: ', json[0].sent_otp);
//         // //console.log('>> rows:', rows[0]);
//     });
//
//     const quer = `SELECT sent_otp FROM validation_phone_number WHERE username = '${username}'`;
//     db.query(quer, (err, rows) => {
//         if (err) console.log(err);
//
//         //console.log(rows[0].sent_otp);
//         var success;
//         if(insertedOtp === rows[0].sent_otp){
//             success = 1;
//         }
//         else{
//             success = 0;
//         }
//         //console.log("success");
//         //console.log(success);
//
//         const sql2 = `UPDATE validation_phone_number SET is_success = '${success}' WHERE username = '${username}'`;
//         db.query(sql2, (err, rows) => {
//             if (err) console.log(err);
//         });
//         res.json(success);
//         // //console.log("res.success");
//         // //console.log(res.json(success));
//     });
// });

Router.post("/verify", (req, res) => {

    let username = req.body.username;
    let insertedOtp = req.body.inserted_otp;
    //console.log("req.body");
    //console.log(req.body);

    const sql1 = `UPDATE validation_phone_number 
                    SET inserted_otp = '${insertedOtp}', inserted_otp_at = UTC_TIMESTAMP() 
                    WHERE username = '${username}'`;
    db.query(sql1, (err, rows) => {
        if (err) console.log(err);
        // //console.log('>> results: ', rows);
        // var string = JSON.stringify(rows);
        // //console.log('>> string: ', string);
        // var json = JSON.parse(string);
        // //console.log('>> json: ', json);
        // //console.log('>> user.sent_otp: ', json[0].sent_otp);
        // //console.log('>> rows:', rows[0]);
    });

    const quer = `SELECT sent_otp FROM validation_phone_number WHERE username = '${username}'`;
    db.query(quer, (err, rows) => {
        if (err) console.log(err);

        //console.log(rows[0].sent_otp);
        var success;
        if(insertedOtp === rows[0].sent_otp){
            success = 1;
        }
        else{
            success = 0;
        }
        //console.log("success");
        //console.log(success);

        const sql2 = `UPDATE validation_phone_number SET is_success = '${success}' WHERE username = '${username}'`;
        db.query(sql2, (err, rows) => {
            if (err) console.log(err);
        });
        res.json(success);
        // //console.log("res.success");
        // //console.log(res.json(success));
    });
});

module.exports = Router;