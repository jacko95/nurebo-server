const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const checkDev = require("../middleware/checkDev");


Router.get('/', /*checkDev,*/ (req, res) => {
    try {
        const sql = "SELECT * FROM version";
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

Router.get('/last', /*checkDev,*/ (req, res) => {
    try {
        let action = req.body.action;
        // //console.log(req.body);

        // if(action === 'GET') {
        const sql = `SELECT * 
                        FROM version
                        ORDER BY id DESC
                        LIMIT 1`;
        db.query(sql, (err, rows) => {
            // //console.log(rows);
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // //console.log(rows)
            res.json(rows);
        })
        // }
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post("/:id", (req, res) => {
Router.post("/:id", /*checkDev,*/ (req, res) => {
    try {
        // let id = req.body.id;
        let id = req.params.id;

        const sql = `SELECT * FROM version WHERE id = ?`;
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

module.exports = Router;