// require('dotenv').config({path: './env'})
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import express from 'express';

const app = express();

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.on('error', (error) => {
            console.error("App Error: ", error)
            throw error;
        })
    app.listen(process.env.PORT || 8000, () => {
        console.log('Server running on port ' + process.env.PORT)
    })
})
.catch((err) => {
    console.error(`DB Connection FAILED: ${err.message}`)
});

/*
const app = express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error', (error) => {
            console.error("App Error: ", error)
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log("App listening on port " + process.env.PORT)
        })
    } catch (error) {
        console.error("Error: " + error);
        throw error;
    }
})()
*/