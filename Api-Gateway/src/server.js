require('dotenv').config();
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const express = require('express')
const app = express() ; 
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const logger = require('./utils/Logger')
const proxy = require('express-http-proxy')
const PORT = process.env.PORT || 3000 ; 
const redisClient = new Redis(process.env.REDIS_URL) ;
const errorHandler = require('./middleware/errorHandler')

app.use(helmet()) ;
app.use(cors()) ; 
app.use(express.json())

// rate limiting 

const ratelimitOptions = rateLimit({
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

app.use(ratelimitOptions) ; 

app.use((req,res,next)=>{
    logger.info(` recieved ${req.method} request to  ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
} )


const proxyOption = {
    proxyReqPathResolver : (req)=>{
        return req.originalUrl.replace(/^\/v1/ , "/api")
    },
    proxyErrorHandler : (err , res ,next)=>{
        logger.error(`proxy error : ${err.message}`) ;
        res.status(500).JSON({
            message : `internal server error ` , error : err.message
        })
    }
}
// setting proxy for our idenityt service

app.use('/v1/auth' , proxy(process.env.IDENTITY_SERVICE_URL,{
    ...proxyOption ,
    proxyReqOptDecorator : (proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator : (proxyRes, proxyResData , userReq ,  userRes)=>{
        logger.info(`response recived from identity service : ${proxyRes.statusCode}`)

        return proxyResData 
    }
}))

app.use(errorHandler) ; 

app.listen(PORT , ()=>{
    logger.info(`api gateway is running on port ${PORT}`)
    logger.info(`identity service is ruuing on port ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`identity service is ruuing on port ${process.env.REDIS_URL}`)
})