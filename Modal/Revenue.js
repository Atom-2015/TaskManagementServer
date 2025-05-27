const mongoose = require("mongoose");

const RevenueSchema = mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true, 
    },

    date: {
      type: String,
      required: true, 
    },

    milestone: {
      type: String,
      required: true,
    },

    invoiceNo: {
      type: String,
      required: true, 
    },

    basicAmount: {
      type: String,
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

    received: {
      type: Number,
      required: true,
    },

    pending: {
      type: Number,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true, 
    },

    status: {
      type: String,
      required: true,
    },

    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Revenue = mongoose.model("Revenue", RevenueSchema);
module.exports = Revenue;
