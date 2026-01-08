const express = require("express");
const multer = require("multer");
const compressImages = require("compress-images");
const fs = require("fs");

const port = 7979;

const app = express();

const upload = multer({ dest: "./temp/"/*"uploads/"*/ });
// const storage = multer.memoryStorage/*diskStorage*/({
//     destination: function (req, file, callback) {
//         callback(null, '')
//     },
// });
// const upload1 = multer({
//     storage
//     // storage: storage,
//     // fileFilter: fileFilter
// }).single('image')

app.post("/compress-image", upload.single("imagerr")/*upload1*/, function (req, res) {
    const image = req.file;
    // console.log(req.file)

    if (!image || image.size === 0) {
        res.status(500).send("");
        return;
    }

    try{
        if (image.mimetype === "image/png" || image.mimetype === "image/jpeg" /*|| image.mimetype === "image/webp"*/) {
            // const filePath = "temp/"/*"uploads/"*/ + /*new Date().getTime() +*/ /*"-" +*/ image.originalname;
            const filePath = `temp/${image.originalname}`;
            // const compressedFilePath = "temp/"/*"uploads/"*/ + image.originalname;
            const compressedFilePath = `temp/${image.originalname}`;
            const compression = 40;
            // let rstring = new Date().getTime();

            fs.readFile(image.path, function (error, data0) {
                if (error) {
                    console.log(error)
                    res.status(500).send("");
                }

                fs.writeFile(filePath, data0, async function (error) {
                    if (error) {
                        console.log(error)
                        // throw error;
                        res.status(500).send("");
                    }

                    compressImages(
                        filePath,
                        compressedFilePath,
                        { compress_force: false, statistic: true, autoupdate: true },
                        false,
                        {
                            jpg: { engine: "mozjpeg", command: ["-quality", compression] },
                        },
                        {
                            png: {
                                engine: "pngquant",
                                command: [`--quality=100-${compression}`, "-o"]
                            },
                        },
                        { svg: { engine: "svgo", command: "--multipass" } },
                        { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
                        async function (error, completed, statistic) {
                            if(error) {
                                console.log(error);
                                res.status(500).send("");
                            }
                            // console.log(completed);
                            console.log(statistic);

                            try {
                                fs.readFile(statistic.path_out_new, async function (err, data1) {
                                    if (err) {
                                        console.error('Error reading compressed file:', err);
                                        res.status(500).send("");
                                        return;
                                    }

                                    // console.log(filePath)

                                    fs.unlink(filePath, function (error) {
                                        if (error) {
                                            console.log(error)
                                        }
                                    });
                                    fs.unlink(/*compressedFilePath*/statistic.path_out_new, function (error) {
                                        if (error) {
                                            console.log(error)
                                        }
                                    });

                                    // res.send("File has been compressed and saved.");
                                    // res.set('Content-Type', 'image/jpeg');
                                    // res.set('Content-Type', 'image/png');
                                    res.set('Content-Type', image.mimetype);
                                    res/*.status(226)*/.send(data1/*Buffer.from(req.file.buffer)*/);

                                });
                            } catch (error) {
                                console.error(error);
                                res.status(500).send(error);
                            }
                        }
                    );
                });

                // console.log(image.path)
                fs.unlink(image.path, function (error) {
                    if (error) {
                        console.log(error)
                    }
                });
            });
        }
        else {
            res.status(439).send("Formato non supportato");
        }
    } catch (error) {
        console.error('Errore durante l\'invio dell\'immagine:', error);
        res.status(500).send('Errore durante l\'invio dell\'immagine');
    }

});

function makeid(length) {
    var result           = '';
    var characters       = '0123456789';
    // var characters       = '123456789';//problema con lo 0 da risolvere perchè lo vede come intero a un certo punto (forse regexp)
    // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}

app.listen(port, function () {
    console.log(`Server is running on ${port}`);
});
