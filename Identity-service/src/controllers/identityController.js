
const logger = require('../utils/Logger.js');
const User = require('../models/User.js');
const RefreshToken = require('../models/RefreshToken.js');
const generateToken = require('../utils/generateToken.js')

const {ValidateRegistration, Validatelogin} = require('../utils/validation.js');


// user registration 

const registerUser = async (req , res) =>{

    logger.info('User registration started');

    try{

        // Validate user input jo req body se aaya hai usko validate krna hai

        const {error} = ValidateRegistration(req.body);
        // agr error hai to usko handle krna hai
        if(error){
            logger.warn('Validation error:', error.details[0].message);
            return res.status(400).json({
                success : false , 
                message: error.details[0].message
            }) ;
        }

        // Check if user already exists
        const {email , username , password} = req.body;
         // username ya email check krenge 
        let user = await User.findOne({$or: [{ email }, { username }]});

// agar user already exist krta hai to usko handle krenge
         if (user){
            logger.warn('User already exists:', email);
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
         }

         // create new user 

    user  =  new User({
        username,
        email,
        password
    });
    await user.save() ; 
    logger.info('User saved successfully:', user._id);

    // Generate tokens for the user

    const { accessToken, refreshToken } = await generateToken(user);

    res.status(201).json({
        success : true ,
        message: 'User registered successfully',
        accessToken,
        refreshToken,
    })

    } catch (err) {
        logger.error('Error during user registration:', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error' });
    }

    
}



// user login 

const loginUser = async (req,res)=>{

    logger.info("login endpoints hit..") ; 

    try {
        // validate login

        const {error} = Validatelogin(req.body)
        if(error){
            logger.warn('Validation error:', error.details[0].message);
            return res.status(400).json({
                success : false , 
                message: error.details[0].message
            }) ;
        }

        const {email ,password} = req.body ; 
        const user = await User.findOne({email})

        if(!user){
            logger.warn('invalid user')
            return res.status(400).json({
                success:false ,
                message : 'invalid credetials'
            })
        }

        // validdate user passward 
        const isValidPassward = await user.varifyPassword(password) ;

        if(!isValidPassward){
            logger.warn('invalid password')
            return res.status(400).json({
                success:false ,
                message : 'invalid password'
            })
        }

        const {accessToken , refreshToken} = await generateToken(user) ; 

        res.json({
            accessToken ,
            refreshToken,
            userId : user._id
        })

        
    } catch (err) {
        logger.error('Error during user registration:', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error' });
    }
}

// refresh token 
const refreshToken =  async (req, res) => {
    logger.info('refreshtoken endpoint hit...')

    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('Refresh token is required');
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Check if the refresh token exists in the database
        const token = await RefreshToken.findOne({ token: refreshToken });
        if (!token || token.isExpired()< Date.now()) {
            logger.warn('Invalid refresh token');
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        const user = await User.findById(token.user);
        if (!user) {
            logger.warn('User not found for the provided refresh token');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const {accessToken, newRefreshToken} = await generateToken(user);

        // delete the old refresh token
        await RefreshToken.deleteOne({ token: refreshToken });

        // save the new refresh token
        const newToken = new RefreshToken({
            user: user._id,
            token: newRefreshToken,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        await newToken.save();


    }catch (err) {
        logger.error('refresh token error occured ', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error' });
    }
};
// logout 
const logoutUser = async (req, res) => {
    logger.info('logout endpoint hit...');
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('Refresh token is required');
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }
        // Check if the refresh token exists in the database
        const token = await RefreshToken.findOne({ token: refreshToken });
        if (!token) {
            logger.warn('Invalid refresh token');
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        // Delete the refresh token from the database
        await RefreshToken.deleteOne({ token: refreshToken });

        res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });
        

        
    }catch (err) {
        logger.error('error occured during logout  ', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error' });
    }
};



module.exports = {
    registerUser,
     loginUser,
     refreshToken,
     logoutUser
};
