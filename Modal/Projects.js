const { default: mongoose } = require("mongoose");

const ProjectSchema = new mongoose.Schema({

  name: { type: String, required: true },
  description: { type: String },
  start_date: { type: Date,   },
  end_date: { type: Date },
  // manager_id: { type: String, required: true, ref: 'User' }, // Reference to Users
  team_members: [{ type: String, ref: 'User' }], // Array of User IDs
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold'],
    default: 'Active',
    required: true
  },
  country: { type: String },
  state:{type:String},
  city:{type:String},
  Area:{type:Number},
  budget: { type: Number },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }] // Array of Task IDs
},{timestamps:true});

//   module.exports = mongoose.model('Project', ProjectSchema);
const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;