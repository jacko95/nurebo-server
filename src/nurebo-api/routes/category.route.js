const express = require('express');
const Router = express.Router();
const db = require("../database/dbconnection");
const multer = require('multer');
const JWT = require('jsonwebtoken')
const checkAuth = require("../middleware/checkUserAuth");
const checkUser = require("../middleware/checkUser");
const checkDev = require("../middleware/checkDev");
const turf = require('@turf/turf');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // //console.log(req);
        //TODO: CREARE (SE NON ESISTE GIà) UNA CARTELLA CON L'ID DELL UTENTE
        //OGNI VOLTA CHE SI POSTA UN POST ED IL NOME DELL'IMMAGINE DOVREBBE
        //ESSERE L'ID DEL POST
        // cb(null, `./posts/${userId}/`);
        cb(null, `./event_images/`);
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
        // cb(null, uuidv4() + file.originalname);
    },

});

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

//only allow file up to 5 MB
const upload = multer({
    storage: storage,
    // limits: {
    //     fileSize: 1024 * 1024 * 5
    // },
    fileFilter: fileFilter
});


// Router.get('/mucha', async (req, res) => {
// Router.get('/category/mucha', async (req, res) => {
//     // res.redirect('v1/categories/uwube');
//     // res.writeHead(301, {
//     //     Location: `http://localhost:6000/v1/categories/uwube`
//     // }).end();
//     await res.redirect(`http://api.nexyra.com/category/uwube`)
// });

// Router.get('/all', (req, res) => {
// Router.get('/category', (req, res) => {
//     // //console.log(req.body);
//
//     /*WHERE 1*/
//     const sql = "SELECT DISTINCT * FROM category";
//     db.query(sql, (err, rows) => {
//         // //console.log(rows);
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         res.json(rows);
//     })
// });

// Router.get('/only_booking_business', (req, res) => {
//     //console.log(req.body);
//
//     /*WHERE 1*/
//     // const sql = "SELECT DISTINCT * FROM event_category";
//     const sql = `SELECT DISTINCT category.id, category.name, category.image
//                     FROM category
//                     JOIN booking_business ON booking_business.category_id = category.id`;
//     db.query(sql, (err, rows) => {
//         //console.log(rows);
//         if (err) console.log(err);
//         res.json(rows);
//     })
// });

// Router.get('/only_event_business', (req, res) => {
//     //console.log(req.body);
//
//     /*WHERE 1*/
//     // const sql = "SELECT DISTINCT * FROM event_category";
//     const sql = `SELECT DISTINCT category.id, category.name, category.image
//                     FROM category
//                     JOIN event_business ON event_business.category_id = category.id`;
//     db.query(sql, (err, rows) => {
//         //console.log(rows);
//         if (err) console.log(err);
//         res.json(rows);
//     })
// });

// Router.get('/only_business', (req, res) => {
//     // //console.log(req.body);
//
//     /*WHERE 1*/
//     // const sql = "SELECT DISTINCT * FROM event_category";
//     const sql = `SELECT DISTINCT category.id, category.name, category.image
//                     FROM category
//                     JOIN business ON business.category_id = category.id
//                     WHERE is_valid = 1 AND business.is_visible = 1`;
//     db.query(sql, [], (err, rows) => {
//         // //console.log(rows);
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         res.json(rows);
//     })
// });

// Router.get('/is_valid', (req, res) => {
//     // //console.log(req.body);
//
//     /*WHERE 1*/
//     // const sql = "SELECT DISTINCT * FROM event_category";
//     const sql = `SELECT DISTINCT category.id, category.name, category.image
//                     FROM category
//                     WHERE is_valid = 1`;
//     db.query(sql, [], (err, rows) => {
//         // //console.log(rows);
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         res.json(rows);
//     })
// });

