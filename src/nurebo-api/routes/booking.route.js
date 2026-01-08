const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const { v4: uuidv4 } = require('uuid');
// const multer = require('multer');
// const axios = require('axios');
// const socket = require('../index'); //import socket  from app.js
// const nodemailer = require('nodemailer');
const checkUserAuth = require("../middleware/checkUserAuth");
const checkUser = require("../middleware/checkUser");
// const checkBusinessAuth = require("../middleware/checkBusinessAuth");
// const checkBusiness = require("../middleware/checkBusiness");
// const checkDev = require("../middleware/checkDev");


Router.get("/post", /*checkDev,*/ (req, res, next) => {
    try {
        const sql = `SELECT booking_post.id, booking_post.user_id, booking_post.image_url, booking_post.booking_id,
                            booking_post.review, booking_post.vote, booking_post.created_at,

                            booking.id AS booking_id, booking.created_at AS booking_created_at, booking.begin_at, booking.note, booking.is_canceled,
                            booking.prestazione_id,

                            user.profile_image AS user_profile_image, user.email AS user_email, user.username,
                            user.phone AS user_phone, user.name AS user_name, user.description AS user_description,

                            prestazione.price AS prestazione_price, prestazione.price_min AS prestazione_price_min, prestazione.price_max AS prestazione_price_max, prestazione.is_price_range AS prestazione_is_price_range,  
                            prestazione.created_at AS prestazione_created_at,
                            prestazione.duration AS prestazione_duration, prestazione.description AS prestazione_description,
                            prestazione.image AS prestazione_image, prestazione.title AS prestazione_title, prestazione.is_valid AS prestazione_is_valid,

                            business.max_contemporary_appointments, business.email AS business_email, business.profile_image AS business_profile_image,
                            business.name AS business_name, business.id AS business_id, business.address AS business_address,
                            /*business.email_notification AS business_email_notification,*/
                            business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                            business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id

                     FROM booking_post
                              LEFT JOIN booking ON booking.id = booking_post.booking_id
                              LEFT JOIN prestazione ON prestazione.id = booking.prestazione_id
                              LEFT JOIN business ON business.id = prestazione.business_id
                              LEFT JOIN user ON user.id = booking_post.user_id
                      WHERE business.is_visible = 1 AND user.is_deleted = 0
                     ORDER BY booking_post.created_at`;
        db.query(sql, (err, result) => {
            //console.log(rows);
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            res.status(202).json(result);
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.get("/:id", /*checkDev,*/ (req, res) => {
//     let id = req.body.id;
//     // //console.log(id);
//
//     const sql = `SELECT * FROM booking WHERE id = ?`;
//     db.query(sql, [id], (err, result) => {
//         if (err) {
//             console.log(err)
//             return res.status(500).send(err);
//         }
//         // res.redirect('/category');
//         res.json(result);
//     });
// });

Router.get("/post/is_visible", /*checkDev,*/ (req, res) => {
    try {
        const sql = `SELECT *
        FROM booking_post
        JOIN user ON user.id = booking_post.user_id
        WHERE booking_post.is_visible = 1 AND user.is_deleted = 0`;
        db.query(sql, (err, rows) => {
            //console.log(rows);
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

Router.get("/post/:id", checkUserAuth, /*checkUser,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM booking_post WHERE id = ?`;
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

Router.delete("/post/:id", checkUserAuth, checkUser, (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `UPDATE booking_post SET is_visible = ?
                    WHERE id = ?`;
        db.query(sql, [0, id], (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // res.json(result);
            res.json({
                id
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/post/comment", /*checkDev,*/ (req, res) => {
    try {
        const sql = "SELECT * FROM booking_post_comment";
        db.query(sql, (err, rows) => {
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

Router.get("/post/comment/:id", /*checkDev,*/ (req, res) => {
    try {
        let id = req.params.id;

        const sql = `SELECT *
                    FROM booking_post_comment
                    WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
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

Router.get("/post/:post_id/comment", /*checkAuth,*/ (req, res) => {
    try {
        // let postId = req.body.post_id;
        let postId = req.params.post_id;

        const sql = `SELECT booking_post_comment.id, booking_post_comment.text, booking_post_comment.is_visible, booking_post_comment.created_at,

                        user.profile_image AS user_profile_image, user.email AS user_email, user.username,
                        user.phone AS user_phone, user.name AS user_name, user.description AS user_description

                    FROM booking_post_comment
                    JOIN user ON user.id = booking_post_comment.user_id
                    WHERE booking_post_id = ? AND user.is_deleted = 0
                    ORDER BY booking_post_comment.created_at DESC`;
        db.query(sql, [postId], (err, result) => {
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

Router.post("/post/:post_id/comment", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        let postId = req.body.post_id;
        let text = req.body.text;
        let postCommentId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'

        let query = `INSERT INTO booking_post_comment(id, user_id, booking_post_id, text, created_at)
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

Router.delete("/post/comment/:id", checkUserAuth, checkUser, (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        let sql = `DELETE FROM booking_post_comment
                WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) throw err;
            // let messaggio = "ciccio";
            res.json(result.affectedRows);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.post("/post/:post_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        // let postId = req.body.post_id;
        let postId = req.params.post_id;

        let sql1 = `SELECT *
                FROM booking_post_like
                WHERE user_id = ? AND booking_post_id = ?`;
        db.query(sql1, [userId, postId], (err, result) => {
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
                let sql = `INSERT INTO booking_post_like(user_id, booking_post_id, created_at)
                VALUES(?, ?, ?)`;
                db.query(sql, [userId, postId, new Date(Date.now()).toISOString()], (err, result) => {
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

Router.delete("/post/:post_id/like", checkUserAuth, checkUser, (req, res) => {
    try {
        let userId = req.body.user_id;
        // let postId = req.body.post_id;
        let postId = req.params.post_id;

        let sql = `DELETE FROM booking_post_like
                WHERE user_id = ? AND booking_post_id = ?`;
        db.query(sql, [userId, postId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // let messaggio = "ciccio";
            res.json(result.affectedRows);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

Router.get("/post/:post_id/like", (req, res) => {
    try {
        // let bookingPostId = req.body.post_id;
        let bookingPostId = req.params.post_id;

        //console.log(businessPostId);
        console.log(bookingPostId);

        // SELECT *
        // FROM post_like
        // JOIN post ON post.id = post_like.post_id
        // WHERE post_like.user_id = ${userId}
        // let sql = `SELECT DISTINCT *
        //             FROM booking_post_like
        //             WHERE booking_post_like.booking_post_id = ?
        //             ORDER BY booking_post_like.created_at DESC`;
        let sql = `SELECT booking_post_like.user_id, booking_post_like.booking_post_id, booking_post_like.created_at,

                      user.profile_image AS user_profile_image, user.email AS user_email, user.username,
                      user.phone AS user_phone, user.name AS user_name, user.description AS user_description

               FROM booking_post_like
                        JOIN user ON user.id = booking_post_like.user_id
               WHERE booking_post_id = ? AND user.is_deleted = 0
               ORDER BY booking_post_like.created_at DESC`;
        // let sql = `SELECT *
        //             FROM post_like
        //             WHERE user_id = ${userId} AND post_id = ${postId}`;
        db.query(sql, [bookingPostId], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            // console.log(result)
            // console.log(result.length)
            res.json(result);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

module.exports = Router;