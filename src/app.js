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
app.use(express.urlencoded({extended: true, limit: "16kb"})); // converting url to readable we use urlencoded. like abhi%20shek.
app.use(express.static('public')) // Storing the files.
app.use(cookieParser());

// Middleware: Middleware is a function that receives the request and response objects. 
// Most tasks that the middleware functions perform are: Execute any code. Update or modify the request and the response objects. 
// Finish the request-response cycle

// import router
import userRouter from './routes/user.route.js';
import healthCheckRouter from './routes/healthcheck.route.js';
import videoRouter from './routes/video.route.js';
import commentRouter from './routes/comment.route.js';
import tweetRouter from './routes/tweet.route.js';
import likeRouter from './routes/like.route.js';
import Subscriptionrouter from './routes/subscription.route.js';

// router declaration.
app.use('/api/v1/users/', userRouter);

app.use("/api/v1/healthcheck/", healthCheckRouter);

app.use("/api/v1/videos/", videoRouter)

app.use("/api/v1/comments/", commentRouter)

app.use("/api/v1/tweets/", tweetRouter)

app.use("/api/v1/likes/", likeRouter)

app.use("/api/v1/subscriptions/", Subscriptionrouter)

// http://localhost:8000/api/v1/users/register

export {app}