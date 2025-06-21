const winston = require('winston');

// Yeh pura setup aapki Node.js app mein centralized logging system banata hai
// jisse aapki application ke logs ko manage aur analyze karna asaan ho jata hai.
// yaha logger ko create kr rhe hai isme ye defined hai ki logs kis format me honge
// aur kis level ke logs ko store krna hai
// winston is a popular logging library for Node.js applications

const logger = winston.createLogger({
    level : process.env.NODE_ENV === 'production' ? 'info' : 'debug',

    // multiple formats ko combine kiya gya hau 

    format : winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    // kaun se service ka logger hai
    defaultMeta: { service: 'identity-service' },

    // transports define krte hai ki logs ko kaha store krna hai
    // Console transport is used for development and debugging

    transports : [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(), // colorfull way me logs ko print krne ke liye
                winston.format.simple()
            ),
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),
        new winston.transports.File({
            filename: 'logs/combined.log'
        })
    ]

})

module.exports = logger;