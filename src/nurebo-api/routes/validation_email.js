//import { v4 as uuidv4 } from 'uuid';
const { v4: uuidv4 } = require('uuid');

// const rateLimiter = require("express-rate-limit");

require('dotenv').config();
const nodemailer = require('nodemailer');

const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const JWT = require('jsonwebtoken')


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
    for (var i = 0; i < length; i++) {
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

Router.post("/send_email", (req, res) => {
    let username = req.body.username;
    let email = req.body.email;
    let id = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
    var otp = makeid(6);
    let authenticationId = uuidv4();

    //console.log("username");
    //console.log(username);
    //console.log("email");
    //console.log(email);
    //console.log("otp");
    //console.log(otp);

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
        // to: ["bar@example.com", "baz@example.com"], // list of receivers
        // cc: 'dragon@gmail.com',
        subject: 'Codice di autenticazione per il tentativo di accesso',
        // subject: 'Hello ✔ Nodemailer - Test',
        // text: 'Wooohooo it works!!',
        html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
    };

    // Step 3
    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            console.log('Error occurs', err);
            return res.status(500).end(err);
        }
        // return log('Email sent!!!');
        console.log(otp);
        console.log('Email sent!!!');
    });

    let now = new Date(Date.now());
    // //console.log(now);
    // //console.log(now.getTime());

    // let query = `INSERT INTO login (id, user_id, sent_otp, sent_otp_at) VALUES ('${id}', ${user_id}, ${sent_otp}, ${now})`;
    let query2 = `INSERT INTO user_authentication(id, auth_type, sent_otp, sent_otp_at, /*postal_code, ip_address,*/ is_success, is_logout)
                 VALUES (?, "EMAIL", ?, UTC_TIMESTAMP(), /*?, ?,*/ 0, 0)`;
    db.query(query2, [authenticationId, otp, /*postalCode, ipAddress*/], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        // //console.log(new Date(Date.now()));

        let query = `INSERT INTO validation_email(id, user_authentication_id) VALUES (?, ?)`;
        db.query(query, [id, authenticationId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // //console.log(new Date(Date.now()));

            // res.json(id);
            res.json({
                // id
                'id': authenticationId
            });
        });

        // // res.json(id);
        // res.json({
        //     id
        // });
    });
    // res.json(result);
});

// ================================= VERIFY OTP ================================
// Router.post("/verify", (req, res) => {
//
//     let username = req.body.username;
//     let insertedOtp = req.body.inserted_otp;
//     //console.log("req.body");
//     //console.log(req.body);
//
//     const sql1 = `UPDATE validation_email
//                     SET inserted_otp = '${insertedOtp}', inserted_otp_at = UTC_TIMESTAMP()
//                     WHERE username = '${username}'`;
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
//     const quer = `SELECT sent_otp FROM validation_email WHERE username = '${username}'`;
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
//         const sql2 = `UPDATE validation_email SET is_success = '${success}' WHERE username = '${username}'`;
//         db.query(sql2, (err, rows) => {
//             if (err) console.log(err);
//         });
//         res.json(success);
//         // //console.log("res.success");
//         // //console.log(res.json(success));
//     });
// });
Router.post("/verify", (req, res) => {
    let id = req.body.id;
    // let username = req.body.username;
    let insertedOtp = req.body.inserted_otp.toString();
    //console.log("req.body");
    //console.log(req.body);


    const sql6 = `UPDATE user_authentication SET inserted_otp = ?, inserted_otp_at = UTC_TIMESTAMP() WHERE id = ?`;
    db.query(sql6, [insertedOtp, id], (err, rows) => {
        if (err) {
            console.log(err);
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

    // const quer = `SELECT sent_otp FROM validation_email WHERE username = ?`;
    // db.query(quer, [username], (err, rows) => {
    //     if (err) console.log(err);
    //
    //     //console.log(rows[0].sent_otp);
    //     var success;
    //     if(insertedOtp === rows[0].sent_otp){
    //         success = 1;
    //     }
    //     else{
    //         success = 0;
    //     }
    //     //console.log("success");
    //     //console.log(success);
    //
    //     const sql2 = `UPDATE validation_email SET is_success = ? WHERE username = ?`;
    //     db.query(sql2, [success, username], (err, rows) => {
    //         if (err) console.log(err);
    //     });
    //
    //     // res.status(200).json(success);
    //     // //console.log("res.success");
    //     // //console.log(res.json(success));
    //     res.status(200).end(JSON.stringify(success));
    // });
    const quer = `SELECT sent_otp FROM user_authentication WHERE id = ?`;
    db.query(quer, [id], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        //console.log(rows[0].sent_otp);
        var success;
        if(insertedOtp === rows[0].sent_otp){
            success = 1;
            // console.log('global.JWT_key');
            // console.log(global.JWT_key);
            const token = JWT.sign(
                {id: id},
                process.env.JWT_KEY,
                // {expiresIn: 360000}
            );
            const sql2 = `UPDATE user_authentication SET is_success = ? WHERE id = ?`;
            db.query(sql2, [success, id], (err, rows) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
            });

            res.status(200).end(JSON.stringify({
                success,
                token
            }));
            // res.json({
            //     success,
            //     token
            // });
        }
        else{
            success = 0;
            const sql7 = `UPDATE user_authentication SET is_success = ? WHERE id = ?`;
            db.query(sql7, [success, id], (err, rows) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
            });

            res.status(200).end(JSON.stringify({
                success,
            }));
            // res.json({
            //     success,
            // });
        }
        //console.log("success");
        //console.log(success);

        // //console.log("res.success");
        // //console.log(res.json(success));
    });
});


// // ================================= delete category ================================
//
//
// Router.get("/deleteCategory/:idCategory", (req, res) => {
//
//     let idCategory = req.params.idCategory;
//
//     let query = 'DELETE FROM category WHERE idc = "' + idCategory + '"';
//
//     db.query(query, (err, result) => {
//         if (err) {
//             return res.status(500).send(err);
//         }
//         res.redirect('/category');
//     });
//
// });

module.exports = Router;