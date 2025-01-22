import bcrypt, { genSalt } from "bcrypt";
import jwt  from "jsonwebtoken"
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
        username: {
            type: String, 
            required: true , 
            unique: true, 
            lowercase: true,
            trim: true , 
            index: true , 
        },
        watchHistory:[{
            type:mongoose.Schema.Types.ObjectId, 
            ref: "Video",
        }],
        email: {
            type: String, 
            required: true , 
            unique: true, 
            lowercase: true,
            trim: true , 
            
        },
        fullname: {
            type: String, 
            required: true , 
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url 
            required: true , 
        },
        coverImage:{
            type: String // cloudinary url 
        },
        password: 
            {
                type: String, 
                required: [true, "Password is required."] 
            },
        
        refreshToken: {
            type: String
        } ,
       
} ,{timestamps: true })


userSchema.pre("save",async function  (next){
    if (!this.isModified('password')) {
        return next();
    }

    // const salt = await bcrypt.genSalt(8);
    // const hashedPassword = await bcrypt.hash(this.password, salt)
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect =  async function  (password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateRefreshToken = function(){
    // generateRefreshToken via JWT via 
    // jwt.sign(payload, 'your_refresh_token_secret', options);

    return jwt.sign(
        {
            _id : this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY, 
        }
    )
}

userSchema.methods.generateAccessToken = function(){
    // jwt.sign(payload, 'your_access_token_secret', options);

    return jwt.sign(
        {
            _id : this._id,
            username: this.username,
            fullname:this.fullname,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY ,
        }
    )
}

export const User = mongoose.model("User", userSchema)