// for validating user input in the identity service  ki jo model hai uske related hi data hai ya nhi vo check krne k  liye 

const Joi = require('joi');


const ValidateRegistration = (data) =>{

    const schema =  Joi.object({
        username: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    })

    return schema.validate(data) ; 

}

const Validatelogin = (data) =>{

    const schema =  Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    })

    return schema.validate(data) ; 

}

module.exports = {
    ValidateRegistration,
    Validatelogin,
};






