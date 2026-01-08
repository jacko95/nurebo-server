const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const { v4: uuidv4 } = require('uuid');
const checkBusinessAuth = require("../middleware/checkBusinessAuth");
const checkBusiness = require("../middleware/checkBusiness");
const checkDev = require("../middleware/checkDev");


// Router.get('/', (req, res) => {
//     // let action = req.body.action;
//     // //console.log(req.body);
//
//     // if(action === 'GET') {
//         const sql = "SELECT * FROM timetable";
//         db.query(sql, (err, rows) => {
//             // //console.log(rows);
//             if (err) console.log(err);
//             res.json(rows);
//         })
//     // }
// });

// Router.post("/id", (req, res) => {
Router.get("/timetable/:id", /*checkDev,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM timetable WHERE id = ?`;
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

// Router.post("/weekday", (req, res) => {
Router.get("/business/:business_id/timetable/weekday/:weekday", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // let weekday = req.body.weekday;
        // let businessId = req.body.business_id;
        let weekday = req.params.weekday;
        let businessId = req.params.business_id;

        const sql = `SELECT * 
                    FROM timetable 
                    WHERE business_id = ? AND weekday_id = ?
                    ORDER BY open_at_hour ASC`;
        db.query(sql, [businessId, weekday], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            // console.log(result);
            // console.log(result[0]);
            res.json(result);
            // res.json(result[0]);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.put('/', async (req, res) => {
//     console.log('req.body 00');
//     console.log(req.body);
//
//     for(let i = 0; i < req.body.length; i++){
//         let weekdayId = req.body[i].weekday_id;
//         let timetableId = req.body[i].id;
//         let businessId = req.body[i].business_id;
//         let openAtHour = req.body[i].open_at_hour;
//         let openAtMinute = req.body[i].open_at_minute;
//         let closeAtHour = req.body[i].close_at_hour;
//         let closeAtMinute = req.body[i].close_at_minute;
//         let id = uuidv4();
//
//         if(req.body[i].is_new) {
//             const sql = `INSERT INTO timetable(id, business_id, weekday_id, open_at_hour, open_at_minute, close_at_hour, close_at_minute)
//                  VALUES(?, ?, ?, ?, ?, ?, ?)`;
//             db.query(sql, [id, businessId, weekdayId, openAtHour, openAtMinute, closeAtHour, closeAtMinute], (err, result) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//             });
//         }
//         else {
//             const sql1 = `UPDATE timetable SET weekday_id = ? , open_at_hour = ?, open_at_minute = ?, close_at_hour = ?, close_at_minute = ?
//                       WHERE id = ?`;
//             db.query(sql1, [weekdayId, openAtHour, openAtMinute, closeAtHour, closeAtMinute, timetableId], (err, rows) => {
//                 if (err) {
//                     console.log(err)
//                     return res.status(500).send(err);
//                 }
//             });
//         }
//     }
//
//     return res.status(200).send(req.body);
// });

// Router.put('/', async (req, res) => {
Router.put("/business/:business_id/timetable", checkBusinessAuth, checkBusiness, async (req, res) => {
    try {
        console.log('req.body 00');
        console.log(req.body);
        // console.log('req.body[0] 00');
        // console.log(req.body[0]);

        let sql0 = `DELETE FROM timetable WHERE business_id = ?`;
        await db.promise().query(sql0, [req.body[0].business_id]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            for (let i = 0; i < req.body.length; i++) {
                let weekdayId = req.body[i].weekday_id;
                let timetableId = req.body[i].id;
                let businessId = req.body[i].business_id;
                let openAtHour = req.body[i].open_at_hour;
                let openAtMinute = req.body[i].open_at_minute;
                let closeAtHour = req.body[i].close_at_hour;
                let closeAtMinute = req.body[i].close_at_minute;
                let id = uuidv4();

                // if(req.body[i].is_new) {
                const sql = `INSERT INTO timetable(id, business_id, weekday_id, open_at_hour, open_at_minute, close_at_hour, close_at_minute)
                 VALUES(?, ?, ?, ?, ?, ?, ?)`;
                await db.promise().query(sql, [id, businessId, weekdayId, openAtHour, openAtMinute, closeAtHour, closeAtMinute]).then((result, err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }

                    console.log('result');
                    console.log(result);
                });
                // }
                // else {
                //     const sql1 = `UPDATE timetable SET weekday_id = ?, open_at_hour = ?, open_at_minute = ?, close_at_hour = ?, close_at_minute = ?
                //           WHERE id = ?`;
                //     await db.promise().query(sql1, [weekdayId, openAtHour, openAtMinute, closeAtHour, closeAtMinute, timetableId]).then((result, err) => {
                //         if (err) {
                //             console.log(err)
                //             return res.status(500).send(err);
                //         }
                //
                //         console.log('result');
                //         console.log(result);
                //     });
                // }
            }

            // return res.status(200).send(req.body);
        });

        let sql4 = `SELECT * FROM timetable WHERE business_id = ?`;
        db.promise().query(sql4, [req.body[0].business_id]).then((result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            console.log('result555');
            console.log(result[0]);
            return res.status(200).send(result[0]);
            // return res.status(200).send(req.body);
        });

        // return res.status(200).send(req.body);
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.delete('/', async (req, res) => {
Router.delete("/business/:business_id/timetable", checkBusinessAuth, checkBusiness, async (req, res) => {
    try {
        console.log('req.body delete');
        console.log(req.body);

        let sql0 = `DELETE FROM timetable WHERE business_id = ?`;
        db.query(sql0, [req.body.business_id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }

            return res.status(200).send(req.body);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/booking_business/begin_at", (req, res) => {
//     let businessId = req.body.business_id;
//     let bookingBeginAtDay = req.body.begin_at_day;
//     let bookingBeginAtMonth = req.body.begin_at_month;
//     let bookingBeginAtYear = req.body.begin_at_year;
//
//     const sql = `SELECT *
//                  FROM booking
//                     JOIN prestazione ON prestazione_id = prestazione.id
//                     JOIN user ON user_id = user.id
//                  WHERE business_id = ?
//                     AND DAY(begin_at) = ?
//                     AND MONTH(begin_at) = ?
//                     AND YEAR(begin_at) = ?
//                  ORDER BY begin_at ASC`;
//     db.query(sql, [businessId, bookingBeginAtDay, bookingBeginAtMonth, bookingBeginAtYear], (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     });
// });

// Router.post("/business", (req, res) => {
Router.get("/business/:business_id/timetable", /*checkBusinessAuth, checkBusiness,*/ (req, res) => {
    try {
        // let businessId = req.body.business_id;
        let businessId = req.params.business_id;

        const sql = `SELECT * 
                 FROM weekday
                    JOIN timetable ON weekday.id = timetable.weekday_id
                 WHERE business_id = ?
                 ORDER BY weekday_id ASC`;
        db.query(sql, [businessId], (err, result) => {
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


module.exports = Router;