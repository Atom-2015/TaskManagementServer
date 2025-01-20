const { default: mongoose } = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  
    employee_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Reference to Users
    leave_type: { type: String, required: true }, // e.g., Sick Leave, Casual Leave
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], required: true },
    approver_id: {  type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to Users
    application_date: { type: Date, required: true }
  });
  
//   module.exports = mongoose.model('Leave', LeaveSchema);
  const Leave = mongoose.model('Leave', LeaveSchema);
  module.exports = Leave;