const { default: mongoose } = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
    
    name: { type: String, required: true },
    // manager_id: { type: String, ref: 'User' }, // Reference to Users
    location: { type: String }
  });
  
//   module.exports = mongoose.model('Department', DepartmentSchema);
  const Department = mongoose.model('Department', DepartmentSchema);
  module.exports = Department;