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
const AWS = require('aws-sdk');
const qr = require("qrcode");
const formData = require('form-data');
const sharp = require('sharp');


exports.insertUserBooking = async (/*req,*/ res, userBooking, userOrderId, /*userSessionId*/) => {
    console.log('userBooking54545');
    console.log(userBooking);
    let userId = userBooking.user_id;
    let businessId = userBooking.business_id;
    let prestazioneId = userBooking.prestazione_id;
    let prestazionePrice = userBooking.prestazione_price;
    let note = userBooking.note;
    let bookingBeginAt = userBooking.begin_at;
    var newDateBeginAt = new Date(bookingBeginAt);
    let id = uuidv4();
    var duration;
    let array = [];
    let dbBookings = [];

    //TODO: SE LA DIFFERENZA TRA BEGINAT E NOW (O IL VALORE CHE GLI INVIAMO DA CLIENT)
    //è MAGGIORE DI 24 ORE RETURN RES.JSON
    var nowDate = Date.now();

    // var timeDifference = Math.abs(newDateBeginAt.getTime() - nowDate.getTime());
    // //console.log(timeDifference);
    //
    // var differentInHours = Math.ceil(timeDifference / (1000 * 3600));
    // //console.log(differentInHours);

    const diffInMs = Math.abs(newDateBeginAt - nowDate);
    let differentInHours1 = diffInMs / (1000 * 60 * 60);
    // //console.log('differentInHours1');
    // //console.log(differentInHours1);

    if (differentInHours1 <= 24)
        return res.status(419).send("Prenotare un appuntamento con almeno 24 ore di anticipo")
    // return res.json("Prenotare un appuntamento con almeno 24 ore di anticipo")

    const sql0 = `SELECT *
             FROM prestazione
             WHERE id = ?`;
    await db.promise().query(sql0, [prestazioneId]).then(async (result, err) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err);
        }

        console.log('uallaaaua')
        console.log(result[0])
        console.log(result[0][0].id)
        // // res.json(result);
        // //console.log('result')
        // //console.log(result)
        // //console.log('result[0].duration')
        // //console.log(result[0].duration)
        // // duration = result[0].duration;
        // //console.log('bookingBeginAt')
        // //console.log(bookingBeginAt)

        // //console.log('Date.parse(bookingBeginAt)')
        // //console.log(Date.parse(bookingBeginAt)/*.getMinutes()*/)

        // var newDateBeginAt = new Date(bookingBeginAt);
        var newDateEndAt = new Date(newDateBeginAt);
        // booking = Date.parse(bookingBeginAt);
        // //console.log(bookingEndAt.getDate());
        // //console.log(bookingEndAt.getMinutes());

        newDateEndAt.setUTCMinutes(newDateBeginAt.getMinutes() + result[0][0].duration);
        // //console.log('bookingEndAt');
        // //console.log(bookingEndAt);
        // //console.log('newDateBeginAt');
        // //console.log(newDateBeginAt);

        // SELECT *
        // FROM occupied_booking
        // WHERE DAY("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = DAY(occupied_from) AND
        // WHERE MONTH("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = MONTH(occupied_from) AND
        // WHERE YEAR("${newDateBeginAt.getFullYear()}/${newDateBeginAt.getMonth()}/${newDateBeginAt.getDate()}") = YEAR(occupied_from)
        // ORDER BY created_at DESC
        const sql1 = `SELECT *
         FROM booking_occupied
         WHERE business_id = ?
         ORDER BY occupied_from ASC`;
        await db.promise().query(sql1, [businessId]).then(async (result, err) => {
            if (err) {
                console.log(err)
                return res.status(500).send(err);
            }
            // res.json(result);
            // console.log('occupied_booking')
            // console.log(result)
            // //console.log(result[0].occupied_from)

            var c = 0;
            //console.log(c);
            //console.log(result.length)
            for (var i = 0; i < result[0].length - 1; i++) {
                // if((newDateBeginAt < result[i].occupied_until && bookingEndAt > result[i+1].occupied_from) ||
                //     (newDateBeginAt === result[i].occupied_from && bookingEndAt > result[i+1].occupied_from)
                /*|| (newDateBeginAt > result[i].occupied_from && bookingEndAt < result[i].occupied_until)
                || newDateBeginAt < result[0].occupied_from || bookingEndAt > result[result.length-1].occupied_until*/
                // ){
                // console.log('newDateBeginAt');
                // console.log(newDateBeginAt);
                // console.log('newDateEndAt');
                // console.log(newDateEndAt);
                var occupiedFrom = new Date(result[0][i].occupied_from);
                var occupiedUntil = new Date(result[0][i].occupied_until);
                console.log('occupiedFrom')
                console.log(occupiedFrom)
                console.log('occupiedUntil')
                console.log(occupiedUntil)
                // console.log('\n')
                if ((occupiedUntil.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedUntil.getTime()) ||
                    (occupiedFrom.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < occupiedFrom.getTime()) ||
                    /*(occupiedUntil.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === occupiedFrom.getTime()) ||*/
                    (occupiedFrom.getTime() === newDateBeginAt.getTime()) || (occupiedUntil.getTime() === newDateEndAt.getTime())) {
                    c++
                }
                // if(newDateBeginAt.toString() === result[i].occupied_from.toString()) {
                //     c++;
                // }
            }
            console.log('c');
            console.log(c);

            if (c >= 1) {
                return res.status(419).send("Lo slot è già occupato")
                // res.json("Lo slot è già occupato");
            } else if (c === 0) {
                const sql2 = `SELECT *
                     FROM business
                     JOIN prestazione ON prestazione.business_id = business.id
                     WHERE prestazione.id = ?`;
                await db.promise().query(sql2, [prestazioneId]).then(async (result, err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err);
                    }
                    // res.json(result);
                    // //console.log(result[0].business_id);

                    var day;
                    if (newDateBeginAt.getDay() === 0)
                        day = 7;
                    else
                        day = newDateBeginAt.getDay();

                    const sql3 = `SELECT *
                             FROM timetable
                             WHERE business_id = ? AND weekday_id = ?
                             ORDER BY open_at_hour ASC`;
                    await db.promise().query(sql3, [result[0][0].business_id, day]).then(async (result25, err) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).send(err);
                        }

                        console.log('result25[0]');
                        console.log(result25[0]);

                        var c1 = 0;
                        for (let j = 0; j < result25[0].length; j++) {
                            //console.log('rrrrr');
                            //creo il bookingtime di tutti i giorni e vedo se end booking è maggiore

                            //todo: openAt e closeAt spesso sbagliati
                            var closeAt = new Date(newDateBeginAt);
                            var openAt = new Date(newDateBeginAt);
                            console.log('openAt0');
                            console.log(openAt);
                            console.log('closeAt0');
                            console.log(closeAt);

                            console.log(result25[0][j].open_at_hour)
                            console.log(result25[0][j].open_at_minute)
                            console.log(result25[0][j].close_at_hour)
                            console.log(result25[0][j].close_at_minute)

                            // booking = Date.parse(bookingBeginAt);
                            // openAt.setMinutes(result25[0][j].open_at_minute)
                            // openAt.setHours(result25[0][j].open_at_hour)
                            // closeAt.setMinutes(result25[0][j].close_at_minute)
                            // closeAt.setHours(result25[0][j].close_at_hour)
                            openAt.setUTCMinutes(result25[0][j].open_at_minute)
                            openAt.setUTCHours(result25[0][j].open_at_hour)
                            closeAt.setUTCMinutes(result25[0][j].close_at_minute)
                            closeAt.setUTCHours(result25[0][j].close_at_hour)
                            console.log('openAt1');
                            console.log(openAt);
                            console.log('closeAt1');
                            console.log(closeAt);

                            console.log('newDateBeginAt');
                            console.log(newDateBeginAt);
                            console.log('newDateEndAt');
                            console.log(newDateEndAt);
                            if ((closeAt < newDateEndAt && newDateBeginAt < closeAt) || (openAt < newDateEndAt && newDateBeginAt < openAt)
                                /*|| (newDateBeginAt > closeAt && newDateEndAt < openAt)*/ /*|| (newDateBeginAt > closeAt) || (newDateEndAt < openAt)*/
                                //todo: non va bene perchè apre due volte nello stesso giorno ed esce fuori da uno degli orari di apertura di quel giorno,
                                // comunque va bene questo controllo, ma va aggiunto il fatto che deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
                                /*|| (newDateBeginAt < openAt && newDateEndAt < openAt) || (newDateBeginAt > closeAt && newDateEndAt > closeAt)*/) {
                                c1++;
                                // break;
                            }
                            console.log('c1')
                            console.log(c1)
                        }

                        //todo: deve essere maggiore o uguale a tutte/alla quantità di aperture di quel giorno
                        if (c1 >= 1) {
                            return res.status(419).send("L'appuntamento si incastra con gli orari di apertura e di chiusura o non è compreso tra gli orari di apertura e chiusura")
                            // res.json("L'appuntamento si incastra con gli orari di apertura e di chiusura");
                        } else if (c1 === 0) {
                            // const sql12 = `SELECT *
                            //                FROM booking
                            //                  JOIN prestazione ON prestazione.id = booking.prestazione_id
                            //                  JOIN business ON business.id = prestazione.business_id
                            //                WHERE is_canceled = 0 AND booking.user_id = ?
                            //                ORDER BY booking.created_at DESC`;
                            const sql12 = `SELECT *
                                   FROM booking
                                     JOIN prestazione ON prestazione.id = booking.prestazione_id
                                     JOIN business ON business.id = prestazione.business_id
                                     JOIN user_order ON user_order.id = booking.user_order_id
                                   WHERE is_canceled = 0 AND user_order.user_id = ?
                                   ORDER BY booking.created_at DESC`;
                            await db.promise().query(sql12, [userId]).then(async (result, err) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).send(err);
                                }

                                var c5 = 0;
                                for (var i = 0; i < result[0].length; i++) {
                                    var tempDateBeginAt = new Date(result[0][i].begin_at);
                                    // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)

                                    var tempDateEndAt = new Date(result[0][i].begin_at);
                                    tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + result[0][i].duration)

                                    if ((tempDateEndAt.getDate() === newDateEndAt.getDate() && tempDateBeginAt.getDate() === newDateBeginAt.getDate()) &&
                                        (tempDateEndAt.getMonth() === newDateEndAt.getMonth() && tempDateBeginAt.getMonth() === newDateBeginAt.getMonth()) &&
                                        (tempDateEndAt.getFullYear() === newDateEndAt.getFullYear() && tempDateBeginAt.getFullYear() === newDateBeginAt.getFullYear()) &&
                                        result[0][i].prestazione_id === prestazioneId) {
                                        c5++;
                                        //console.log('tempDateBeginAt');
                                        //console.log(tempDateBeginAt);
                                        // break;
                                    }
                                }
                                console.log('c5')
                                console.log(c5)

                                // //console.log(result);

                                // //console.log('result[0].max_contemporary_appointments');
                                // //console.log(result[0].max_contemporary_appointments);
                                //console.log('maxContemporaryAppointments');
                                //console.log(maxContemporaryAppointments);
                                // //console.log(result.max_contemporary_appointments);

                                // if(c2 >= /*3*/result[0].max_contemporary_appointments){
                                if (c5/*0*/ >= 1) {
                                    // return res.status(419).send("L'appuntamento da inserire avviene nello stesso giorno di un altro appuntamento dello stesso utente")
                                    return res.status(419).send("Non si possono effettuare più prestazioni uguali nello stesso giorno")
                                    // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
                                } else /*if(c === 0)*/{
                                    // //console.log('businessId')
                                    // //console.log(businessId)
                                    const sql4 = `SELECT max_contemporary_appointments
                                          FROM business
                                          WHERE id = ?`;
                                    await db.promise().query(sql4, [businessId]).then(async (result, err) => {
                                        if (err) {
                                            console.log(err)
                                            return res.status(500).send(err);
                                        }

                                        var maxContemporaryAppointments = result[0][0].max_contemporary_appointments;

                                        //todo: perchè prendo tutti gli appuntamenti
                                        // invece di prendere solo quelli di quel business?
                                        const sql5 = `SELECT *
                                              FROM booking
                                                   JOIN prestazione ON prestazione.id = booking.prestazione_id
                                                   JOIN business ON business.id = prestazione.business_id
                                              WHERE is_canceled = 0 AND business.id = ?
                                              ORDER BY booking.created_at DESC`;
                                        await db.promise().query(sql5, [businessId]).then(async (result, err) => {
                                            if (err) {
                                                console.log(err)
                                                return res.status(500).send(err);
                                            }
                                            // res.json(result);
                                            // //console.log(result);
                                            //console.log('ooooooo');

                                            dbBookings.push(...result[0]);
                                            console.log('dbBookings.length0');
                                            console.log(dbBookings.length);
                                            // console.log(dbBookings);

                                            const sql51 = `SELECT guest_booking.id AS booking_id, guest_booking.begin_at, 
                                            guest_booking.created_at, guest_booking.is_canceled, guest_booking.name, guest_booking.phone,
                                            guest_booking.email, guest_booking.note,
                            
                                            prestazione.duration, prestazione.title,
                                            prestazione.image, prestazione.price, prestazione.description,
                                            prestazione.id, prestazione.business_id
                                            
                                        FROM guest_booking
                                            JOIN prestazione ON prestazione_id = prestazione.id
                        
                                        WHERE business_id = ? AND is_canceled = 0`;
                                            await db.promise().query(sql51, [businessId]).then(async (result, err) => {
                                                if (err) {
                                                    console.log(err)
                                                    return res.status(500).send(err);
                                                }

                                                dbBookings.push(...result[0]);
                                                console.log('dbBookings.length1');
                                                console.log(dbBookings.length);
                                                // console.log(dbBookings);

                                                let c2 = 0;
                                                for (let i = 0; i < dbBookings.length; i++) {
                                                    let tempDateBeginAt = new Date(dbBookings[i].begin_at);
                                                    // tempDateBeginAt.setHours(tempDateBeginAt.getHours() + 2)

                                                    let tempDateEndAt = new Date(dbBookings[i].begin_at);
                                                    tempDateEndAt.setUTCMinutes(tempDateEndAt.getMinutes() + dbBookings[i].duration)

                                                    // console.log('tempDateBeginAt')
                                                    // console.log(tempDateBeginAt)
                                                    // console.log('tempDateEndAt')
                                                    // console.log(tempDateEndAt)

                                                    // var eee = new Date(bookingBeginAt);

                                                    // if((tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateEndAt.getTime()) ||
                                                    //     (tempDateBeginAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
                                                    //     (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
                                                    //     (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())){
                                                    if ((tempDateEndAt.getTime() < newDateEndAt.getTime() && tempDateEndAt.getTime() > newDateBeginAt.getTime()) ||
                                                        (tempDateBeginAt.getTime() > newDateBeginAt.getTime() && tempDateBeginAt.getTime() < newDateEndAt.getTime()) ||
                                                        (tempDateEndAt.getTime() === newDateEndAt.getTime() && newDateBeginAt.getTime() === tempDateBeginAt.getTime()) ||
                                                        (tempDateEndAt.getTime() > newDateEndAt.getTime() && newDateBeginAt.getTime() > tempDateBeginAt.getTime()) ||
                                                        (tempDateEndAt.getTime() < newDateEndAt.getTime() && newDateBeginAt.getTime() < tempDateBeginAt.getTime()) ||
                                                        (tempDateBeginAt.getTime() === newDateBeginAt.getTime()) || (tempDateEndAt.getTime() === newDateEndAt.getTime())) {
                                                        c2++;
                                                        //console.log('tempDateBeginAt');
                                                        //console.log(tempDateBeginAt);
                                                        // break;
                                                    }
                                                }
                                                console.log('c2')
                                                console.log(c2)

                                                // //console.log(result);

                                                // //console.log('result[0].max_contemporary_appointments');
                                                // //console.log(result[0].max_contemporary_appointments);
                                                //console.log('maxContemporaryAppointments');
                                                //console.log(maxContemporaryAppointments);
                                                // //console.log(result.max_contemporary_appointments);

                                                // if(c2 >= /*3*/result[0].max_contemporary_appointments){
                                                if (c2 >= /*3*/maxContemporaryAppointments) {
                                                    return res.status(419).send("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotati")
                                                    // res.json("L'appuntamento si incastra con altri " + c2 + " appuntamenti già prenotato");
                                                } else /*if(c === 0)*/{
                                                    // let id = uuidv4();
                                                    // //console.log('eeeeeeeeee')
                                                    // //console.log(eee)
                                                    // var rrr = new Date(bookingBeginAt);
                                                    // //console.log('rrr')
                                                    // //console.log(rrr)

                                                    const sql6 = `INSERT INTO booking(id, prestazione_id, user_id, begin_at,
                                                                              user_order_id, note, created_at)
                                                          VALUES (?, ?, ?, ?, ?, ?, /*UTC_TIMESTAMP()*/"${new Date(Date.now()).toISOString()}")`;
                                                    await db.promise().query(sql6, [id, prestazioneId, userId, bookingBeginAt, /*userBooking.user_order_id*/userOrderId, note]).then(async (result, err) => {
                                                        if (err) {
                                                            console.log(err)
                                                            return res.status(500).send(err);
                                                        }

                                                        // // const rooms = await socket.ioObject.of('/').adapter.allRooms();
                                                        // var rooms = await socket.ioObject.of('/').adapter.allRooms();
                                                        // console.log(`socket.ioObject.of('/').adapter.allRooms()`);
                                                        // console.log(rooms);
                                                        //
                                                        // var sockets = await socket.ioObject.of('/').adapter.sockets(new Set());
                                                        // console.log(`socket.ioObject.of('/').adapter.sockets`);
                                                        // console.log(sockets);
                                                        //
                                                        // var sids = await socket.ioObject.of('/').adapter.sids;
                                                        // console.log(`socket.ioObject.of('/').adapter.sids`);
                                                        // console.log(sids);
                                                        //
                                                        // var rooms1 = await socket.ioObject.of('/').adapter.rooms;
                                                        // console.log(`socket.ioObject.of('/').adapter.rooms`);
                                                        // console.log(rooms1);
                                                        //
                                                        // //se è online lo invio con socket.io, altrimenti lo metto in tabella notifiche
                                                        // // if(socket.ioObject.sockets.adapter.rooms[userBooking.business_id] === undefined) {
                                                        // if (!rooms.has(userBooking.business_id)) {
                                                        //     let notification_id = uuidv4();
                                                        //     let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
                                                        //                 VALUES (?, 0, ?, ?, ?, /*NOW*/UTC_TIMESTAMP())`;
                                                        //     await db.promise().query(sql1, [notification_id, businessId, userId, id]).then((result, err) => {
                                                        //         if (err) {
                                                        //             console.log(err);
                                                        //             return res.status(500).send(err);
                                                        //         }
                                                        //         //console.log('result');
                                                        //         //console.log(result);
                                                        //         // res.end(result);
                                                        //         // res.result;
                                                        //         //     res.json(id);
                                                        //         //     res.json(result);
                                                        //     });
                                                        // }
                                                        // else {
                                                        //     console.log('userBooking.begin_at')
                                                        //     console.log(userBooking.begin_at)
                                                        //     // socket.ioObject./*sockets.in(chatId)*/sockets.to(userBooking.business_id)/*sockets.broadcast*/.emit(
                                                        //     socket.ioObject./*sockets.in(userBooking.business_id)*/sockets.to(userBooking.business_id)/*sockets.broadcast*/.emit(
                                                        //         'update_booking_business_appointments',
                                                        //         // "iiiiiiiiiii",
                                                        //         {
                                                        //             "booking_id": id,
                                                        //             "prestazione_id": userBooking.prestazione_id,
                                                        //             "note": userBooking.note,
                                                        //             "begin_at": userBooking.begin_at,
                                                        //             'prestazione_duration': userBooking.prestazione_duration,
                                                        //             'prestazione_image': userBooking.prestazione_image,
                                                        //             'prestazione_description': userBooking.prestazione_description,
                                                        //             'prestazione_title': userBooking.prestazione_title,
                                                        //             'prestazione_price': userBooking.prestazione_price,
                                                        //             'presale_price': userBooking.presale_price,
                                                        //             'user_id': userBooking.user_id,
                                                        //             'user_username': userBooking.user_username,
                                                        //             'user_name': userBooking.user_name,
                                                        //             'user_profile_image': userBooking.user_profile_image,
                                                        //             'user_phone_number': userBooking.user_phone_number,
                                                        //             'user_email': userBooking.user_email,
                                                        //             // 'price': userBooking.prestazione_price,
                                                        //             'business_id': userBooking.business_id,
                                                        //             'business_name': userBooking.business_name,
                                                        //             'business_type_id': userBooking.business_type_id,
                                                        //             'business_profile_image': userBooking.profile_image,
                                                        //             'business_description': userBooking.description,
                                                        //             'business_address': userBooking.address,
                                                        //             'business_phone_number': userBooking.phone_number,
                                                        //             'max_contemporary_appointments': userBooking.max_contemporary_appointments,
                                                        //             'is_canceled': 0,
                                                        //             'created_at': new Date(Date.now()).toISOString(),
                                                        //         }
                                                        //     );
                                                        // }

                                                        const sql7 = `SELECT *
                                                              FROM user
                                                              WHERE id = ?`;
                                                        db.query(sql7, [userId], async (err, result0) => {
                                                            if (err) {
                                                                console.log(err)
                                                                return res.status(500).send(err);
                                                            }

                                                            const sql8 = `SELECT *
                                                                  FROM business
                                                                  WHERE id = ?`;
                                                            db.query(sql8, [businessId], async (err, result1) => {
                                                                if (err) {
                                                                    console.log(err)
                                                                    return res.status(500).send(err);
                                                                }

                                                                const sql9 = `SELECT *
                                                                      FROM booking
                                                                      JOIN prestazione ON prestazione.id = booking.prestazione_id
                                                                      WHERE booking.id = ?`;
                                                                db.query(sql9, [id], async (err, result2) => {
                                                                    if (err) {
                                                                        console.log(err)
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
                                                                    // if(socket.ioObject.sockets.adapter.rooms[userBooking.business_id] === undefined) {
                                                                    if (!rooms.has(userBooking.business_id)) {
                                                                        let notification_id = uuidv4();
                                                                        let sql1 = `INSERT INTO user_business_notification(id, type, business_id, user_id, booking_id, sent_at)
                                                                    VALUES (?, 0, ?, ?, ?, /*NOW*//*UTC_TIMESTAMP()*/?)`;
                                                                        await db.promise().query(sql1, [notification_id, businessId, userId, id, (new Date()).toISOString()]).then((result, err) => {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                return res.status(500).send(err);
                                                                            }
                                                                            //console.log('result');
                                                                            //console.log(result);
                                                                            // res.end(result);
                                                                            // res.result;
                                                                            //     res.json(id);
                                                                            //     res.json(result);
                                                                        });
                                                                    } else {
                                                                        console.log('userBooking')
                                                                        console.log(userBooking)
                                                                        // socket.ioObject./*sockets.in(chatId)*/sockets.to(userBooking.business_id)/*sockets.broadcast*/.emit(
                                                                        socket.ioObject./*sockets.in(userBooking.business_id)*/sockets.to(userBooking.business_id)/*sockets.broadcast*/.emit(
                                                                            'update_booking_business_appointments',
                                                                            // "iiiiiiiiiii",
                                                                            {
                                                                                "booking_id": id,
                                                                                "prestazione_id": userBooking.prestazione_id,
                                                                                "note": userBooking.note,
                                                                                "begin_at": userBooking.begin_at,
                                                                                'prestazione_duration': userBooking.prestazione_duration,
                                                                                'prestazione_image': `${userBooking.prestazione_image}`,
                                                                                'prestazione_description': userBooking.prestazione_description,
                                                                                'prestazione_title': userBooking.prestazione_title,
                                                                                'prestazione_price': userBooking.prestazione_price,
                                                                                'presale_price': userBooking.presale_price,
                                                                                'user_id': userBooking.user_id,
                                                                                'user_username': userBooking.user_username,
                                                                                'user_name': userBooking.user_name,
                                                                                'user_profile_image': `${userBooking.user_profile_image}`,
                                                                                'user_phone': userBooking.user_phone,
                                                                                'user_email': userBooking.user_email,
                                                                                // 'price': userBooking.prestazione_price,
                                                                                'business_id': userBooking.business_id,
                                                                                'business_name': userBooking.business_name,
                                                                                'business_type_id': result1[0].business_type_id,
                                                                                'business_profile_image': `${result1[0].profile_image}`,
                                                                                'business_description': result1[0].description,
                                                                                'business_address': result1[0].address,
                                                                                'business_phone': result1[0].phone,
                                                                                'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                                                                                'is_canceled': 0,
                                                                                'created_at': new Date(Date.now()).toISOString(),
                                                                            }
                                                                        );
                                                                    }

                                                                    console.log('result2')
                                                                    console.log(result2)
                                                                    console.log('result1')
                                                                    console.log(result1)
                                                                    console.log('result0')
                                                                    console.log(result0)

                                                                    var bookingDate = new Date(result2[0].begin_at);
                                                                    const offset = bookingDate.getTimezoneOffset();
                                                                    var localBookingDate = new Date(bookingDate.setUTCMinutes(bookingDate.getMinutes() /*- offset*/ + 120));
                                                                    let localeBookingString = localBookingDate.toLocaleString(
                                                                        'it-IT',
                                                                        {
                                                                            year: 'numeric',
                                                                            month: '2-digit',
                                                                            day: '2-digit',
                                                                            weekday: "long",
                                                                            hour: '2-digit',
                                                                            hour12: false,
                                                                            minute: '2-digit',
                                                                            second: '2-digit'
                                                                        }
                                                                    );

                                                                    console.log('bookingDate.toISOString()');
                                                                    console.log(bookingDate.toISOString());
                                                                    console.log('offset');
                                                                    console.log(offset);
                                                                    console.log('localBookingDate.toISOString()');
                                                                    console.log(localBookingDate.toISOString());

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
                                                                            // user: process.env.EMAIL_USER,
                                                                            user: process.env.AWS_SMTP_USER,
                                                                            // pass: process.env.EMAIL_PASSWORD
                                                                            pass: process.env.AWS_SMTP_PASSWORD
                                                                        },
                                                                        //TODO: da testare
                                                                        tls: {
                                                                            rejectUnauthorized: false
                                                                        }
                                                                    });

                                                                    if (result1[0].email_notification === 1) {
                                                                        //email a business
                                                                        let mailOptions = {
                                                                            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                                                            from: `"${result0[0].name !== null && result0[0].name !== '' ? result0[0].name : result0[0].username}" support@nurebo.com`, // sender address
                                                                            to: result1[0].email,
                                                                            // to: "bar@example.com, baz@example.com", // list of receivers
                                                                            subject: `Prenotazione di ${userBooking.prestazione_title} da ${/*userBooking.user_name*/result0[0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                                            // subject: 'Hello ✔ Nodemailer - Test',
                                                                            // text: 'Wooohooo it works!!',
                                                                            html: `<h1>La prenotazione di ${userBooking.prestazione_title} da ${/*userBooking.user_name*/result0[0].username} per ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} delle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
                                                                       <h1>Grazie.</h1>
                                                                       <h1>A presto!</h1>`,
                                                                        };

                                                                        // Step 3
                                                                        await transporter.sendMail(mailOptions, (err, data) => {
                                                                            if (err) {
                                                                                console.log('Error occurs', err);
                                                                                return;
                                                                            }
                                                                            // console.log(otp);
                                                                            console.log('Email sent!!!');
                                                                        });
                                                                    }
                                                                    if (result0[0].email_notification === 1) {
                                                                        //email a user
                                                                        let mailOptions1 = {
                                                                            // from: '"Fred Foo 👻" info.funnydragon@gmail.com', // sender address
                                                                            from: `"${result1[0].name}" support@nurebo.com`, // sender address
                                                                            to: result0[0].email,
                                                                            // to: "bar@example.com, baz@example.com", // list of receivers
                                                                            subject: `Prenotazione di ${userBooking.prestazione_title} da ${userBooking.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                                            // subject: 'Hello ✔ Nodemailer - Test',
                                                                            // text: 'Wooohooo it works!!',
                                                                            html: `<h1>La prenotazione di ${userBooking.prestazione_title} da ${userBooking.business_name} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ore ${localeBookingString.substr(localeBookingString.length - 8, 5)} è stata effettuata con successo.</h1>
                                                                       <h1>Grazie.</h1>
                                                                       <h1>A presto!</h1>`,
                                                                        };

                                                                        // Step 3
                                                                        await transporter.sendMail(mailOptions1, (err, data) => {
                                                                            if (err) {
                                                                                console.log('Error occurs', err);
                                                                                // return log('Error occurs', err);
                                                                                return;
                                                                            }
                                                                            return;
                                                                            // console.log(otp);
                                                                            // console.log('Email sent!!!');
                                                                        });
                                                                    }

                                                                    const sql15 = `SELECT fcm_token 
                                                                             FROM business_device
                                                                             WHERE fcm_token IS NOT NULL AND fcm_token <> '' AND business_id = ?
                                                                             ORDER BY RAND()
                                                                             LIMIT 1000`;
                                                                    db.query(sql15, [businessId], async (err, result6) => {
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

                                                                        // await axios({
                                                                        //     method: 'POST',
                                                                        //     url: 'https://fcm.googleapis.com/fcm/send',
                                                                        //     headers: {
                                                                        //         'Content-Type': 'application/json',
                                                                        //         Authorization: `key=${process.env.NUREBO_FCM_SERVER_KEY}`,
                                                                        //     },
                                                                        //     data: {
                                                                        //         // "to": "cDdRQ4IPR6qpRREaeV0KNp:APA91bFsj7Vreyql4ZGXWJqAYiXkJBlZr-TkyvL7OvGnz672VroVtTyElxIRNRdIyxU1ghHLtOJ5Q2QcXqbpT5MFbdkbgQawSInR6sEdYRM-NdvAKMHrhBTX0jNpSqQ5Vx-2PcVGteJ-",
                                                                        //         "to": "cPD5QfLPQfSmNXtArooBQp:APA91bE5UePiJLxhCUdvLMrLHLI3jBcJFRWxX0OMAS4k5YptHkj3rCkCFIziAwOcvC9xIDmmNKM3ywqE0GWNMW_6022xR_vC1stS-TmkUQQXd-3I2GdY-7BzouyOyDNELKaX8zhE4C4C",
                                                                        //         // "to": userBooking.user_token,
                                                                        //         "direct_boot_ok" : true,
                                                                        //         "badge": 1,
                                                                        //         "notification": {
                                                                        //             "title": "Check this Mobile (title)",
                                                                        //             "subtitle": "Norris (subtitle)",
                                                                        //             "body": "Rich Notification testing (body)",
                                                                        //             // "mutable_content": true,
                                                                        //             "link": "https://www.google.com",
                                                                        //             // "vibrate": "true",
                                                                        //             "sound": "default",
                                                                        //             "image": "https://kadingira-s3.s3.eu-central-1.amazonaws.com/image/prestazione/0e3c9167-1d17-40f4-a2a5-edeaa341e1a2.jpg",
                                                                        //             "click_action": "MAIN_ACTIVITY",
                                                                        //             // "click_action": "MAIN",
                                                                        //             // "click_action": "LAUNCHER",
                                                                        //             // "requireInteraction": "true",
                                                                        //             // "ttl": 2
                                                                        //         },
                                                                        //         "android": {
                                                                        //             "ttl": 3,
                                                                        //             "sound": "default",
                                                                        //             "subtitle": "Android specific",
                                                                        //             "vibrate": true,
                                                                        //             "link": "https://www.google.com",
                                                                        //             "priority": "high",
                                                                        //             "notification": {
                                                                        //                 "image": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
                                                                        //             }
                                                                        //         },
                                                                        //         "apns":{
                                                                        //             "headers": {
                                                                        //                 "apns-priority": "5",
                                                                        //                 "apns-expiration":"1604750400"
                                                                        //             },
                                                                        //             "payload":{
                                                                        //                 "aps":{
                                                                        //                     "mutable-content": 1
                                                                        //                 }
                                                                        //             },
                                                                        //             "fcm_options": {
                                                                        //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
                                                                        //             }
                                                                        //         },
                                                                        //         "webpush":{
                                                                        //             "headers":{
                                                                        //                 "image":"https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
                                                                        //                 "TTL":"86400",
                                                                        //                 "Urgency": "high"
                                                                        //             }
                                                                        //         },
                                                                        //         "data": {
                                                                        //             "url": "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png",
                                                                        //             "dl": "<deeplink action on tap of notification>"
                                                                        //         }
                                                                        //     }
                                                                        // }).then(function (response) {
                                                                        //     console.log(response.status);
                                                                        //     console.log(response.data);
                                                                        //     console.log(response.data.success);
                                                                        //     // res.status(200).send(response.data);
                                                                        // }).catch(function (error) {
                                                                        //     console.log(error);
                                                                        //     // res.status(500).send(error);
                                                                        // });
                                                                        await axios({
                                                                            method: 'POST',
                                                                            url: 'https://fcm.googleapis.com/fcm/send',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                Authorization: `key=${process.env.NUREBO_ADMIN_FCM_SERVER_KEY}`,
                                                                            },
                                                                            data: {
                                                                                "notification": {
                                                                                    "title": `${userBooking.prestazione_title}`,
                                                                                    "subtitle": /*`${}`*/"Prenotazione",
                                                                                    "body": `Prenotazione da ${/*userBooking.user_name*/userBooking.user_name !== null && userBooking.user_name !== '' ? userBooking.user_name : userBooking.user_username} di ${localeBookingString.charAt(0).toUpperCase() + localeBookingString.substr(1, localeBookingString.length - 11)} alle ${localeBookingString.substr(localeBookingString.length - 8, 5)}`,
                                                                                    // "channel_id": "fcm_nurebo_admin_channel",
                                                                                    "android_channel_id": "fcm_nurebo_admin_channel",
                                                                                    // "image": `${userBooking.prestazione_image}`,
                                                                                    "vibrate": true,
                                                                                    "icon": "calendar"
                                                                                },
                                                                                "direct_boot_ok": true,
                                                                                "data": {
                                                                                    "keyname": "any value",
                                                                                    "booking_id": id,
                                                                                    "prestazione_id": `${userBooking.prestazione_id}`,
                                                                                    "note": userBooking.note,
                                                                                    "begin_at": userBooking.begin_at,
                                                                                    'prestazione_duration': userBooking.prestazione_duration,
                                                                                    "prestazione_image": `${userBooking.prestazione_image}`,
                                                                                    'prestazione_description': userBooking.prestazione_description,
                                                                                    'prestazione_title': userBooking.prestazione_title,
                                                                                    'prestazione_price': userBooking.prestazione_price,
                                                                                    'presale_price': userBooking.presale_price,
                                                                                    'user_id': userBooking.user_id,
                                                                                    'user_username': userBooking.user_username,
                                                                                    'user_name': userBooking.user_name,
                                                                                    'user_profile_image': `${userBooking.user_profile_image}`,
                                                                                    'user_phone': userBooking.user_phone,
                                                                                    'user_email': userBooking.user_email,
                                                                                    // 'price': userBooking.prestazione_price,
                                                                                    'business_id': userBooking.business_id,
                                                                                    'business_name': userBooking.business_name,
                                                                                    'business_type_id': result1[0].business_type_id,
                                                                                    'business_profile_image': `${result1[0].profile_image}`,
                                                                                    'business_description': result1[0].description,
                                                                                    'business_address': result1[0].address,
                                                                                    'business_phone': result1[0].phone,
                                                                                    'max_contemporary_appointments': result1[0].max_contemporary_appointments,
                                                                                    'is_canceled': 0,
                                                                                    'created_at': new Date(Date.now()).toISOString(),
                                                                                },
                                                                                "android": {
                                                                                    "notification": {
                                                                                        "image": `${userBooking.prestazione_image}`,
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

                                                                });
                                                            });
                                                        });

                                                        // res.json(result);
                                                    });

                                                    // res.json(result);
                                                    // res.json(id);

                                                    console.log('fb54df45d')
                                                    return 200;
                                                }
                                            });
                                        });
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    });
}