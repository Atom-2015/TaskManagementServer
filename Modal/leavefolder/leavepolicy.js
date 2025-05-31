const mongoose = require("mongoose");

const LeavePolicySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  leaves: [
    {
      type: {
        type: String,
        required: true,  
        uppercase: true,
      },
      days: {
        type: Number,
        required: true,  
        x
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// module.exports = mongoose.model("LeavePolicy", LeavePolicySchema);

const LeavePolicy = mongoose.model('LeavePolicy', LeavePolicySchema);
module.exports = LeavePolicy;