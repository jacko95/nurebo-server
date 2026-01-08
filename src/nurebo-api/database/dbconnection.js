// const mysql = require('mysql');
const mysql = require('mysql2');
// const mysql = require('mysql2/promise');


// // REMOTE PROD
// require('dotenv').config();
// // const db = mysql.createConnection({
// const db = mysql.createPool({
//     host: process.env.DB_PROD_HOST,
//     port: process.env.DB_PROD_PORT,
//     user: process.env.DB_PROD_USER,
//     password: process.env.DB_PROD_PASSWORD,
//     database: process.env.DB_PROD_NAME,
//     // connectionLimit: 50,
//     // debug: false,
//     // multipleStatements: false//?????per sql injection
//     // waitForConnection: true,
//     // queueLimit: 0,
// });

// // REMOTE DEV
// require('dotenv').config();
// // const db = mysql.createConnection({
// const db = mysql.createPool({
//     host: process.env.DB_DEV_HOST,
//     port: process.env.DB_DEV_PORT,
//     user: process.env.DB_DEV_USER,
//     password: process.env.DB_DEV_PASSWORD,
//     database: process.env.DB_DEV_NAME,
//     // connectionLimit: 50,
//     // debug: false,
//     // multipleStatements: false//?????per sql injection
//     // waitForConnection: true,
//     // queueLimit: 0,
// });

//LOCAL
// require('dotenv').config({ path: './src/nurebo-api/.env' });
// LOCAL WSL
require('dotenv').config();
// const db = mysql.createConnection({
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    // multipleStatements: false//?????per sql injection
});

// // connect to database
// db.connect((err) => {
//     if (err) {
//         console.log(err);
//     }
//     console.log('Connected to database ');
// });

// db.changeUser({
//     database : 'nexyra'
// }, (err) => {
//     if (err) {
//         console.log('Error in changing database', err);
//     }
//     // Do another query
// })

// Attempt to catch disconnects
db.on('connection', function (connection) {
    console.log('DB Connection established');

    // // Imposta il fuso orario UTC per la sessione corrente
    // db.query('SET time_zone = "+00:00"', (err, result) => {
    //     if (err) {
    //         console.log(err)
    //         throw err;
    //     }
    //     console.log('Fuso orario UTC impostato con successo');
    // });

    // connection.on('open', function (err) {
    //     console.error(new Date(), 'MySQL open', err);
    // });

    connection.on('error', function (err) {
        // console.error(new Date(), 'MySQL error', err.code);
        console.error(new Date(), 'MySQL error', err);
    });

    connection.on('close', function (err) {
        console.error(new Date(), 'MySQL close', err);
    });
});

// db.getConnection(function(err, connection) {
//     console.log('db.getConnection')
//     if (err) {
//         connection.release();
//         console.log(err);
//         console.log(err);
//     }
//
//     // connection.query(query, function(err,rows){
//     //     connection.release();
//     //     if(!err) {
//     //         callback(null, {rows: rows});
//     //     }
//     // });
//
//     connection.on('error', function(err) {
//         console.log(err);
//         console.log(err);
//     });
// });

// function startConnection() {
//     console.error('CONNECTING');
//     connection = mysql.createConnection(config.mysql);
//     connection.connect(function(err) {
//         if (err) {
//             console.error('CONNECT FAILED', err.code);
//             startConnection();
//         }
//         else
//             console.error('CONNECTED');
//     });
//     connection.on('error', function(err) {
//         if (err.fatal)
//             startConnection();
//     });
// }
//
// startConnection();
//
// // testing a select every 3 seconds :
// // to try the code you can stop mysql service => select will fail
// // if you start mysql service => connection will restart correctly => select will succeed
// setInterval(function() {
//     connection.query('select 1', function(err, results) {
//         if (err) console.log('SELECT', err.code);
//         else console.log('SELECT', results);
//     });
// }, 3000);

module.exports = db;
// module.exports = db.promise();