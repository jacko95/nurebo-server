const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const { v4: uuidv4 } = require('uuid');


Router.delete('/',(req, res) => {

    let chatId = req.body.id;
    //console.log(chatId);

    let sql = `DELETE FROM chat WHERE id = ?`;
    db.query(sql, [chatId], (err, result) => {
      if(err) throw err;
      let messaggio = "ciccio";
      res.json(result.affectedRows);
    });
  }
);


// ================================= GET ALL CHATS ================================
Router.get('/', (req, res) => {
    // let action = req.body.action;
    //console.log(req.body);

    const sql = "SELECT * FROM chat";
    db.query(sql, (err, rows) => {
        //console.log(rows);
        if (err) throw err;
        res.json(rows);
    })
});

// ================================= GET A CHAT BY ITS ID ================================
Router.post("/id", (req, res) => {
    let id = req.body.id;
    // //console.log(id);

    const sql = `SELECT * FROM chat WHERE id = ?`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET A CHAT BY USER ID ================================
Router.post("/user_id", (req, res) => {
    let id = req.body.user_id;
    // //console.log(id);

    const sql = `SELECT * FROM chat 
    WHERE chat.user_a_id = ? OR chat.user_b_id = ?`;

    db.query(sql, [id, id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET A CHAT BY USERs ID ================================
Router.post("/users", (req, res) => {
    let aId = req.body.a_id;
    let bId = req.body.b_id;
    //console.log('aId0');
    //console.log(aId);
    //console.log('bId0');
    //console.log(bId);
    let id = uuidv4();

    const sql = `SELECT DISTINCT chat.id, user_a_id, user_b_id, chat.created_at, user_a_last_opening_at, user_b_last_opening_at
                    FROM chat
                        JOIN user AS sender ON sender.id = chat.user_a_id
                        JOIN user AS receiver ON receiver.id = chat.user_b_id
                    WHERE sender.id = ? AND receiver.id = ? OR sender.id = ? AND receiver.id = ?`;
    db.query(sql, [aId, bId, bId, aId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if (result.length > 0) {
            //console.log(result);
            res.json(result);
        }
        else /*if (result.length === 0)*/{
            //console.log(result);
            let sql = `INSERT INTO chat(id, user_a_id, user_b_id, created_at) 
                       VALUES(?, ?, ?, UTC_TIMESTAMP())`;
            db.query(sql, [id, aId, bId,], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                //console.log(result);
                // res.redirect('/category');
                res.json(result);
            });
        }
        // res.json(result);
    });
});

// ================================= GET All user CHAT ================================
Router.post("/user", (req, res) => {
    let userId = req.body.user_id;
    //console.log('userId4564');
    //console.log(userId);

    // SELECT DISTINCT chat.id, IF(usera.id <> '${userId}', usera.id, '') AS a_id, usera.username AS a_username,
    //     usera.profile_image AS a_profile_image, IF(userb.id <> '${userId}', userb.id, '') AS b_id, userb.username AS b_username,
    //     userb.profile_image AS b_profile_image, chat_message.sent_at, chat_message.text
    // FROM chat
    // JOIN user AS usera ON usera.id = chat.user_a_id
    // JOIN user AS userb ON userb.id = chat.user_b_id
    // JOIN chat_message ON chat_message.chat_id = chat.id
    // WHERE chat.user_a_id = '11' OR chat.user_b_id = '11'
    // ORDER BY chat_message.sent_at DESC
    const sql = `SELECT DISTINCT chat.id, IF(usera.id <> ?, usera.id, '') AS a_id, usera.username AS a_username, 
    usera.profile_image AS a_profile_image, IF(userb.id <> ?, userb.id, '') AS b_id, userb.username AS b_username, 
    userb.profile_image AS b_profile_image, chat.user_a_last_opening_at, chat.user_b_last_opening_at,
    chat.user_a_last_closing_at, chat.user_b_last_closing_at,
    chat.user_b_last_closing_at, chat.is_visible_for_user_a, chat.is_visible_for_user_b
                    FROM chat
                        JOIN user AS usera ON usera.id = chat.user_a_id
                        JOIN user AS userb ON userb.id = chat.user_b_id
                    WHERE chat.user_a_id = ? OR chat.user_b_id = ?`;
    db.query(sql, [userId, userId, userId, userId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET All user CHAT ================================
Router.post("/user_a", (req, res) => {
    let userId = req.body.user_id;
    //console.log('userId4564');
    //console.log(userId);

    // SELECT DISTINCT chat.id, IF(usera.id <> '${userId}', usera.id, '') AS a_id, usera.username AS a_username,
    //     usera.profile_image AS a_profile_image, IF(userb.id <> '${userId}', userb.id, '') AS b_id, userb.username AS b_username,
    //     userb.profile_image AS b_profile_image, chat_message.sent_at, chat_message.text
    // FROM chat
    // JOIN user AS usera ON usera.id = chat.user_a_id
    // JOIN user AS userb ON userb.id = chat.user_b_id
    // JOIN chat_message ON chat_message.chat_id = chat.id
    // WHERE chat.user_a_id = '11' OR chat.user_b_id = '11'
    // ORDER BY chat_message.sent_at DESC
    const sql = `SELECT DISTINCT chat.id, IF(usera.id <> ?, usera.id, '') AS a_id, usera.username AS a_username, 
    usera.profile_image AS a_profile_image, IF(userb.id <> ?, userb.id, '') AS b_id, userb.username AS b_username, 
    userb.profile_image AS b_profile_image, chat.user_a_last_opening_at, chat.user_b_last_opening_at,
    chat.user_a_last_closing_at, chat.user_b_last_closing_at,
    chat.user_b_last_closing_at, chat.is_visible_for_user_a, chat.is_visible_for_user_b
                    FROM chat
                        JOIN user AS usera ON usera.id = chat.user_a_id
                        JOIN user AS userb ON userb.id = chat.user_b_id
                    WHERE chat.user_a_id = ? OR chat.user_b_id = ?
                    AND chat.is_visible_for_user_a = '1'`;
    db.query(sql, [userId, userId, userId, userId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET All user CHAT ================================
Router.post("/user_b", (req, res) => {

    let userId = req.body.user_id;
    //console.log('userId4564');
    //console.log(userId);

    // SELECT DISTINCT chat.id, IF(usera.id <> '${userId}', usera.id, '') AS a_id, usera.username AS a_username,
    //     usera.profile_image AS a_profile_image, IF(userb.id <> '${userId}', userb.id, '') AS b_id, userb.username AS b_username,
    //     userb.profile_image AS b_profile_image, chat_message.sent_at, chat_message.text
    // FROM chat
    // JOIN user AS usera ON usera.id = chat.user_a_id
    // JOIN user AS userb ON userb.id = chat.user_b_id
    // JOIN chat_message ON chat_message.chat_id = chat.id
    // WHERE chat.user_a_id = '11' OR chat.user_b_id = '11'
    // ORDER BY chat_message.sent_at DESC
    const sql = `SELECT DISTINCT chat.id, IF(usera.id <> ?, usera.id, '') AS a_id, usera.username AS a_username, 
    usera.profile_image AS a_profile_image, IF(userb.id <> ?, userb.id, '') AS b_id, userb.username AS b_username, 
    userb.profile_image AS b_profile_image, chat.user_a_last_opening_at, chat.user_b_last_opening_at,
    chat.user_a_last_closing_at, chat.user_b_last_closing_at, chat.user_b_last_closing_at, 
    chat.is_visible_for_user_a, chat.is_visible_for_user_b
                    FROM chat
                        JOIN user AS usera ON usera.id = chat.user_a_id
                        JOIN user AS userb ON userb.id = chat.user_b_id
                    WHERE chat.user_a_id = ? OR chat.user_b_id = ?
                    AND chat.is_visible_for_user_b = '1'`;
    db.query(sql, [userId, userId, userId, userId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET All user CHAT ================================
Router.post("/update_user_a_last_opening", (req, res) => {
    let userAId = req.body.user_a_id;
    let userBId = req.body.user_b_id;
    let chatId = req.body.chat_id;
    let time = req.body.time;
    //console.log('userAId');
    //console.log(userAId);
    //console.log('userBId');
    //console.log(userBId);

    // const sql = `UPDATE chat SET user_a_last_opening_at = UTC_TIMESTAMP()
    //                 WHERE user_a_id = '${userAId}' AND user_b_id = '${userBId}'`;
const sql = `UPDATE chat SET user_a_last_opening_at = UTC_TIMESTAMP() 
                    WHERE id = ?`;
    db.query(sql, [chatId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET All user CHAT ================================
Router.post("/update_user_b_last_opening", (req, res) => {
    let userAId = req.body.user_a_id;
    let userBId = req.body.user_b_id;
    let chatId = req.body.chat_id;
    let time = req.body.time;
    //console.log('userAId');
    //console.log(userAId);
    //console.log('userBId');
    //console.log(userBId);

    // const sql = `UPDATE chat SET user_b_last_opening_at = UTC_TIMESTAMP()
    //                 WHERE user_a_id = '${userAId}' AND user_b_id = '${userBId}'`;
    const sql = `UPDATE chat SET user_b_last_opening_at = UTC_TIMESTAMP() 
                    WHERE id = ?`;

    db.query(sql, [chatId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET All user CHAT ================================
Router.post("/update_user_a_last_closing", (req, res) => {
    let userAId = req.body.user_a_id;
    let userBId = req.body.user_b_id;
    let chatId = req.body.chat_id;
    let time = req.body.time;
    //console.log('userAId');
    //console.log(userAId);
    //console.log('userBId');
    //console.log(userBId);

    // const sql = `UPDATE chat SET user_a_last_opening_at = UTC_TIMESTAMP()
    //                 WHERE user_a_id = '${userAId}' AND user_b_id = '${userBId}'`;
    const sql = `UPDATE chat SET user_a_last_closing_at = UTC_TIMESTAMP() 
                    WHERE id = ?`;

    db.query(sql, [chatId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// ================================= GET All user CHAT ================================
Router.post("/update_user_b_last_closing", (req, res) => {
    let userAId = req.body.user_a_id;
    let userBId = req.body.user_b_id;
    let chatId = req.body.chat_id;
    let time = req.body.time;
    //console.log('userAId');
    //console.log(userAId);
    //console.log('userBId');
    //console.log(userBId);

    // const sql = `UPDATE chat SET user_b_last_opening_at = UTC_TIMESTAMP()
    //                 WHERE user_a_id = '${userAId}' AND user_b_id = '${userBId}'`;
    const sql = `UPDATE chat SET user_b_last_closing_at = UTC_TIMESTAMP() 
                    WHERE id = ?`;

    db.query(sql, [chatId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

module.exports = Router;