Router.get('/business', (req, res) => {
    try {
        let sql = '';
        if (req.query.is_valid && req.query.is_visible) {
            sql = `SELECT DISTINCT category.id, category.name, category.image
                    FROM category
                        JOIN business ON business.category_id = category.id
                    WHERE is_valid = ? AND business.is_visible = ?
                    ORDER BY category.name ASC`;
        }
        else if (req.query.is_valid && req.query.is_visible === undefined) {
            sql = `SELECT DISTINCT category.id, category.name, category.image
                    FROM category
                        LEFT JOIN business ON business.category_id = category.id
                    WHERE is_valid = ?
                    ORDER BY category.name ASC`;
        }
        else if (req.query.is_valid === undefined && req.query.is_visible) {
            sql = `SELECT DISTINCT category.id, category.name, category.image
                    FROM category
                        JOIN business ON business.category_id = category.id
                    WHERE business.is_visible = ?
                    ORDER BY category.name ASC`;
        }
        else if (req.query.is_valid === undefined && req.query.is_visible === undefined) {
            sql = "SELECT DISTINCT * FROM category";
        }
        else return;
        db.query(sql, [req.query.is_valid ?? 1, req.query.is_visible ?? 1], (err, rows) => {
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

// Router.post('/business', /*checkAuth,*/ /*checkUser,*/ (req, res) => {
//     // try{
//     //     console.log('req.headers.authorization');
//     //     console.log(req.headers.authorization);
//     //     const decoded = JWT.verify(req.headers.authorization, process.env.JWT_KEY)
//     //     console.log('decoded')
//     //     console.log(decoded)
//     //
//     // } catch(error){
//     //     console.log(error)
//     //     return res.status(401).json(
//     //         'Autenticazione fallita: token non valido'
//     //     )
//     // }
//
//     let categoryId = req.body.category_id;
//     // //console.log(categoryId);
//
//     const sql = `SELECT max_contemporary_appointments, business.profile_image AS business_profile_image,
//                     business.name AS business_name, business.id AS business_id, business.address AS business_address,
//                     /*business.email_notification AS business_email_notification,*/
//                     business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
//                     business.latitude AS business_latitude, business.description AS business_description, business.business_type_id,
//                     business.description AS business_description, business.email AS business_email,
//
//                     category.id AS category_id, category.name AS category_name, category.image AS category_image
//
//                 FROM category
//                 JOIN business ON business.category_id = category.id
//                 WHERE category_id = ? AND business.is_visible = 1`;
//     db.query(sql, [categoryId], (err, result) => {
//         // //console.log(result);
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     })
// });

// Router.post('/business', /*checkAuth,*/ /*checkUser,*/ (req, res) => {
Router.get('/:category_id/business', /*checkAuth,*/ /*checkUser,*/ (req, res) => {
    try {
        let sql = '';
        let categoryId = req.params.category_id;
        let ipLatitude = req.query.ip_latitude;
        let ipLongitude = req.query.ip_longitude;
        let geoLatitude = req.query.geo_latitude;
        let geoLongitude = req.query.geo_longitude;
        let ipLocation;
        let geoLocation;
        const locationsWithinRadius = new Set();

        console.log(req.query);

        if(ipLatitude && ipLongitude){
            ipLocation = turf.point([ipLongitude, ipLatitude]);
        }
        if(geoLatitude && geoLongitude){
            geoLocation = turf.point([geoLongitude, geoLatitude]);
        }

        const userLocation = geoLocation !== undefined ? geoLocation : ipLocation;

        console.log('geoLocation');
        console.log(geoLocation);
        console.log('ipLocation');
        console.log(ipLocation);
        console.log('userLocation');
        console.log(userLocation);

        // if (req.query.is_visible) {
            sql = `SELECT max_contemporary_appointments, business.profile_image AS business_profile_image, 
                    business.name AS business_name, business.id AS business_id, business.address AS business_address,
                    /*business.email_notification AS business_email_notification,*/
                    business.phone AS business_phone, category_id, business.longitude AS business_longitude,
                    business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id, 
                    business.description AS business_description, business.email AS business_email,
                    
                    business_room.id AS business_room_id,
                    
                    category.id AS category_id, category.name AS category_name, category.image AS category_image
            
                FROM category
                    LEFT JOIN business ON business.category_id = category.id
                    LEFT JOIN business_room ON business_room.business_id = business.id
                WHERE category_id = ? AND business.is_visible = ?`;
        // } else {
        //     sql = `SELECT max_contemporary_appointments, business.profile_image AS business_profile_image,
        //             business.name AS business_name, business.id AS business_id, business.address AS business_address,
        //             /*business.email_notification AS business_email_notification,*/
        //             business.phone AS business_phone_number, category_id, business.longitude AS business_longitude,
        //             business.latitude AS business_latitude, business.description AS business_description, business.type_id AS business_type_id,
        //             business.description AS business_description, business.email AS business_email,
        //
        //             business_room.id AS business_room_id,
        //
        //             category.id AS category_id, category.name AS category_name, category.image AS category_image
        //
        //         FROM category
        //             LEFT JOIN business ON business.category_id = category.id
        //             LEFT JOIN business_room ON business_room.business_id = business.id
        //         WHERE category_id = ?`;
        // }
        db.query(sql, [categoryId, req.query.is_visible ?? 1], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            try {
                result.forEach(location => {
                    location.turfPoint = turf.point([location.business_longitude, location.business_latitude]);
                });

                result.forEach(location => {
                    const distance = turf.distance(userLocation, location.turfPoint, { units: 'kilometers' });
                    console.log('distance4555')
                    console.log(distance)
                    location.business_distance = distance;

                    console.log(global.maxDistanceBusinessSearch);
                    console.log(process.env.MAX_DISTANCE_BUSINESS_SEARCH);
                    console.log(parseInt(process.env.MAX_DISTANCE_BUSINESS_SEARCH));
                    // if (distance <= 30/*km*/) {
                    // if (distance <= global.maxDistanceBusinessSearch) {
                    if (distance <= parseInt(process.env.MAX_DISTANCE_BUSINESS_SEARCH)){
                    // if (distance <= process.env.MAX_DISTANCE_BUSINESS_SEARCH){
                        locationsWithinRadius.add(location);
                    }
                });

                console.log('locationsWithinRadius.size')
                console.log(locationsWithinRadius.size)

                // res.status(201).json(result);
                res.status(201).json(Array.from(locationsWithinRadius));
            } catch (e) {
                console.log(err)
                res.status(510).send(err);
            }

            // console.log('resultg5hh5h5h5h');
            // console.log(result);
            // console.log(locationsWithinRadius);
            //
            // // res.json(result);
            // res.json(Array.from(locationsWithinRadius));
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("");
    }
});

// Router.post('/booking_business', (req, res) => {
//     let categoryId = req.body.category_id;
//     // //console.log(categoryId);
//
//     const sql = `SELECT *
//                     FROM category
//                     JOIN booking_business ON booking_business.category_id = category.id
//                     WHERE category_id = ?`;
//     db.query(sql, [categoryId], (err, result) => {
//         // //console.log(result);
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         res.json(result);
//     })
// });

// Router.post('/business', (req, res) => {
//     let categoryId = req.body.category_id;
//     // //console.log(categoryId);
//
//     const sql = `SELECT *
//                     FROM category
//                     JOIN business ON business.category_id = category.id
//                     WHERE category_id = ?`;
//     db.query(sql, [categoryId], (err, result) => {
//         // //console.log(result);
//         if (err) console.log(err);
//         res.json(result);
//     })
// });

// Router.post("/id", (req, res) => {
//     let id = req.body.id;
//     // //console.log(id);
//
//     const sql = `SELECT * FROM event WHERE id = ? AND is_visible = 1`;
//     db.query(sql, [id],(err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }
//         // res.redirect('/category');
//         res.json(result);
//     });
// });

module.exports = Router;