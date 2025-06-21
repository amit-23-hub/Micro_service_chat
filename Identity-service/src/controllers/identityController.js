
const logger = require('../utils/Logger.js');
const User = require('../models/User.js');
const RefreshToken = require('../models/RefreshToken.js');
const generateToken = require('../utils/generateToken.js')
const varifyPassword = require('../models/User.js')
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


// logout 


module.exports = {
    registerUser,
     loginUser,
    // refreshToken,
    // logoutUser
};