const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  email: { type: String, required: true, match: /.+@.+\..+/ },
  phone: { type: String },
  department_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
   }, // Reference to Departments
  designation: { type: String },
  date_of_joining: { type: Date },
  // manager_id: { type: String },  
  salary: { type: Number },
  role: { type: String, enum: ['Employee', 'Manager', 'Admin'],   },
  profile_image: { type: String }
});

// module.exports = mongoose.model('User', UserSchema);
const User = mongoose.model('User', UserSchema);
module.exports = User;
