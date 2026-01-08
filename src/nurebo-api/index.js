const express = require("express");
var http = require("http");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
var fs = require('fs');
const morgan = require("morgan");
const socketio = require("socket.io");
const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
var session = require('express-session')
const multer = require('multer');
var upload = multer();
const router = express.Router();
//LOCAL
require('dotenv').config({ path: './src/nurebo-api/.env' });
// REMOTE
// require('dotenv').config();

process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';
process.env.TZ = 'UTC';

global.maxDistanceBusinessSearch = 30;

// const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const chatMessageRoutes = require("./routes/chat_message");
const eventRoomRoutes = require("./routes/event_room");
// const businessRoutes = require("./routes/business");
// const businessPostRoutes = require("./routes/business_post");
// const businessPostCommentRoutes = require("./routes/business_post_comment");
// const businessPostLikeRoutes = require("./routes/business_post_like");
// const bookingPostLikeRoutes = require("./routes/booking_post_like");
// const categoryRoutes = require("./routes/category");
// const eventRoutes = require("./routes/event");
// const bookingPostRoutes = require("./routes/booking_post");
// const bookingPostCommentRoutes = require("./routes/booking_post_comment");
const validationPhoneNumberRoutes = require("./routes/validation_phone_number");
const validationEmailRoutes = require("./routes/validation_email");
// const authenticationRoutes = require("./routes/authentication");
// const businessAuthenticationRoutes = require("./routes/business_authentication");
// const bookingRoutes = require("./routes/booking");
// const timetableRoutes = require("./routes/timetable");
const occupiedBookingRoutes = require("./routes/booking_occupied");
// const prestazioneRoutes = require("./routes/prestazione");
// const userOrderRoutes = require("./routes/user_order");
const sellerVisitedRoutes = require("./routes/seller_visited");
// const versionRoutes = require("./routes/version");
// const prestazioneUserLikeRoutes = require("./routes/prestazione_favorite");
// const savedBusinessRoutes = require("./routes/business_favorite");
// const userBusinessNotificationRoutes = require("./routes/user_business_notification");
// const eventTicketCategoryRoutes = require("./routes/event_ticket");
const eventTicketRoutes = require("./routes/event_reservation");
// const eventFavoriteRoutes = require("./routes/event_favorite");
// const userFriendshipRoutes = require("./routes/user_friendship");
// const businessUserNotificationRoutes = require("./routes/business_user_notification");
const websiteContactUsRoutes = require("./routes/website_contact_us");


const userV1Routes = require("./routes/user.route");
// const authenticationV1Routes = require("./routes/authentication.route");
const bookingV1Routes = require("./routes/booking.route");
const categoryV1Routes = require("./routes/category.route");
const prestazioneV1Routes = require("./routes/prestazione.route");
// const timetableV1Routes = require("./routes/timetable.route");
const eventV1Routes = require("./routes/event.route");
const businessV1Routes = require("./routes/business.route");
const versionV1Routes = require("./routes/version.route");
const imageV1Routes = require("./routes/image.route");
const reservationV1Routes = require("./routes/reservation.route");
const productV1Routes = require("./routes/product.route");


// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// })

const port = process.env.port || 5000;

// const app = express();
// var server = http.createServer(app);
// var io = require("socket.io")(server, {
//     cors: {
//         origin: "*"
//     }
// });

