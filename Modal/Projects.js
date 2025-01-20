const { default: mongoose } = require("mongoose");

const ProjectSchema = new mongoose.Schema({
    
    name: { type: String, required: true },
    description: { type: String },
    start_date: { type: Date, required: true },
    end_date: { type: Date },
    // manager_id: { type: String, required: true, ref: 'User' }, // Reference to Users
    team_members: [{ type: String, ref: 'User' }], // Array of User IDs
    status: { type: String,
      enum: ['Active', 'Completed', 'On Hold'], 
      default: 'Active',
      required: true 
    },
    budget: { type: Number },
    tasks: [{  
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Task' 
    }] // Array of Task IDs
  });
  
//   module.exports = mongoose.model('Project', ProjectSchema);
  const Project = mongoose.model('Project', ProjectSchema);
  module.exports = Project;