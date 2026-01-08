const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const welcome_email = require("../template/email/welcome_email.html");
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const fs = require("fs");
const multer = require('multer');
const AWS = require('aws-sdk')

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

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         //console.log(req);
//         let userId = req.body.user_id;
//         //TODO: CREARE (SE NON ESISTE GIà) UNA CARTELLA CON L'ID DELL UTENTE
//         //OGNI VOLTA CHE SI POSTA UN POST ED IL NOME DELL'IMMAGINE DOVREBBE
//         //ESSERE L'ID DEL POST
//         // cb(null, `./posts/${userId}/`);
//         cb(null, `./posts/`);
//     },
//     filename: function(req, file, cb) {
//         cb(null, file.originalname);
//         // cb(null, uuidv4() + file.originalname);
//     },
//
// });

const storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, '')
    }
})

//only allow png or jpg file
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        // cb(null, false);
        cb(new Error('File format not allowed'), false);
    }
};

//only allow file up to 5 MB
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
})/*.single('image')*/;


// ================================= INSERT A NEW USER ================================
// Router.post("/", async (req, res) => {
//     let name = req.body.name;
//     let email = req.body.email;
//     let title = req.body.title;
//     let message = req.body.message;
//     //console.log(name);
//     //console.log(username);
//     //console.log(email);
//     //console.log(phone_number);
//     let id = uuidv4();
//
//     let sql1 = `INSERT INTO website_contact_us(id, name, email, title, message) VALUES(?, ?, ?, ?, ?)`;
//     await db.query(sql1, [id, name, email, title, message], (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//
//         // // Step 1
//         // let transporter = nodemailer.createTransport({
//         //     // service: 'gmail',
//         //     // service: 'iCloud',
//         //     host: 'authsmtp.securemail.pro',
//         //     port: 465,
//         //     // port: 587,
//         //     secure: true, // true for 465, false for other ports
//         //     // secure: false,
//         //     auth: {
//         //         user: process.env.EMAIL_USER,
//         //         pass: process.env.EMAIL_PASSWORD
//         //     },
//         //     //TODO: da testare
//         //     tls: {
//         //         rejectUnauthorized: false
//         //     }
//         // });
//         //
//         // // Step 2
//         // let mailOptions = {
//         //     from: `${name} support@nurebo.com`, // sender address
//         //     // from: `${name} "${email}"`, // sender address
//         //     // to: email, // email receiver
//         //     to: 'support@nurebo.com', // email receiver
//         //     // to: "bar@example.com, baz@example.com", // list of receivers
//         //     subject: title,
//         //     // subject: 'Hello ✔ Nodemailer - Test',
//         //     // text: 'Wooohooo it works!!',
//         //     // html: `<h1>Il tuo codice di verifica è ${otp}</h1>`,
//         //     // html: welcome_email.toString(),
//         //     html: fs.readFileSync("./src/template/email/welcome_email.html").toString(),
//         //     // html: new XMLSerializer().serializeToString(welcome_email),
//         // };
//         //
//         // // Step 3
//         // transporter.sendMail(mailOptions, (err, data) => {
//         //     if (err) {
//         //         console.log('Error occurs', err);
//         //         return log('Error occurs', err);
//         //     }
//         //     // return log('Email sent!!!');
//         //     console.log('Email sent!!!');
//         // });
//         //
//         // // //console.log('result');
//         // // //console.log(result);
//         // // res.end(result);
//
//         res.status(200).send(result);
//     });
// });

Router.post("/send_email", async (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let title = req.body.title;
    let message = req.body.message;
    //console.log(name);
    //console.log(username);
    //console.log(email);
    //console.log(phone_number);

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
            // user: process.env.EMAIL_USER, // TODO: your gmail account
            user: process.env.AWS_SMTP_USER, // TODO: your gmail account
            // pass: process.env.EMAIL_PASSWORD // TODO: your gmail password
            pass: process.env.AWS_SMTP_PASSWORD // TODO: your gmail password
        },
        //TODO: da testare
        tls: {
            rejectUnauthorized: false
        }
    });

    // Step 2
    let mailOptions = {
        // from: `"Nexyra" support@nurebo.com`, // sender address
        from: `support@nurebo.com`, // sender address
        // from: `${name} "${email}"`, // sender address
        // to: email, // email receiver
        to: 'support@nurebo.com', // email receiver
        // to: "bar@example.com, baz@example.com", // list of receivers
        subject: title,
        // subject: 'Hello ✔ Nodemailer - Test',
        // text: 'Wooohooo it works!!',
        html: `<h1>Email:</h1><p>${email}</p>
               <h1>Nome:</h1><p>${name}</p>
               <h1>Messaggio:</h1><p>${message}</p>`,
        // html: welcome_email.toString(),
        // html: fs.readFileSync("./src/template/email/welcome_email.html").toString(),
        // html: fs.readFileSync("./template/email/welcome_email.html").toString(),

        // html: new XMLSerializer().serializeToString(welcome_email),
    };

    // Step 3
    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            console.log('Error occurs', err);
            return;
        }
        // return log('Email sent!!!');
        console.log('Email sent!!!');
    });

    // //console.log('result');
    // //console.log(result);
    // res.end(result);

    // res.status(200);
    res.json(req.body);

});

module.exports = Router;