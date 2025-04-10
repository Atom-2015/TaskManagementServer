const { default: mongoose, Mongoose } = require("mongoose");

const subTaskSchema=new mongoose.Schema({
    name:{type:String,required: true },

    project_id:{type:mongoose.Schema.Types.ObjectId,
    ref:"Project"},

    assigned_userid: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    
    task_id:{type:mongoose.Schema.Types.ObjectId,
        ref:'Task'
    },

    priority:{
        type:String,
        required: true
    },

    start_date:{
        type:Date,
        required: true
       
    },

    end_date:{
        type:Date,
        required: true
       
    },

    cost:{
        type:Number,
        required: true
      
    },
    status:{
        type:String,
      
    }

    
})

const SubTask = mongoose.model('SubTask',subTaskSchema);
module.exports=SubTask;