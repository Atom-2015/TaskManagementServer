const { default: mongoose } = require("mongoose");

const AttendanceSchema = new mongoose.Schema({

  employee_id: {
    type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'

  }, // Reference to Users
  date: { type: Date, required: true },
  check_in_time: { type: String },
  check_out_time: { type: String },
  status: { type: String, enum: ['Present', 'Absent', 'On Leave'], required: true },
  location: { type: String },
  remarks: { type: String }
});

//   module.exports = mongoose.model('Attendance', AttendanceSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
module.exports = Attendance;