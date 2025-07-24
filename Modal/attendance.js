const { default: mongoose } = require("mongoose");
const Shift = require("./Shift");

const AttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  }, 

  shiftId:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
    ref:"Shift",
  },

  date: { type: Date, required: true },
  check_in_time: { type: String },
  check_out_time: { type: String },
    workingHours: { type: String, default: "0h 0m" },
  overtime: { type: String, default: "0h 0m" },
  status: {
    type: String,
    enum: ["Present", "Absent", "OnLeave","Late"],
    required: true,
  },

  isLate:{type:Boolean,required:true},

  lateByMinutes:{type:Number,default:0},

    requiredTime: { type: String }, // e.g., "8h 30m"
  isRequiredTimeCompleted: { type: Boolean, default: false },

  remarks: { type: String,default:"" },

  createdAt:{type:Date,default:Date.now}
});

//   module.exports = mongoose.model('Attendance', AttendanceSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);
module.exports = Attendance;
