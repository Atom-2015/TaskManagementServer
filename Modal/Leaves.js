const mongoose =require ('mongoose');
const User=require('../Modal/User');



const LeaveSchema =mongoose.Schema({
    employ_Id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    startdate:{
        type:String,

    },
    endDate:{
        type:String,
    },
    reason:{
        type:String,
    },

    status:{
        type:String,
        enum:[approved,pending,reject]
    }
    
})