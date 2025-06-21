const mongoose = require('mongoose') ;
const argon2 = require('argon2') ; /// use to hash and varify  the password 

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, 
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
},{
    timestamps: true,
});

// Hash the password before saving the user

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (err) {
            return next(err);
        }
    }
    next();
} );

// Method to verify the password
userSchema.methods.varifyPassword = async function name(enteredpassword) {
    try{
        return await argon2.verify(this.password, enteredpassword);
    } catch (err) {
        throw new Error('Password verification failed');
    }
    
}

// indexing the username and email for faster lookups
userSchema.index({ username: 1, email: 1 });

const User = mongoose.model('User' , userSchema);
module.exports = User;
