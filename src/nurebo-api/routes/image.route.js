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
const AWS = require('aws-sdk')
const formData = require('form-data');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'eu-central-1',
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


// Router.get('/image', async (req, res) => {
//     try {
//         console.log(req.params);
//         console.log(req.query);
//
//         const params = {
//             // Bucket: 'nexyra-s3',
//             // Bucket: 'nurebo-s3',
//             Bucket: process.env.AWS_BUCKET_NAME,
//             // Key: "pexels-cottonbro-3826676.jpg"
//             // Key: "image/user/11/6b3d3928-9084-4352-bd38-b909f2e955bd.jpg"
//             // Key: req.params.path
//             Key: req.query.path,
//         };
//
//         s3.getObject(params, (err, data) => {
//             if (err) {
//                 console.error(err);
//                 res.status(500).send('');
//             } else {
//                 console.log(data)
//
//                 res.set('Content-Type', 'image/jpeg');
//                 // res.set('Content-Type', 'image/png');
//                 // res.set('Content-Type', image.mimetype);
//                 res/*.status(226)*/.send(data.Body);
//                 // res.send('data.Body');
//             }
//         });
//
//     } catch (error) {
//         console.error('Errore durante l\'invio dell\'immagine:', error);
//         res.status(500).send('Errore durante l\'invio dell\'immagine');
//     }
// });

Router.get('/', async (req, res) => {
    try {
        // console.log(req.params);
        // console.log(req.query);

        const params = {
            // Bucket: 'nexyra-s3',
            // Bucket: 'nurebo-s3',
            Bucket: process.env.AWS_BUCKET_NAME,
            // Key: "pexels-cottonbro-3826676.jpg"
            // Key: "image/user/11/6b3d3928-9084-4352-bd38-b909f2e955bd.jpg"
            // Key: req.params.path
            Key: req.query.path,
            Expires: 3600/*10*/, // Durata in secondi per cui l'URL sarà valido
        };

        /*const signedUrl = await*/ s3.getSignedUrl('getObject', params, (err, signedUrl) => {
            if (err) {
                console.error(err);
                res.status(500).send('');
            } else {
                // console.log(signedUrl)

                res.send(signedUrl);
            }
        });

        // res.send(signedUrl);

    } catch (error) {
        console.error('Errore durante l\'invio dell\'immagine:', error);
        res.status(500).send('Errore durante l\'invio dell\'immagine');
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