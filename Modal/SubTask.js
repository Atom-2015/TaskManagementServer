const { default: mongoose, Mongoose } = require("mongoose");

const subTaskSchema = new mongoose.Schema({
    name: { type: String, required: true },

    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },

    assigned_userid: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    task_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },

    priority: {
        type: String,
      
    },

    start_date: {
        type: Date,
        
       

    },

    end_date: [{
      
        value:{type:Date},
        updatedby:{
            type:String,
            // required:true
        },
        timeUpdated:{
            type:Date
        }     
        
       
    }],

    checklist: [
        {
          item: { type: String},
          toCheck:{type:String},
          checked: { type: Boolean, default: false }
        }
      ],

    cost: [{
        value:{
            type:Number
        },
        updatedby:{
            type:String,
            // required:true
        },
        timeUpdated:{
            type:Date
        }     

    }],
    status: {
        type: String,

    },

    position:{
        type:Number,
        default:0
    },

    comment:{
        type:String,
    },

    updateHistory:[{
        userId:{type : mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        field:{type:String},
        oldValue:mongoose.Schema.Types.Mixed,
        newValue:mongoose.Schema.Types.Mixed,
        updatedAt:{type:Date,default:Date.now}
        
    }]


},{timestamps:true})

const SubTask = mongoose.model('SubTask', subTaskSchema);
module.exports = SubTask;