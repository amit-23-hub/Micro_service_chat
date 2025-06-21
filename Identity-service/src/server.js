
require ('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/Logger');
const helmet = require('helmet');
const Redis = require('ioredis') ;
const {RateLimiterRedis} = require('rate-limiter-flexible');
const rateLimit = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis')
const Userroutes = require('./routes/identity-service');
const errrHandler = require('./middleware/errorHandler');
const app = express();
const PORT = process.env.PORT ; 
// connet to mongodb

mongoose.connect(process.env.MONGO_URI)
.then(()=>logger.info('Connected to MongoDB')) 
.catch((err)=> logger.error('MongoDB connection error:', err));

// creating redis client 
const redisClient = new Redis(process.env.REDIS_URL)

//  middlware setup
app.use(helmet())
app.use(cors());
app.use(express.json());

app.use((req,res,next)=>{
    logger.info(` recieved ${req.method} request to  ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
} )

// ddos protection and  Rate limiting 

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix :'middleware',
    points: 10, // no of request in certian tome 
    duration: 1, // time in seconds
}) ; 

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip)
    .then(() => {
        next();
    })
    .catch(()=>{
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        });
    })
})

// rate limiting for sensitive routes/ endpoints

const sensitiveEndpointLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max : 50 , // limit each IP to 50 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler:(req,res)=>{
        logger.warn(`rate limit exceeded for the endpoint: ${req.originalUrl} for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        });
    },
    store : new RedisStore({
        sendCommand : (...args)=>redisClient.call(...args),
    })


});

// using rate limiter to endpoints 
app.use('/api/auth/register' , sensitiveEndpointLimiter) ; 

// routes

app.use('/api/auth',Userroutes) ; 

// error handler 

app.use(errrHandler) ; 

// start server 

app.listen ( PORT , ()=>{
    logger.info (`identity server running on port ${PORT}`)
}) ; 

// unhandled  promise rejection 

process.on('unhandledRejection',(reason,promise)=>{
    logger.error('unhandled rejection at ' , promise ,'reason : ' , reason)
})   ; 



