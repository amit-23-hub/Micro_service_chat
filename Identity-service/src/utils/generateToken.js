
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');


const generateToken = async (user)=>{

    const accessToken = jwt.sign(
        {
            userId : user._id,
            username: user.username,
        }, process.env.JWT_SECRET,{
            expiresIn: '15m'
        }
    )
// Generate a secure random refresh token
    const refreshTokenVal = crypto.randomBytes(64).toString('hex'); 

    const expiresAt = new Date() ; 
    expiresAt.setDate(expiresAt.getDate() + 7); // Set expiration to 7 days from now
    

    await RefreshToken.create({
        token: refreshTokenVal,
        user: user._id,
        expiresAt: expiresAt   // jo hm just upar create kiye vhi use kr rhre 
    });

    return {
        accessToken,
       refreshToken: refreshTokenVal ,
        expiresAt
    };
}

module.exports = generateToken;