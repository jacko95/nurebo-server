const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const { v4: uuidv4 } = require('uuid');
const checkBusinessAuth = require("../middleware/checkBusinessAuth");
const checkBusiness = require("../middleware/checkBusiness");


// ================================= GET ALL DATES ================================
Router.get('/', (req, res) => {
    //console.log(req.body);

    const sql = "SELECT * FROM occupied_booking";
    db.query(sql, (err, rows) => {
        //console.log(rows);
        if (err) console.log(err);
        res.json(rows);
    })
});

// ================================= GET A DATES BY ID ================================
Router.post("/id", (req, res) => {
    let id = req.body.id;
    //console.log(id);

    const sql = `SELECT * FROM occupied_booking WHERE id = ?`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        // res.redirect('/category');
        res.json(result);
    });
});

// ================================= GET A EVENT MANAGER'S DATES ================================
// Router.post("/weekday", (req, res) => {
//
//     let weekday = req.body.weekday;
//     let businessId = req.body.business_id;
//     // //console.log(eventBusinessId);
//
//     const sql = `SELECT *
//                     FROM timetable
//                     WHERE business_id = '${businessId}' AND weekday_id = ${weekday}
//                     ORDER BY open_at_hour ASC`;
//
//     db.query(sql, (err, result) => {
//         if (err) {
//             //console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

// ================================= GET ALL USER'S DATES ================================
Router.get("/business", (req, res) => {
    let businessId = req.body.business_id;
    // //console.log(eventBusinessId);

    const sql = `SELECT * 
                 FROM occupied_booking
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

// ================================= GET A new booking ================================
Router.post("/", checkBusinessAuth, checkBusiness, (req, res) => {
    let businessId = req.body.business_id;
    let occupiedFrom = req.body.occupied_from;
    let occupiedUntil = req.body.occupied_until;
    let id = uuidv4();

    const sql = `INSERT INTO occupied_booking(id, business_id, occupied_from, occupied_until, created_at) 
                 VALUES(?, ?, ?, ?, ?)`;
    db.query(sql, [id, businessId, occupiedFrom, occupiedUntil, new Date(Date.now()).toISOString()], (err, result) => {
        if (err) {
            //console.log(err)
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET A new booking ================================
Router.delete("/", checkBusinessAuth, checkBusiness, (req, res) => {
    let businessId = req.body.business_id;
    let occupiedFrom = req.body.occupied_from;
    let occupiedUntil = req.body.occupied_until;
    //console.log(businessId);
    //console.log(occupiedFrom);
    //console.log(occupiedUntil);

    const sql = `DELETE FROM occupied_booking 
                    WHERE occupied_from = ? 
                    AND occupied_until = ? 
                    AND business_id = ?`;
    db.query(sql, [occupiedFrom, occupiedUntil, businessId], (err, result) => {
        if (err) {
            //console.log(err)
            return res.status(500).send(err);
        }
        res.json(result);
    });
});


// ================================= GET A EVENT MANAGER'S SINGLE EVENT ================================
// Router.post("/booking", (req, res) => {
//
//     let singleEventId = req.body.event_id;
//     let singleEventTitle = req.body.title;
//     let singleEventDescription = req.body.description;
//     let singleEventEndAt = req.body.end_at;
//     let singleEventBeginAt = req.body.begin_at;
//
//     const sql = `UPDATE event SET title = '${singleEventTitle}', description = '${singleEventDescription}',
//                     begin_at = '${singleEventBeginAt}', end_at = '${singleEventEndAt}' WHERE id = ${singleEventId}`;
//     db.query(sql, (err, result) => {
//         if (err) {
//             //console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

// // ================================= upbooking cover image ================================
// Router.post('/upload_image', upload.single('eventImage'), (req, res) => {
//     // //console.log(req.file);
//     let singleEventId = req.body.event_id;
//     //console.log(singleEventId);
//     //console.log(req.file);
//     // let url = 'http://192.168.1.252/kadingira-server';
//     // let postPath = req.file.destination.substring(1);
//     // let filename = req.file.originalname;
//     //
//     // let sql1 = `UPDATE event SET image = '${url}${postPath}${filename}'
//     //                 WHERE id = '${singleEventId}'`;
//     //
//     // db.query(sql1, (err, result) => {
//     //     if (err) {
//     //         console.log(err);
//     //         return res.status(500).send(err);
//     //     }
//     //     res.json(result);
//     // });
// });

module.exports = Router;