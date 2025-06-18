

const mongoose = require("mongoose")

const UserLeaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required: true,
  },

  companyId: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Company",
    required: true,
  },
  year:{
    type:Number,
    default:new Date().getFullYear(),
  },
leavesTaken: [
  {
    type: {
      type: String,
      required: true,
      uppercase: true,
    },
    days: {
      type: Number,
      required: true,
      default: 0,
    },
    fromDate: {
      type: Date,
     
    },
    toDate: {
      type: Date,
     
    }
  }
],


  createdAt:{
    type:Date,
    default:Date.now
  }

});

const UserLeave = mongoose.model("UserLeave",UserLeaveSchema);
module.exports =UserLeave;