var app = express({
    cors: {
        origin: "*"
    }
});
var server = http.createServer(app);
var server1 = /*app*/server.listen(port, () => console.log(`listening on port ${port}`));
var io = socketio(server1, {
    // // Imposta il percorso dell'endpoint per le connessioni Socket.IO
    // path: '/socket.io',
    // Serve automaticamente il client Socket.IO sul server
    serveClient: true,
    // // Adattatore da utilizzare per gestire le sessioni dei socket
    // adapter: require('socket.io-adapter'),
    // // Parser da utilizzare per i messaggi Socket.IO
    // parser: require('socket.io-parser'),
    // Specifica i metodi di trasporto da utilizzare (websocket e polling)
    transports: ['websocket', 'polling'],
    // Intervallo di ping in millisecondi (controlla se il client è ancora connesso)
    pingInterval: 5000, // 5 secondi
    // Timeout del ping in millisecondi (tempo massimo di attesa per una risposta al ping)
    pingTimeout: 5000, // 5 secondi
    // Nome del cookie da utilizzare per memorizzare l'ID del socket
    cookie: false, // Disabilita i cookie
    // Abilita la compressione dei messaggi inviati al client
    perMessageDeflate: {
        threshold: 512, // Dimensione minima dei messaggi per la compressione
    },
    // Abilita la trasmissione di dati binari
    allowUpgrades: true, // Consente l'upgrade da HTTP a WebSocket
    // Abilita il supporto per CORS (Cross-Origin Resource Sharing)
    cors: {
        origin: "*", // Permette richieste da qualsiasi origine
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Metodi HTTP permessi
        // allowedHeaders: ["my-custom-header"], // Intestazioni HTTP permessi
        credentials: true, // Invia cookie e credenziali con richieste CORS
    },
    // Numero massimo di tentativi di riconnessione
    reconnectionAttempts: Infinity, // Tentativi infiniti
    // Ritardo iniziale tra i tentativi di riconnessione in millisecondi
    reconnectionDelay: 1000, // 1 secondo
    // Ritardo massimo tra i tentativi di riconnessione in millisecondi
    reconnectionDelayMax: 5000, // 5 secondi
    // Fattore di randomizzazione per il ritardo di riconnessione
    randomizationFactor: 0.5, // 50% di variazione casuale
    // Tempo massimo per tentare la connessione iniziale in millisecondi
    timeout: 20000, // 20 secondi
});

// server.listen(port, () => {
// // server.listen(port, "0.0.0.0", () => {
// // server.listen(port, "www.nexyra.com", () => {
//     console.log(`Server running on http://supperman.hopto.org:${port}`);
// })

// app.use('/api/v1', router);
// router.use('/api/v1', router);

app.use((req, res, next) => {
    const timeout = 5000;
    const timer = setTimeout(() => {
        if (!res.headersSent) {
            res.status(503).json({ message: 'Request timeout' });
        }
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
});

// Add headers before the routes are defined
app.use(function (req, res, next) {
    // // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000,https://www.nurebo.com');
    // res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', false);
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // if(req.method === 'GET') {
    //     res.setHeader("Cache-control", `public, max-age=${60 * 5}`)
    //     // res.set("Cache-control", `public, max-age=${60 * 5}`)
    // }
    // else{
    //     res.setHeader("Cache-control", `no-store`)
    // }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    // Pass to next layer of middleware
    next();
});

// router.use(function (req, res, next) {
//     // // Website you wish to allow to connect
//     // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//
//     // Request methods you wish to allow
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//
//     // Request headers you wish to allow
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//
//     // Set to true if you need the website to include cookies in the requests sent
//     // to the API (e.g. in case you use sessions)
//     res.setHeader('Access-Control-Allow-Credentials', false);
//
//     // // Pass to next layer of middleware
//     next();
// });

app.use(express.json());
// router.use(express.json());

// Allow CORS-Cross Origin Resouce Sharing ( Share data between different URL's)
app.use(cors({
    // origin: '*',
    // origin: 'http://localhost:3000',
    origin: ['http://localhost:3000', 'https://www.nurebo.com'],
    // methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    // allowedHeaders: ['Content-Type', 'Authorization', 'Timezone-Offset'],  // Aggiungi 'timezone-offset' nelle intestazioni permesse
    // allowedHeaders: '*',  // Aggiungi 'timezone-offset' nelle intestazioni permesse
    // preflightContinue: false,
    credentials: true, // Permette l'invio di cookie e credenziali
}));

// app.set('trust proxy', 1) // trust first proxy
// app.use(cookieParser('yourSecretKey'));
app.use(cookieParser(process.env.JWT_KEY));
const sessionMiddleware = session({
    // secret: 'keyboard cat',
    secret: process.env.JWT_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        // secure: true, //REMOTE
        // maxAge: 60000 * 60 * 40,
    },

})
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// router.use(cors({
//     origin: '*',
//     // methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     // methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
//     // preflightContinue: false,
// }));

// for parsing application/json
app.use(
    bodyParser.json({
        limit: "50mb",
    })
);

// router.use(
//     bodyParser.json({
//         limit: "50mb",
//     })
// );

app.use(
    bodyParser.urlencoded({
        limit: "10mb",
        extended: true,
    })
);

// router.use(
//     bodyParser.urlencoded({
//         limit: "50mb",
//         extended: true,
//     })
// );

// app.use(upload.array());

// app.use(limiter)

// app.use(morgan(':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms\n'));
// app.use(morgan(':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":user-agent"\n'));
// app.use(
//     morgan(
//     'combined',
//         {
//             immediate: function (req, res) {
//
//             }
//         }
//     )
// );
app.use(morgan('dev'));
// router.use(morgan('dev'));
// app.use(morgan('combined'));

//Max 5 requests per 5 seconds
// app.use(rateLimiter({
//     windowMs: 5000, //5 seconds
//     max: 5, //5 requests
//     message: {
//         code: 429, //HTTP code per too many requests
//         message: "Troppe richieste, amico mio... Riprova dopo, magari sarai più fortunato! :)"
//     }
// }));

console.log(process.env.NODE_ENV)
// const pubClient = process.env.NODE_ENV === 'DEV_LOCAL'
//     ? new Redis({host: '127.0.0.1', port: 6379}) //LOCAL
//     : process.env.NODE_ENV === 'DEV_REMOTE' || process.env.NODE_ENV === 'PROD'
//         ? new Redis({host: process.env.REDIS_ENDPOINT, port: 6379})
//     : null; //REMOTE

// const pubClient = new Redis({ url: "redis://localhost:6379" });
const pubClient = new Redis({host: '127.0.0.1', port: 6379}) //LOCAL
// const pubClient = new Redis({host: process.env.REDIS_ENDPOINT, port: 6379}); //REMOTE
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient/*, {
    publishOnSpecificResponseChannel: true
}*/));
pubClient.on("error", (err) => {
    console.log(err);
});
subClient.on("error", (err) => {
    console.log(err);
});

