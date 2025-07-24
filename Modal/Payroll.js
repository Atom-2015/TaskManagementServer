const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attendenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    earnings: {
      salary: {
        type: Number,
      },
      incentives: [
        {
          // incentivesId: {
          //   type: mongoose.Schema.Types.ObjectId,
          //   auto: true,
          // },
          label: {
            type: String,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
        },
      ],
    },

    deductions: {
      absentDays: {
        type: Number,
        required: true,
      },
      unpaidLeaves: {
        type: Number,
        required: true,
      },
      totalDeductions: {
        type: Number,
        required: true,
      },
    },

    netPay: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Not Paid", "Paid"],
      default: "Not Paid",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);
