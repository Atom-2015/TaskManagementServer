const mongoose = require("mongoose");

const UserLeaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  year: {
    type: Number,
    default: new Date().getFullYear(), // Optional: helps with annual reporting
  },
  leavesTaken: [
    {
      type: {
        type: String,
        required: true,  // e.g., "CL", "SL", "ML"
        uppercase: true,
      },
      days: {
        type: Number,
        required: true,  // e.g., 2 (days taken)
        default: 0,
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const UserLeave = mongoose.model("UserLeave", UserLeaveSchema);
module.exports = UserLeave;