app.use("/booking", bookingV1Routes);
app.use("/category", categoryV1Routes);
app.use("/user", userV1Routes);
app.use("/event", eventV1Routes);
app.use("/event-ticket", eventTicketRoutes);
// app.use("/authentication", authenticationV1Routes);
// app.use("/timetable", timetableV1Routes);
app.use("/version", versionV1Routes);
app.use("/business", businessV1Routes);
app.use("/prestazione", prestazioneV1Routes);
app.use("/image", imageV1Routes);
app.use("/reservation", reservationV1Routes);
app.use("/product", productV1Routes);


app.use("/chat_message", chatMessageRoutes);
app.use("/chat", chatRoutes);
app.use("/event_room", eventRoomRoutes);
// app.use("/validation_phone_number", validationPhoneNumberRoutes);
// app.use("/validation_email", validationEmailRoutes);
app.use("/booking_occupied", occupiedBookingRoutes);
app.use("/seller_visited", sellerVisitedRoutes);
app.use("/website_contact_us", websiteContactUsRoutes);

// app.use('/posts', express.static(__dirname + '/posts'));
// app.use('/src/posts', express.static('/src/posts'));

// app.use("/posts", express.static(path.join(__dirname, "posts")));

// io.use(async (socket, next) => {
//     try {
//         // const user = await io.fetchUser(socket);
//         // socket.user = user;
//     } catch (e) {
//         next(new Error("unknown user"));
//     }
// });

var chatt;

(async () => {
    try {
        // console.log("io.of('/')");
        // console.log(io.of('/'));

        var rooms = await io.of('/').adapter.allRooms();
        console.log(`io.of('/').adapter.allRooms()`);
        console.log(rooms);

        var sockets = await io.of('/').adapter.sockets(new Set());
        console.log(`io.of('/').adapter.sockets`);
        console.log(sockets);

        var sids = await io.of('/').adapter.sids;
        console.log(`io.of('/').adapter.sids`);
        console.log(sids);

        var rooms1 = await io.of('/').adapter.rooms;
        console.log(`io.of('/').adapter.rooms`);
        console.log(rooms1);
    } catch (e) {
        console.log(e)
    }
})();

