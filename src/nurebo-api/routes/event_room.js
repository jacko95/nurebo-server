const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const { v4: uuidv4 } = require('uuid');
// const schedule = require('node-schedule')


// ================================= DELETE room BY ID ================================
Router.delete('/id',(req, res) => {
    let roomId = req.body.id;
    // //console.log(roomId);

    let sql = `DELETE FROM event_room WHERE id = '${roomId}'`;
    db.query(sql, (err, result) => {
      if(err) throw err;
      // let messaggio = "ciccio";
      res.json(result.affectedRows);
    });
  }
);

// ================================= GET ALL rooms ================================
Router.get('/', (req, res) => {
    // let action = req.body.action;
    // //console.log(req.body);

    const sql = `SELECT * FROM event_room`;
    db.query(sql, (err, rows) => {
        // //console.log(rows);
        if (err) throw err;
        res.json(rows);
    })
});

// ================================= GET A room BY ITS ID ================================
Router.post("/id", (req, res) => {

    let id = req.body.id;
    // //console.log(id);

    const sql = `SELECT * FROM event_room WHERE id = "${id}"`;

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

Router.post("/event", (req, res) => {
    let singleEventId = req.body.event_id;
    // //console.log(singleEventId);

    const sql = `SELECT event_room.id AS event_room_id, event_room.text AS event_room_text,
                        event_room.is_visible AS event_room_is_visible, event_room.sent_at AS event_room_sent_at,

                        user.username, user.email, user.first_name, user.name AS user_name,
                        user.profile_image AS user_profile_image, user.description AS user_description, user.id AS user_id,

                        event.title AS event_title, event.id,
                        event.description AS event_description,
                        event.begin_at AS event_begin_at, event.end_at AS event_end_at,
                     /*event.is_visible AS single_event_is_visible, */event.image AS event_image
                 FROM event_room
                          JOIN user ON event_room.sender_id = user.id
                          JOIN event ON event.id = event_room.event_id
                 WHERE event.id = ?
                 ORDER BY sent_at ASC`;
    db.query(sql, [singleEventId], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET rooms BY USER ID ================================
Router.post("/user_id", (req, res) => {
    let userId = req.body.user_id;
    // //console.log(userId);

    const sql = `SELECT * 
                    FROM event_room 
                    JOIN event ON event.id = event_room.single_event_id
                    JOIN business ON business.id = event.business_id
                    WHERE sender_id = '${userId}' AND event.is_visible = 1`;

    db.query(sql, [], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET A SINGLE EVENT TICKET CATEGORY'S SINGLE EVENT ================================
Router.post("/insert", (req, res) => {
    // let chatId = req.body.chat_id;
    let senderId = req.body.sender_id;
    let singleEventId = req.body.event_id;
    let text = req.body.text;
    let sentAt = req.body.sent_at;
    let id = uuidv4();

    let query = `INSERT INTO event_room(id, sender_id, event_id, text, sent_at)
                    VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [id, senderId, singleEventId, text, sentAt], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        //dovrebbe funzionare questo job
        /*const someDate = new Date(sentAt)//italia = UTC+1
        var d2 = new Date(someDate);
        d2.setMinutes(someDate.getMinutes() + 1);
        schedule.scheduleJob('mmm', /!*someDate*!/d2, ( ) => {
            //console.log('job eseguito alle', new Date().toString())
            let sql = `DELETE FROM single_event_room WHERE id = '${id}'`;
            db.query(sql, (err, result) => {
                if(err) throw err;
                // let messaggio = "ciccio";
                schedule.cancelJob('mmm')
                // res.json(result.affectedRows);
            });
        })*/

        // schedule.cancelJob('mmm')
        res.status(200).json(result);
    });
});

module.exports = Router;