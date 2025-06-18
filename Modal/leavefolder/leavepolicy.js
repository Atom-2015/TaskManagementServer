

const mongoose = require ("mongoose");

const LeavePolicySchema =  new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  leaves: [
    {
      type:{
        type: String,
        required:true,
        uppercase:true,
      },

      days: {
        type: Number,required:true
      }
    }
  ],
  createdAt:{
    type:Date,
    default: Date.now,
  }

})

const LeavePolicy = mongoose.model('LeavePolicy',LeavePolicySchema);
module.exports = LeavePolicy;