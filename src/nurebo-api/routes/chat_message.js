const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
// const io = require("../index").io;
// var server = http.createServer(app);
// const app = require('../index')
// const io = app.getSocketIo
const axios = require('axios');
const socket = require('../index'); //import socket  from app.js
const { v4: uuidv4 } = require('uuid');


// Get socket.io
// We pass a server, since socket io requires a server to run
// var io = require("socket.io")(require("../index")., {
//     cors: {
//         origin: "*"
//     }
// });

// Router.delete('/',(req, res) => {
//
//     let id = req.body.id;
//     //console.log(id);
//
//     let sql = "DELETE FROM chat_message WHERE id = " + id;
//     db.query(sql, (err, result) => {
//       if(err) throw err;
//       // let messaggio = "ciccio";
//       res.json(result.affectedRows);
//     });
//   }
// );

Router.post("/delete/both", (req, res) => {

    let senderId = req.body.sender_id;
    let receiverId = req.body.receiver_id;
    let text = req.body.text;
    let sentAt = req.body.sent_at;
    // //console.log('userAId');
    // //console.log(senderId);
    // //console.log('userBId');
    // //console.log(receiverId);

    const sql = `UPDATE chat_message SET is_visible_for_sender = 0,
                is_visible_for_receiver = 0
                    WHERE sender_id = ? AND receiver_id = ?
                    AND text = ? AND sent_at = ?`;
    db.query(sql, [senderId, receiverId, text, sentAt], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

Router.post("/edit/text", (req, res) => {
    let senderId = req.body.sender_id;
    let receiverId = req.body.receiver_id;
    let newText = req.body.new_text;
    let oldText = req.body.old_text;
    let sentAt = req.body.sent_at;
    // //console.log('userAId');
    // //console.log(senderId);
    // //console.log('userBId');
    // //console.log(receiverId);

    // const sql = `UPDATE chat_message SET text = "${newText}"
    //                 WHERE sender_id = '${senderId}' AND receiver_id = '${receiverId}'
    //                 AND text = "${oldText}" AND sent_at = '${sentAt}'`;
    const sql = `UPDATE chat_message SET text = ?
                    WHERE sender_id = ? AND receiver_id = ?
                    AND text = ? AND sent_at = ?`;
    db.query(sql, [newText, senderId, receiverId, oldText, sentAt], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

Router.post('/chat/all', (req, res) => {
    let userAId = req.body.user_a_id;
    let userBId = req.body.user_b_id;
    // //console.log('ernesto');
    // //console.log(userAId);
    // //console.log(userBId);

    // const sql = `SELECT DISTINCT chat.id AS chat_id, chat_message.sender_id, chat_message.receiver_id, chat_message.sent_at,
	// 		chat_message.text, user_receiver.username AS receiver_username, user_sender.username AS sender_username,
    //         user_receiver.profile_image AS receiver_profile_image, user_sender.profile_image AS sender_profile_image,
    //         chat.user_a_last_opening_at, chat.user_b_last_opening_at, chat.user_a_id, chat.user_b_id
    //                 FROM chat
    //                 JOIN chat_message ON chat_message.chat_id = chat.id
    //                 JOIN user AS user_sender ON chat_message.sender_id = user_sender.id
    //                 JOIN user AS user_receiver ON chat_message.receiver_id = user_receiver.id
    //                 WHERE chat.user_a_id = '${userAId}' AND chat.user_b_id = '${userBId}'
    //                 OR chat.user_b_id = '${userAId}' AND chat.user_a_id = '${userBId}'
    //                 ORDER BY chat_message.sent_at DESC
    //                 LIMIT 1`;
    const sql = `SELECT *
                    FROM chat_message 
                    WHERE chat_message.sender_id = ? AND chat_message.receiver_id = ?
                    OR chat_message.receiver_id = ? AND chat_message.sender_id = ?
                    ORDER BY chat_message.sent_at DESC`;
    db.query(sql, [userAId, userBId, userAId, userBId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });

});

Router.post('/chat/user_a/all', (req, res) => {
    let userAId = req.body.user_a_id;
    let userBId = req.body.user_b_id;
    // //console.log('ernesto');
    // //console.log(userAId);
    // //console.log(userBId);

    // const sql = `SELECT DISTINCT chat.id AS chat_id, chat_message.sender_id, chat_message.receiver_id, chat_message.sent_at,
    // 		chat_message.text, user_receiver.username AS receiver_username, user_sender.username AS sender_username,
    //         user_receiver.profile_image AS receiver_profile_image, user_sender.profile_image AS sender_profile_image,
    //         chat.user_a_last_opening_at, chat.user_b_last_opening_at, chat.user_a_id, chat.user_b_id
    //                 FROM chat
    //                 JOIN chat_message ON chat_message.chat_id = chat.id
    //                 JOIN user AS user_sender ON chat_message.sender_id = user_sender.id
    //                 JOIN user AS user_receiver ON chat_message.receiver_id = user_receiver.id
    //                 WHERE chat.user_a_id = '${userAId}' AND chat.user_b_id = '${userBId}'
    //                 OR chat.user_b_id = '${userAId}' AND chat.user_a_id = '${userBId}'
    //                 ORDER BY chat_message.sent_at DESC
    //                 LIMIT 1`;
    const sql = `SELECT *
                    FROM chat_message 
                    WHERE chat_message.sender_id = ? AND chat_message.receiver_id = ?
                    OR chat_message.receiver_id = ? AND chat_message.sender_id = ?
                    ORDER BY chat_message.sent_at DESC`;
    db.query(sql, [userAId, userBId, userAId, userBId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });

});

Router.post('/last', (req, res) => {
    let userAId = req.body.user_a;
    let userBId = req.body.user_b;
    // //console.log(userAId);
    // //console.log(userBId);

    // const sql = `SELECT *
    //                 FROM chat_message
    //                 WHERE chat_message.sender_id = '${userAId}' AND chat_message.receiver_id = '${userBId}'
    //                 OR chat_message.sender_id = '${userBId}' AND chat_message.receiver_id = '${userAId}'
    //                 ORDER BY sent_at DESC
    //                 LIMIT 1`;
    const sql = `SELECT DISTINCT chat.id AS chat_id, chat_message.sender_id, chat_message.receiver_id, chat_message.sent_at, 
			chat_message.text, user_receiver.username AS receiver_username, user_sender.username AS sender_username,
            user_receiver.profile_image AS receiver_profile_image, user_sender.profile_image AS sender_profile_image,
            user_receiver.name AS receiver_name, user_sender.name AS sender_name,
                
            chat.user_a_last_opening_at, chat.user_b_last_opening_at, chat.user_a_id, chat.user_b_id,
            chat.user_a_last_closing_at, chat.user_b_last_closing_at

                    FROM chat
                    JOIN chat_message ON chat_message.chat_id = chat.id
                    JOIN user AS user_sender ON chat_message.sender_id = user_sender.id
                    JOIN user AS user_receiver ON chat_message.receiver_id = user_receiver.id
                    WHERE chat.user_a_id = ? AND chat.user_b_id = ?
                    OR chat.user_b_id = ? AND chat.user_a_id = ?
                    ORDER BY chat_message.sent_at DESC
                    LIMIT 1`;
    db.query(sql, [userAId, userBId, userAId, userBId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });

});

Router.post('/user', (req, res) => {
    let userAId = req.body.a_id;
    let userBId = req.body.b_id;
    // //console.log(userAId);
    // //console.log(userBId);

    const sql = `SELECT DISTINCT sender.id AS sender_id, sender.username AS sender_username,
    sender.profile_image AS sender_profile_image, receiver.id AS receiver_id, receiver.username AS receiver_username,
    receiver.profile_image AS receiver_profile_image, text, sent_at
            FROM chat_message
                JOIN user AS sender ON sender.id = chat_message.sender_id
                JOIN user AS receiver ON receiver.id = chat_message.receiver_id
            WHERE sender.id = ? AND receiver.id = ? OR sender.id = ? 
            AND receiver.id = ?
                ORDER BY sent_at DESC`;
    db.query(sql, [userAId, userBId, userBId, userAId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json(result);
    });

});

Router.post("/insert", (req, res) => {
    let chatId = req.body.chat_id;
    let senderId = req.body.sender_id;
    let senderName = req.body.sender_name;
    let senderProfileImage = req.body.sender_profile_image;
    let receiverId = req.body.receiver_id;
    let text = req.body.text;
    let sentAt = req.body.sent_at;
    // //console.log(userId);
    let id = uuidv4();
    let array = [];
    console.log(req.body);

    // let postCommentId = uuidv4();// ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
    // //console.log(postCommentId);


    // io.on("connection", (socket) => {
    //     socket.on("broadcast-test", (msg, ack) => {
    //         // console.log(io.sockets.adapter.rooms);
    //         /*var era = */socket.broadcast.emit(
    //             'broad',
    //             'esquilo from everywhere',
    //         )
    //         ack('lumbasssa');
    //         // console.log(era);
    //     })
    //     // /*var era = */socket.broadcast.emit(
    //     //     'broad',
    //     //     'esquilo from everywhere',
    //     // )
    // });

    let query = `INSERT INTO chat_message(id, chat_id, sender_id, receiver_id, text, sent_at)
                    VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(query, [id, chatId, senderId, receiverId, text, sentAt], async (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        // const rooms = await socket.ioObject.of('/').adapter.allRooms();
        var rooms = await socket.ioObject.of('/').adapter.allRooms();
        console.log(`socket.ioObject.of('/').adapter.allRooms()`);
        console.log(rooms);

        var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
        console.log(`socket.ioObject.of('/').adapter.sockets`);
        console.log(sockets);

        var sids = await socket.ioObject.of('/').adapter.sids;
        console.log(`socket.ioObject.of('/').adapter.sids`);
        console.log(sids);

        var rooms1 = await socket.ioObject.of('/').adapter.rooms;
        console.log(`socket.ioObject.of('/').adapter.rooms`);
        console.log(rooms1);

        //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
        // if(socket.ioObject.sockets.adapter.rooms[req.body.business_id] === undefined) {
        if (rooms.has(chatId) && rooms.has(receiverId)) {
            //todo: wrappare emit in on
            socket.ioObject./*sockets.in(chatId)*/sockets.to(chatId)/*sockets.broadcast*/.emit(
                // "msg",
                // 'broad',
                'receive-message',
                // "Weriolllpingg",
                {
                    content: text,
                    senderId: senderId,
                    // senderUsername: ,
                    senderName: senderName,
                    senderProfileImage: senderProfileImage,
                    receiverId: receiverId,
                    chatId: chatId,
                    sentAt: sentAt,
                    // user_a_id: ,
                    // user_b_id: ,
                }
                // (response) => {
                //     console.log('allaahhhhhh')
                //     console.log(response)
                // }
            );

            // socket.ioObject.on("breadramp", (msg, ack) => {
            //     ack('simposio');
            //     console.log('msggione:');
            //     console.log(msg);
            // })
        }
        else {
            const sql15 = `SELECT fcm_token 
                             FROM user_device
                             WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND user_id = ?
                             ORDER BY RAND()
                             LIMIT 1000`;
            db.query(sql15, [receiverId], async (err, result6) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err);
                }
                console.log('result6');
                console.log(result6);

                for (let i = 0; i < result6.length; i++) {
                    console.log(result6[i].fcm_token);
                    // if(result[i].fcm_token !== null){
                    array.push(result6[i].fcm_token);
                    // }
                }

                await axios({
                    method: 'POST',
                    url: 'https://fcm.googleapis.com/fcm/send',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                    },
                    data: {
                        "notification": {
                            "title": `${senderName}`,
                            "subtitle": /*`${}`*/"Messaggio",
                            "body": `${text}`,
                            // "channel_id": "fcm_nexyra_admin_channel",
                            "android_channel_id": "fcm_nurebo_channel",
                            "image": `${senderProfileImage}`,
                            "icon": "calendar",
                            "vibrate": true
                        },
                        "direct_boot_ok" : true,
                        "data": {
                            "keyname": "any value"
                        },
                        "android": {
                            "notification": {
                                "image": `${senderProfileImage}`,
                                "bodyLocKey": "STOCK_NOTIFICATION_BODY",
                                "bodyLocArgs": ["FooCorp", 11.80, 835.67, 1.43]
                            },
                            "direct_boot_ok": true
                        },
                        // "registration_ids": [`${result1[0].fcm_token}`, ],
                        "registration_ids": array,
                        // "to": "dVfj2xlvRfyCzc1vfxYi7l:APA91bHF2AoxWAtjQJp9Q52pkgFGvUo7Vjs7U7wdNraaFXbUuU6nmHv4Ol0ga3MDQZlvEv-QOR8096Jj6a69nxwca3XbPkSXBFacM6JLHUlzEnmJFb0xPLRHT4zgtYm_oAkrT7t1CR1J"
                    }
                }).then(function (response) {
                    console.log(response.status);
                    console.log(response.data);
                    console.log(response.data.success);
                }).catch(function (error) {
                    console.log(error);
                });

            });
        }

        res.status(200).json(result);
    });
});


module.exports = Router;