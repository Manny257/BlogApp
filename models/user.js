var mongoose               =require("mongoose"),
    passportLocalMongoose  =require("passport-local-mongoose");

var userSchema=new mongoose.Schema({
    username: { type:String, unique:true, required: true },
    email:    { type:String, unique:true, required: true },
    isAdmin:  { type:Boolean, default:false },
    firstName:String,
    lastName:String,
    password:String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User",userSchema);