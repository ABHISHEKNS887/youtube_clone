import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
// Cross-Origin Resource Sharing: https://expressjs.com/en/resources/middleware/cors.html
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})); // Setting limit for JSON responses.
app.use(express.urlencoded({extended: true, limit: "16kb"})); 
app.use(express.static('public')) // Storing the files.
app.use(cookieParser());

// Middleware: Middleware is a function that receives the request and response objects. 
// Most tasks that the middleware functions perform are: Execute any code. Update or modify the request and the response objects. 
// Finish the request-response cycle
export {app}