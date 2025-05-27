const mongoose = require("mongoose");
const Project = require("../Modal/Projects");


const expenseSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  paidTo: {
    type: String,
    required: true,
  },
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  gst: {
    type: Number,
    required: true,
  },
  tds: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Expense', expenseSchema);
