const { default: mongoose } = require("mongoose");
const User = require('../Modal/User')




const CompanySchema=new mongoose.Schema({
    company_name:{
        type:String,
        required:true,
    },

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'

    },

    client_name:{
        type:String,
        required:true,
    },

    email:{
        type:String,
        required:true,
    },

    joinDate:{
        type:Date,
        required:true,
    },

    validity:{
        type:Date,
        required:true,
    },
    

    cost:{
        type:Number,
        required:true,
    },
    company_password:{
        type:String,
        required:true,
    },

    
       
        country:{
            type:String,
        },
        state:{
            type:String,
        },
        city:{
            type:String
        }
    


    
});

module.exports =mongoose.model('Company',CompanySchema);