// /*module.exports = *//*global.sio = */io.sockets.on("connection", (socket) => {
/*module.exports = *//*global.sio = */io.on("connection", (socket) => {
// /*module.exports = *//*global.sio = */io.on("connection", function (socket) {
    console.log("Socket connected")

    socket.on("join-notification", user => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        console.log('user.user_id');
        console.log(user.user_id);
        console.log('user');
        console.log(user);
        // console.log(io.of('/').adapter.rooms);

        socket.join(user.user_id);
        // console.log(io.of('/').adapter.rooms);
        // console.log('ciccciolloooo');

        // if(typeof chat.id != "undefined")
        //     chatt = chat.id;
        // console.log(socket.id + " joined in chat " + chat.id);
        // socket.to(chat.id).emit(
        //     "isLogged",
        //     chat.id
        // );

    })

    socket.on("join_booking_business_appointments", async room => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        // console.log("io.sockets.adapter.rooms in join booking business");
        console.log(await io.of('/').adapter.rooms);
        // console.log("io.sockets.adapter.rooms.length");
        // console.log(io.sockets.adapter.rooms.length);
        // console.log('io.sockets.adapter.rooms[room.id].sockets[0].length')
        // console.log(io.sockets.adapter.rooms[room.id].sockets[0].length)

        // console.log('io.sockets.adapter.rooms[room.id]')
        // console.log(io.sockets.adapter.rooms[room.id])

        socket.join(room.id);

        // if(io.sockets.adapter.rooms[room.id] !== undefined){
        //     console.log("io.sockets.adapter.rooms[room.id].sockets 1")
        //     console.log(io.sockets.adapter.rooms[room.id].sockets)
        //     console.log("io.sockets.adapter.rooms[room.id].length 1")
        //     console.log(io.sockets.adapter.rooms[room.id].length)
        //
        //     var i = 0;
        //     for(var e in io.sockets.adapter.rooms[room.id].sockets){
        //         console.log('e.toString()')
        //         console.log(e.toString())
        //         // if(i >= 2){
        //         if(i === 0 && io.sockets.adapter.rooms[room.id].length > 2){
        //             console.log('e.toString() da eliminare')
        //             console.log(e.toString())
        //             // e.leave(room.id)
        //             // io.sockets.adapter.rooms[room.id].sockets.remoteLeave(e, room.id)
        //             // /*io.of("/admin")*/socket.in(room.id).socketsLeave(e.toString());
        //             /*io.of("/admin")*/socket.in(e.toString()).leave(room.id);
        //         }
        //         i++;
        //     }
        //
        //     if(io.sockets.adapter.rooms[room.id] !== undefined){
        //         console.log("io.sockets.adapter.rooms[room.id].sockets 2")
        //         console.log(io.sockets.adapter.rooms[room.id].sockets)
        //         console.log("io.sockets.adapter.rooms[room.id].length 2")
        //         console.log(io.sockets.adapter.rooms[room.id].length)
        //     }
        //
        // }
    })

    socket.on("join-appointments", chat => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)

        socket.join('appointments000');
        // console.log(io.of('/').adapter.rooms);

    })

    // socket.on("send-message", message => {
    //     socket.broadcast.emit("receive-message", message);
    //     console.log(message)
    // })

    // //Send message to only a particular user
    // socket.on('send-message', message => {
    //     receiverId = message.receiverId
    //     senderId = message.senderId
    //     content = message.content
    //     console.log(message)
    //     // console.log(message.content)
    //
    //     //Send message to only that particular id
    //     // socket.in(receiverId).emit('receive-message', {
    //     socket.broadcast.emit('receive-message', {
    //         'content': content,
    //         'senderId': senderId,
    //         'receiverId':receiverId,
    //     })
    // })

    // socket.on("typing", (data) => {
    //     // socket.broadcast.emit("typing", data);
    //     socket.to(data).emit("typing", data);
    //     console.log(data);
    //
    // });
    //
    // socket.on("stop_typing", (data) => {
    //     // socket.broadcast.emit("stop_typing", data)
    //     socket.to(data).emit("stop_typing", data);
    //     console.log(data);
    //     // console.log(data);
    // });

    socket.on("update_booking_business_appointments", (appointment) => {
        console.log(io.of('/').adapter.rooms);

        // console.log('appointment prenotation');
        // console.log(appointment);

        // socket.broadcast.emit("booking_booking_business_appointments", appointment);
        socket.to(appointment.business_id).emit("update_booking_business_appointments", appointment);

        // console.log("io.sockets.adapter.rooms[appointment.business_id].sockets 1")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].sockets)
        // console.log("io.sockets.adapter.rooms[appointment.business_id].length 1")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].length)
        //
        // var i = 0;
        // for(var e in io.sockets.adapter.rooms[appointment.business_id].sockets){
        //     console.log('e.toString()')
        //     console.log(e.toString())
        //     if(i >= 2){
        //         console.log('e.toString() da eliminare')
        //         console.log(e.toString())
        //         // e.leave(room.id)
        //         // io.sockets.adapter.rooms[room.id].sockets.remoteLeave(e, room.id)
        //         // /*io.of("/admin")*/socket.in(room.id).socketsLeave(e.toString());
        //         /*io.of("/admin")*/socket.in(e.toString()).leave(appointment.business_id);
        //     }
        //     i++;
        // }
        //
        // console.log("io.sockets.adapter.rooms[appointment.business_id].sockets 2")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].sockets)
        // console.log("io.sockets.adapter.rooms[appointment.business_id].length 2")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].length)

    })

    socket.on("cancel_user_appointment_notification", async (appointment) => {
        console.log(await io.of('/').adapter.rooms);

        // console.log('appointment prenotation');
        // console.log(appointment);

        socket.to(appointment.business_id).emit("cancel_user_appointment_notification", appointment);
    })

    socket.on("cancel_business_appointment_notification", async (appointment) => {
        console.log(await io.of('/').adapter.rooms);

        // console.log('appointment prenotation');
        // console.log(appointment);

        io.sockets.to(appointment.user_id).emit("cancel_business_appointment_notification", appointment);
        // socket.to(appointment.user_id).emit("cancel_business_appointment_notification", appointment);

    })

    socket.on("remove_user_socket", async (user) => {
        console.log(await io.of('/').adapter.rooms);
        console.log(user);

        // socket./*in(user.socketId).*/leave(user.userId);
        socket.disconnect();

        // var arr1 = [];

        // //non funziona
        // for(var e in io.sockets.adapter.rooms[user.userId].sockets){
        //     console.log('eeeeeee.toString()')
        //     console.log(e.toString())
        //     console.log('eeeeeee.toString() da eliminare')
        //     console.log(e.toString())
        //     // socket.in(e.toString()).leave(user.userId);
        //     arr1.push(e.toString())
        // }
        // console.log('arr1.toString()')
        // console.log(arr1.toString())
        //
        // for(var e in arr1){
        //     socket.in(e.toString()).leave(user.userId);
        // }

        console.log('leave sockettttt');
        console.log(await io.of('/').adapter.rooms);
    })

    socket.on("remove_background_user_socket", async (user) => {
        console.log(await io.of('/').adapter.rooms);
        console.log(user);

        /*io.of("/admin")*/socket.in(user.socketId).leave(user.userId);

        console.log(await io.of('/').adapter.rooms);
    })

    socket.on("broadcast-test", (msg, ack) => {
        // console.log(io.sockets.adapter.rooms);

        // ack('lubbberjack');

        /*var era = */socket.broadcast.emit(
            'broad',
            'Ciaooone dal broadcast di Socket.io',
            // (response) => {
            //     console.log('allaahhhhhh')
            //     console.log(response)
            // }
            // function (arg, ack) {
            //     console.log('ferret')
            //     ack('woot');
            // }

            // {
            //     'content': msg.content,
            //     'senderId': senderId,
            //     'receiverId':receiverId,
            // }
        )
        ack('lubbberjack');
        // console.log(era);
    })

    // Print the ID of the client
    // console.log(socket.id + " JOINED");
    // socket.broadcast.emit("greeting", { msg: "Welcome, ", socket: socket.id });

    socket.on("join-chat", chat => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        socket.join(chat.id);
        // console.log(io.sockets.adapter.rooms);
        // console.log('ciccciolloooo');

        if(typeof chat.id != "undefined")
            chatt = chat.id;
        console.log(socket.id + " joined in chat " + chat.id);
        socket.to(chat.id).emit(
            "isLogged",
            chat.id
        );
        // while(typeof chat === "undefined") {
        // // while(chat === "undefined") {
        //     socket.join(chatt);
        //     // chatt = chat;
        //     console.log(socket.id + " joined in chat " + chatt);
        //     socket.to(chatt).emit(
        //         "isLogged",Weriolllpingg
        //         chatt
        //     );
        // }
    })

    socket.on("join-chat_room", chat => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        socket.join(chat.id);
        // console.log(io.sockets.adapter.rooms);
        // console.log('join-chat_room');

        // if(typeof chat.id != "undefined")
        //     chatt = chat.id;
        console.log(socket.id + " joined in chat room " + chat.id);
        // socket.to(chat.id).emit(
        //     "isLogged",
        //     chat.id
        // );
    })

    socket.on("join-business_room", chat => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        socket.join(chat.id);
        // console.log(io.sockets.adapter.rooms);
        // console.log('join-chat_room');

        // if(typeof chat.id != "undefined")
        //     chatt = chat.id;
        console.log(socket.id + " joined in business chat room " + chat.id);
        // socket.to(chat.id).emit(
        //     "isLogged",
        //     chat.id
        // );
    })

    socket.on("join-business", message => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        socket.join(message.id);
        // console.log(io.sockets.adapter.rooms);

        console.log(socket.id + " joined in business " + message.id);
    })

    socket.on("join-notification", user => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        console.log('user.user_id');
        console.log(user.user_id);
        console.log('user');
        console.log(user);
        // console.log(io.sockets.adapter.rooms);

        socket.join(user.user_id);
        // console.log(io.sockets.adapter.rooms);
        // console.log('ciccciolloooo');

        // if(typeof chat.id != "undefined")
        //     chatt = chat.id;
        // console.log(socket.id + " joined in chat " + chat.id);
        // socket.to(chat.id).emit(
        //     "isLogged",
        //     chat.id
        // );

    })

    socket.on("join_date_business_appointments", room => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)
        // console.log("io.sockets.adapter.rooms in join date business");
        console.log(io.sockets.adapter.rooms);
        // console.log("io.sockets.adapter.rooms.length");
        // console.log(io.sockets.adapter.rooms.length);
        // console.log('io.sockets.adapter.rooms[room.id].sockets[0].length')
        // console.log(io.sockets.adapter.rooms[room.id].sockets[0].length)

        // console.log('io.sockets.adapter.rooms[room.id]')
        // console.log(io.sockets.adapter.rooms[room.id])


        socket.join(room.id);


        // if(io.sockets.adapter.rooms[room.id] !== undefined){
        //     console.log("io.sockets.adapter.rooms[room.id].sockets 1")
        //     console.log(io.sockets.adapter.rooms[room.id].sockets)
        //     console.log("io.sockets.adapter.rooms[room.id].length 1")
        //     console.log(io.sockets.adapter.rooms[room.id].length)
        //
        //     var i = 0;
        //     for(var e in io.sockets.adapter.rooms[room.id].sockets){
        //         console.log('e.toString()')
        //         console.log(e.toString())
        //         // if(i >= 2){
        //         if(i === 0 && io.sockets.adapter.rooms[room.id].length > 2){
        //             console.log('e.toString() da eliminare')
        //             console.log(e.toString())
        //             // e.leave(room.id)
        //             // io.sockets.adapter.rooms[room.id].sockets.remoteLeave(e, room.id)
        //             // /*io.of("/admin")*/socket.in(room.id).socketsLeave(e.toString());
        //             /*io.of("/admin")*/socket.in(e.toString()).leave(room.id);
        //         }
        //         i++;
        //     }
        //
        //     if(io.sockets.adapter.rooms[room.id] !== undefined){
        //         console.log("io.sockets.adapter.rooms[room.id].sockets 2")
        //         console.log(io.sockets.adapter.rooms[room.id].sockets)
        //         console.log("io.sockets.adapter.rooms[room.id].length 2")
        //         console.log(io.sockets.adapter.rooms[room.id].length)
        //     }
        //
        // }
    })

    // socket.on("send-message", message => {
    //     socket.broadcast.emit("receive-message", message);
    //     console.log(message)
    // })

    // //Send message to only a particular user
    // socket.on('send-message', message => {
    //     receiverId = message.receiverId
    //     senderId = message.senderId
    //     content = message.content
    //     console.log(message)
    //     // console.log(message.content)
    //
    //     //Send message to only that particular id
    //     // socket.in(receiverId).emit('receive-message', {
    //     socket.broadcast.emit('receive-message', {
    //         'content': content,
    //         'senderId': senderId,
    //         'receiverId':receiverId,
    //     })
    // })

    socket.on("send_remove_chat_message", (message/*, chat*/) => {
        // console.log(io.sockets.adapter.rooms);
        console.log(message.chatId);

        // if(chatt === message.chatId){
        // io.sockets.in(message.chatId).emit("receive-message", message);
        socket.to(message.chatId).emit("receive_remove_chat_message", message);
        console.log(message);
        // }
        // if(chatt !== message.chatId){
        // socket.broadcast.emit("receive-message", message);
        // console.log(message.chatId);
        // console.log("non va");
        // }
    })

    socket.on("send_edit_chat_message", (message/*, chat*/) => {
        // console.log(io.sockets.adapter.rooms);
        console.log(message.chatId);

        // if(chatt === message.chatId){
        // io.sockets.in(message.chatId).emit("receive-message", message);
        socket.to(message.chatId).emit("receive_edit_chat_message", message);
        console.log(message);
        // }
        // if(chatt !== message.chatId){
        // socket.broadcast.emit("receive-message", message);
        // console.log(message.chatId);
        // console.log("non va");
        // }
    })

    socket.on("send_closing_chat", (message/*, chat*/) => {
        // console.log(io.sockets.adapter.rooms);
        console.log(message.chatId);

        // if(chatt === message.chatId){
        // io.sockets.in(message.chatId).emit("receive-message", message);
        socket.to(message.chatId).emit("receive_closing_chat", message);
        console.log(message);
        // }
        // if(chatt !== message.chatId){
        // socket.broadcast.emit("receive-message", message);
        // console.log(message.chatId);
        // console.log("non va");
        // }
    })

    socket.on("send_opening_chat", (message/*, chat*/) => {
        // console.log(io.sockets.adapter.rooms);
        console.log(message.chatId);

        // if(chatt === message.chatId){
        // io.sockets.in(message.chatId).emit("receive-message", message);
        socket.to(message.chatId).emit("receive_opening_chat", message);
        console.log(message);
        // }
        // if(chatt !== message.chatId){
        // socket.broadcast.emit("receive-message", message);
        // console.log(message.chatId);
        // console.log("non va");
        // }
    })

    socket.on("send-message", (message/*, chat*/) => {
        console.log(io.sockets.adapter.rooms);
        console.log(message.chatId);

        // if(chatt === message.chatId){
        // io.sockets.in(message.chatId).emit("receive-message", message);
        socket.to(message.chatId).emit(
            "receive-message",
            message,
            // (response) => {
            //     console.log('allaahhhhhh')
            //     console.log(response)
            // }
        );
        console.log(message);
        // }
        // if(chatt !== message.chatId){
        // socket.broadcast.emit("receive-message", message);
        // console.log(message.chatId);
        // console.log("non va");
        // }
    })

    socket.on("send-room_message", (message/*, chat*/) => {
        console.log(io.sockets.adapter.rooms);
        // console.log(message);
        console.log(message.singleEventId);

        // if(chatt === message.chatId){
        // io.sockets.in(message.chatId).emit("receive-message", message);
        socket.to(message.singleEventId).emit("receive-room_message", message);
        console.log(message);
        // }
        // if(chatt !== message.chatId){
        // socket.broadcast.emit("receive-message", message);
        // console.log(message.chatId);
        // console.log("non va");
        // }
    })

    socket.on("send-business_room_message", (message/*, chat*/) => {
        // console.log(io.sockets.adapter.rooms);
        // console.log(message);
        console.log('f555555fffffffffffffffff');
        console.log(message.business_room_id);

        // if(chatt === message.chatId){
        // io.sockets.in(message.chatId).emit("receive-message", message);
        socket.to(message.business_room_id).emit("receive-business_room_message", message);
        console.log(message);

        // }
        // if(chatt !== message.chatId){
        // socket.broadcast.emit("receive-message", message);
        // console.log(message.chatId);
        // console.log("non va");
        // }
    })

    // socket.on("send_user-business_room_message", (message/*, chat*/) => {
    //     // console.log(io.sockets.adapter.rooms);
    //     // console.log(message);
    //     console.log('dfbdbgdbbgggddggggddgdd6dg6g6gf5gbdgff');
    //     console.log(message.business_room_id);
    //
    //     // if(chatt === message.chatId){
    //     // io.sockets.in(message.chatId).emit("receive-message", message);
    //     socket.to(message.business_room_id).emit("receive_business-business_room_message", message);
    //     console.log(message);
    //
    //     // }
    //     // if(chatt !== message.chatId){
    //     // socket.broadcast.emit("receive-message", message);
    //     // console.log(message.chatId);
    //     // console.log("non va");
    //     // }
    // })
    //
    // socket.on("send_business-business_room_message", (message/*, chat*/) => {
    //     // console.log(io.sockets.adapter.rooms);
    //     console.log('messagegffh6f6');
    //     console.log(message);
    //
    //     console.log(message.business_room_id);
    //
    //     // if(chatt === message.chatId){
    //     // io.sockets.in(message.chatId).emit("receive-message", message);
    //     socket.to(message.business_room_id).emit("receive_user-business_room_message", message);
    //
    //     // }
    //     // if(chatt !== message.chatId){
    //     // socket.broadcast.emit("receive-message", message);
    //     // console.log(message.chatId);
    //     // console.log("non va");
    //     // }
    // })

    // socket.on("typing", (data) => {
    //     // socket.broadcast.emit("typing", data);
    //     socket.to(data).emit("typing", data);
    //     console.log(data);
    //
    // });
    //
    // socket.on("stop_typing", (data) => {
    //     // socket.broadcast.emit("stop_typing", data)
    //     socket.to(data).emit("stop_typing", data);
    //     console.log(data);
    //     // console.log(data);
    // });

    socket.on("typing", (data) => {
        // socket.broadcast.emit("typing", data);
        // socket.broadcast.emit("typing", data);
        socket.to(data.chat).emit("typing", data);
        console.log(data.chat);
        console.log(data.text);
        console.log(data);
    });

    socket.on("stop_typing", (data) => {
        // socket.broadcast.emit("stop_typing", data)
        socket.to(data.chat).emit("stop_typing", data);
        // socket.broadcast.emit("stop_typing", data);
        console.log(data.chat);
        console.log(data.text);
        console.log(data);
    });

    socket.on("update_date_business_appointments", (appointment) => {
        // console.log(io.sockets.adapter.rooms);

        // console.log('appointment prenotation');
        // console.log(appointment);

        // socket.broadcast.emit("update_date_business_appointments", appointment);
        socket.to(appointment.business_id).emit("update_date_business_appointments", appointment);

        // console.log("io.sockets.adapter.rooms[appointment.business_id].sockets 1")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].sockets)
        // console.log("io.sockets.adapter.rooms[appointment.business_id].length 1")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].length)
        //
        // var i = 0;
        // for(var e in io.sockets.adapter.rooms[appointment.business_id].sockets){
        //     console.log('e.toString()')
        //     console.log(e.toString())
        //     if(i >= 2){
        //         console.log('e.toString() da eliminare')
        //         console.log(e.toString())
        //         // e.leave(room.id)
        //         // io.sockets.adapter.rooms[room.id].sockets.remoteLeave(e, room.id)
        //         // /*io.of("/admin")*/socket.in(room.id).socketsLeave(e.toString());
        //         /*io.of("/admin")*/socket.in(e.toString()).leave(appointment.business_id);
        //     }
        //     i++;
        // }
        //
        // console.log("io.sockets.adapter.rooms[appointment.business_id].sockets 2")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].sockets)
        // console.log("io.sockets.adapter.rooms[appointment.business_id].length 2")
        // console.log(io.sockets.adapter.rooms[appointment.business_id].length)

    })

    socket.on("cancel_user_appointment_notification", (appointment) => {
        // console.log(io.sockets.adapter.rooms);

        // console.log('appointment prenotation');
        // console.log(appointment);

        socket.to(appointment.business_id).emit("cancel_user_appointment_notification", appointment);
    })

    socket.on("cancel_business_appointment_notification", (appointment) => {
        // console.log(io.sockets.adapter.rooms);

        // console.log('appointment prenotation');
        // console.log(appointment);

        socket.to(appointment.user_id).emit("cancel_business_appointment_notification", appointment);

    })

    socket.on("join-appointments", chat => {
        // console.log(io.sockets.adapter.rooms.(chat));
        // io.sockets.adapter.rooms.has(chat)

        socket.join('appointments000');
        // console.log(io.sockets.adapter.rooms);

    })
});

// To launch the server on the current IP address we use 0.0.0.0
// server.listen(port, "192.168.1.252", () => {
// server.listen(port, "192.168.1.225", () => {
// server.listen(port, () => {
// // server.listen(port, "0.0.0.0", () => {
// // server.listen(port, "www.kadingira.freeddns.org", () => {
// // server.listen(port, "www.nexyra.com", () => {
//     console.log(`Server running on http://supperman.hopto.org:${port}`);
// })

// module.exports = server;
// function getSocketIo(){
//     return io;
// }
// module.exports.getSocketIo = getSocketIo()
module.exports.ioObject = io;