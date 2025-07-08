const mongoose = require("mongoose");

const ShiftSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  shifts: [
    {
      name: {
        type: String,
        required: true,
      },
      punchIn: {
        type: String,
        required: true,
      },
      punchOut: {
        type: String,
        required: true,
      },
      breaks: [
        {
          type: {
            type: String,
            enum: ["Lunch", "Tea", "Other"],
            required: true,
          },
          start: { type: String, required: true },
          end: { type: String, required: true },
          remarks: { type: String, default: "" },
        },
      ],
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Shift = mongoose.model("Shift", ShiftSchema);
module.exports = Shift;
