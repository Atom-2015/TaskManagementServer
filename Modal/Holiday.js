const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  year: {
    type: Number,
    required: true,
  },

  weeklyOff: {
    type: [String],
    required: true,
  },

  holidays: [
    {
      name: {
        type: String,
      },

      date: {
        type: String,
      },
    },
  ],

  overrides: [
    {
      date: { type: Date, required: true },
      isWorkingDay: { type: Boolean },
      reason: { type: String },
    },
  ],
});

module.exports = mongoose.model("Holiday", holidaySchema);
