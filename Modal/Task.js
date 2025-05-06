// const { default: mongoose } = require("mongoose");

// const TaskSchema = new mongoose.Schema({

//   title: { type: String, required: true },
//   description: { type: String },
//   assigned_to: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'User'
//   }, // Reference to Users

//   assigned_by: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'User'
//   }, // Reference to Users
  
//   //Project Dropdown
//   project_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Project'
//   },
//   due_date: { type: Date },
//   status: {
//     type: String,
//     enum: ['Pending', 'In Progress', 'Completed'],
//     default: 'Pending'
//   },


//   //filename
//   fileName:{
//     type:String,
//     default:"",
//   },

//   //repeat task
//   repeat:{
//     type:Boolean,
//     default:false
  
//   },

//   //reminder task
//   reminder:{
//     type:Number,
//   },


  
//   priority: {
//     type: String, enum: ['High', 'Medium', 'Low'],
//     required: true,
//     default: 'Low'

//   },
//   completedUnit: {
//     type: Number,
//     default: 0
//   },
//   totalunit: {
//     type: Number,
//   },
//   unittype: {
//     type: String,
//   },
//   comments: [
//     {
//       comment_id: { type: String },
//       comment_text: { type: String },
//       commented_by: { type: String, ref: 'User' },
//       comment_date: { type: Date }
//     }
//   ]
// });

// //   module.exports = mongoose.model('Task', TaskSchema);
// const Task = mongoose.model('Task', TaskSchema);
// module.exports = Task;




const { default: mongoose, Mongoose } = require("mongoose");

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
 
    ref: 'User'
  }, // Reference to Users

  ProjectName:{
    type:String
  },

  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    
    ref: 'User'
  }, // Reference to Users
  
  //Project Dropdown
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  due_date: { type: Date },
  status: {
    type: String,
    // enum: ['Pending', 'In Progress', 'Completed'],
    // default: 'Pending'
  },

  //filename
  fileName: {
    type: String,
    default: "",
  },


  // repeatDates:{
  //   type:[String],
  //   default:[]
  // },

  //repeat task
  repeatType: {
    type: String,
    default: false
  },

  end_date:{
    type: String,
  },
  //reminder task
  reminder: {
    type: Map,
    of: String,  // This allows you to store an object with keys and string values
  },

  priority: {
    type: String, 
    // enum: ['High', 'Medium', 'Low'],
    
    // default: 'Low'
  },
  loop_users:[ 
    type= mongoose.Schema.Types.ObjectId,
    
    ref= 'User'
   ],
  completedUnit: {
    type: Number,
    default: 0
  },
  totalunit: {
    type: Number,
  },
  unittype: {
    type: String,
  },
  start_date:{
    type:Date
  },
  comments: [
    {
      comment_id: { type: String },
      comment_text: { type: String },
      commented_by: { type: String, ref: 'User' },
      comment_date: { type: Date }
    }
  ],
  
  // New fields added
  category: { type: String },
  loop_user: [{ type: mongoose.Schema.Types.ObjectId,
  
    ref: 'User'  }],
  attachment: { type: Array, default: [] },
  clock: {
    reminder_date: { type: Date },
    time: { type: String },
    before_after: { type: String, enum: ['Before', 'After'] }
  }
});

const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;
