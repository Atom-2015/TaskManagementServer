const { default: mongoose } = require("mongoose");

const TaskSchema = new mongoose.Schema({

  title: { type: String, required: true },
  description: { type: String },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }, // Reference to Users

  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }, // Reference to Users

  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  due_date: { type: Date },
  status: {
    type: String,
     enum: ['Pending', 'In Progress', 'Completed'],
     default: 'Pending'
  },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], 
  required: true ,
  default:'Low'

},
completedUnit:{
  type:Number,
  default:0
},
totalunit:{
  type:Number,
},
unittype:{
  type:String,
},
  comments: [
    {
      comment_id: { type: String },
      comment_text: { type: String },
      commented_by: { type: String, ref: 'User' },
      comment_date: { type: Date }
    }
  ]
});

//   module.exports = mongoose.model('Task', TaskSchema);
const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;
