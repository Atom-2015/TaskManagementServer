const mongoose = require("mongoose");
const Project = require("../Modal/Projects");
const User= require("../Modal/User");


const ClentDisSchema =new mongoose.Schema({
    projectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        required:true,
    },
    client_name:{
        type:String,
        required:true,

    },

    discussed_by:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        
    },

    phone_no:{
        type:Number,
        
    },
    comment:{
        type:String,
        required:true
    },
    next_update:{
        type:String,
        required:true,
    }
})

module.exports = mongoose.model("ClientDis",ClentDisSchema); 