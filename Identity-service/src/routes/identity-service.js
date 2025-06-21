const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshAccessToken } = require('../controllers/identityController');



router.post('/register' , registerUser);
router.post('/login' , loginUser);




module.exports = router;