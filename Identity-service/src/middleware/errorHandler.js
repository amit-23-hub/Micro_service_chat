
const logger = require('../utils/Logger');

// This middleware function is used to handle errors in the application.
// It logs the error stack and sends a JSON response with the error message and status code.
const errrHandler = (err, req, res, next) => {

    logger.error(err.stack) 

    res.status (err.status || 500).json({
        message : err.message || 'Internal Server Error',
    })
}

module.exports = errrHandler;
