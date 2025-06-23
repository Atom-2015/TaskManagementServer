const mongoose = require('mongoose');
const Company = require('../Modal/Conpany');

const UserSchema = new mongoose.Schema({
  
  Company:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Company',
  },
  name: { type: String, required: true },
  last_name:{type:String,required:true},
  email: { type: String, required: true, match: /.+@.+\..+/ },
  phone: { type: String },
  department_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
   }, // Reference to Departments
  designation: { type: String },
  dob: { type: Date },
  password:{
       type:String,
       required:true
  },
  state:{type:String,required:true},

  city:{type:String,required:true},
  // manager_id: { type: String },  
  salary: { type: Number },
  status:{
    type:String,
    enum: ['Active', 'Inactive'],
    default:'Active'
  },
  date_of_joining:{type:Date, required:true},
  role: { type: String, enum: ['Employee', 'Manager', 'Admin'],   default:'Employee' },
  profile_image: { type: String, default:null }
});

// module.exports = mongoose.model('User', UserSchema);
const User = mongoose.model('User', UserSchema);
module.exports = User;
